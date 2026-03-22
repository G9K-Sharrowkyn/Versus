import type { TemplatePreviewProps } from '../types'
import { CharacterDossierATemplate } from '../templates/v2/character-dossier-a/CharacterDossierATemplate'
import { CharacterDossierBTemplate } from '../templates/v2/character-dossier-b/CharacterDossierBTemplate'
import { VictoryArchiveTemplate } from '../templates/v2/victory-archive/VictoryArchiveTemplate'
import { CharacterProfileTemplate } from '../templates/v2/character-profile/CharacterProfileTemplate'
import { CrucialFeatsTemplate } from '../templates/v2/crucial-feats/CrucialFeatsTemplate'
import { BattleDynamicsTemplate } from '../templates/v2/battle-dynamics/BattleDynamicsTemplate'
import { DirectVerdictTemplate } from '../templates/v2/direct-verdict/DirectVerdictTemplate'
import { FightSimulationTemplate } from '../templates/v2/fight-simulation/FightSimulationTemplate'
import { FightCardTemplate } from '../templates/v2/fight-card/FightCardTemplate'
import { InterpretationTemplate } from '../templates/v2/interpretation/InterpretationTemplate'
import { StatTrapTemplate } from '../templates/v2/stat-trap/StatTrapTemplate'
import { FinalSummaryTemplate as SummaryTemplate } from '../templates/v2/final-summary/FinalSummaryTemplate'
import { UnknownTemplate } from '../templates/content/blank/UnknownTemplate'
import { VerdictMatrixTemplate } from '../templates/v2/verdict-matrix/VerdictMatrixTemplate'
import { XFactorTemplate } from '../templates/v2/x-factor/XFactorTemplate'
import { FightAnalyticsTemplate } from '../templates/v2/fight-analytics/FightAnalyticsTemplate'
import { MethodologyTemplate } from '../templates/v2/methodology/MethodologyTemplate'
import { ParameterComparisonTemplate } from '../templates/v2/parameter-comparison/ParameterComparisonTemplate'
import { TacticalBoardTemplate } from '../templates/v2/tactical-board/TacticalBoardTemplate'

export function TemplateRenderer({ activeTemplateId, ...templateProps }: TemplatePreviewProps) {
  const props: TemplatePreviewProps = {
    activeTemplateId,
    ...templateProps,
  }

  switch (activeTemplateId) {
    case 'character-profile':
      return <CharacterProfileTemplate {...props} />
    case 'crucial-feats':
      return <CrucialFeatsTemplate {...props} />
    case 'fight-analytics':
      return <FightAnalyticsTemplate {...props} />
    case 'parameter-comparison':
      return <ParameterComparisonTemplate {...props} />
    case 'tactical-board':
      return <TacticalBoardTemplate {...props} />
    case 'victory-archive':
      return <VictoryArchiveTemplate {...props} />
    case 'character-dossier-a':
      return <CharacterDossierATemplate {...props} />
    case 'character-dossier-b':
      return <CharacterDossierBTemplate {...props} />
    case 'final-summary':
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
    case 'direct-verdict':
      return <DirectVerdictTemplate {...props} />
    case 'verdict-matrix':
      return <VerdictMatrixTemplate {...props} />
    case 'fight-card':
      return <FightCardTemplate {...props} />
    case 'methodology':
      return <MethodologyTemplate {...props} />
    default:
      return <UnknownTemplate {...props} />
  }
}
