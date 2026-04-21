import { isValidElement, useEffect, useState, type ReactNode, type RefObject } from 'react'
import type { TranslationDictionary } from '../../../i18n/types'
import type { TemplateId } from '../types'

type TemplateTransitionPhase = 'idle' | 'exit' | 'enter'

type FightPreviewStageProps = {
  ui: TranslationDictionary['ui']
  activeTemplateLabel: string
  templateCursor: number
  templateOrderLength: number
  canStepTemplateBackward: boolean
  canStepTemplateForward: boolean
  fightViewVisible: boolean
  onBackToLibrary: () => void
  onStepTemplateOrder: (direction: 1 | -1) => void
  previewShellRef: RefObject<HTMLDivElement | null>
  previewRef: RefObject<HTMLDivElement | null>
  scaledPreviewWidth: number
  scaledPreviewHeight: number
  previewBaseWidth: number
  previewBaseHeight: number
  previewScale: number
  previewReady: boolean
  activeTemplate: TemplateId
  activeFightFolderKey: string
  activeFightLocale: string
  templateTransitionPhase: TemplateTransitionPhase
  panelSwitchGlitchVisible: boolean
  panelSwitchGlitchNonce: number
  children: ReactNode
  incomingTemplate: ReactNode
}

export function FightPreviewStage({
  fightViewVisible,
  previewShellRef,
  previewRef,
  previewScale,
  previewReady,
  activeTemplate,
  activeFightFolderKey,
  activeFightLocale,
  templateTransitionPhase,
  panelSwitchGlitchVisible,
  panelSwitchGlitchNonce,
  children,
  incomingTemplate,
}: FightPreviewStageProps) {
  const isTemplateTransitioning = templateTransitionPhase !== 'idle'
  const showIncomingLayer = isTemplateTransitioning && Boolean(incomingTemplate)
  const readNodeKey = (node: ReactNode, fallback: string) =>
    isValidElement(node) && node.key != null ? String(node.key) : fallback

  return (
    <section
      className="flex h-full min-h-0 flex-col gap-3 transition-opacity duration-200 ease-out"
      style={{
        opacity: fightViewVisible ? 1 : 0,
        pointerEvents: fightViewVisible && !isTemplateTransitioning ? 'auto' : 'none',
      }}
    >
      <div
        ref={previewShellRef}
        data-vs-preview-shell="true"
        className="vs-preview-shell--bare min-h-0 flex-1 overflow-hidden"
      >
        <div
          ref={previewRef}
          data-vs-stage="true"
          data-vs-preview-ready={previewReady ? 'true' : 'false'}
          data-vs-preview-scale={previewScale}
          data-vs-template={activeTemplate}
          data-vs-folder-key={activeFightFolderKey}
          data-vs-locale={activeFightLocale}
          data-vs-template-transition={templateTransitionPhase}
          className={`vs-preview-shell--bare-body ${isTemplateTransitioning ? 'is-template-transitioning' : ''}`}
          style={{
            width: '100%',
            height: '100%',
            transform: 'none',
            transformOrigin: 'top center',
            opacity: previewReady ? 1 : 0,
          }}
          aria-busy={!previewReady || isTemplateTransitioning}
        >
          {/* Unified layer stack to preserve instances across transitions */}
          {(() => {
            const layers = []
            if (children) {
              layers.push({
                node: children,
                key: readNodeKey(children, 'current-layer'),
                isIncoming: false,
              })
            }
            if (showIncomingLayer) {
              layers.push({
                node: incomingTemplate,
                key: readNodeKey(incomingTemplate, 'incoming-layer'),
                isIncoming: true,
              })
            }

            // Sort layers by z-index (incoming on top)
            return layers.map((layer) => (
              <div
                key={layer.key}
                className={`vs-preview-shell--bare-layer ${layer.isIncoming ? 'vs-preview-shell--bare-layer--incoming' : 'vs-preview-shell--bare-layer--current'} ${!layer.isIncoming && templateTransitionPhase === 'enter' ? 'is-template-transition-exit-active' : ''} ${layer.isIncoming && templateTransitionPhase === 'enter' ? 'is-template-transition-enter' : ''}`}
                style={{ zIndex: layer.isIncoming ? 2 : 1 }}
              >
                {layer.node}
              </div>
            ))
          })()}

          {/* Laser sweep — sits on top */}
          {isTemplateTransitioning && (
            <LaserSweepTransition phase={templateTransitionPhase} />
          )}
          {panelSwitchGlitchVisible ? (
            <PanelSwitchGlitchTransition
              key={`panel-switch-glitch-${panelSwitchGlitchNonce}`}
              nonce={panelSwitchGlitchNonce}
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}

type ChromaFlashBand = {
  id: string
  top: string
  height: string
  background: string
  opacity: number
}

const PANEL_SWITCH_GLITCH_COLORS = ['rgba(255,85,78,1)', '#77e2f2', '#ff0', '#fff', '#0cf', '#f80']
const PANEL_SWITCH_GLITCH_FRAMES = 20
const PANEL_SWITCH_GLITCH_INTERVAL_MS = 40
const PANEL_SWITCH_GLITCH_JITTER_X = 55
const PANEL_SWITCH_GLITCH_SKEW = 10

function PanelSwitchGlitchTransition({ nonce }: { nonce: number }) {
  const [bands, setBands] = useState<ChromaFlashBand[]>([])
  const [distortionTransform, setDistortionTransform] = useState('')

  useEffect(() => {
    let frame = 0
    const intervalId = window.setInterval(() => {
      const nextBands: ChromaFlashBand[] = Array.from({
        length: 9 + Math.floor(Math.random() * 10),
      }).map((_, index) => ({
        id: `panel-glitch-band-${nonce}-${frame}-${index}`,
        top: `${Math.random() * 100}%`,
        height: `${1 + Math.random() * 14}%`,
        background: PANEL_SWITCH_GLITCH_COLORS[Math.floor(Math.random() * PANEL_SWITCH_GLITCH_COLORS.length)],
        opacity: 0.7 + Math.random() * 0.3,
      }))
      setBands(nextBands)
      setDistortionTransform(
        `translateX(${(Math.random() - 0.5) * PANEL_SWITCH_GLITCH_JITTER_X}px) skewX(${(Math.random() - 0.5) * PANEL_SWITCH_GLITCH_SKEW}deg)`,
      )
      frame += 1
      if (frame >= PANEL_SWITCH_GLITCH_FRAMES) {
        window.clearInterval(intervalId)
        setBands([])
        setDistortionTransform('')
      }
    }, PANEL_SWITCH_GLITCH_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
      setBands([])
      setDistortionTransform('')
    }
  }, [nonce])

  return (
    <div className="vs-template-panel-chroma-glitch" aria-hidden="true">
      <div className="vs-template-panel-chroma-glitch__distortion" style={{ transform: distortionTransform }}>
        {bands.map((band) => (
          <span
            key={band.id}
            className="vs-template-panel-chroma-glitch__band"
            style={{
              top: band.top,
              height: band.height,
              background: band.background,
              opacity: band.opacity,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function LaserSweepTransition({
  phase,
  variant = 'template',
}: {
  phase: TemplateTransitionPhase
  variant?: 'template' | 'panel-switch'
}) {
  if (phase !== 'enter') return null

  return (
    <div
      className={`vs-template-laser-transition ${variant === 'panel-switch' ? 'vs-template-laser-transition--panel-switch' : ''}`}
    >
      <div className="vs-template-laser-line" />
    </div>
  )
}
