import type { TemplatePreviewProps } from '../../types'
import { BattleDynamicsTemplate } from './blank/BattleDynamicsTemplate'
import { createBlankTemplateContext } from './blank/context'
import { DefaultBlankTemplate } from './blank/DefaultBlankTemplate'
import { FightSimulationTemplate } from './blank/FightSimulationTemplate'
import { FightTitleTemplate } from './blank/FightTitleTemplate'
import { InterpretationTemplate } from './blank/InterpretationTemplate'
import { StatTrapTemplate } from './blank/StatTrapTemplate'
import { SummaryTemplate } from './blank/SummaryTemplate'
import { VerdictMatrixTemplate } from './blank/VerdictMatrixTemplate'
import { XFactorTemplate } from './blank/XFactorTemplate'

export function BlankTemplate(props: TemplatePreviewProps) {
  const context = createBlankTemplateContext(props)

  switch (props.activeTemplateId) {
    case 'fight-title':
      return <FightTitleTemplate {...props} context={context} />
    case 'summary':
      return <SummaryTemplate {...props} context={context} />
    case 'battle-dynamics':
      return <BattleDynamicsTemplate {...props} context={context} />
    case 'x-factor':
      return <XFactorTemplate {...props} context={context} />
    case 'interpretation':
      return <InterpretationTemplate {...props} context={context} />
    case 'fight-simulation':
      return <FightSimulationTemplate {...props} context={context} />
    case 'stat-trap':
      return <StatTrapTemplate {...props} context={context} />
    case 'verdict-matrix':
      return <VerdictMatrixTemplate {...props} context={context} />
    default:
      return <DefaultBlankTemplate {...props} context={context} />
  }
}
