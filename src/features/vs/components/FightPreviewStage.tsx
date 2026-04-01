import { useMemo, type CSSProperties, type ReactNode, type RefObject } from 'react'
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
  children,
  incomingTemplate,
}: FightPreviewStageProps) {
  const isTemplateTransitioning = templateTransitionPhase !== 'idle'
  const showIncomingLayer = isTemplateTransitioning && Boolean(incomingTemplate)

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
          {/* Current template — sits underneath during transition */}
          <div
            className={`vs-preview-shell--bare-layer vs-preview-shell--bare-layer--current ${templateTransitionPhase === 'enter' ? 'is-template-transition-exit-active' : ''}`}
            style={showIncomingLayer ? { zIndex: 1 } : undefined}
          >
            {children}
          </div>

          {/* Incoming template — rendered once, above current, visible through tile backs */}
          {showIncomingLayer ? (
            <div
              className={`vs-preview-shell--bare-layer vs-preview-shell--bare-layer--incoming ${templateTransitionPhase === 'enter' ? 'is-template-transition-enter' : ''}`}
              style={{ zIndex: 2 }}
            >
              {incomingTemplate}
            </div>
          ) : null}

          {/* Laser sweep — sits on top */}
          {isTemplateTransitioning && (
            <LaserSweepTransition phase={templateTransitionPhase} />
          )}
        </div>
      </div>
    </section>
  )
}

function LaserSweepTransition({ phase }: { phase: TemplateTransitionPhase }) {
  if (phase !== 'enter') return null

  return (
    <div className="vs-template-laser-transition">
      <div className="vs-template-laser-line" />
    </div>
  )
}
