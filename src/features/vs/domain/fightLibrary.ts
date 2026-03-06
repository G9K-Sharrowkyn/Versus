import { normalizeToken, stripFileExtension } from '../helpers'
import type { FightRecord, FightVariantLocale } from '../types'

export type FightLibraryGroup = {
  matchupKey: string
  title: string
  fights: FightRecord[]
}

export const selectFolderFights = (fights: FightRecord[]) => fights.filter((fight) => fight.source === 'folder')

export const selectManualFights = (fights: FightRecord[]) => fights.filter((fight) => fight.source !== 'folder')

const localeRank = (value: FightVariantLocale) => (value === 'pl' ? 0 : value === 'en' ? 1 : 2)

export const buildFolderFightGroups = (folderFights: FightRecord[]): FightLibraryGroup[] => {
  const map = new Map<string, { matchupKey: string; title: string; sortIndex: number; fights: FightRecord[] }>()

  folderFights.forEach((fight, index) => {
    const key = fight.matchupKey || normalizeToken(fight.name)
    const existing = map.get(key)

    if (!existing) {
      map.set(key, {
        matchupKey: key,
        title: stripFileExtension(fight.name) || stripFileExtension(fight.fileName),
        sortIndex: index,
        fights: [fight],
      })
      return
    }

    existing.fights.push(fight)
    existing.sortIndex = Math.min(existing.sortIndex, index)
  })

  return Array.from(map.values())
    .map((group) => ({
      ...group,
      fights: [...group.fights].sort((left, right) => {
        const variantRank = localeRank(left.variantLocale) - localeRank(right.variantLocale)
        if (variantRank !== 0) return variantRank
        return left.fileName.localeCompare(right.fileName, undefined, {
          numeric: true,
          sensitivity: 'base',
        })
      }),
    }))
    .sort((left, right) => {
      if (left.sortIndex !== right.sortIndex) return left.sortIndex - right.sortIndex
      return left.title.localeCompare(right.title, undefined, { numeric: true, sensitivity: 'base' })
    })
}
