import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../importer'
import type { TemplatePreviewProps } from '../../types'
import { LightningCanvas } from '../../components/LightningCanvas'
import { FittedText } from '../shared/FittedText'
import { HighEndTemplateHeader } from '../shared/highEnd'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../shared/templateUi'

const METHODOLOGY_ITEM_COUNT = 6

export function MethodologyTemplate({ rows, title, subtitle, templateBlocks, language, onToggleLanguage }: TemplatePreviewProps) {
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES.methodology || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const chrome = buildFightTemplateChrome('methodology', language, blockFields)
  const common = getFightCommonCopy('methodology', language)
  const ui = getTemplateUi('methodology', language)
  const shell = ui.highEnd as Record<string, string>
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string | number>
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const listLabel =
    pickTemplateField(blockFields, ['list_label']) ||
    getFightTemplateDefaultField('methodology', 'list_label', language)
  const realityLabel =
    pickTemplateField(blockFields, ['reality_label']) ||
    getFightTemplateDefaultField('methodology', 'reality_label', language)
  const linearLabel =
    pickTemplateField(blockFields, ['linear_label']) ||
    getFightTemplateDefaultField('methodology', 'linear_label', language)
  const chaosLabel =
    pickTemplateField(blockFields, ['chaos_label']) ||
    getFightTemplateDefaultField('methodology', 'chaos_label', language)
  const closingLabel =
    pickTemplateField(blockFields, ['closing_label']) ||
    getFightTemplateDefaultField('methodology', 'closing_label', language)
  const rowSource = rows.length
    ? rows
    : [{ id: 'fallback', label: common.baseline, a: 50, b: 50, delta: 0, winner: 'draw' as const }]
  const safeRows = Array.from({ length: METHODOLOGY_ITEM_COUNT }, (_, index) => rowSource[index]?.label || common.emptyFieldLabel)

  const splitX = Number(layout.SPLIT_X)
  const linearStartX = Number(layout.LINEAR_START_X)
  const chaosEndX = Number(layout.CHAOS_END_X)
  const stablePoints = `${linearStartX},50 ${splitX},50`
  const linearLabelX = Number(layout.LINEAR_LABEL_X)
  const chaosLabelX = Number(layout.CHAOS_LABEL_X)

  return (
    <div className={`${shell.HIGH_END_ROOT_CLASS} vs-highend-root`}>
      <div className={`${shell.HIGH_END_PANEL_CLASS} vs-highend-panel`}>
        <div className={shell.HIGH_END_GRID_OVERLAY_CLASS} />
        <div className={layout.INNER_CLASS as string}>
          <HighEndTemplateHeader
            templateId="methodology"
            language={language}
            chrome={chrome}
            headerText={headerText}
            subText={subText}
            onToggleLanguage={onToggleLanguage}
          />

          <div className={`${shell.HIGH_END_BODY_GAP_CLASS} ${layout.BODY_CLASS}`}>
            <div className={layout.LIST_PANEL_CLASS as string}>
              <p className={layout.LIST_HEADER_CLASS as string}>{listLabel}</p>
              <div className={layout.LIST_GRID_CLASS as string}>
                {safeRows.map((label, index) => (
                  <div key={`method-${index}`} className={layout.LIST_ITEM_CLASS as string}>
                    <FittedText
                      as="p"
                      slotKey={`methodology:item:${index}`}
                      spec={slots.methodologyItem}
                      text={`${index + 1}. ${label}`}
                      className={layout.LIST_ITEM_TEXT_CLASS as string}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className={layout.RIGHT_COLUMN_CLASS as string}>
              <div className={layout.REALITY_PANEL_CLASS as string}>
                <p className={layout.REALITY_HEADER_CLASS as string}>{realityLabel}</p>
                <div className={layout.REALITY_VIEWPORT_CLASS as string}>
                  <div className={layout.REALITY_CANVAS_CLASS as string}>
                    <LightningCanvas
                      startRatio={{ x: splitX / 100, y: 0.5 }}
                      endRatio={{ x: Math.min(1.34, chaosEndX / 100 + Number(layout.LIGHTNING_EXTENSION)), y: 0.5 }}
                    />
                    <svg viewBox={layout.SVG_VIEWBOX as string} className={layout.SVG_CLASS as string}>
                      <line x1={splitX} y1={layout.DIVIDER_Y1 as string} x2={splitX} y2={layout.DIVIDER_Y2 as string} stroke={layout.DIVIDER_STROKE as string} strokeWidth={layout.DIVIDER_STROKE_WIDTH as string} strokeDasharray={layout.DIVIDER_DASHARRAY as string} />
                      <text
                        x={linearLabelX}
                        y={layout.LINEAR_LABEL_Y as string}
                        fill={layout.LINEAR_LABEL_FILL as string}
                        fontSize={layout.LABEL_FONT_SIZE as string}
                        fontFamily={layout.LABEL_FONT_FAMILY as string}
                        fontWeight={layout.LABEL_FONT_WEIGHT as string}
                        textAnchor={layout.LABEL_TEXT_ANCHOR as 'middle'}
                        style={{ letterSpacing: layout.LABEL_LETTER_SPACING as string }}
                      >
                        {linearLabel}
                      </text>
                      <text
                        x={chaosLabelX}
                        y={layout.CHAOS_LABEL_Y as string}
                        fill={layout.CHAOS_LABEL_FILL as string}
                        fontSize={layout.LABEL_FONT_SIZE as string}
                        fontFamily={layout.LABEL_FONT_FAMILY as string}
                        fontWeight={layout.LABEL_FONT_WEIGHT as string}
                        textAnchor={layout.LABEL_TEXT_ANCHOR as 'middle'}
                        style={{ letterSpacing: layout.LABEL_LETTER_SPACING as string }}
                      >
                        {chaosLabel}
                      </text>
                      <polyline points={stablePoints} fill="none" stroke={layout.STABLE_LINE_STROKE as string} strokeWidth={layout.STABLE_LINE_WIDTH as string} />
                      <polyline points={stablePoints} fill="none" stroke={layout.GLOW_LINE_STROKE as string} strokeWidth={layout.GLOW_LINE_WIDTH as string} />
                    </svg>
                  </div>
                </div>
              </div>

              <div className={layout.CLOSING_CARD_CLASS as string}>
                <FittedText
                  as="p"
                  slotKey="methodology:closing-label"
                  spec={slots.methodologyClosing}
                  text={closingLabel}
                  className={layout.CLOSING_TEXT_CLASS as string}
                />
                <p className={layout.CLOSING_SUBTEXT_CLASS as string}>{subText}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

