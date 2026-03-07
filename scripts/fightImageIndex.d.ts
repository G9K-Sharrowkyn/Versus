export type FightImageIndexEntry = {
  section: string
  title: string
  fileName: string
  originalUrl: string
  resolvedImageUrl: string
  sourceUrl: string
}

export declare const parseFightImageIndex: (raw: string) => FightImageIndexEntry[]
export declare const cleanFightImageIndexValue: (value: unknown) => string
export declare const inferFightImageSectionFromFileName: (fileName: string) => string
