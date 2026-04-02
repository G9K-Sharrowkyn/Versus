import type { Category, Language, TemplateId } from '../../types'

type TemplateLayoutPrimitive = string | number | boolean | null
export type TemplateLayoutValue =
  | TemplateLayoutPrimitive
  | TemplateLayoutValue[]
  | { [key: string]: TemplateLayoutValue }

export type TemplateSlotSpec = {
  baseFontPx: number
  minFontPx: number
  lineHeight: number
  maxLines: number
  fitMode?: 'none' | 'shrink'
  whiteSpace?: string
  textAlign?: string
  textTransform?: string
  overflowWrap?: string
  wordBreak?: string
  letterSpacing?: string
}

export type TemplateLocaleDefinition = {
  id: TemplateId
  locale: Language
  metadata: {
    activeName: string
    description: string
    title: string
    subtitle: string
    blockName: string
    purpose: string
  }
  chrome: {
    threatLevelLabel: string
    threatLevelValue: string
    dataIntegrityLabel: string
    dataIntegrityValue: string
    brandAlt: string
    brandMarkTitle: string
    brandMarkAria: string
    brandImageSrc: string
    portraitAdjustHint: string
  }
  common: {
    style: string
    advantage: string
    mentality: string
    blueCorner: string
    redCorner: string
    noImage: string
    portraitSlot: string
    noDrawsCurrentSetup: string
    baseline: string
    toolkitProfileSuffix: string
    noEntry: string
    noDataInCategory: string
    noPowersWeaknesses: string
    noLeftCategoryEdge: string
    noRightCategoryEdge: string
    archiveLabel: string
    recordPrefix: string
    entriesUnit: string
    averageShort: string
    parameterLabel: string
    scoreScaleLabel: string
    drawZonesLabel: string
    drawLabel: string
    favoriteSuffix: string
    summaryLabel: string
    dataLabel: string
    verdictLabel: string
    mechanicsLabel: string
    implicationLabel: string
    psychologyLabel: string
    keyQuestionLabel: string
    templateBlockPreviewLabel: string
    emptyFieldLabel: string
    startLabel: string
    fightTimeLabel: string
    endLabel: string
    advantageStaminaLabel: string
    phaseLabel: string
    phase1Label: string
    phase2Label: string
    phase3Label: string
    scenarioPresetLabel: string
  }
  categories: Category[]
  staticFields: Record<string, string>
  layout: Record<string, TemplateLayoutValue>
  slots: Record<string, TemplateSlotSpec>
}

import battleDynamicsPL from '../content/battle-dynamics/Template PL.json'
import battleDynamicsEN from '../content/battle-dynamics/Template EN.json'
import characterDossierAPL from '../content/character-dossier-a/Template PL.json'
import characterDossierAEN from '../content/character-dossier-a/Template EN.json'
import characterDossierBPL from '../content/character-dossier-b/Template PL.json'
import characterDossierBEN from '../content/character-dossier-b/Template EN.json'
import characterProfilePL from '../content/character-profile/Template PL.json'
import characterProfileEN from '../content/character-profile/Template EN.json'
import crucialFeatsPL from '../content/crucial-feats/Template PL.json'
import crucialFeatsEN from '../content/crucial-feats/Template EN.json'
import directVerdictPL from '../content/direct-verdict/Template PL.json'
import directVerdictEN from '../content/direct-verdict/Template EN.json'
import fightAnalyticsPL from '../content/fight-analytics/Template PL.json'
import fightAnalyticsEN from '../content/fight-analytics/Template EN.json'
import fightCardPL from '../content/fight-card/Template PL.json'
import fightCardEN from '../content/fight-card/Template EN.json'
import fightSimulationPL from '../content/fight-simulation/Template PL.json'
import fightSimulationEN from '../content/fight-simulation/Template EN.json'
import finalSummaryPL from '../content/final-summary/Template PL.json'
import finalSummaryEN from '../content/final-summary/Template EN.json'
import interpretationPL from '../content/interpretation/Template PL.json'
import interpretationEN from '../content/interpretation/Template EN.json'
import methodologyPL from '../content/methodology/Template PL.json'
import methodologyEN from '../content/methodology/Template EN.json'
import parameterComparisonPL from '../content/parameter-comparison/Template PL.json'
import parameterComparisonEN from '../content/parameter-comparison/Template EN.json'
import statTrapPL from '../content/stat-trap/Template PL.json'
import statTrapEN from '../content/stat-trap/Template EN.json'
import tacticalBoardPL from '../content/tactical-board/Template PL.json'
import tacticalBoardEN from '../content/tactical-board/Template EN.json'
import verdictMatrixPL from '../content/verdict-matrix/Template PL.json'
import verdictMatrixEN from '../content/verdict-matrix/Template EN.json'
import victoryArchivePL from '../content/victory-archive/Template PL.json'
import victoryArchiveEN from '../content/victory-archive/Template EN.json'
import xFactorPL from '../content/x-factor/Template PL.json'
import xFactorEN from '../content/x-factor/Template EN.json'

export const TEMPLATE_LIBRARY = {
  'battle-dynamics': { pl: battleDynamicsPL, en: battleDynamicsEN },
  'character-dossier-a': { pl: characterDossierAPL, en: characterDossierAEN },
  'character-dossier-b': { pl: characterDossierBPL, en: characterDossierBEN },
  'character-profile': { pl: characterProfilePL, en: characterProfileEN },
  'crucial-feats': { pl: crucialFeatsPL, en: crucialFeatsEN },
  'direct-verdict': { pl: directVerdictPL, en: directVerdictEN },
  'fight-analytics': { pl: fightAnalyticsPL, en: fightAnalyticsEN },
  'fight-card': { pl: fightCardPL, en: fightCardEN },
  'fight-simulation': { pl: fightSimulationPL, en: fightSimulationEN },
  'final-summary': { pl: finalSummaryPL, en: finalSummaryEN },
  'interpretation': { pl: interpretationPL, en: interpretationEN },
  'methodology': { pl: methodologyPL, en: methodologyEN },
  'parameter-comparison': { pl: parameterComparisonPL, en: parameterComparisonEN },
  'stat-trap': { pl: statTrapPL, en: statTrapEN },
  'tactical-board': { pl: tacticalBoardPL, en: tacticalBoardEN },
  'verdict-matrix': { pl: verdictMatrixPL, en: verdictMatrixEN },
  'victory-archive': { pl: victoryArchivePL, en: victoryArchiveEN },
  'x-factor': { pl: xFactorPL, en: xFactorEN },
} as Record<TemplateId, Record<Language, TemplateLocaleDefinition>>
