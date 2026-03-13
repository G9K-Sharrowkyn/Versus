import { type CSSProperties } from 'react'
import clsx from 'clsx'
import { AdjustableTemplateImage } from '../../../components/AdjustableTemplateImage'
import {
  type FightCardPalette,
  fighterMonogram,
  normalizeHexColor,
  resolveFightCardPalette,
  resolveFightCardStripeStyle,
  stripFightLocaleSuffixFromLabel,
} from '../../../helpers'
import { TEMPLATE_BLOCK_ALIASES, findTemplateBlockLines, getPlainTemplateLines, parseTemplateFieldMap, pickTemplateField } from '../../../importer'
import type { TemplatePreviewProps } from '../../../types'
import { FittedText } from '../../shared/FittedText'
import { HighEndTemplateHeader } from '../../shared/highEnd'
import {
  buildTemplateChrome as buildFightTemplateChrome,
  getTemplateCommonCopy as getFightCommonCopy,
  getTemplateStaticField as getFightTemplateDefaultField,
} from '../../shared/templateCopy'
import { getTemplateUi, type TemplateSlotSpec } from '../../shared/templateUi'

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
  const chrome = buildFightTemplateChrome('fight-card', language, blockFields)
  const common = getFightCommonCopy('fight-card', language)
  const ui = getTemplateUi('fight-card', language)
  const shell = ui.highEnd as Record<string, string>
  const slots = ui.slots as Record<string, TemplateSlotSpec>
  const layout = ui.template as Record<string, string>
  const line = (position: number, keys: string[], fallback = '') =>
    pickTemplateField(blockFields, keys) || plainLines[position] || fallback
  const headerText = pickTemplateField(blockFields, ['headline', 'header', 'title']) || title
  const fighterAFallback = getFightTemplateDefaultField('fight-card', 'fighter_a_fallback', language)
  const fighterBFallback = getFightTemplateDefaultField('fight-card', 'fighter_b_fallback', language)
  const fighterFallback = getFightTemplateDefaultField('fight-card', 'fighter_fallback', language)
  const finalLabelRaw = line(
    0,
    ['fight_title', 'match_title', 'title_text', 'line_1', 'line1'],
    fightLabel || `${fighterA.name || fighterAFallback} vs ${fighterB.name || fighterBFallback}`,
  )
  const normalizedLabel = finalLabelRaw.replace(/\s+/g, ' ').trim()
  const subText = subtitle || ''
  const isAuditMode = typeof document !== 'undefined' && document.documentElement.dataset.vsAudit === 'true'
  const parsedLabel = normalizedLabel.match(/^\s*(.+?)\s+(?:vs\.?|versus|kontra|v)\s+(.+?)\s*$/i)
  const topName = stripFightLocaleSuffixFromLabel((parsedLabel?.[1] || fighterA.name || fighterAFallback).trim())
  const bottomName = stripFightLocaleSuffixFromLabel((parsedLabel?.[2] || fighterB.name || fighterBFallback).trim())
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

    return (
      <FittedText
        as="span"
        slotKey={`fight-card:name:${text}`}
        spec={slots.fightCardName}
        text={text}
        className={layout.WORDMARK_CLASS}
        style={
          {
            color: palette.colorA,
            width: '100%',
            '--vvv-stripe-image': stripeStyle.textureUrl,
            '--vvv-stripe-filter': stripeStyle.textureFilter,
          } as CSSProperties
        }
      />
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
          layout.PORTRAIT_CLASS,
          side === 'left' ? layout.PORTRAIT_LEFT_CLASS : layout.PORTRAIT_RIGHT_CLASS,
        )}
        style={
          {
            '--vvv-portrait-color': fighter.color,
            '--f': isAuditMode ? 'none' : `url(#${layout.FILTER_ID})`,
            '--electric-y-offset': '-3px',
            '--electric-border-color': fighter.color,
            '--electric-light-color': 'oklch(from var(--electric-border-color) l c h)',
          } as CSSProperties
        }
      >
        <div className={layout.PORTRAIT_INNER_CONTAINER_CLASS}>
          <div className={layout.PORTRAIT_BORDER_OUTER_CLASS}>
            <div className={layout.PORTRAIT_INNER_CLASS}>
              {fighter.imageUrl ? (
                <AdjustableTemplateImage
                  imageUrl={fighter.imageUrl}
                  alt={fighter.name || fighterFallback}
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
                  className={layout.FALLBACK_CLASS}
                  style={{ color: fighter.color }}
                >
                  <div className={layout.FALLBACK_INNER_CLASS}>
                    <p className={layout.FALLBACK_MONOGRAM_CLASS}>{fighterMonogram(fighter.name || fighterFallback)}</p>
                    <p className={layout.FALLBACK_LABEL_CLASS}>{common.portraitSlot}</p>
                  </div>
                </div>
              )}
              <div className={layout.PORTRAIT_NAME_CLASS}>{renderStaticLine(nameText, palette)}</div>
              <div className={layout.PORTRAIT_NAME_FADE_CLASS} />
            </div>
          </div>
          <div className={layout.PORTRAIT_GLOW_LAYER_1_CLASS} />
          <div className={layout.PORTRAIT_GLOW_LAYER_2_CLASS} />
        </div>
      </div>
    )
  }

  return (
    <div className={shell.HIGH_END_ROOT_CLASS}>
      <div className={shell.HIGH_END_PANEL_CLASS}>
        <div className={shell.HIGH_END_GRID_OVERLAY_CLASS} />
        {!isAuditMode ? (
          <svg className={layout.SVG_DEFS_CLASS} aria-hidden="true">
            <defs>
              <filter id={layout.FILTER_ID} colorInterpolationFilters="sRGB" x={layout.FILTER_X} y={layout.FILTER_Y} width={layout.FILTER_WIDTH} height={layout.FILTER_HEIGHT}>
                <feTurbulence type={layout.TURBULENCE_TYPE} baseFrequency={layout.TURBULENCE_BASE_1} numOctaves={Number(layout.TURBULENCE_OCTAVES_1)} />
                <feColorMatrix type="hueRotate" result="pt1">
                  <animate attributeName="values" values={layout.HUE_VALUES_1} dur={layout.HUE_DURATION_1} repeatCount="indefinite" calcMode="paced" />
                </feColorMatrix>
                <feComposite />
                <feTurbulence type={layout.TURBULENCE_TYPE} baseFrequency={layout.TURBULENCE_BASE_2} numOctaves={Number(layout.TURBULENCE_OCTAVES_2)} seed={Number(layout.TURBULENCE_SEED_2)} />
                <feColorMatrix type="hueRotate" result="pt2">
                  <animate attributeName="values" values={layout.HUE_VALUES_2} dur={layout.HUE_DURATION_2} repeatCount="indefinite" calcMode="paced" />
                </feColorMatrix>
                <feBlend in="pt1" in2="pt2" mode="normal" result="combinedNoise" />
                <feDisplacementMap in="SourceGraphic" scale={Number(layout.DISPLACEMENT_SCALE)} xChannelSelector={layout.DISPLACEMENT_X} yChannelSelector={layout.DISPLACEMENT_Y} />
              </filter>
            </defs>
          </svg>
        ) : null}
        <div className={layout.CONTENT_CLASS}>
          <HighEndTemplateHeader
            templateId="fight-card"
            language={language}
            chrome={chrome}
            headerText={headerText}
            subText={subText}
            onToggleLanguage={onToggleLanguage}
          />
          <div className={`${shell.HIGH_END_BODY_GAP_CLASS} ${layout.SPLIT_CLASS}`}>
            {renderFightCardPortrait(fighterA, topName, topPalette, 'left')}
            {renderFightCardPortrait(fighterB, bottomName, bottomPalette, 'right')}
            <span className={layout.VS_WRAP_CLASS}>
              <img src="/assets/VS.png" alt="VS" className={layout.VS_IMAGE_CLASS} draggable={false} />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
