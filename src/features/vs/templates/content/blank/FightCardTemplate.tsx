import { type CSSProperties } from 'react'
import clsx from 'clsx'
import { AdjustableTemplateImage } from '../../../components/AdjustableTemplateImage'
import { buildFightTemplateChrome, getFightCommonCopy } from '../../../fightManifest'
import {
  type FightCardPalette,
  fighterMonogram,
  normalizeHexColor,
  parseBooleanFlag,
  resolveFightCardNameFontRem,
  resolveFightCardPalette,
  resolveFightCardStripeStyle,
  stripFightLocaleSuffixFromLabel,
} from '../../../helpers'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { HIGH_END_BACKGROUND_CLASS, HIGH_END_HEADER_CLASS, HIGH_END_SUBTEXT_CLASS } from '../../shared/highEnd'

export function FightCardTemplate({
  fighterA,
  fighterB,
  portraitAAdjust,
  portraitBAdjust,
  fightLabel,
  title,
  subtitle,
  templateBlocks,
  slideImageAdjustments,
  onSlideImageAdjustChange,
  onSlideImageAdjustCommit,
  language,
  onToggleLanguage,
}: TemplatePreviewProps) {
  const blockLines = findTemplateBlockLines(templateBlocks, TEMPLATE_BLOCK_ALIASES['fight-card'] || [])
  const blockFields = parseTemplateFieldMap(blockLines)
  const plainLines = getPlainTemplateLines(blockLines)
  const chrome = buildFightTemplateChrome(language, blockFields)
  const common = getFightCommonCopy(language)
  const line = (position: number, keys: string[], fallback = '') =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const finalLabelRaw = line(
    0,
    ['fight_title', 'match_title', 'title_text', 'line_1', 'line1'],
    fightLabel || `${fighterA.name || 'Fighter A'} vs ${fighterB.name || 'Fighter B'}`,
  )
  const normalizedLabel = finalLabelRaw.replace(/\s+/g, ' ').trim()
  const subText = pickTemplateField(blockFields, ['subtitle', 'purpose', 'note']) || subtitle || normalizedLabel
  const parsedLabel = normalizedLabel.match(/^\s*(.+?)\s+(?:vs\.?|versus|kontra|v)\s+(.+?)\s*$/i)
  const topName = stripFightLocaleSuffixFromLabel((parsedLabel?.[1] || fighterA.name || 'Fighter A').trim())
  const bottomName = stripFightLocaleSuffixFromLabel((parsedLabel?.[2] || fighterB.name || 'Fighter B').trim())
  const topBasePalette = resolveFightCardPalette(topName, 'a')
  const bottomBasePalette = resolveFightCardPalette(bottomName, 'b')
  const topPalette: FightCardPalette = {
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
  const bottomPalette: FightCardPalette = {
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

  const renderAnimatedLine = (text: string, palette: FightCardPalette) => {
    const stripeStyle = resolveFightCardStripeStyle(palette)
    const fontSizeRem = resolveFightCardNameFontRem(text)

    return (
      <span
        data-text={text}
        className="vvv-fight-card-outro__wordmark"
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

  const renderFightCardPortrait = (
    fighter: typeof fighterA,
    nameText: string,
    palette: FightCardPalette,
    side: 'left' | 'right',
  ) => {
    const fighterAdjust = side === 'left' ? portraitAAdjust : portraitBAdjust
    const adjustKey = side === 'left' ? 'fight-card:portrait-a' : 'fight-card:portrait-b'

    return (
      <div
        className={clsx(
          'vvv-fight-card-portrait',
          side === 'left' ? 'vvv-fight-card-portrait--left' : 'vvv-fight-card-portrait--right',
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
        <div className="vvv-fight-card-portrait__inner-container">
          <div className="vvv-fight-card-portrait__border-outer">
            <div className="vvv-fight-card-portrait__inner">
              {fighter.imageUrl ? (
                <AdjustableTemplateImage
                  imageUrl={fighter.imageUrl}
                  alt={fighter.name || 'Fighter'}
                  fallbackLabel={common.portraitSlot}
                  hintLabel={chrome.portraitAdjustHint}
                  adjustKey={adjustKey}
                  baseAdjust={fighterAdjust}
                  adjustments={slideImageAdjustments}
                  onAdjustChange={onSlideImageAdjustChange}
                  onAdjustCommit={onSlideImageAdjustCommit}
                  plain
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.16),transparent_45%),linear-gradient(160deg,rgba(15,23,42,0.96),rgba(2,6,23,0.9))]"
                  style={{ color: fighter.color }}
                >
                  <div className="text-center">
                    <p className="text-[62px] font-semibold tracking-[0.04em]">{fighterMonogram(fighter.name || 'Fighter')}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{common.portraitSlot}</p>
                  </div>
                </div>
              )}
              <div className="vvv-fight-card-portrait__name">{renderAnimatedLine(nameText, palette)}</div>
              <div className="vvv-fight-card-portrait__name-fade" />
              <div className="vvv-fight-card-portrait__scan" />
            </div>
          </div>
          <div className="vvv-fight-card-portrait__glow-layer-1" />
          <div className="vvv-fight-card-portrait__glow-layer-2" />
        </div>
      </div>
    )
  }

  return (
    <div className={`relative z-10 flex h-full min-h-0 overflow-hidden rounded-[20px] px-2 pt-2 pb-1 text-center text-slate-200 ${HIGH_END_BACKGROUND_CLASS}`}>
      <svg className="vvv-fight-card-svg-defs" aria-hidden="true">
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
      <div className="pointer-events-none absolute left-4 right-4 top-3 z-20">
        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 rounded-[18px] border border-cyan-300/25 bg-slate-950/38 px-4 pb-2 pt-2 text-[11px] text-slate-200 backdrop-blur-[8px]">
          <div className="min-w-[238px] space-y-1 pt-1 text-left">
            <p className="whitespace-nowrap uppercase tracking-[0.16em]">{chrome.threatLevelLabel}: {chrome.threatLevelValue}</p>
            <p className="whitespace-nowrap uppercase tracking-[0.16em]">{chrome.dataIntegrityLabel}: {chrome.dataIntegrityValue}</p>
          </div>
          <div className="text-center">
            <h2 className={`${HIGH_END_HEADER_CLASS} text-[32px]`} style={{ fontFamily: 'var(--font-display)' }}>
              {headerText}
            </h2>
            {subText ? <p className={HIGH_END_SUBTEXT_CLASS}>{subText}</p> : null}
          </div>
          <div className="flex items-start justify-end pt-1">
            <button
              type="button"
              className="flex h-[86px] aspect-[755/322] items-center justify-center overflow-hidden rounded-[14px] border border-cyan-300/35 bg-[linear-gradient(180deg,rgba(7,24,42,0.96),rgba(4,14,24,0.94))] p-0 shadow-[0_0_0_1px_rgba(125,211,252,0.08)_inset,0_10px_26px_rgba(2,8,23,0.45)] cursor-pointer transition-transform active:scale-95"
              title={chrome.brandMarkTitle}
              aria-label={chrome.brandMarkAria}
              onClick={onToggleLanguage}
            >
              <img src={chrome.brandImageSrc} alt={chrome.brandAlt} className="h-full w-full object-contain drop-shadow-[0_0_14px_rgba(251,146,60,0.28)]" draggable={false} />
            </button>
          </div>
        </div>
      </div>
      <div className="vvv-fight-card-split relative z-10 h-full w-full">
        {renderFightCardPortrait(fighterA, topName, topPalette, 'left')}
        {renderFightCardPortrait(fighterB, bottomName, bottomPalette, 'right')}
        <span className="vvv-fight-card-split__vs">
          <img src="/assets/VS.png" alt="VS" className="vvv-fight-card-outro__vs-image" draggable={false} />
        </span>
      </div>
    </div>
  )
}
