import {
  GIF_EXPORT_DURATION_MS,
  GIF_EXPORT_FPS,
  GIF_EXPORT_LONG_EDGE,
  STARFIELD_FRAME_DURATION_MS,
  createLayeredCapture,
  drawCover,
  drawSparklesLayer,
  loadSparklesDecoder,
  loadStarfieldDecoder,
  resolveGifExportSize,
} from './gifExport'
import { createVotedFrameRenderer } from '../frameAnimation'

export type WebmExportProgress = {
  frame: number
  frameCount: number
  percent: number
  width: number
  height: number
}

export type WebmExportOptions = {
  durationMs?: number
  fps?: number
  longEdge?: number
  backgroundColor?: string
  onProgress?: (progress: WebmExportProgress) => void
}

type EncodedChunk = {
  type: 'key' | 'delta'
  timestamp: number
  data: Uint8Array
}

type VideoFrameLike = { close: () => void }
type VideoFrameConstructor = new (
  source: CanvasImageSource,
  init: { timestamp: number; duration?: number },
) => VideoFrameLike

type VideoEncoderLike = {
  encodeQueueSize: number
  configure: (config: Record<string, unknown>) => void
  encode: (frame: VideoFrameLike, options?: { keyFrame?: boolean }) => void
  flush: () => Promise<void>
  close: () => void
}

type VideoEncoderConstructor = {
  new (options: {
    output: (chunk: {
      type: 'key' | 'delta'
      timestamp: number
      byteLength: number
      copyTo: (target: Uint8Array) => void
    }) => void
    error: (error: unknown) => void
  }): VideoEncoderLike
  isConfigSupported?: (config: Record<string, unknown>) => Promise<{ supported?: boolean }>
}

const getWebCodecs = () => {
  const browserGlobals = globalThis as typeof globalThis & {
    VideoEncoder?: VideoEncoderConstructor
    VideoFrame?: VideoFrameConstructor
  }
  if (!browserGlobals.VideoEncoder || !browserGlobals.VideoFrame) {
    throw new Error('Eksport WebM wymaga aktualnego Chrome albo Edge.')
  }
  return { VideoEncoder: browserGlobals.VideoEncoder, VideoFrame: browserGlobals.VideoFrame }
}

const concatBytes = (parts: Uint8Array[]) => {
  const length = parts.reduce((total, part) => total + part.length, 0)
  const result = new Uint8Array(length)
  let offset = 0
  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }
  return result
}

const idBytes = (id: number) => {
  const hex = id.toString(16).padStart(2, '0')
  const bytes = new Uint8Array(hex.length / 2)
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16)
  return bytes
}

const vint = (value: number) => {
  const target = BigInt(Math.max(0, Math.floor(value)))
  for (let width = 1; width <= 8; width += 1) {
    const maximum = (1n << BigInt(width * 7)) - 2n
    if (target > maximum) continue
    const bytes = new Uint8Array(width)
    let remainder = target
    for (let index = width - 1; index >= 0; index -= 1) {
      bytes[index] = Number(remainder & 0xffn)
      remainder >>= 8n
    }
    bytes[0] |= 1 << (8 - width)
    return bytes
  }
  throw new Error('WebM jest zbyt duży dla tego eksportera.')
}

const uint = (value: number) => {
  if (value <= 0) return new Uint8Array([0])
  const bytes: number[] = []
  let remainder = Math.floor(value)
  while (remainder > 0) {
    bytes.unshift(remainder & 0xff)
    remainder = Math.floor(remainder / 256)
  }
  return new Uint8Array(bytes)
}

const stringBytes = (value: string) => new TextEncoder().encode(value)

const float64 = (value: number) => {
  const bytes = new Uint8Array(8)
  new DataView(bytes.buffer).setFloat64(0, value, false)
  return bytes
}

const element = (id: number, payload: Uint8Array) => concatBytes([idBytes(id), vint(payload.length), payload])

const signedInt16 = (value: number) => {
  const clamped = Math.max(-32_768, Math.min(32_767, Math.round(value)))
  return new Uint8Array([(clamped >> 8) & 0xff, clamped & 0xff])
}

const buildSimpleBlock = (chunk: EncodedChunk) => concatBytes([
  new Uint8Array([0x81]),
  signedInt16(chunk.timestamp / 1_000),
  new Uint8Array([chunk.type === 'key' ? 0x80 : 0x00]),
  chunk.data,
])

const muxWebm = (chunks: EncodedChunk[], width: number, height: number, durationMs: number, codec: 'vp8' | 'vp9') => {
  const ebmlHeader = element(0x1a45dfa3, concatBytes([
    element(0x4286, uint(1)),
    element(0x42f7, uint(1)),
    element(0x42f2, uint(4)),
    element(0x42f3, uint(8)),
    element(0x4282, stringBytes('webm')),
    element(0x4287, uint(2)),
    element(0x4285, uint(2)),
  ]))

  const info = element(0x1549a966, concatBytes([
    element(0x2ad7b1, uint(1_000_000)),
    element(0x4489, float64(durationMs)),
    element(0x4d80, stringBytes('Versus Verse')),
    element(0x5741, stringBytes('Versus Verse WebM')),
  ]))

  const video = element(0xe0, concatBytes([
    element(0xb0, uint(width)),
    element(0xba, uint(height)),
    // Keep the display geometry explicit for players that do not infer the
    // presentation size from PixelWidth/PixelHeight alone.
    element(0x54b0, uint(width)),
    element(0x54ba, uint(height)),
  ]))
  const trackEntry = element(0xae, concatBytes([
    element(0xd7, uint(1)),
    element(0x73c5, uint(1)),
    element(0x83, uint(1)),
    element(0x9c, uint(0)),
    element(0x22b59c, stringBytes('und')),
    element(0x86, stringBytes(codec === 'vp9' ? 'V_VP9' : 'V_VP8')),
    element(0x258688, stringBytes(codec.toUpperCase())),
    video,
  ]))
  const tracks = element(0x1654ae6b, trackEntry)
  const cluster = element(0x1f43b675, concatBytes([
    element(0xe7, uint(0)),
    ...chunks.map(chunk => element(0xa3, buildSimpleBlock(chunk))),
  ]))
  const segmentPayload = concatBytes([info, tracks, cluster])
  const segment = concatBytes([idBytes(0x18538067), vint(segmentPayload.length), segmentPayload])
  return new Blob([ebmlHeader, segment], { type: 'video/webm' })
}

const chooseVideoConfig = async (VideoEncoder: VideoEncoderConstructor, width: number, height: number, fps: number) => {
  const candidates = [
    { codec: 'vp09.00.10.08', codecFamily: 'vp9' as const },
    { codec: 'vp8', codecFamily: 'vp8' as const },
  ]
  for (const candidate of candidates) {
    const config = {
      codec: candidate.codec,
      width,
      height,
      // 4K60 has a lot of small, high-contrast particles and thin UI text.
      // 24 Mb/s was valid, but visibly softened those details when the video
      // was enlarged to full screen. Give the encoder enough headroom to keep
      // the exported frame close to the 4K canvas capture.
      bitrate: 100_000_000,
      framerate: fps,
      latencyMode: 'quality' as const,
      contentHint: 'detail' as const,
    }
    if (!VideoEncoder.isConfigSupported) return { config, codecFamily: candidate.codecFamily }
    try {
      const support = await VideoEncoder.isConfigSupported(config)
      if (support.supported) return { config, codecFamily: candidate.codecFamily }
    } catch {
      // Try the next codec profile.
    }
  }
  throw new Error('Ta przeglądarka nie ma dostępnego kodera VP8/VP9 dla WebM.')
}

export async function exportElementAsWebm(element: HTMLElement, options: WebmExportOptions = {}) {
  const requestedDurationMs = Math.max(100, options.durationMs ?? GIF_EXPORT_DURATION_MS)
  const fps = Math.min(60, Math.max(1, options.fps ?? GIF_EXPORT_FPS))
  const longEdge = Math.max(320, options.longEdge ?? GIF_EXPORT_LONG_EDGE)
  const backgroundColor = options.backgroundColor ?? '#070b13'
  const { width, height } = resolveGifExportSize(element, longEdge)
  const capture = await createLayeredCapture(element, width, backgroundColor)
  if (!capture) throw new Error('Nie udało się przygotować widoku do nagrania WebM.')

  const { VideoEncoder, VideoFrame } = getWebCodecs()
  const decoderState = await loadStarfieldDecoder()
  let sparklesDecoderState: Awaited<ReturnType<typeof loadSparklesDecoder>> | null = null
  try {
    if (capture.sparkles.length) sparklesDecoderState = await loadSparklesDecoder()
  } catch (error) {
    decoderState.decoder.close()
    throw error
  }
  const sourceDurationMs = decoderState.frameCount * STARFIELD_FRAME_DURATION_MS
  const loopCount = Math.max(1, Math.round(requestedDurationMs / sourceDurationMs))
  const framesPerSourceLoop = Math.max(1, Math.round((sourceDurationMs / 1_000) * fps))
  const frameCount = framesPerSourceLoop * loopCount
  const durationMs = (frameCount * 1_000) / fps
  const selectedCodec = await chooseVideoConfig(VideoEncoder, width, height, fps)
  const frameCanvas = document.createElement('canvas')
  frameCanvas.width = width
  frameCanvas.height = height
  const context = frameCanvas.getContext('2d')
  if (!context) {
    decoderState.decoder.close()
    sparklesDecoderState?.decoder.close()
    throw new Error('Nie udało się utworzyć płótna nagrania WebM.')
  }

  const chunks: EncodedChunk[] = []
  let encodingError: Error | null = null
  const encoder = new VideoEncoder({
    output: chunk => {
      const data = new Uint8Array(chunk.byteLength)
      chunk.copyTo(data)
      chunks.push({ type: chunk.type, timestamp: chunk.timestamp, data })
    },
    error: cause => {
      encodingError = cause instanceof Error ? cause : new Error('Koder WebM zgłosił błąd.')
    },
  })
  encoder.configure(selectedCodec.config)

  let cachedSourceFrame = -1
  let cachedSourceImage: (CanvasImageSource & { close?: () => void }) | null = null
  let cachedSparklesFrame = -1
  let cachedSparklesImage: (CanvasImageSource & { close?: () => void }) | null = null
  const votedFrameRenderer = capture.votedFrames.length ? createVotedFrameRenderer(width, height) : null

  const renderFrame = async (frame: number) => {
    context.clearRect(0, 0, width, height)
    context.drawImage(capture.base, 0, 0, width, height)

    const frameTimeMs = (frame * 1_000) / fps
    const sourceFrame = Math.floor(frameTimeMs / STARFIELD_FRAME_DURATION_MS) % decoderState.frameCount
    if (sourceFrame !== cachedSourceFrame) {
      cachedSourceImage?.close?.()
      cachedSourceImage = (await decoderState.decoder.decode({ frameIndex: sourceFrame })).image
      cachedSourceFrame = sourceFrame
    }
    const image = cachedSourceImage
    if (!image) throw new Error('Nie udało się odczytać klatki animowanego tła.')

    const imageWidth = Number((image as { displayWidth?: number; width?: number }).displayWidth ?? (image as { width?: number }).width ?? 1)
    const imageHeight = Number((image as { displayHeight?: number; height?: number }).displayHeight ?? (image as { height?: number }).height ?? 1)
    context.save()
    context.globalCompositeOperation = 'screen'
    context.globalAlpha = 0.8
    context.filter = 'brightness(1.1) contrast(1.1)'
    drawCover(context, image, imageWidth, imageHeight, capture.animatedLeft, capture.animatedTop, capture.animatedWidth, capture.animatedHeight)
    context.restore()
    const frameProgress = frame / frameCount
    votedFrameRenderer?.drawGlow(context, capture.votedFrames, frameProgress)
    context.drawImage(capture.foreground, capture.foregroundLeft, capture.foregroundTop)

    if (sparklesDecoderState && capture.sparkles.length) {
      const sparkleFrame = Math.floor(
        ((frameTimeMs % sourceDurationMs) / sourceDurationMs) * sparklesDecoderState.frameCount,
      ) % sparklesDecoderState.frameCount
      if (sparkleFrame !== cachedSparklesFrame) {
        cachedSparklesImage?.close?.()
        cachedSparklesImage = (await sparklesDecoderState.decoder.decode({ frameIndex: sparkleFrame })).image
        cachedSparklesFrame = sparkleFrame
      }
      const sparkleImage = cachedSparklesImage
      if (sparkleImage) {
        const sparkleWidth = Number((sparkleImage as { displayWidth?: number; width?: number }).displayWidth ?? (sparkleImage as { width?: number }).width ?? 1)
        const sparkleHeight = Number((sparkleImage as { displayHeight?: number; height?: number }).displayHeight ?? (sparkleImage as { height?: number }).height ?? 1)
        capture.sparkles.forEach(layer => drawSparklesLayer(context, sparkleImage, sparkleWidth, sparkleHeight, layer))
      }
    }
    votedFrameRenderer?.drawBorders(context, capture.votedFrames, frameProgress)
  }

  try {
    for (let frame = 0; frame < frameCount; frame += 1) {
      await renderFrame(frame)
      const videoFrame = new VideoFrame(frameCanvas, {
        timestamp: Math.round((frame * durationMs * 1_000) / frameCount),
        duration: Math.round((durationMs * 1_000) / frameCount),
      })
      encoder.encode(videoFrame, { keyFrame: frame === 0 })
      videoFrame.close()
      if (encoder.encodeQueueSize > 3) await encoder.flush()
      if (encodingError) throw encodingError
      options.onProgress?.({
        frame: frame + 1,
        frameCount,
        percent: Math.round(((frame + 1) / frameCount) * 100),
        width,
        height,
      })
    }
    await encoder.flush()
    if (encodingError) throw encodingError
    return {
      blob: muxWebm(chunks, width, height, durationMs, selectedCodec.codecFamily),
      width,
      height,
      frameCount,
      durationMs,
    }
  } finally {
    try {
      encoder.close()
    } catch {
      // The encoder may already be closed after an encoding failure.
    }
    const sourceImage = cachedSourceImage as { close?: () => void } | null
    sourceImage?.close?.()
    cachedSparklesImage?.close?.()
    decoderState.decoder.close()
    sparklesDecoderState?.decoder.close()
    votedFrameRenderer?.dispose()
    frameCanvas.width = 1
    frameCanvas.height = 1
    capture.base.width = 1
    capture.foreground.width = 1
  }
}
