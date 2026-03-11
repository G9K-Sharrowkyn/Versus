import { type CSSProperties } from 'react'
import clsx from 'clsx'
import { AdjustableTemplateImage } from '../../../components/AdjustableTemplateImage'
import { buildFightTemplateChrome, getFightCommonCopy, getFightTemplateDefaultField } from '../../../fightManifest'
import {
  type FightCardPalette,
  fighterMonogram,
  normalizeHexColor,
  resolveFightCardNameFontRem,
  resolveFightCardPalette,
  resolveFightCardStripeStyle,
  stripFightLocaleSuffixFromLabel,
} from '../../../helpers'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import {
  HIGH_END_BODY_GAP_CLASS,
  HIGH_END_GRID_OVERLAY_CLASS,
  HIGH_END_PANEL_CLASS,
  HIGH_END_ROOT_CLASS,
  HighEndTemplateHeader,
} from '../../shared/highEnd'

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
  const subText = subtitle || ''
  const parsedLabel = normalizedLabel.match(/^\s*(.+?)\s+(?:vs\.?|versus|kontra|v)\s+(.+?)\s*$/i)
  const topName = stripFightLocaleSuffixFromLabel((parsedLabel?.[1] || fighterA.name || 'Fighter A').trim())
  const bottomName = stripFightLocaleSuffixFromLabel((parsedLabel?.[2] || fighterB.name || 'Fighter B').trim())
  const topBasePalette = resolveFightCardPalette(topName, 'a')
  const bottomBasePalette = resolveFightCardPalette(bottomName, 'b')
  const topPalette: FightCardPalette = {
    colorA:
      normalizeHexColor(getFightTemplateDefaultField('fight-card', 'top_color_a', language)) || topBasePalette.colorA,
    colorB:
      normalizeHexColor(getFightTemplateDefaultField('fight-card', 'top_color_b', language)) || topBasePalette.colorB,
    dark: topBasePalette.dark,
  }
  const bottomPalette: FightCardPalette = {
    colorA:
      normalizeHexColor(getFightTemplateDefaultField('fight-card', 'bottom_color_a', language)) || bottomBasePalette.colorA,
    colorB:
      normalizeHexColor(getFightTemplateDefaultField('fight-card', 'bottom_color_b', language)) || bottomBasePalette.colorB,
    dark: bottomBasePalette.dark,
  }

  const renderStaticLine = (text: string, palette: FightCardPalette) => {
    const stripeStyle = resolveFightCardStripeStyle(palette)
    const fontSizeRem = resolveFightCardNameFontRem(text)

    return (
      <span
        className="vvv-fight-card-portrait__wordmark"
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
            '--electric-border-color': fighter.color,
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
              <div className="vvv-fight-card-portrait__name">{renderStaticLine(nameText, palette)}</div>
              <div className="vvv-fight-card-portrait__name-fade" />
            </div>
          </div>
          <div className="vvv-fight-card-portrait__glow-layer-1" />
          <div className="vvv-fight-card-portrait__glow-layer-2" />
        </div>
      </div>
    )
  }

  return (
    <div className={HIGH_END_ROOT_CLASS}>
      <div className={HIGH_END_PANEL_CLASS}>
        <div className={HIGH_END_GRID_OVERLAY_CLASS} />
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
        <div className="relative z-10 flex h-full min-h-0 flex-col text-center text-slate-200">
          <HighEndTemplateHeader
            chrome={chrome}
            headerText={headerText}
            subText={subText}
            onToggleLanguage={onToggleLanguage}
          />
          <div className={`${HIGH_END_BODY_GAP_CLASS} vvv-fight-card-split relative z-10 min-h-0 flex-1`}>
            {renderFightCardPortrait(fighterA, topName, topPalette, 'left')}
            {renderFightCardPortrait(fighterB, bottomName, bottomPalette, 'right')}
            <span className="vvv-fight-card-split__vs">
              <img src="/assets/VS.png" alt="VS" className="vvv-fight-card-outro__vs-image" draggable={false} />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
