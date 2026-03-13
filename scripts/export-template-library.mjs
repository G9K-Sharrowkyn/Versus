import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const templatesRoot = path.join(repoRoot, 'Templates')
const generatedModulePath = path.join(
  repoRoot,
  'src/features/vs/templates/shared/templateLibrary.generated.ts',
)

const locales = ['pl', 'en']

const toImportAlias = (templateId, locale) =>
  `${templateId.replace(/[^a-z0-9]+([a-z0-9])/gi, (_, character) => character.toUpperCase()).replace(/[^a-zA-Z0-9]/g, '')}${locale.toUpperCase()}`

const templateDirs = readdirSync(templatesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

mkdirSync(path.dirname(generatedModulePath), { recursive: true })

const importLines = []
const registryLines = []

for (const templateId of templateDirs) {
  for (const locale of locales) {
    const filePath = path.join(templatesRoot, templateId, `Template ${locale.toUpperCase()}.json`)
    const json = JSON.parse(readFileSync(filePath, 'utf8'))
    if (json.id !== templateId) {
      throw new Error(`Template ${templateId} has mismatched id in ${filePath}: ${json.id}`)
    }
    if (json.locale !== locale) {
      throw new Error(`Template ${templateId} has mismatched locale in ${filePath}: ${json.locale}`)
    }
    if (!statSync(filePath).isFile()) {
      throw new Error(`Missing template definition file: ${filePath}`)
    }

    const alias = toImportAlias(templateId, locale)
    const relativeImport = `../../../../../Templates/${templateId}/Template ${locale.toUpperCase()}.json`
    importLines.push(`import ${alias} from '${relativeImport}'`)
  }

  registryLines.push(
    `  '${templateId}': { pl: ${toImportAlias(templateId, 'pl')}, en: ${toImportAlias(templateId, 'en')} },`,
  )
}

const generatedModule = `import type { Category, Language, TemplateId } from '../../types'

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

${importLines.join('\n')}

export const TEMPLATE_LIBRARY = {
${registryLines.join('\n')}
} as Record<TemplateId, Record<Language, TemplateLocaleDefinition>>
`

writeFileSync(generatedModulePath, generatedModule, 'utf8')

console.log(`Generated template library index for ${templateDirs.length} templates.`)
