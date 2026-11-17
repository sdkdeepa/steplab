/** Images uploaded together with a lab, keyed by lowercase file name. */
export type Assets = Record<string, string>

const IMAGE = /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i
export const isImageFile = (f: File) => f.type.startsWith('image/') || IMAGE.test(f.name)
export const isLabFile = (f: File) => /\.(md|markdown|txt)$/i.test(f.name)

export async function readImages(files: File[]): Promise<Assets> {
  const out: Assets = {}
  await Promise.all(
    files.filter(isImageFile).map(
      (f) =>
        new Promise<void>((done) => {
          const r = new FileReader()
          r.onload = () => {
            out[f.name.toLowerCase()] = String(r.result)
            done()
          }
          r.onerror = () => done()
          r.readAsDataURL(f)
        }),
    ),
  )
  return out
}

const fileName = (src: string) => {
  try {
    src = decodeURIComponent(src)
  } catch {
    /* keep as is */
  }
  return src.split(/[?#]/)[0].split('/').pop()!.toLowerCase()
}

/** Swaps relative image paths (img/terms.png, ./terms.png) for uploaded images with the same file name. */
export function applyAssets(html: string, assets: Assets): string {
  if (!Object.keys(assets).length) return html
  return html.replace(/(<img\b[^>]*?\bsrc=")([^"]+)(")/gi, (all, a: string, src: string, b: string) => {
    if (/^(https?:|data:|blob:)/i.test(src)) return all
    const hit = assets[fileName(src)]
    // keep the original path in data-src so a downloaded lab can be reopened with its images
    return hit ? `${a}${hit}${b} data-src="${src.replace(/"/g, '&quot;')}"` : all
  })
}
