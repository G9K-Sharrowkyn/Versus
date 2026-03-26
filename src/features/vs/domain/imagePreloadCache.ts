type ImagePreloadStatus = 'idle' | 'loading' | 'loaded' | 'error'

export type ImagePreloadSnapshot = {
  url: string
  status: ImagePreloadStatus
  width: number
  height: number
}

type ImagePreloadEntry = ImagePreloadSnapshot & {
  promise: Promise<ImagePreloadSnapshot>
  image: HTMLImageElement | null
}

const imagePreloadCache = new Map<string, ImagePreloadEntry>()

const createLoadedSnapshot = (url: string, width: number, height: number): ImagePreloadSnapshot => ({
  url,
  status: 'loaded',
  width,
  height,
})

export const getImagePreloadSnapshot = (url: string): ImagePreloadSnapshot | null => {
  const cached = imagePreloadCache.get(url)
  if (!cached) return null
  return {
    url: cached.url,
    status: cached.status,
    width: cached.width,
    height: cached.height,
  }
}

export const isImagePreloaded = (url: string) => getImagePreloadSnapshot(url)?.status === 'loaded'

export const preloadImageUrl = (url: string): Promise<ImagePreloadSnapshot> => {
  const trimmed = url.trim()
  if (!trimmed || typeof window === 'undefined') {
    return Promise.resolve({
      url: trimmed,
      status: 'error',
      width: 0,
      height: 0,
    })
  }

  const cached = imagePreloadCache.get(trimmed)
  if (cached) {
    return cached.promise
  }

  let resolvePromise!: (value: ImagePreloadSnapshot) => void
  const promise = new Promise<ImagePreloadSnapshot>((resolve) => {
    resolvePromise = resolve
  })

  const cacheEntry: ImagePreloadEntry = {
    url: trimmed,
    status: 'loading',
    width: 0,
    height: 0,
    promise,
    image: null,
  }
  imagePreloadCache.set(trimmed, cacheEntry)

  const image = new window.Image()
  image.decoding = 'async'
  cacheEntry.image = image

  const finalize = (status: ImagePreloadStatus, width = 0, height = 0) => {
    cacheEntry.status = status
    cacheEntry.width = width
    cacheEntry.height = height
    resolvePromise({
      url: trimmed,
      status,
      width,
      height,
    })
  }

  image.onload = () => {
    const complete = () => finalize('loaded', image.naturalWidth || 0, image.naturalHeight || 0)
    if (typeof image.decode === 'function') {
      image.decode().then(complete).catch(complete)
      return
    }
    complete()
  }

  image.onerror = () => {
    finalize('error')
  }

  image.src = trimmed

  if (image.complete && image.naturalWidth > 0) {
    const snapshot = createLoadedSnapshot(trimmed, image.naturalWidth, image.naturalHeight)
    cacheEntry.status = snapshot.status
    cacheEntry.width = snapshot.width
    cacheEntry.height = snapshot.height
    resolvePromise(snapshot)
  }

  return promise
}

export const preloadImageUrls = async (urls: string[]) => {
  const uniqueUrls = [...new Set(urls.map((url) => url.trim()).filter(Boolean))]
  await Promise.all(uniqueUrls.map((url) => preloadImageUrl(url)))
}
