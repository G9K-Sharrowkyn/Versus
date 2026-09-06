import { GIFEncoder, applyPalette, quantize } from 'gifenc'

type EncoderMessage =
  | { type: 'init'; width: number; height: number; frameDelays: number[]; frameCount: number }
  | { type: 'frame'; frame: number; pixels: ArrayBuffer }
  | { type: 'finish' }

type EncoderResponse =
  | { type: 'progress'; frame: number; frameCount: number }
  | { type: 'done'; bytes: ArrayBuffer }
  | { type: 'error'; message: string }

type WorkerScope = {
  onmessage: ((event: MessageEvent<EncoderMessage>) => void) | null
  postMessage: (message: EncoderResponse, transfer?: Transferable[]) => void
}

const workerScope = globalThis as unknown as WorkerScope
let encoder: ReturnType<typeof GIFEncoder> | null = null
let palette: ReturnType<typeof quantize> | null = null
let frameWidth = 0
let frameHeight = 0
let frameDelays: number[] = []
let frameCount = 0
let previousPixels: Uint8Array | null = null

const buildPaletteSample = (rgba: Uint8Array, width: number, height: number) => {
  const maxPixels = 120_000
  const sourcePixels = width * height
  const step = Math.max(1, Math.ceil(Math.sqrt(sourcePixels / maxPixels)))
  const sampleWidth = Math.ceil(width / step)
  const sampleHeight = Math.ceil(height / step)
  const sample = new Uint8Array(sampleWidth * sampleHeight * 4)
  let sampleOffset = 0

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const sourceOffset = (y * width + x) * 4
      sample[sampleOffset] = rgba[sourceOffset] ?? 0
      sample[sampleOffset + 1] = rgba[sourceOffset + 1] ?? 0
      sample[sampleOffset + 2] = rgba[sourceOffset + 2] ?? 0
      sample[sampleOffset + 3] = rgba[sourceOffset + 3] ?? 255
      sampleOffset += 4
    }
  }

  return sample
}

const reportError = (cause: unknown) => {
  const message = cause instanceof Error ? cause.message : 'Nie udało się zakodować GIF-a.'
  workerScope.postMessage({ type: 'error', message })
}

workerScope.onmessage = (event) => {
  try {
    const message = event.data
    if (message.type === 'init') {
      frameWidth = message.width
      frameHeight = message.height
      frameDelays = message.frameDelays
      frameCount = message.frameCount
      previousPixels = null
      encoder = GIFEncoder({ initialCapacity: Math.max(4_096, frameWidth * frameHeight / 32) })
      palette = null
      return
    }

    if (message.type === 'frame') {
      if (!encoder) throw new Error('Encoder GIF nie został zainicjalizowany.')
      const rgba = new Uint8Array(message.pixels)
      const fullFrame = previousPixels ? rgba.slice() : null
      let transparent = false
      if (previousPixels) {
        transparent = true
        for (let offset = 0; offset < rgba.length; offset += 4) {
          const unchanged = rgba[offset] === previousPixels[offset]
            && rgba[offset + 1] === previousPixels[offset + 1]
            && rgba[offset + 2] === previousPixels[offset + 2]
            && rgba[offset + 3] === previousPixels[offset + 3]
          if (unchanged) rgba[offset + 3] = 0
        }
      }
      previousPixels = fullFrame ?? rgba.slice()
      if (!palette) {
        const opaquePalette = quantize(buildPaletteSample(previousPixels, frameWidth, frameHeight), 255, { format: 'rgb565' })
          .map(([red, green, blue]) => [red, green, blue, 255] as [number, number, number, number])
        palette = [[0, 0, 0, 0], ...opaquePalette]
      }
      const index = applyPalette(rgba, palette, 'rgba4444')
      const frameDelay = frameDelays[message.frame] ?? frameDelays[frameDelays.length - 1] ?? 20
      encoder.writeFrame(index, frameWidth, frameHeight, {
        palette,
        delay: frameDelay,
        repeat: message.frame === 0 ? 0 : undefined,
        transparent,
        transparentIndex: 0,
        dispose: 1,
      })
      workerScope.postMessage({ type: 'progress', frame: message.frame + 1, frameCount })
      return
    }

    if (message.type === 'finish') {
      if (!encoder) throw new Error('Encoder GIF nie został zainicjalizowany.')
      encoder.finish()
      const encoded = encoder.bytes()
      const bytes = new Uint8Array(encoded)
      workerScope.postMessage({ type: 'done', bytes: bytes.buffer }, [bytes.buffer])
      encoder = null
      palette = null
      previousPixels = null
    }
  } catch (cause) {
    reportError(cause)
  }
}
