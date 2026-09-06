declare module 'gifenc' {
  export type GifColor = [number, number, number] | [number, number, number, number]

  export type GifEncoder = {
    finish: () => void
    bytes: () => Uint8Array
    writeFrame: (
      index: Uint8Array,
      width: number,
      height: number,
      options?: {
        palette?: GifColor[] | null
        delay?: number
        repeat?: number
        dispose?: number
        transparent?: boolean
        transparentIndex?: number
      },
    ) => void
  }

  export function GIFEncoder(options?: { initialCapacity?: number; auto?: boolean }): GifEncoder
  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: Record<string, unknown>,
  ): GifColor[]
  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: GifColor[],
    format?: string,
  ): Uint8Array
}
