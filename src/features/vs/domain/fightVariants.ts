import { PORTRAIT_ADJUST_DEFAULT, normalizePortraitAdjust, normalizeSlideImageAdjustments } from '../helpers'
import type { FightRecord, Language, PortraitAdjust } from '../types'

export type FightVisualAdjustments = {
  portraitAAdjust: PortraitAdjust
  portraitBAdjust: PortraitAdjust
  slideImageAdjustments: Record<string, PortraitAdjust>
}

const isDefaultPortraitAdjust = (value: PortraitAdjust) =>
  value.x === PORTRAIT_ADJUST_DEFAULT.x &&
  value.y === PORTRAIT_ADJUST_DEFAULT.y &&
  value.scale === PORTRAIT_ADJUST_DEFAULT.scale

const samePortraitAdjust = (left: PortraitAdjust, right: PortraitAdjust) =>
  left.x === right.x && left.y === right.y && left.scale === right.scale

const sameSlideImageAdjustments = (
  left: Record<string, PortraitAdjust>,
  right: Record<string, PortraitAdjust>,
) => {
  const leftKeys = Object.keys(left).sort()
  const rightKeys = Object.keys(right).sort()
  if (leftKeys.length !== rightKeys.length) return false
  for (let index = 0; index < leftKeys.length; index += 1) {
    const key = leftKeys[index]
    if (key !== rightKeys[index]) return false
    if (!samePortraitAdjust(left[key]!, right[key]!)) return false
  }
  return true
}

const buildFightVariantGroupKey = (fight: FightRecord) => {
  const folderKey = fight.folderKey?.trim()
  if (folderKey) return `folder:${folderKey}`
  const matchupKey = fight.matchupKey.trim()
  if (matchupKey) return `matchup:${fight.source}:${matchupKey}`
  return `fight:${fight.id}`
}

const isSameFightVariantGroup = (left: FightRecord, right: FightRecord) =>
  buildFightVariantGroupKey(left) === buildFightVariantGroupKey(right)

const pickSharedPortraitAdjust = (
  fights: FightRecord[],
  side: 'a' | 'b',
  preferredFight?: FightRecord | null,
) => {
  const readAdjust = (fight: FightRecord) =>
    normalizePortraitAdjust(side === 'a' ? fight.portraitAAdjust : fight.portraitBAdjust)

  if (preferredFight) {
    const preferredAdjust = readAdjust(preferredFight)
    if (!isDefaultPortraitAdjust(preferredAdjust)) return preferredAdjust
  }

  for (const fight of fights) {
    if (preferredFight && fight.id === preferredFight.id) continue
    const adjust = readAdjust(fight)
    if (!isDefaultPortraitAdjust(adjust)) return adjust
  }

  return preferredFight ? readAdjust(preferredFight) : readAdjust(fights[0]!)
}

const mergeSharedSlideImageAdjustments = (fights: FightRecord[], preferredFight?: FightRecord | null) => {
  const merged: Record<string, PortraitAdjust> = {}
  for (const fight of fights) {
    if (preferredFight && fight.id === preferredFight.id) continue
    Object.assign(merged, normalizeSlideImageAdjustments(fight.slideImageAdjustments))
  }
  if (preferredFight) {
    Object.assign(merged, normalizeSlideImageAdjustments(preferredFight.slideImageAdjustments))
  }
  return merged
}

const scoreFightVisualAdjustments = (fight: FightRecord) => {
  const portraitAAdjust = normalizePortraitAdjust(fight.portraitAAdjust)
  const portraitBAdjust = normalizePortraitAdjust(fight.portraitBAdjust)
  const slideImageAdjustments = normalizeSlideImageAdjustments(fight.slideImageAdjustments)

  return (
    Object.keys(slideImageAdjustments).length * 10 +
    (isDefaultPortraitAdjust(portraitAAdjust) ? 0 : 1) +
    (isDefaultPortraitAdjust(portraitBAdjust) ? 0 : 1)
  )
}

export const resolveSharedFightVisualAdjustments = (
  fights: FightRecord[],
  referenceFight: FightRecord,
): FightVisualAdjustments => {
  const groupedFights = fights.filter((fight) => isSameFightVariantGroup(fight, referenceFight))
  const group = groupedFights.length ? groupedFights : [referenceFight]

  return {
    portraitAAdjust: pickSharedPortraitAdjust(group, 'a', referenceFight),
    portraitBAdjust: pickSharedPortraitAdjust(group, 'b', referenceFight),
    slideImageAdjustments: mergeSharedSlideImageAdjustments(group, referenceFight),
  }
}

export const applySharedFightVisualAdjustments = (
  fights: FightRecord[],
  referenceFight: FightRecord,
  updates: Partial<FightVisualAdjustments>,
) => {
  const currentShared = resolveSharedFightVisualAdjustments(fights, referenceFight)
  const nextShared: FightVisualAdjustments = {
    portraitAAdjust: updates.portraitAAdjust
      ? normalizePortraitAdjust(updates.portraitAAdjust)
      : currentShared.portraitAAdjust,
    portraitBAdjust: updates.portraitBAdjust
      ? normalizePortraitAdjust(updates.portraitBAdjust)
      : currentShared.portraitBAdjust,
    slideImageAdjustments: updates.slideImageAdjustments
      ? normalizeSlideImageAdjustments(updates.slideImageAdjustments)
      : currentShared.slideImageAdjustments,
  }

  return fights.map((fight) =>
    isSameFightVariantGroup(fight, referenceFight)
      ? {
          ...fight,
          portraitAAdjust: nextShared.portraitAAdjust,
          portraitBAdjust: nextShared.portraitBAdjust,
          slideImageAdjustments: nextShared.slideImageAdjustments,
        }
      : fight,
  )
}

export const synchronizeFightVisualAdjustments = (fights: FightRecord[]) => {
  const fightsByGroup = new Map<string, FightRecord[]>()
  fights.forEach((fight) => {
    const groupKey = buildFightVariantGroupKey(fight)
    const group = fightsByGroup.get(groupKey)
    if (group) {
      group.push(fight)
      return
    }
    fightsByGroup.set(groupKey, [fight])
  })

  const sharedByGroup = new Map<string, FightVisualAdjustments>()
  fightsByGroup.forEach((group, groupKey) => {
    if (group.length < 2) return
    const preferredFight = group.reduce((best, candidate) =>
      scoreFightVisualAdjustments(candidate) > scoreFightVisualAdjustments(best) ? candidate : best,
    )
    sharedByGroup.set(groupKey, resolveSharedFightVisualAdjustments(group, preferredFight))
  })

  let changed = false
  const nextFights = fights.map((fight) => {
    const shared = sharedByGroup.get(buildFightVariantGroupKey(fight))
    if (!shared) return fight

    const currentPortraitA = normalizePortraitAdjust(fight.portraitAAdjust)
    const currentPortraitB = normalizePortraitAdjust(fight.portraitBAdjust)
    const currentSlideImageAdjustments = normalizeSlideImageAdjustments(fight.slideImageAdjustments)

    if (
      samePortraitAdjust(currentPortraitA, shared.portraitAAdjust) &&
      samePortraitAdjust(currentPortraitB, shared.portraitBAdjust) &&
      sameSlideImageAdjustments(currentSlideImageAdjustments, shared.slideImageAdjustments)
    ) {
      return fight
    }

    changed = true
    return {
      ...fight,
      portraitAAdjust: shared.portraitAAdjust,
      portraitBAdjust: shared.portraitBAdjust,
      slideImageAdjustments: shared.slideImageAdjustments,
    }
  })

  return changed ? nextFights : fights
}

export const findFightVariantByLanguage = (
  fights: FightRecord[],
  referenceFight: FightRecord,
  language: Language,
) =>
  fights.find(
    (fight) =>
      fight.id !== referenceFight.id &&
      isSameFightVariantGroup(fight, referenceFight) &&
      fight.variantLocale === language,
  ) || null
