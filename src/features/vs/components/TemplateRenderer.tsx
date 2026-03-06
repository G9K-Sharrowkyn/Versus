import type { LayoutMode, TemplatePreviewProps } from '../types'
import {
  CharacterCardATemplate,
  CharacterCardBTemplate,
  WinnerCvTemplate,
} from '../templates/cardTemplates'
import {
  BlankTemplate,
  PowersToolsTemplate,
  RawFeatsTemplate,
} from '../templates/contentTemplates'
import {
  HudBarsTemplate,
  MethodologyTemplate,
  RadarBriefTemplate,
  TacticalBoardTemplate,
} from '../templates/statTemplates'

type TemplateRendererProps = TemplatePreviewProps & {
  layoutMode: LayoutMode
}

export function TemplateRenderer({
  layoutMode,
  activeTemplateId,
  ...commonProps
}: TemplateRendererProps) {
  const templateProps: TemplatePreviewProps = {
    activeTemplateId,
    ...commonProps,
  }

  if (activeTemplateId === 'powers-tools') {
    return <PowersToolsTemplate {...templateProps} />
  }

  if (activeTemplateId === 'raw-feats') {
    return <RawFeatsTemplate {...templateProps} />
  }

  switch (layoutMode) {
    case 'radarBrief':
      return <RadarBriefTemplate {...templateProps} />
    case 'tacticalBoard':
      return <TacticalBoardTemplate {...templateProps} />
    case 'winnerCv':
      return <WinnerCvTemplate {...templateProps} />
    case 'characterCardA':
      return <CharacterCardATemplate {...templateProps} />
    case 'characterCardB':
      return <CharacterCardBTemplate {...templateProps} />
    case 'blankTemplate':
      return <BlankTemplate {...templateProps} />
    case 'methodology':
      return <MethodologyTemplate {...templateProps} />
    default:
      return <HudBarsTemplate {...templateProps} />
  }
}
