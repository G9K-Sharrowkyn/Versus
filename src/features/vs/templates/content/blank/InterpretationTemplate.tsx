import '../../shared/theme.css'
import { AVERAGE_DRAW_THRESHOLD } from '../../../helpers'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { FittedText } from '../../shared/FittedText'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../../shared/templateUi'

export function InterpretationTemplate({
  fighterA,
  fighterB,
  averageA,
  averageB,
  rows,
  title,
  subtitle,
  templateBlocks,
  activeFightId,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const common = getFightCommonCopy('interpretation', language)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES.interpretation || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const chrome = buildFightTemplateChrome('interpretation', language, blockFields)
  const ui = getTemplateUi('interpretation', language)
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const tokens = ui.tokens as Record<string, string>
  const layout = ui.template as Record<string, string | number>
  const line = (position: number, keys: string[], fallback = common.emptyFieldLabel) =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const fighterAFallback = getFightTemplateDefaultField('interpretation', 'fighter_a_fallback', language)
  const fighterBFallback = getFightTemplateDefaultField('interpretation', 'fighter_b_fallback', language)
  const drawBadgeLabel = getFightTemplateDefaultField('interpretation', 'draw_badge_label', language)
  const averageGap = Math.abs(averageA - averageB)
  const isAverageDraw = averageGap < AVERAGE_DRAW_THRESHOLD
  const leaderSide: 'a' | 'b' = averageA >= averageB ? 'a' : 'b'
  const leaderName = leaderSide === 'a' ? fighterA.name || fighterAFallback : fighterB.name || fighterBFallback
  const cardTitleText = isAverageDraw ? drawBadgeLabel : leaderName
  const leaderColor = isAverageDraw ? '#94a3b8' : leaderSide === 'a' ? '#0b69ad' : '#b91c1c'

  const edgeRows = [...rows]
    .map((row) => {
      const delta = isAverageDraw ? Math.abs(row.a - row.b) : leaderSide === 'a' ? row.a - row.b : row.b - row.a
      return { label: row.label.toUpperCase(), delta }
    })
    .filter((row) => row.delta > 0)
    .sort((left, right) => right.delta - left.delta)
    .slice(0, 5)

  const fallbackEdges = isAverageDraw
    ? [
        { label: getFightTemplateDefaultField('interpretation', 'fallback_draw_edge_1', language), delta: 0.8 },
        { label: getFightTemplateDefaultField('interpretation', 'fallback_draw_edge_2', language), delta: 0.7 },
        { label: getFightTemplateDefaultField('interpretation', 'fallback_draw_edge_3', language), delta: 0.6 },
      ]
    : [
        { label: getFightTemplateDefaultField('interpretation', 'fallback_lead_edge_1', language), delta: 4 },
        { label: getFightTemplateDefaultField('interpretation', 'fallback_lead_edge_2', language), delta: 3 },
        { label: getFightTemplateDefaultField('interpretation', 'fallback_lead_edge_3', language), delta: 2 },
      ]
  const bars = edgeRows.length ? edgeRows : fallbackEdges
  const formatDelta = (value: number) => (Number.isInteger(value) ? `${value}` : value.toFixed(1))
  const barGradient = isAverageDraw
    ? String(layout.BAR_GRADIENT_DRAW)
    : leaderSide === 'a'
      ? String(layout.BAR_GRADIENT_A)
      : String(layout.BAR_GRADIENT_B)
  const auditPrefix = `${activeFightId || 'draft'}:interpretation`
  const maxDelta = Number(layout.BAR_MAX_DELTA)
  const minFill = Number(layout.BAR_MIN_FILL)
  const fillRange = Number(layout.BAR_FILL_RANGE)

  const bullet1 = line(0, ['line_1', 'line1', 'thesis'])
  const bullet2 = line(1, ['line_2', 'line2', 'antithesis'])
  const bullet3 = line(2, ['line_3', 'line3', 'conclusion'])
  const closingQuote = pickTemplateField(blockFields, ['quote', 'line_4', 'line4']) || common.emptyFieldLabel
  const badgeSymbol = isAverageDraw ? '=' : 'V'

  const matchupText = `${fighterA.name || fighterAFallback} VS ${fighterB.name || fighterBFallback}`
  const matchupMatch = matchupText.match(/^(.*?)(\s+VS\s+)(.*)$/i)

  return (
    <div className="vs-tpl-surface">
      <div className="vs-tpl-meta">
        <p>{chrome.threatLevelLabel}: <span>{chrome.threatLevelValue}</span></p>
        <p>{chrome.dataIntegrityLabel}: <span>{chrome.dataIntegrityValue}</span></p>
      </div>

      <div className="vs-tpl-heading">
        <h2 className="vs-tpl-title">{headerText}</h2>
        {subText ? <p className="vs-tpl-subtitle">{subText}</p> : null}
        <div className="vs-tpl-matchup">
          {matchupMatch ? (
            <>
              <span className="vs-tpl-matchup-a" style={{ color: fighterA.color }}>{matchupMatch[1].trim()}</span>
              <span className="vs-tpl-matchup-sep">{matchupMatch[2]}</span>
              <span className="vs-tpl-matchup-b" style={{ color: fighterB.color }}>{matchupMatch[3].trim()}</span>
            </>
          ) : matchupText}
        </div>
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
        <div className={`${layout.EDGE_PANEL_CLASS as string} flex-1`}>
          <div className={layout.EDGE_PANEL_OVERLAY_CLASS as string} />
          <div className={layout.EDGE_PANEL_GRID_CLASS as string}>
            <div className={layout.BADGE_SHELL_CLASS as string} style={{ borderColor: leaderColor, backgroundColor: `${leaderColor}1A` }}>
              <div className={layout.BADGE_CARD_CLASS as string}>
                <div className={layout.BADGE_SYMBOL_WRAP_CLASS as string} style={{ borderColor: leaderColor, color: leaderColor }}>
                  {badgeSymbol}
                </div>
                <div className={layout.BADGE_TITLE_WRAP_CLASS as string}>
                  <FittedText
                    as="p"
                    slotKey={`${auditPrefix}:badge-title`}
                    spec={slots.interpretationBadge}
                    text={cardTitleText}
                    className={layout.BADGE_TITLE_CLASS as string}
                    style={{ color: leaderColor, fontFamily: 'var(--font-display)' }}
                    templateId="interpretation"
                    activeFightId={activeFightId}
                    language={language}
                  />
                </div>
              </div>
            </div>

            <div className={layout.BAR_LIST_CLASS as string}>
              {bars.map((bar, index) => {
                const normalizedDelta = Math.min(bar.delta, maxDelta) / maxDelta
                const fillWidth = minFill + normalizedDelta * fillRange
                const labelText = isAverageDraw ? `${bar.label} (d${formatDelta(bar.delta)})` : `${bar.label} (+${formatDelta(bar.delta)})`
                return (
                  <div
                    key={`interp-bar-${index}-${bar.label}`}
                    className={layout.BAR_ROW_CLASS as string}
                    style={{ gridTemplateColumns: `minmax(0,1fr) ${String(layout.LABEL_COLUMN_WIDTH)}` }}
                  >
                    <div className={layout.BAR_TRACK_CLASS as string}>
                      <div className={layout.BAR_FILL_CLASS as string} style={{ width: `${fillWidth}%`, background: barGradient }} />
                    </div>
                    <FittedText
                      as="p"
                      slotKey={`${auditPrefix}:bar-${index}`}
                      spec={slots.interpretationBarLabel}
                      text={labelText}
                      className={tokens.INTERPRETATION_BAR_LABEL_CLASS}
                      templateId="interpretation"
                      activeFightId={activeFightId}
                      language={language}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className={layout.BULLET_PANEL_CLASS as string}>
          <ul className={tokens.INTERPRETATION_BULLET_LIST_CLASS}>
            <li>
              <FittedText
                as="span"
                slotKey={`${auditPrefix}:bullet-1`}
                spec={slots.interpretationBullet}
                text={bullet1}
                templateId="interpretation"
                activeFightId={activeFightId}
                language={language}
              />
            </li>
            <li>
              <FittedText
                as="span"
                slotKey={`${auditPrefix}:bullet-2`}
                spec={slots.interpretationBullet}
                text={bullet2}
                templateId="interpretation"
                activeFightId={activeFightId}
                language={language}
              />
            </li>
            <li>
              <FittedText
                as="span"
                slotKey={`${auditPrefix}:bullet-3`}
                spec={slots.interpretationBullet}
                text={bullet3}
                templateId="interpretation"
                activeFightId={activeFightId}
                language={language}
              />
            </li>
          </ul>
        </div>

        <div className={tokens.INTERPRETATION_QUOTE_CLASS}>
          <FittedText
            as="p"
            slotKey={`${auditPrefix}:quote`}
            spec={slots.interpretationQuote}
            text={`"${closingQuote}"`}
            templateId="interpretation"
            activeFightId={activeFightId}
            language={language}
          />
        </div>
      </div>
    </div>
  )
}
