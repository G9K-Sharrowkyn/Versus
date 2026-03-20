import '../shared/theme.css'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, parseTemplateFieldMap, pickTemplateField } from '../../importer'
import type { TemplatePreviewProps } from '../../types'
import { HighEndFighterBanner } from '../shared/highEnd'
import { FittedText } from '../shared/FittedText'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../shared/templateUi'

export function FightAnalyticsTemplate({
  rows,
  fighterA,
  fighterB,
  averageA,
  averageB,
  title,
  subtitle,
  templateBlocks,
  activeFightId,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['fight-analytics'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const chrome = buildFightTemplateChrome('fight-analytics', language, blockFields)
  const common = getFightCommonCopy('fight-analytics', language)
  const ui = getTemplateUi('fight-analytics', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string>
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = subtitle
  const averageShort =
    getFightTemplateDefaultField('fight-analytics', 'average_short', language) || common.averageShort
  const parameterLabel =
    getFightTemplateDefaultField('fight-analytics', 'parameter_label', language) || common.parameterLabel
  const scoreScaleLabel =
    getFightTemplateDefaultField('fight-analytics', 'score_scale_label', language) || common.scoreScaleLabel
  const auditPrefix = `${activeFightId || 'draft'}:fight-analytics`
  const scaleMarks = (layout.SCALE_MARKS as unknown as Array<{ label: string; className: string }>) || []

  return (
    <div className="vs-tpl-surface">
      <div className="vs-tpl-meta">
        <p>{chrome.threatLevelLabel}: <span>{chrome.threatLevelValue}</span></p>
        <p>{chrome.dataIntegrityLabel}: <span>{chrome.dataIntegrityValue}</span></p>
      </div>

      <div className="vs-tpl-heading">
        <h2 className="vs-tpl-title">{headerText}</h2>
        {subText ? <p className="vs-tpl-subtitle">{subText}</p> : null}
      </div>

      <button
        type="button"
        className="vs-tpl-logo"
        title={chrome.brandMarkTitle}
        aria-label={chrome.brandMarkAria}
        onClick={onToggleLanguage}
      >
        <img src={chrome.brandImageSrc} alt={chrome.brandAlt} draggable={false} />
        <img className="vs-tpl-logo-reflection" src={chrome.brandImageSrc} alt="" aria-hidden="true" draggable={false} />
      </button>

      <div className="vs-tpl-body">
        <div className={layout.BANNERS_GRID_CLASS}>
          <HighEndFighterBanner
            templateId="fight-analytics"
            language={language}
            fighter={fighterA}
            trailing={
              <div className={layout.AVERAGE_CARD_CLASS}>
                <p className={layout.AVERAGE_LABEL_CLASS}>{averageShort}</p>
                <p className={layout.AVERAGE_VALUE_CLASS} style={{ color: fighterA.color }}>
                  {averageA.toFixed(1)}
                </p>
              </div>
            }
          />
          <HighEndFighterBanner
            templateId="fight-analytics"
            language={language}
            fighter={fighterB}
            trailing={
              <div className={layout.AVERAGE_CARD_CLASS}>
                <p className={layout.AVERAGE_LABEL_CLASS}>{averageShort}</p>
                <p className={layout.AVERAGE_VALUE_CLASS} style={{ color: fighterB.color }}>
                  {averageB.toFixed(1)}
                </p>
              </div>
            }
          />
        </div>

        <div className={layout.CONTENT_CLASS}>
          <div className={layout.HEADER_ROW_CLASS}>
            <p>{parameterLabel}</p>
            <div className={layout.SCALE_WRAP_CLASS}>
              <span>{scoreScaleLabel}</span>
              <div className={layout.SCALE_GRID_CLASS}>
                <div className={layout.SCALE_MARKS_CLASS}>
                  {scaleMarks.map((mark) => (
                    <span key={`fight-analytics-scale-${mark.label}`} className={mark.className}>
                      {mark.label}
                    </span>
                  ))}
                </div>
                <div />
              </div>
            </div>
          </div>
          <div className={layout.ROWS_WRAP_CLASS}>
            {rows.map((row, index) => (
              <div
                key={`row-${row.id}`}
                className={layout.ROW_CLASS}
                style={{ animationDelay: `${index * 0.04}s` }}
              >
                <FittedText
                  as="div"
                  slotKey={`${auditPrefix}:row-label-${row.id}`}
                  spec={slots.parameterAdvantageValue}
                  text={row.label}
                  className={layout.ROW_LABEL_CLASS}
                  templateId="fight-analytics"
                  activeFightId={activeFightId}
                  language={language}
                />
                <div className={layout.BAR_GROUP_CLASS}>
                  <div className={layout.BAR_ROW_CLASS}>
                    <div className={layout.BAR_TRACK_CLASS}>
                      <div className={layout.BAR_FILL_CLASS} style={{ width: `${row.a}%`, backgroundColor: fighterA.color }} />
                    </div>
                    <span className={layout.BAR_VALUE_CLASS}>{row.a}</span>
                  </div>
                  <div className={layout.BAR_ROW_CLASS}>
                    <div className={layout.BAR_TRACK_CLASS}>
                      <div className={layout.BAR_FILL_CLASS} style={{ width: `${row.b}%`, backgroundColor: fighterB.color }} />
                    </div>
                    <span className={layout.BAR_VALUE_CLASS}>{row.b}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
