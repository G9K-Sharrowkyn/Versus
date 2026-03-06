import type { TemplatePreviewProps } from '../types'
import { CharacterCardATemplate } from '../templates/card/CharacterCardATemplate'
import { CharacterCardBTemplate } from '../templates/card/CharacterCardBTemplate'
import { WinnerCvTemplate } from '../templates/card/WinnerCvTemplate'
import { PowersToolsTemplate } from '../templates/content/PowersToolsTemplate'
import { RawFeatsTemplate } from '../templates/content/RawFeatsTemplate'
import { BattleDynamicsTemplate } from '../templates/content/blank/BattleDynamicsTemplate'
import { DefaultBlankTemplate } from '../templates/content/blank/DefaultBlankTemplate'
import { FightSimulationTemplate } from '../templates/content/blank/FightSimulationTemplate'
import { FightTitleTemplate } from '../templates/content/blank/FightTitleTemplate'
import { InterpretationTemplate } from '../templates/content/blank/InterpretationTemplate'
import { StatTrapTemplate } from '../templates/content/blank/StatTrapTemplate'
import { SummaryTemplate } from '../templates/content/blank/SummaryTemplate'
import { VerdictMatrixTemplate } from '../templates/content/blank/VerdictMatrixTemplate'
import { XFactorTemplate } from '../templates/content/blank/XFactorTemplate'
import { HudBarsTemplate } from '../templates/stat/HudBarsTemplate'
import { MethodologyTemplate } from '../templates/stat/MethodologyTemplate'
import { RadarBriefTemplate } from '../templates/stat/RadarBriefTemplate'
import { TacticalBoardTemplate } from '../templates/stat/TacticalBoardTemplate'

export function TemplateRenderer({ activeTemplateId, ...templateProps }: TemplatePreviewProps) {
  const props: TemplatePreviewProps = {
    activeTemplateId,
    ...templateProps,
  }

  switch (activeTemplateId) {
    case 'powers-tools':
      return <PowersToolsTemplate {...props} />
    case 'raw-feats':
      return <RawFeatsTemplate {...props} />
    case 'hud-bars':
      return <HudBarsTemplate {...props} />
    case 'radar-brief':
      return <RadarBriefTemplate {...props} />
    case 'tactical-board':
      return <TacticalBoardTemplate {...props} />
    case 'winner-cv':
      return <WinnerCvTemplate {...props} />
    case 'character-card-a':
      return <CharacterCardATemplate {...props} />
    case 'character-card-b':
      return <CharacterCardBTemplate {...props} />
    case 'summary':
      return <SummaryTemplate {...props} />
    case 'battle-dynamics':
      return <BattleDynamicsTemplate {...props} />
    case 'x-factor':
      return <XFactorTemplate {...props} />
    case 'interpretation':
      return <InterpretationTemplate {...props} />
    case 'fight-simulation':
      return <FightSimulationTemplate {...props} />
    case 'stat-trap':
      return <StatTrapTemplate {...props} />
    case 'verdict-matrix':
      return <VerdictMatrixTemplate {...props} />
    case 'fight-title':
      return <FightTitleTemplate {...props} />
    case 'methodology':
      return <MethodologyTemplate {...props} />
    default:
      return <DefaultBlankTemplate {...props} />
  }
}
