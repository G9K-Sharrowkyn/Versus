import { Brain, Crosshair, WandSparkles } from 'lucide-react'
import { buildFightTemplateChrome, getFightCommonCopy } from '../../../fightManifest'
import { pickLang } from '../../../presets'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parsePercentValue, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import {
  HIGH_END_BODY_GAP_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HighEndTemplateHeader,
} from '../../shared/highEnd'

export function XFactorTemplate({
  fighterA,
  fighterB,
  title,
  subtitle,
  templateBlocks,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const common = getFightCommonCopy(language)
  const fighterAName = fighterA.name || tr('Postać A', 'Fighter A')
  const fighterBName = fighterB.name || tr('Postać B', 'Fighter B')
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['x-factor'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const chrome = buildFightTemplateChrome(language, blockFields)
  const line = (position: number, keys: string[], fallback = '') =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
  const superPct = parsePercentValue(
    pickTemplateField(blockFields, ['a_value', 'super_value', 'superman', 'left_value']),
    40,
  )
  const hyperPct = parsePercentValue(
    pickTemplateField(blockFields, ['b_value', 'hyper_value', 'hyperion', 'right_value']),
    40,
  )
  const superBonusPct = parsePercentValue(
    pickTemplateField(blockFields, ['a_bonus', 'super_bonus', 'left_bonus']),
    0,
  )
  const hyperBonusPct = parsePercentValue(
    pickTemplateField(blockFields, ['b_bonus', 'hyper_bonus', 'right_bonus']),
    0,
  )
  const superTotalPct = Math.max(0, Math.min(100, superPct + superBonusPct))
  const hyperTotalPct = Math.max(0, Math.min(100, hyperPct + hyperBonusPct))
  const xLabel = line(0, ['factor', 'headline'], tr('REGENERACJA I PRZETRWANIE', 'REGENERATION AND SURVIVAL'))
  const headerText = title || 'X-FACTOR'
  const subText = pickTemplateField(blockFields, ['subtitle', 'note']) || subtitle
  const factorMatch = xLabel.match(/^(.*?)(\s+VS\s+)(.*)$/i)
  const factorSupplement = xLabel ? (
    <p
      className="mt-1 text-center text-[18px] uppercase leading-[1.05] tracking-[0.18em] text-cyan-100"
      style={{ fontFamily: 'var(--font-display)' }}
    >
      {factorMatch ? (
        <>
          <span style={{ color: fighterA.color }}>{factorMatch[1].trim()}</span>
          <span className="text-slate-200">{factorMatch[2]}</span>
          <span style={{ color: fighterB.color }}>{factorMatch[3].trim()}</span>
        </>
      ) : (
        xLabel
      )}
    </p>
  ) : null
  const mechanics = line(
    1,
    ['mechanika', 'mechanics'],
    tr(`${fighterBName} ma znaczący czynnik regeneracji.`, `${fighterBName} has a major regeneration factor.`),
  )
  const implication = line(
    2,
    ['implikacja', 'implication'],
    tr(
      `${fighterBName} nie musi wygrywać każdej wymiany. Wystarczy, że przetrwa.`,
      `${fighterBName} does not need to win every exchange. Surviving is enough.`,
    ),
  )
  const psychology = line(
    3,
    ['psychologia', 'psychology'],
    tr('Mentalność przetrwania i walka na wyniszczenie zwiększają jego szanse.', 'Survival mindset and attrition fighting raise his odds.'),
  )
  return (
    <div className={HIGH_END_ROOT_CLASS}>
      <div className={HIGH_END_PANEL_CLASS}>
        <div className={HIGH_END_GRID_OVERLAY_CLASS} />
        <div className="relative z-10 flex h-full flex-col">
          <HighEndTemplateHeader
            chrome={chrome}
            headerText={headerText}
            subText={subText}
            centerSupplement={factorSupplement}
            onToggleLanguage={onToggleLanguage}
          />

          <div className={`${HIGH_END_BODY_GAP_CLASS} min-h-0 flex-1 rounded-md border border-cyan-300/25 bg-slate-950/65 p-3`}>
            <div className="space-y-6">
              <div>
                <p className="text-[58px] font-semibold uppercase leading-none tracking-[0.01em]" style={{ color: '#38bdf8', fontFamily: 'var(--font-display)' }}>
                  {fighterAName}
                </p>
                <div className="mt-2 grid grid-cols-[1fr_168px] items-center gap-2">
                  <div className="relative h-14 overflow-hidden rounded-md border-2 border-slate-500/70 bg-slate-900/85 shadow-[0_0_0_1px_rgba(125,211,252,0.12)]">
                    <div className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,#0ea5e9,#1d4ed8)]" style={{ width: `${superPct}%` }} />
                    {superBonusPct > 0 ? (
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          clipPath: `inset(5% ${Math.max(0, 100 - superTotalPct)}% 5% ${Math.max(0, Math.min(100, superPct))}%)`,
                          background:
                            'repeating-linear-gradient(135deg, rgba(56,189,248,0.75) 0px, rgba(56,189,248,0.75) 8px, rgba(15,23,42,0) 8px, rgba(15,23,42,0) 16px)',
                        }}
                      />
                    ) : null}
                    <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(226,232,240,0.08)_0px,rgba(226,232,240,0.08)_8px,rgba(15,23,42,0)_8px,rgba(15,23,42,0)_16px)]" />
                  </div>
                  <div className="flex h-14 w-[168px] flex-col items-center justify-center rounded-md border-2 border-cyan-300/55 bg-slate-950/92 px-3 leading-none text-sky-300">
                    <span className={superBonusPct > 0 ? 'text-[34px]' : 'text-[42px]'}>{Math.round(superPct)}%</span>
                    {superBonusPct > 0 ? (
                      <span className="text-[14px] uppercase tracking-[0.08em] text-cyan-100">
                        +{Math.round(superBonusPct)}%
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[58px] font-semibold uppercase leading-none tracking-[0.01em]" style={{ color: '#f87171', fontFamily: 'var(--font-display)' }}>
                  {fighterBName}
                </p>
                <div className="mt-2 grid grid-cols-[1fr_168px] items-center gap-2">
                  <div className="relative h-14 overflow-hidden rounded-md border-2 border-slate-500/70 bg-slate-900/85 shadow-[0_0_0_1px_rgba(248,113,113,0.12)]">
                    <div className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,#ef4444,#b91c1c)]" style={{ width: `${hyperPct}%` }} />
                    {hyperBonusPct > 0 ? (
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          clipPath: `inset(5% ${Math.max(0, 100 - hyperTotalPct)}% 5% ${Math.max(0, Math.min(100, hyperPct))}%)`,
                          background:
                            'repeating-linear-gradient(135deg, rgba(248,113,113,0.75) 0px, rgba(248,113,113,0.75) 8px, rgba(15,23,42,0) 8px, rgba(15,23,42,0) 16px)',
                        }}
                      />
                    ) : null}
                    <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(226,232,240,0.08)_0px,rgba(226,232,240,0.08)_8px,rgba(15,23,42,0)_8px,rgba(15,23,42,0)_16px)]" />
                  </div>
                  <div className="flex h-14 w-[168px] flex-col items-center justify-center rounded-md border-2 border-rose-300/55 bg-slate-950/92 px-3 leading-none text-rose-200">
                    <span className={hyperBonusPct > 0 ? 'text-[34px]' : 'text-[36px]'}>{Math.round(hyperPct)}%</span>
                    {hyperBonusPct > 0 ? (
                      <span className="text-[14px] uppercase tracking-[0.08em] text-rose-100">
                        +{Math.round(hyperBonusPct)}%
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-md border border-slate-500/70 bg-slate-900/85 p-2">
                <div className="flex items-start gap-2">
                  <WandSparkles size={20} className="mt-1 text-cyan-200" />
                  <div>
                    <p className="text-[16px] font-semibold uppercase leading-none text-slate-100">{common.mechanicsLabel}</p>
                    <p className="mt-1 text-[15px] leading-tight text-slate-200">{mechanics}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-slate-500/70 bg-slate-900/85 p-2">
                <div className="flex items-start gap-2">
                  <Crosshair size={20} className="mt-1 text-cyan-200" />
                  <div>
                    <p className="text-[16px] font-semibold uppercase leading-none text-slate-100">{common.implicationLabel}</p>
                    <p className="mt-1 text-[15px] leading-tight text-slate-200">{implication}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-md border border-slate-500/70 bg-slate-900/85 p-2">
                <div className="flex items-start gap-2">
                  <Brain size={20} className="mt-1 text-cyan-200" />
                  <div>
                    <p className="text-[16px] font-semibold uppercase leading-none text-slate-100">{common.psychologyLabel}</p>
                    <p className="mt-1 text-[15px] leading-tight text-slate-200">{psychology}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
