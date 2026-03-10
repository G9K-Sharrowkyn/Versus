import { buildFightTemplateChrome, getFightTemplateDefaultField } from '../../../fightManifest'
import { pickLang } from '../../../presets'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import {
  HIGH_END_BODY_GAP_CLASS,
  HIGH_END_CARD_CLASS,
  HIGH_END_FRAME_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_LABEL_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HighEndTemplateHeader,
} from '../../shared/highEnd'

export function DirectVerdictTemplate({
  fighterA,
  fighterB,
  averageA,
  averageB,
  title,
  subtitle,
  templateBlocks,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const fighterAName = fighterA.name || tr('Postać A', 'Fighter A')
  const fighterBName = fighterB.name || tr('Postać B', 'Fighter B')
  const winnerSide: 'a' | 'b' = averageA >= averageB ? 'a' : 'b'
  const defaultWinner = winnerSide === 'a' ? fighterAName : fighterBName
  const defaultLoser = winnerSide === 'a' ? fighterBName : fighterAName
  const accentColor = winnerSide === 'a' ? fighterA.color : fighterB.color

  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['direct-verdict'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const chrome = buildFightTemplateChrome(language, blockFields)
  const line = (position: number, keys: string[], fallback = '') =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle
  const winnerLabel = pickTemplateField(blockFields, ['winner', 'verdict']) || defaultWinner
  const loserLabel = pickTemplateField(blockFields, ['loser', 'opponent']) || defaultLoser
  const outcomeLabel =
    pickTemplateField(blockFields, ['outcome', 'result', 'method']) ||
    getFightTemplateDefaultField('direct-verdict', 'outcome', language)
  const certaintyLabel =
    pickTemplateField(blockFields, ['certainty', 'margin', 'confidence']) ||
    getFightTemplateDefaultField('direct-verdict', 'certainty', language)
  const summaryLines = [
    line(0, ['line_1', 'line1'], getFightTemplateDefaultField('direct-verdict', 'line_1', language)),
    line(1, ['line_2', 'line2'], getFightTemplateDefaultField('direct-verdict', 'line_2', language)),
    line(2, ['line_3', 'line3'], getFightTemplateDefaultField('direct-verdict', 'line_3', language)),
  ]

  return (
    <div className={HIGH_END_ROOT_CLASS}>
      <div className={HIGH_END_PANEL_CLASS}>
        <div className={HIGH_END_GRID_OVERLAY_CLASS} />
        <div className="relative z-10 flex h-full flex-col">
          <HighEndTemplateHeader
            chrome={chrome}
            headerText={headerText}
            subText={subText}
            onToggleLanguage={onToggleLanguage}
          />

          <div className={`${HIGH_END_BODY_GAP_CLASS} grid min-h-0 flex-1 grid-cols-[0.95fr_1.25fr] gap-3`}>
            <div className={`${HIGH_END_FRAME_CLASS} flex min-h-0 flex-col p-3`} style={{ boxShadow: `0 0 0 1px ${accentColor}33 inset` }}>
              <div
                className="rounded-xl border px-4 py-4 text-left"
                style={{
                  borderColor: `${accentColor}88`,
                  background: `linear-gradient(145deg, ${accentColor}33, rgba(15,23,42,0.78))`,
                }}
              >
                <p className="text-xs uppercase tracking-[0.18em] text-slate-200">
                  {pickLang(language, 'Werdykt', 'Verdict')}
                </p>
                <p
                  className="mt-3 text-[clamp(2rem,3vw,3.5rem)] font-semibold uppercase leading-[0.98] tracking-[-0.03em] text-white"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {winnerLabel}
                </p>
                <p className="mt-3 text-[clamp(1rem,1.25vw,1.35rem)] leading-tight text-slate-100">
                  {tr('pokonuje', 'defeats')} {loserLabel}
                </p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className={`${HIGH_END_CARD_CLASS} px-3 py-2`}>
                  <p className={HIGH_END_LABEL_CLASS}>{tr('Wynik', 'Outcome')}</p>
                  <p className="mt-1 text-base leading-tight text-slate-100">{outcomeLabel}</p>
                </div>
                <div className={`${HIGH_END_CARD_CLASS} px-3 py-2`}>
                  <p className={HIGH_END_LABEL_CLASS}>{tr('Pewność', 'Confidence')}</p>
                  <p className="mt-1 text-base leading-tight text-slate-100">{certaintyLabel}</p>
                </div>
              </div>

              <div className="mt-3 grid flex-1 grid-cols-2 gap-2">
                <div className={`${HIGH_END_CARD_CLASS} px-3 py-2`}>
                  <p className={HIGH_END_LABEL_CLASS}>{fighterAName}</p>
                  <p className="mt-1 text-[1.75rem] font-semibold leading-none" style={{ color: fighterA.color }}>
                    {Math.round(averageA)}
                  </p>
                </div>
                <div className={`${HIGH_END_CARD_CLASS} px-3 py-2`}>
                  <p className={HIGH_END_LABEL_CLASS}>{fighterBName}</p>
                  <p className="mt-1 text-[1.75rem] font-semibold leading-none" style={{ color: fighterB.color }}>
                    {Math.round(averageB)}
                  </p>
                </div>
              </div>
            </div>

            <div className={`${HIGH_END_FRAME_CLASS} flex min-h-0 flex-col p-3`}>
              <p className={HIGH_END_LABEL_CLASS}>{pickLang(language, 'Dlaczego ten werdykt?', 'Why this verdict?')}</p>
              <div className="mt-3 grid min-h-0 flex-1 grid-rows-3 gap-2">
                {summaryLines.map((item, index) => (
                  <div key={`direct-verdict-line-${index}-${item}`} className={`${HIGH_END_CARD_CLASS} flex items-center px-3 py-3 text-[1.02rem] leading-tight text-slate-100`}>
                    <span className="mr-3 text-xl font-semibold" style={{ color: accentColor }}>
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
