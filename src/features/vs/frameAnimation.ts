export const VOTED_FRAME_COLORS = ['#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f', '#90be6d', '#43aa8b', '#4d908e', '#277da1', '#577590', '#f94144']
export const VOTED_FRAME_BLUR = 32
export const VOTED_FRAME_BLEED = VOTED_FRAME_BLUR * 3 + 6
export const VOTED_FRAME_GLOW_RATIO = 0.125
export const VOTED_FRAME_DURATION_MS = 4_000
export const VOTED_FRAME_LINE_WIDTH = 6

export type VotedFrameLayer = {
  left: number
  top: number
  width: number
  height: number
  radius: number
  scale: number
}

export const roundedRectPath = (
  context: CanvasRenderingContext2D,
  left: number,
  top: number,
  width: number,
  height: number,
  radius: number,
) => {
  const safeRadius = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(left + safeRadius, top)
  context.arcTo(left + width, top, left + width, top + height, safeRadius)
  context.arcTo(left + width, top + height, left, top + height, safeRadius)
  context.arcTo(left, top + height, left, top, safeRadius)
  context.arcTo(left, top, left + width, top, safeRadius)
  context.closePath()
}

export const createVotedFrameGradient = (
  context: CanvasRenderingContext2D,
  angle: number,
  centerX: number,
  centerY: number,
  left: number,
  top: number,
  width: number,
  height: number,
) => {
  const gradient = typeof context.createConicGradient === 'function'
    ? context.createConicGradient(angle - Math.PI / 2, centerX, centerY)
    : context.createLinearGradient(left, top, left + width, top + height)
  VOTED_FRAME_COLORS.forEach((color, index) => gradient.addColorStop(index / (VOTED_FRAME_COLORS.length - 1), color))
  return gradient
}

export const createVotedFrameRenderer = (width: number, height: number) => {
  // A single scene-sized buffer lets every glow fade naturally. Separate
  // card-sized bitmaps left a visible rectangular edge in exported video.
  const glowCanvas = document.createElement('canvas')
  glowCanvas.width = Math.max(1, Math.ceil(width * VOTED_FRAME_GLOW_RATIO))
  glowCanvas.height = Math.max(1, Math.ceil(height * VOTED_FRAME_GLOW_RATIO))
  const glowContext = glowCanvas.getContext('2d')
  if (!glowContext) throw new Error('Nie udało się utworzyć bufora poświaty ramek.')

  const angleForProgress = (progress: number) => (progress % 1) * Math.PI * 2

  const drawGlow = (target: CanvasRenderingContext2D, layers: VotedFrameLayer[], progress: number) => {
    glowContext.setTransform(1, 0, 0, 1, 0, 0)
    glowContext.clearRect(0, 0, glowCanvas.width, glowCanvas.height)
    glowContext.setTransform(VOTED_FRAME_GLOW_RATIO, 0, 0, VOTED_FRAME_GLOW_RATIO, 0, 0)
    const angle = angleForProgress(progress)

    for (const layer of layers) {
      const lineWidth = VOTED_FRAME_LINE_WIDTH * layer.scale
      const left = layer.left + lineWidth / 2
      const top = layer.top + lineWidth / 2
      const frameWidth = Math.max(1, layer.width - lineWidth)
      const frameHeight = Math.max(1, layer.height - lineWidth)
      const radius = Math.max(1, layer.radius - lineWidth / 2)

      const strokeGlow = (blur: number, glowWidth: number) => {
        glowContext.save()
        glowContext.globalAlpha = 1
        glowContext.filter = `blur(${blur * layer.scale * VOTED_FRAME_GLOW_RATIO}px)`
        glowContext.lineWidth = glowWidth * layer.scale
        glowContext.strokeStyle = createVotedFrameGradient(
          glowContext,
          angle,
          layer.left + layer.width / 2,
          layer.top + layer.height / 2,
          left,
          top,
          frameWidth,
          frameHeight,
        )
        roundedRectPath(glowContext, left, top, frameWidth, frameHeight, radius)
        glowContext.stroke()
        glowContext.restore()
      }

      strokeGlow(VOTED_FRAME_BLUR, VOTED_FRAME_LINE_WIDTH * 3)
      strokeGlow(VOTED_FRAME_BLUR / 2, VOTED_FRAME_LINE_WIDTH * 2)
    }

    target.save()
    target.imageSmoothingEnabled = true
    target.imageSmoothingQuality = 'high'
    target.drawImage(glowCanvas, 0, 0, width, height)
    target.restore()
  }

  const drawBorders = (target: CanvasRenderingContext2D, layers: VotedFrameLayer[], progress: number) => {
    const angle = angleForProgress(progress)
    for (const layer of layers) {
      const lineWidth = VOTED_FRAME_LINE_WIDTH * layer.scale
      const left = layer.left + lineWidth / 2
      const top = layer.top + lineWidth / 2
      const frameWidth = Math.max(1, layer.width - lineWidth)
      const frameHeight = Math.max(1, layer.height - lineWidth)
      target.save()
      target.lineWidth = lineWidth
      target.strokeStyle = createVotedFrameGradient(
        target,
        angle,
        layer.left + layer.width / 2,
        layer.top + layer.height / 2,
        left,
        top,
        frameWidth,
        frameHeight,
      )
      roundedRectPath(target, left, top, frameWidth, frameHeight, Math.max(1, layer.radius - lineWidth / 2))
      target.stroke()
      target.restore()
    }
  }

  return {
    drawGlow,
    drawBorders,
    dispose: () => {
      glowCanvas.width = 1
      glowCanvas.height = 1
    },
  }
}
