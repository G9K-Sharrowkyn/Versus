import type { ReactNode, RefObject } from 'react'
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
}: FightPreviewStageProps) {
  const isTemplateTransitioning = templateTransitionPhase !== 'idle'
  const transitionClass =
    templateTransitionPhase === 'exit'
      ? 'is-template-transition-exit'
      : templateTransitionPhase === 'enter'
      ? 'is-template-transition-enter'
      : ''

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
          className={`vs-preview-shell--bare-body ${isTemplateTransitioning ? 'is-template-transitioning' : ''} ${transitionClass}`}
          style={{
            width: '100%',
            height: '100%',
            transform: 'none',
            transformOrigin: isTemplateTransitioning ? 'center center' : 'top center',
            opacity: previewReady ? 1 : 0,
          }}
          aria-busy={!previewReady || isTemplateTransitioning}
        >
          {children}
        </div>
        <div
          className={`vs-template-rail-overlay ${isTemplateTransitioning ? 'is-active' : ''} ${templateTransitionPhase === 'exit' ? 'is-exit' : ''} ${templateTransitionPhase === 'enter' ? 'is-enter' : ''}`}
          aria-hidden="true"
        >
          <div className="vs-template-rail-gutter vs-template-rail-gutter-left">
            <div className="vs-template-rail-fill" />
            <div className="vs-template-rail-line vs-template-rail-line-outer" />
            <div className="vs-template-rail-line vs-template-rail-line-inner" />
          </div>
          <div className="vs-template-rail-gutter vs-template-rail-gutter-right">
            <div className="vs-template-rail-fill" />
            <div className="vs-template-rail-line vs-template-rail-line-outer" />
            <div className="vs-template-rail-line vs-template-rail-line-inner" />
          </div>
          <div className="vs-template-rail-gear vs-template-rail-gear-left-top" />
          <div className="vs-template-rail-gear vs-template-rail-gear-left-bottom" />
          <div className="vs-template-rail-gear vs-template-rail-gear-right-top" />
          <div className="vs-template-rail-gear vs-template-rail-gear-right-bottom" />
        </div>
      </div>
    </section>
  )
}
