import html2canvas from 'html2canvas'

export const GIF_EXPORT_DURATION_MS = 2_000
export const GIF_EXPORT_FPS = 60
export const GIF_EXPORT_LONG_EDGE = 3_840

const STARFIELD_URL = '/stars.gif'
export const STARFIELD_FRAME_DURATION_MS = 30

export type GifExportProgress = {
  frame: number
  frameCount: number
  percent: number
  width: number
  height: number
}

export type GifExportOptions = {
  durationMs?: number
  fps?: number
  longEdge?: number
  backgroundColor?: string
  onProgress?: (progress: GifExportProgress) => void
}

type ElementRect = {
  left: number
  top: number
  width: number
  height: number
}

type GifDecoderFrame = {
  image: CanvasImageSource & { close?: () => void }
}

type GifDecoder = {
  tracks: {
    ready: Promise<void>
    selectedTrack?: { frameCount: number }
  }
  decode: (options: { frameIndex: number }) => Promise<GifDecoderFrame>
  close: () => void
}

type GifDecoderConstructor = new (options: { data: ArrayBuffer; type: string }) => GifDecoder

type GifEncoderWorkerMessage =
  | { type: 'progress'; frame: number; frameCount: number }
  | { type: 'done'; bytes: ArrayBuffer }
  | { type: 'error'; message: string }

export const waitForPaint = () => new Promise<void>((resolve) => {
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()))
})

const waitForFonts = async () => {
  if (document.fonts?.ready) await document.fonts.ready
}

const readRect = (element: HTMLElement): ElementRect => {
  const rect = element.getBoundingClientRect()
  return {
    left: rect.left,
    top: rect.top,
    width: Math.max(1, rect.width || element.clientWidth),
    height: Math.max(1, rect.height || element.clientHeight),
  }
}

export const resolveGifExportSize = (element: HTMLElement, longEdge = GIF_EXPORT_LONG_EDGE) => {
  const rect = readRect(element)
  const scale = longEdge / Math.max(rect.width, rect.height)

  return {
    width: Math.max(1, Math.round(rect.width * scale)),
    height: Math.max(1, Math.round(rect.height * scale)),
  }
}

const getImageDecoder = () => {
  const browserGlobals = globalThis as typeof globalThis & { ImageDecoder?: GifDecoderConstructor }
  return browserGlobals.ImageDecoder
}

export const loadStarfieldDecoder = async () => {
  const Decoder = getImageDecoder()
  if (!Decoder) {
    throw new Error('Eksport animowanego GIF-a wymaga aktualnego Chrome albo Edge.')
  }

  const response = await fetch(new URL(STARFIELD_URL, document.baseURI), { cache: 'force-cache' })
  if (!response.ok) throw new Error('Nie udało się wczytać animowanego tła.')

  const decoder = new Decoder({ data: await response.arrayBuffer(), type: 'image/gif' })
  await decoder.tracks.ready
  const frameCount = decoder.tracks.selectedTrack?.frameCount ?? 0
  if (frameCount < 1) {
    decoder.close()
    throw new Error('Animowane tło nie zawiera żadnych klatek.')
  }

  return { decoder, frameCount }
}

const appendCaptureStyles = (clonedDocument: Document, hideAnimatedLayer: boolean, hideForeground: boolean) => {
  const captureStyle = clonedDocument.createElement('style')
  captureStyle.textContent = `
    /* html2canvas 1.4 cannot parse color-mix()/color() values. */
    .vs-advanced__scene--teams .vs-advanced__portrait,
    .vs-advanced__scene--gauntlet .vs-advanced__portrait {
      box-shadow: 0 0 14px rgba(120, 220, 220, 0.22) !important;
    }
    /* html2canvas's canvas baseline sits a little lower than the browser's
       baseline for these flex labels. Keep exported text centered in its pill. */
    .vs-advanced__panel-label-text {
      position: relative !important;
      top: -0.54em !important;
    }
    .vs-advanced__caption-text {
      position: relative !important;
      top: -0.54em !important;
    }
    ${hideAnimatedLayer ? `
      .vs-simple-editor-sparkly::after {
        display: none !important;
        background-image: none !important;
      }
    ` : ''}
    ${hideForeground ? '[data-gif-export-foreground] { display: none !important; }' : ''}
  `
  clonedDocument.head.appendChild(captureStyle)
}

const parseObjectPosition = (value: string | undefined, axis: 0 | 1) => {
  const token = value?.trim().split(/\s+/)[axis] ?? '50%'
  if (token.endsWith('%')) {
    const percent = Number.parseFloat(token)
    return Number.isFinite(percent) ? Math.max(0, Math.min(1, percent / 100)) : 0.5
  }
  if (axis === 0) return token === 'left' ? 0 : token === 'right' ? 1 : 0.5
  return token === 'top' ? 0 : token === 'bottom' ? 1 : 0.5
}

const replaceImagesWithCoverLayers = (clonedDocument: Document, scale: number) => {
  // html2canvas stretches cloned <img> elements to their CSS box and ignores
  // object-fit: cover. Rasterize the cover crop into an export-scale canvas
  // first so portrait artwork keeps its live-view proportions and sharpness
  // (including transforms).
  const images = clonedDocument.querySelectorAll<HTMLImageElement>(
    '[data-gif-export-foreground] img',
  )
  images.forEach((image) => {
    const parent = image.parentElement
    if (!parent || !image.complete || !image.naturalWidth || !image.naturalHeight) return

    const computed = clonedDocument.defaultView?.getComputedStyle(image)
    const imageWidth = image.offsetWidth || parent.clientWidth
    const imageHeight = image.offsetHeight || parent.clientHeight
    const coverLayer = clonedDocument.createElement('canvas')
    coverLayer.setAttribute('aria-hidden', 'true')
    const rasterScale = Math.max(1, scale)
    coverLayer.width = Math.max(1, Math.round(imageWidth * rasterScale))
    coverLayer.height = Math.max(1, Math.round(imageHeight * rasterScale))
    coverLayer.style.position = 'absolute'
    coverLayer.style.inset = '0'
    coverLayer.style.width = '100%'
    coverLayer.style.height = '100%'
    coverLayer.style.display = 'block'
    coverLayer.style.transform = image.style.transform || computed?.transform || 'none'
    coverLayer.style.transformOrigin = computed?.transformOrigin || '50% 50%'
    coverLayer.style.zIndex = computed?.zIndex || '0'
    coverLayer.style.filter = computed?.filter || 'none'
    const context = coverLayer.getContext('2d')
    if (!context) return
    const positionX = parseObjectPosition(computed?.objectPosition || image.style.objectPosition, 0)
    const positionY = parseObjectPosition(computed?.objectPosition || image.style.objectPosition, 1)
    const coverScale = Math.max(imageWidth / image.naturalWidth, imageHeight / image.naturalHeight)
    // `coverScale` is based on the CSS box. The source crop therefore also
    // has to be calculated from CSS dimensions; the destination canvas is
    // merely a higher-resolution raster of that same crop.
    const sourceWidth = imageWidth / coverScale
    const sourceHeight = imageHeight / coverScale
    const sourceLeft = (image.naturalWidth - sourceWidth) * positionX
    const sourceTop = (image.naturalHeight - sourceHeight) * positionY
    context.drawImage(image, sourceLeft, sourceTop, sourceWidth, sourceHeight, 0, 0, coverLayer.width, coverLayer.height)
    image.style.display = 'none'
    parent.insertBefore(coverLayer, image)
  })
}

const captureElement = async (
  element: HTMLElement,
  scale: number,
  backgroundColor: string | null,
  hideAnimatedLayer: boolean,
  hideForeground: boolean,
) => {
  const rect = readRect(element)
  const expectedWidth = Math.max(1, Math.round(rect.width * scale))
  const expectedHeight = Math.max(1, Math.round(rect.height * scale))
  const canvas = await html2canvas(element, {
    backgroundColor,
    allowTaint: false,
    imageTimeout: 0,
    logging: false,
    removeContainer: true,
    scale,
    useCORS: true,
    width: rect.width,
    height: rect.height,
    windowWidth: Math.max(document.documentElement.clientWidth, window.innerWidth),
    windowHeight: Math.max(document.documentElement.clientHeight, window.innerHeight),
    onclone: (clonedDocument) => {
      appendCaptureStyles(clonedDocument, hideAnimatedLayer, hideForeground)
      if (!hideForeground) replaceImagesWithCoverLayers(clonedDocument, scale)
    },
  })

  if (canvas.width === expectedWidth && canvas.height === expectedHeight) return canvas

  const resized = document.createElement('canvas')
  resized.width = expectedWidth
  resized.height = expectedHeight
  const context = resized.getContext('2d')
  if (!context) throw new Error('Nie udało się utworzyć bufora eksportu GIF.')
  context.drawImage(canvas, 0, 0, expectedWidth, expectedHeight)
  canvas.width = 1
  canvas.height = 1
  return resized
}

export const drawCover = (
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  imageWidth: number,
  imageHeight: number,
  left: number,
  top: number,
  width: number,
  height: number,
) => {
  const scale = Math.max(width / imageWidth, height / imageHeight)
  const cropWidth = width / scale
  const cropHeight = height / scale
  const cropLeft = (imageWidth - cropWidth) / 2
  const cropTop = (imageHeight - cropHeight) / 2
  context.drawImage(image, cropLeft, cropTop, cropWidth, cropHeight, left, top, width, height)
}

export const createLayeredCapture = async (
  element: HTMLElement,
  width: number,
  backgroundColor: string,
) => {
  const targetRect = readRect(element)
  const scale = width / targetRect.width
  const animatedLayer = element.classList.contains('vs-simple-editor-sparkly')
    ? element
    : element.querySelector<HTMLElement>('.vs-simple-editor-sparkly')
  const foreground = element.querySelector<HTMLElement>('[data-gif-export-foreground]')

  if (!animatedLayer || !foreground) return null

  await waitForFonts()
  await waitForPaint()
  const hadSparklyClass = animatedLayer.classList.contains('vs-simple-editor-sparkly')
  const previousForegroundVisibility = foreground.style.visibility
  if (hadSparklyClass) animatedLayer.classList.remove('vs-simple-editor-sparkly')
  foreground.style.visibility = 'hidden'
  let base: HTMLCanvasElement
  try {
    // Remove the live animated layer while capturing the base. The cloned
    // pseudo-element can otherwise survive html2canvas's style snapshot and
    // get composited a second time below the decoded GIF frames.
    base = await captureElement(element, scale, backgroundColor, true, true)
  } finally {
    if (hadSparklyClass) animatedLayer.classList.add('vs-simple-editor-sparkly')
    foreground.style.visibility = previousForegroundVisibility
  }
  await waitForPaint()
  const foregroundCanvas = await captureElement(foreground, scale, null, false, false)
  const foregroundRect = readRect(foreground)
  const animatedRect = readRect(animatedLayer)

  return {
    base,
    foreground: foregroundCanvas,
    foregroundLeft: (foregroundRect.left - targetRect.left) * scale,
    foregroundTop: (foregroundRect.top - targetRect.top) * scale,
    animatedLeft: (animatedRect.left - targetRect.left) * scale,
    animatedTop: (animatedRect.top - targetRect.top) * scale,
    animatedWidth: animatedRect.width * scale,
    animatedHeight: animatedRect.height * scale,
  }
}

const createWorkerEncoder = (
  width: number,
  height: number,
  frameDelays: number[],
  onProgress: (frame: number) => void,
) => {
  const worker = new Worker(new URL('./gifEncoder.worker.ts', import.meta.url), { type: 'module' })
  let pendingFrame: { resolve: () => void; reject: (error: Error) => void } | null = null
  let pendingFinish: { resolve: (bytes: ArrayBuffer) => void; reject: (error: Error) => void } | null = null
  let failure: Error | null = null

  const fail = (cause: unknown) => {
    const error = cause instanceof Error ? cause : new Error('Nie udało się zakodować GIF-a.')
    failure = error
    pendingFrame?.reject(error)
    pendingFinish?.reject(error)
    pendingFrame = null
    pendingFinish = null
  }

  worker.onmessage = (event: MessageEvent<GifEncoderWorkerMessage>) => {
    const message = event.data
    if (message.type === 'progress') {
      onProgress(message.frame)
      pendingFrame?.resolve()
      pendingFrame = null
    } else if (message.type === 'done') {
      pendingFinish?.resolve(message.bytes)
      pendingFinish = null
    } else {
      fail(new Error(message.message))
    }
  }
  worker.onerror = (event) => fail(new Error(event.message || 'Nie udało się uruchomić kodera GIF-a.'))
  worker.postMessage({ type: 'init', width, height, frameDelays, frameCount: frameDelays.length })

  return {
    addFrame: (rgba: Uint8ClampedArray, frame: number) => {
      if (failure) return Promise.reject(failure)
      return new Promise<void>((resolve, reject) => {
        pendingFrame = { resolve, reject }
        worker.postMessage({ type: 'frame', frame, pixels: rgba.buffer }, [rgba.buffer])
      })
    },
    finish: () => {
      if (failure) return Promise.reject(failure)
      return new Promise<ArrayBuffer>((resolve, reject) => {
        pendingFinish = { resolve, reject }
        worker.postMessage({ type: 'finish' })
      })
    },
    terminate: () => worker.terminate(),
  }
}

const createGifFrameDelays = (durationMs: number, frameCount: number) => {
  // GIF stores delays in centiseconds. Distributing the rounded duration over
  // all frames gives a 20/10 ms pattern (two 20 ms delays and one 10 ms delay
  // every 50 ms) for 60 FPS instead of rounding every frame to 20 ms, which
  // would silently turn 60 FPS into 50 FPS.
  const totalCentiseconds = Math.max(frameCount, Math.round(durationMs / 10))
  const delays: number[] = []
  let allocatedCentiseconds = 0

  for (let frame = 0; frame < frameCount; frame += 1) {
    const targetCentiseconds = Math.round(((frame + 1) * totalCentiseconds) / frameCount)
    const delayCentiseconds = Math.max(1, targetCentiseconds - allocatedCentiseconds)
    delays.push(delayCentiseconds * 10)
    allocatedCentiseconds += delayCentiseconds
  }

  const correctionMs = (totalCentiseconds - allocatedCentiseconds) * 10
  if (correctionMs !== 0) delays[delays.length - 1] = Math.max(10, delays[delays.length - 1] + correctionMs)
  return delays
}

export async function exportElementAsGif(element: HTMLElement, options: GifExportOptions = {}) {
  const durationMs = Math.max(100, options.durationMs ?? GIF_EXPORT_DURATION_MS)
  const fps = Math.min(60, Math.max(1, options.fps ?? GIF_EXPORT_FPS))
  const frameCount = Math.max(1, Math.round((durationMs / 1_000) * fps))
  const frameDelays = createGifFrameDelays(durationMs, frameCount)
  const longEdge = Math.max(320, options.longEdge ?? GIF_EXPORT_LONG_EDGE)
  const backgroundColor = options.backgroundColor ?? '#070b13'
  const { width, height } = resolveGifExportSize(element, longEdge)
  const capture = await createLayeredCapture(element, width, backgroundColor)
  const decoderState = await loadStarfieldDecoder()
  const encoder = createWorkerEncoder(width, height, frameDelays, (frame) => {
    options.onProgress?.({
      frame,
      frameCount,
      percent: Math.round((frame / frameCount) * 100),
      width,
      height,
    })
  })
  const frameCanvas = document.createElement('canvas')
  frameCanvas.width = width
  frameCanvas.height = height
  const context = frameCanvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    decoderState.decoder.close()
    encoder.terminate()
    throw new Error('Nie udało się utworzyć bufora eksportu GIF.')
  }

  let cachedSourceFrame = -1
  let cachedSourceImage: (CanvasImageSource & { close?: () => void }) | null = null

  try {
    for (let frame = 0; frame < frameCount; frame += 1) {
      context.clearRect(0, 0, width, height)

      if (capture) {
        context.drawImage(capture.base, 0, 0, width, height)
      } else {
        const fallback = await captureElement(element, width / readRect(element).width, backgroundColor, false, false)
        context.drawImage(fallback, 0, 0, width, height)
        fallback.width = 1
        fallback.height = 1
      }

      const frameTimeMs = (frame * durationMs) / frameCount
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
      if (capture) {
        drawCover(context, image, imageWidth, imageHeight, capture.animatedLeft, capture.animatedTop, capture.animatedWidth, capture.animatedHeight)
      } else {
        drawCover(context, image, imageWidth, imageHeight, 0, 0, width, height)
      }
      context.restore()

      if (capture) context.drawImage(capture.foreground, capture.foregroundLeft, capture.foregroundTop)
      const rgba = context.getImageData(0, 0, width, height).data
      await encoder.addFrame(rgba, frame)
      await waitForPaint()
    }

    const bytes = await encoder.finish()
    const blobBuffer = new ArrayBuffer(bytes.byteLength)
    new Uint8Array(blobBuffer).set(new Uint8Array(bytes))
    return {
      blob: new Blob([blobBuffer], { type: 'image/gif' }),
      width,
      height,
      frameCount,
      durationMs: frameDelays.reduce((total, delay) => total + delay, 0),
    }
  } finally {
    cachedSourceImage?.close?.()
    decoderState.decoder.close()
    encoder.terminate()
    frameCanvas.width = 1
    frameCanvas.height = 1
    if (capture) {
      capture.base.width = 1
      capture.foreground.width = 1
    }
  }
}
