import type { TemplatePreviewProps } from '../types'
import { CharacterDossierATemplate } from '../templates/card/CharacterDossierATemplate'
import { CharacterDossierBTemplate } from '../templates/card/CharacterDossierBTemplate'
import { VictoryArchiveTemplate } from '../templates/card/VictoryArchiveTemplate'
import { CharacterProfileTemplate } from '../templates/content/CharacterProfileTemplate'
import { CrucialFeatsTemplate } from '../templates/content/CrucialFeatsTemplate'
import { BattleDynamicsTemplate } from '../templates/content/blank/BattleDynamicsTemplate'
import { NewTemplate } from '../templates/content/blank/NewTemplate'
import { FightSimulationTemplate } from '../templates/content/blank/FightSimulationTemplate'
import { FightCardTemplate } from '../templates/content/blank/FightCardTemplate'
import { InterpretationTemplate } from '../templates/content/blank/InterpretationTemplate'
import { StatTrapTemplate } from '../templates/content/blank/StatTrapTemplate'
import { SummaryTemplate } from '../templates/content/blank/SummaryTemplate'
import { VerdictMatrixTemplate } from '../templates/content/blank/VerdictMatrixTemplate'
import { XFactorTemplate } from '../templates/content/blank/XFactorTemplate'
import { FightAnalyticsTemplate } from '../templates/stat/FightAnalyticsTemplate'
import { MethodologyTemplate } from '../templates/stat/MethodologyTemplate'
import { ParameterComparisonTemplate } from '../templates/stat/ParameterComparisonTemplate'
import { TacticalBoardTemplate } from '../templates/stat/TacticalBoardTemplate'

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
    case 'verdict-matrix':
      return <VerdictMatrixTemplate {...props} />
    case 'fight-card':
      return <FightCardTemplate {...props} />
    case 'methodology':
      return <MethodologyTemplate {...props} />
    default:
      return <NewTemplate {...props} />
  }
}
