/** Caminhos relativos (/images/…) e data/blob URLs para <img src>. */
export function koiImageSrc(path: string | undefined): string | undefined {
  if (!path?.trim()) return undefined
  if (
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return path
  }
  return path.startsWith('/') ? path : `/${path}`
}
