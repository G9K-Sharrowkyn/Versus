export type BattleMode = 'teams' | 'gauntlet'
export type PairSplit = 'vertical' | 'horizontal'
export type BattleSettings = {
  mode: BattleMode
  teams: number[]
  gauntletSize: 1 | 2
  pairSplit: PairSplit
}
export type BattlePanel = {
  id: string
  role: 'team' | 'round' | 'challenger' | 'boss'
  index: number
  slots: string[]
}

export const TEAM_PRESETS = ['1 vs 2', '2 vs 2', '2 vs 4', '4 vs 4', '1 vs 1 vs 1 vs 1']

export function parseTeamFormat(value: string): number[] | null {
  if (!/^\s*[1-8](?:\s*(?:vs\.?|x|×)\s*[1-8]){1,3}\s*$/i.test(value)) return null
  return value.trim().split(/\s*(?:vs\.?|x|×)\s*/i).map(Number)
}

export function buildBattlePanels(settings: BattleSettings): BattlePanel[] {
  if (settings.mode === 'teams') {
    return settings.teams.map((count, index) => ({
      id: `team-${index}`, role: 'team', index,
      slots: Array.from({ length: count }, (_, member) => `team-${index}-${member}`),
    }))
  }
  return [
    ...Array.from({ length: 6 }, (_, index) => ({ id: `round-${index}`, role: 'round' as const, index })),
    { id: 'challenger', role: 'challenger' as const, index: 6 },
    { id: 'boss', role: 'boss' as const, index: 7 },
  ].map(panel => ({
    ...panel,
    slots: Array.from({ length: settings.gauntletSize }, (_, member) => `${panel.id}-${member}`),
  }))
}