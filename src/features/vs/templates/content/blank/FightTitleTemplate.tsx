import { type CSSProperties } from 'react'
import clsx from 'clsx'
import {
  type FightTitlePalette,
  buildPortraitImageStyle,
  fighterMonogram,
  normalizeHexColor,
  parseBooleanFlag,
  resolveFightTitleNameFontRem,
  resolveFightTitlePalette,
  resolveFightTitleStripeStyle,
  stripFightLocaleSuffixFromLabel,
} from '../../../helpers'
import { pickLang } from '../../../presets'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { HIGH_END_BACKGROUND_CLASS, HIGH_END_HEADER_CLASS, HIGH_END_SUBTEXT_CLASS } from '../../shared/highEnd'

export function FightTitleTemplate({
  fighterA,
  fighterB,
  portraitAAdjust,
  portraitBAdjust,
  fightLabel,
  templateBlocks,
  language,
}: TemplatePreviewProps) {
  const tr = (pl: string, en: string) => pickLang(language, pl, en)
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['fight-title'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const line = (position: number, keys: string[], fallback = '') =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || tr('KARTA WALKI', 'FIGHT CARD')
  const finalLabelRaw = line(
    0,
    ['fight_title', 'match_title', 'title_text', 'line_1', 'line1'],
    fightLabel || `${fighterA.name || 'Fighter A'} vs ${fighterB.name || 'Fighter B'}`,
  )
  const normalizedLabel = finalLabelRaw.replace(/\s+/g, ' ').trim()
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || normalizedLabel
  const leftTopLabel = tr('Stopien zagrozenia', 'Threat level')
  const threatLevel = tr('ekstremalny', 'extreme')
  const leftBottomLabel = tr('Integralnosc danych', 'Data integrity')
  const integrity = '99.6%'
  const rightTopLabel = 'VersusVerseVault'
  const profileMode = '/assets/VS2.png'
  const rightBottomLabel = tr('Sygnatura marki', 'Brand mark')
  const scale = 'VersusVerseVault badge'
  const parsedLabel = normalizedLabel.match(/^\s*(.+?)\s+(?:vs\.?|versus|kontra|v)\s+(.+?)\s*$/i)
  const topName = stripFightLocaleSuffixFromLabel((parsedLabel?.[1] || fighterA.name || 'Fighter A').trim())
  const bottomName = stripFightLocaleSuffixFromLabel((parsedLabel?.[2] || fighterB.name || 'Fighter B').trim())
  const topBasePalette = resolveFightTitlePalette(topName, 'a')
  const bottomBasePalette = resolveFightTitlePalette(bottomName, 'b')
  const topPalette: FightTitlePalette = {
    colorA:
      normalizeHexColor(
        pickTemplateField(blockFields, ['top_color_a', 'top_primary', 'fighter_a_color_a', 'fighter_a_primary']),
      ) || topBasePalette.colorA,
    colorB:
      normalizeHexColor(
        pickTemplateField(blockFields, ['top_color_b', 'top_secondary', 'fighter_a_color_b', 'fighter_a_secondary']),
      ) || topBasePalette.colorB,
    dark: parseBooleanFlag(pickTemplateField(blockFields, ['top_dark', 'fighter_a_dark']), topBasePalette.dark),
  }
  const bottomPalette: FightTitlePalette = {
    colorA:
      normalizeHexColor(
        pickTemplateField(blockFields, ['bottom_color_a', 'bottom_primary', 'fighter_b_color_a', 'fighter_b_primary']),
      ) || bottomBasePalette.colorA,
    colorB:
      normalizeHexColor(
        pickTemplateField(blockFields, ['bottom_color_b', 'bottom_secondary', 'fighter_b_color_b', 'fighter_b_secondary']),
      ) || bottomBasePalette.colorB,
    dark: parseBooleanFlag(
      pickTemplateField(blockFields, ['bottom_dark', 'fighter_b_dark']),
      bottomBasePalette.dark,
    ),
  }

  const renderAnimatedLine = (text: string, palette: FightTitlePalette) => {
    const stripeStyle = resolveFightTitleStripeStyle(palette)
    const fontSizeRem = resolveFightTitleNameFontRem(text)

    return (
      <span
        data-text={text}
        className="vvv-fight-title-outro__wordmark"
        style={
          {
            color: palette.colorA,
            fontSize: `${fontSizeRem}rem`,
            '--vvv-stripe-image': stripeStyle.textureUrl,
            '--vvv-stripe-filter': stripeStyle.textureFilter,
          } as CSSProperties
        }
      >
        {text}
      </span>
    )
  }

  const renderFightTitlePortrait = (
    fighter: typeof fighterA,
    nameText: string,
    palette: FightTitlePalette,
    side: 'left' | 'right',
  ) => (
    <div
      className={clsx(
        'vvv-fight-title-portrait',
        side === 'left' ? 'vvv-fight-title-portrait--left' : 'vvv-fight-title-portrait--right',
      )}
      style={
        {
          '--vvv-portrait-color': fighter.color,
          '--f': 'url(#vvv-electric-flow-hue)',
          '--electric-y-offset': '-3px',
          '--electric-border-color': 'DodgerBlue',
          '--electric-light-color': 'oklch(from var(--electric-border-color) l c h)',
        } as CSSProperties
      }
    >
      <div className="vvv-fight-title-portrait__inner-container">
        <div className="vvv-fight-title-portrait__border-outer">
          <div className="vvv-fight-title-portrait__inner">
            {fighter.imageUrl ? (
              <img
                src={fighter.imageUrl}
                alt={fighter.name || 'Fighter'}
                className="h-full w-full object-cover"
                style={buildPortraitImageStyle(side === 'left' ? portraitAAdjust : portraitBAdjust)}
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.16),transparent_45%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(2,6,23,0.9))]"
                style={{ color: fighter.color }}
              >
                <div className="text-center">
                  <p className="text-[62px] font-semibold tracking-[0.04em]">{fighterMonogram(fighter.name || 'Fighter')}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{tr('Miejsce na portret', 'Portrait Slot')}</p>
                </div>
              </div>
            )}
            <div className="vvv-fight-title-portrait__name">{renderAnimatedLine(nameText, palette)}</div>
            <div className="vvv-fight-title-portrait__name-fade" />
            <div className="vvv-fight-title-portrait__scan" />
          </div>
        </div>
        <div className="vvv-fight-title-portrait__glow-layer-1" />
        <div className="vvv-fight-title-portrait__glow-layer-2" />
      </div>
    </div>
  )

  return (
    <div className={`relative z-10 flex h-full min-h-0 overflow-visible rounded-[20px] px-2 py-2 text-center text-slate-200 ${HIGH_END_BACKGROUND_CLASS}`}>
      <svg className="vvv-fight-title-svg-defs" aria-hidden="true">
        <defs>
          <filter id="vvv-electric-flow-hue" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="7" />
            <feColorMatrix type="hueRotate" result="pt1">
              <animate attributeName="values" values="0;360;" dur=".6s" repeatCount="indefinite" calcMode="paced" />
            </feColorMatrix>
            <feComposite />
            <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="7" seed="5" />
            <feColorMatrix type="hueRotate" result="pt2">
              <animate attributeName="values" values="0;333;199;286;64;168;256;157;360;" dur="5s" repeatCount="indefinite" calcMode="paced" />
            </feColorMatrix>
            <feBlend in="pt1" in2="pt2" mode="normal" result="combinedNoise" />
            <feDisplacementMap in="SourceGraphic" scale="30" xChannelSelector="R" yChannelSelector="B" />
          </filter>
        </defs>
      </svg>
      <div className="pointer-events-none absolute left-4 right-4 top-4 z-20">
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 rounded-[18px] border border-cyan-300/25 bg-slate-950/38 px-4 pb-3 pt-2 text-[11px] text-slate-200 backdrop-blur-[8px]">
          <div className="min-w-[238px] space-y-1 pt-1 text-left">
            <p className="whitespace-nowrap uppercase tracking-[0.16em]">{leftTopLabel}: {threatLevel}</p>
            <p className="whitespace-nowrap uppercase tracking-[0.16em]">{leftBottomLabel}: {integrity}</p>
          </div>
          <div className="text-center">
            <h2 className={`${HIGH_END_HEADER_CLASS} text-[32px]`} style={{ fontFamily: 'var(--font-display)' }}>
              {headerText}
            </h2>
            {subText ? <p className={HIGH_END_SUBTEXT_CLASS}>{subText}</p> : null}
          </div>
          <div className="flex items-start justify-end pt-1">
  <div
    className="flex h-[86px] aspect-[755/322] items-center justify-center overflow-hidden rounded-[14px] border border-cyan-300/35 bg-[linear-gradient(180deg,rgba(7,24,42,0.96),rgba(4,14,24,0.94))] p-0 shadow-[0_0_0_1px_rgba(125,211,252,0.08)_inset,0_10px_26px_rgba(2,8,23,0.45)]"
    title={rightBottomLabel}
    aria-label={scale}
  >
    <img src={profileMode} alt={rightTopLabel} className="h-full w-full object-contain drop-shadow-[0_0_14px_rgba(251,146,60,0.28)]" draggable={false} />
  </div>
</div>
        </div>
      </div>
      <div className="vvv-fight-title-split relative z-10 h-full w-full overflow-visible">
        {renderFightTitlePortrait(fighterA, topName, topPalette, 'left')}
        {renderFightTitlePortrait(fighterB, bottomName, bottomPalette, 'right')}
        <span className="vvv-fight-title-split__vs">
          <img src="/assets/VS.png" alt="VS" className="vvv-fight-title-outro__vs-image" draggable={false} />
        </span>
      </div>
    </div>
  )
}

