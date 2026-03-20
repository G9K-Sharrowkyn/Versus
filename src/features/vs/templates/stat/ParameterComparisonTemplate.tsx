import '../shared/theme.css'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from 'recharts'
import { AVERAGE_DRAW_THRESHOLD } from '../../helpers'
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

export function ParameterComparisonTemplate({
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
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['parameter-comparison'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const chrome = buildFightTemplateChrome('parameter-comparison', language, blockFields)
  const common = getFightCommonCopy('parameter-comparison', language)
  const ui = getTemplateUi('parameter-comparison', language)
  const shell = ui.highEnd as Record<string, string>
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string | number>
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = subtitle
  const fighterAFallback = getFightTemplateDefaultField('parameter-comparison', 'fighter_a_fallback', language)
  const fighterBFallback = getFightTemplateDefaultField('parameter-comparison', 'fighter_b_fallback', language)
  const leftHeader = fighterA.name || fighterAFallback
  const rightHeader = fighterB.name || fighterBFallback
  const drawHeader =
    pickTemplateField(blockFields, ['draw_header']) ||
    getFightTemplateDefaultField('parameter-comparison', 'draw_header', language) ||
    common.drawZonesLabel
  const leftAdvantages = rows.filter((row) => row.winner === 'a')
  const rightAdvantages = rows.filter((row) => row.winner === 'b')
  const drawRows = rows.filter((row) => row.winner === 'draw')
  const fighterAText = fighterA.name || fighterAFallback
  const fighterBText = fighterB.name || fighterBFallback
  const averageGap = Math.abs(averageA - averageB)
  const isAverageDraw = averageGap < AVERAGE_DRAW_THRESHOLD
  const favoriteSide: 'a' | 'b' | 'draw' = isAverageDraw ? 'draw' : averageA > averageB ? 'a' : 'b'
  const favoriteDrawLabel =
    pickTemplateField(blockFields, ['draw_favorite', 'draw_favorite_label', 'favorite_draw']) ||
    getFightTemplateDefaultField('parameter-comparison', 'draw_favorite', language) ||
    common.drawLabel
  const favoriteLabel =
    pickTemplateField(blockFields, ['favorite_label', 'favorite']) ||
    getFightTemplateDefaultField('parameter-comparison', 'favorite_label', language)
  const favorite =
    isAverageDraw
      ? favoriteDrawLabel
      : favoriteLabel || (averageA > averageB ? `${fighterAText} ${common.favoriteSuffix}` : `${fighterBText} ${common.favoriteSuffix}`)
  const favoriteLeft = favoriteSide === 'a' ? '37.5%' : favoriteSide === 'b' ? '87.5%' : '50%'
  const favoriteRotation = favoriteSide === 'a' ? -12 : favoriteSide === 'b' ? 12 : 0
  const auditPrefix = `${activeFightId || 'draft'}:parameter-comparison`
  const renderAdvantageCards = (
    entries: typeof rows,
    side: 'a' | 'b' | 'draw',
    color: string,
    emptyLabel: string,
    slotPrefix: 'left' | 'right' | 'draw',
  ) => {
    if (!entries.length) {
      return (
        <div className={layout.ADVANTAGE_EMPTY_CLASS as string}>
          <FittedText
            as="p"
            slotKey={`${auditPrefix}:${slotPrefix}-empty`}
            spec={slots.parameterAdvantageValue}
            text={emptyLabel}
            className={layout.ADVANTAGE_EMPTY_TEXT_CLASS as string}
            templateId="parameter-comparison"
            activeFightId={activeFightId}
            language={language}
          />
        </div>
      )
    }

    return entries.map((row) => {
      const valueText =
        side === 'draw'
          ? `${row.a} = ${row.b}`
          : side === 'a'
            ? `${row.a} > ${row.b}`
            : `${row.b} > ${row.a}`

      return (
        <div
          key={`${slotPrefix}-adv-${row.id}`}
          className={layout.ADVANTAGE_CARD_CLASS as string}
          style={{
            borderColor: `${color}7A`,
            background: `linear-gradient(180deg, ${color}26 0%, rgba(2,6,23,0.86) 100%)`,
            boxShadow: `0 0 0 1px ${color}22 inset`,
          }}
        >
          <FittedText
            as="p"
            slotKey={`${auditPrefix}:${slotPrefix}-label-${row.id}`}
            spec={slots.parameterAdvantageLabel}
            text={row.label}
            className={layout.ADVANTAGE_LABEL_CLASS as string}
            style={{ color }}
            templateId="parameter-comparison"
            activeFightId={activeFightId}
            language={language}
          />
          <FittedText
            as="p"
            slotKey={`${auditPrefix}:${slotPrefix}-value-${row.id}`}
            spec={slots.parameterAdvantageValue}
            text={valueText}
            className={layout.ADVANTAGE_VALUE_CLASS as string}
            templateId="parameter-comparison"
            activeFightId={activeFightId}
            language={language}
          />
        </div>
      )
    })
  }

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
        <div className={layout.BODY_CLASS as string}>
          <div className={layout.MAIN_GRID_CLASS as string}>
            <div className={`${shell.HIGH_END_FRAME_CLASS} ${layout.SIDE_FRAME_CLASS as string}`}>
              <HighEndFighterBanner templateId="parameter-comparison" language={language} fighter={{ ...fighterA, name: leftHeader }} />
              <div className={layout.ADVANTAGES_GRID_CLASS as string}>
                {renderAdvantageCards(leftAdvantages, 'a', fighterA.color, common.noLeftCategoryEdge, 'left')}
              </div>
            </div>

            <div className={`${shell.HIGH_END_FRAME_CLASS} ${layout.CENTER_FRAME_CLASS as string}`}>
              <div className={layout.RADAR_WRAP_CLASS as string}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    data={rows}
                    cx={String(layout.RADAR_CX)}
                    cy={String(layout.RADAR_CY)}
                    outerRadius={String(layout.RADAR_OUTER_RADIUS)}
                    margin={{
                      top: Number(layout.RADAR_MARGIN_TOP),
                      right: Number(layout.RADAR_MARGIN_RIGHT),
                      bottom: Number(layout.RADAR_MARGIN_BOTTOM),
                      left: Number(layout.RADAR_MARGIN_LEFT),
                    }}
                  >
                    <PolarGrid stroke="rgba(148,163,184,0.35)" />
                    <PolarAngleAxis dataKey="label" tick={{ fill: '#CBD5E1', fontSize: 12 }} />
                    <Radar dataKey="a" stroke={fighterA.color} fill={fighterA.color} fillOpacity={0.33} isAnimationActive={false} />
                    <Radar dataKey="b" stroke={fighterB.color} fill={fighterB.color} fillOpacity={0.28} isAnimationActive={false} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className={layout.DRAW_PANEL_CLASS as string}>
                <FittedText
                  as="p"
                  slotKey={`${auditPrefix}:draw-header`}
                  spec={slots.sectionLabel}
                  text={drawHeader}
                  className={layout.DRAW_HEADER_CLASS as string}
                  templateId="parameter-comparison"
                  activeFightId={activeFightId}
                  language={language}
                />
                <div className={layout.DRAW_GRID_CLASS as string}>
                  {renderAdvantageCards(drawRows, 'draw', '#cbd5e1', common.noDrawsCurrentSetup, 'draw')}
                </div>
              </div>
            </div>

            <div className={`${shell.HIGH_END_FRAME_CLASS} ${layout.SIDE_FRAME_CLASS as string}`}>
              <HighEndFighterBanner templateId="parameter-comparison" language={language} fighter={{ ...fighterB, name: rightHeader }} />
              <div className={layout.ADVANTAGES_GRID_CLASS as string}>
                {renderAdvantageCards(rightAdvantages, 'b', fighterB.color, common.noRightCategoryEdge, 'right')}
              </div>
            </div>
          </div>

          <div className={layout.BOTTOM_GRID_CLASS as string}>
            <div className={`${shell.HIGH_END_FIGHTER_BANNER_CLASS} ${layout.SCORE_BANNER_CLASS as string}`} style={{ boxShadow: `0 0 0 1px ${fighterA.color}33 inset` }}>
              <div className={layout.SCORE_BANNER_INSET_CLASS as string}>
                <div className={layout.SCORE_VALUE_WRAP_CLASS as string}>
                  <p className={layout.SCORE_VALUE_CLASS as string} style={{ color: fighterA.color }}>
                    {Math.round(averageA)}
                  </p>
                </div>
              </div>
            </div>
            <div className={`${shell.HIGH_END_FIGHTER_BANNER_CLASS} ${layout.SCORE_BANNER_CLASS as string}`} style={{ boxShadow: `0 0 0 1px ${fighterB.color}33 inset` }}>
              <div className={layout.SCORE_BANNER_INSET_CLASS as string}>
                <div className={layout.SCORE_VALUE_WRAP_CLASS as string}>
                  <p className={layout.SCORE_VALUE_CLASS as string} style={{ color: fighterB.color }}>
                    {Math.round(averageB)}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={layout.FAVORITE_STAMP_CLASS as string}
              style={{
                left: favoriteLeft,
                transform: `translateX(-50%) rotate(${favoriteRotation}deg)`,
              }}
            >
              <FittedText
                as="p"
                slotKey={`${auditPrefix}:favorite`}
                spec={slots.parameterFavoriteStamp}
                text={favorite}
                className={layout.FAVORITE_TEXT_CLASS as string}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                templateId="parameter-comparison"
                activeFightId={activeFightId}
                language={language}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
