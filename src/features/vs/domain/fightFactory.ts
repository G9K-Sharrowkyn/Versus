import {
  buildMatchupKeyFromNames,
  normalizePortraitAdjust,
  parseMatchupFromFileName,
  resolveFightVariantLabel,
  resolveFightVariantLocaleFromFileName,
  stripFileExtension,
} from '../helpers'
import type { FightRecord, ParsedVsImport, PortraitAdjust } from '../types'

type CreateManualFightParams = {
  draftPayload: ParsedVsImport
  draftTxtFileName: string
  portraitADataUrl: string
  portraitBDataUrl: string
  draftPortraitAdjustA: PortraitAdjust
  draftPortraitAdjustB: PortraitAdjust
  fallbackNewFightName: string
}

export const createManualFightRecord = ({
  draftPayload,
  draftTxtFileName,
  portraitADataUrl,
  portraitBDataUrl,
  draftPortraitAdjustA,
  draftPortraitAdjustB,
  fallbackNewFightName,
}: CreateManualFightParams): FightRecord => {
  const fallbackName = `${draftPayload.fighterAName} vs ${draftPayload.fighterBName}`.trim()
  const derivedName = stripFileExtension(draftTxtFileName) || fallbackName || fallbackNewFightName
  const fileMatchup = parseMatchupFromFileName(draftTxtFileName)
  const matchupKey = buildMatchupKeyFromNames(
    fileMatchup?.leftName || draftPayload.fighterAName,
    fileMatchup?.rightName || draftPayload.fighterBName,
  )
  const variantLocale = resolveFightVariantLocaleFromFileName(draftTxtFileName)
  const variantLabel = resolveFightVariantLabel(draftTxtFileName || `${derivedName}.txt`, variantLocale)

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: derivedName,
    fileName: draftTxtFileName || `${derivedName}.txt`,
    createdAt: Date.now(),
    source: 'manual',
    matchupKey,
    variantLocale,
    variantLabel,
    payload: draftPayload,
    portraitADataUrl,
    portraitBDataUrl,
    portraitAAdjust: normalizePortraitAdjust(draftPortraitAdjustA),
    portraitBAdjust: normalizePortraitAdjust(draftPortraitAdjustB),
    slideImageAdjustments: {},
  }
}

export const insertManualFightRecord = (fights: FightRecord[], fight: FightRecord) => {
  const folderOnly = fights.filter((item) => item.source === 'folder')
  const manualOnly = fights.filter((item) => item.source !== 'folder')
  return [...folderOnly, fight, ...manualOnly]
}
