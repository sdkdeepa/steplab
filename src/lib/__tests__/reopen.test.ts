import { describe, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { reopenStepLabHtml, dataUrlBytes, safeImagePath } from '../reopen'

// A real download: image-lab.md + img/terms.png + logo.svg uploaded on the website, then Download HTML.
const dir = join(__dirname, 'fixtures')
const html = readFileSync(join(dir, 'steplab-download.html'), 'utf8')
const md = readFileSync(join(dir, 'steplab-download.md'), 'utf8')
const png = readFileSync(join(dir, 'steplab-download-img', 'terms.png'))
const svg = readFileSync(join(dir, 'steplab-download-img', 'logo.svg'))

describe('reopening a lab downloaded from StepLab', () => {
  test('gives back the exact markdown, including </script> and <img> inside code', () => {
    const r = reopenStepLabHtml(html)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.markdown).toBe(md)
  })

  test('gives back each image once, with the path the markdown uses and the same bytes', () => {
    const r = reopenStepLabHtml(html)
    if (!r.ok) throw new Error(r.reason)
    expect(r.images.map((i) => i.path)).toEqual(['img/terms.png', './logo.svg'])
    expect(Buffer.from(dataUrlBytes(r.images[0].dataUrl)!)).toEqual(png)
    expect(Buffer.from(dataUrlBytes(r.images[1].dataUrl)!)).toEqual(svg)
  })

  test('ignores an <img> shown as code in the lab', () => {
    const r = reopenStepLabHtml(html)
    if (!r.ok) throw new Error(r.reason)
    expect(r.images.some((i) => i.path.includes('evil'))).toBe(false)
  })

  test('says why when it cannot reopen', () => {
    expect(reopenStepLabHtml('<html><body><table></table></body></html>')).toEqual({ ok: false, reason: 'not-steplab' })
    expect(reopenStepLabHtml(readFileSync(join(dir, 'claat-export.html'), 'utf8'))).toEqual({ ok: false, reason: 'not-steplab' })
    const old = html.replace(/<script type="application\/json" id="steplab-source">[\s\S]*?<\/script>/, '')
    expect(reopenStepLabHtml(old)).toEqual({ ok: false, reason: 'old-version' })
    const broken = html.replace('id="steplab-source">"', 'id="steplab-source">{')
    expect(reopenStepLabHtml(broken)).toEqual({ ok: false, reason: 'damaged' })
    const notText = html.replace(/(id="steplab-source">)[\s\S]*?(<\/script>)/, '$142$2')
    expect(reopenStepLabHtml(notText)).toEqual({ ok: false, reason: 'damaged' })
  })

  test('reads attributes in any order and quoting, with entities', () => {
    const page = `<html><head><meta content='StepLab' name=generator></head><body>
<script id="steplab-source" type="application/json">"# Hi"</script>
<img data-src='img/a&amp;b.png' alt="x" src="data:image/png;base64,iVBORw0KGgo=">
<img src="img/not-inlined.png" data-src="img/not-inlined.png">
<img src="data:image/png;base64,AAAA"></body></html>`
    const r = reopenStepLabHtml(page)
    expect(r).toEqual({ ok: true, markdown: '# Hi', images: [{ path: 'img/a&b.png', dataUrl: 'data:image/png;base64,iVBORw0KGgo=' }] })
  })
})

describe('where reopened images may be saved', () => {
  test('keeps plain relative paths inside the lab folder', () => {
    expect(safeImagePath('img/terms.png')).toBe('img/terms.png')
    expect(safeImagePath('./logo.svg')).toBe('logo.svg')
    expect(safeImagePath('img/My%20Shot.PNG?v=2')).toBe('img/My Shot.PNG')
    expect(safeImagePath('img\\win.png')).toBe('img/win.png')
  })
  test('refuses links, absolute paths, climbing out and non-images', () => {
    for (const p of [
      'https://example.com/a.png',
      '//cdn.example.com/a.png',
      'data:image/png;base64,AAAA',
      '/etc/a.png',
      'C:\\Users\\a.png',
      '../a.png',
      'img/../../a.png',
      'img/%2e%2e/%2e%2e/a.png',
      'img/notes.txt',
      'img/run.sh',
      '',
    ])
      expect(safeImagePath(p), p).toBeNull()
  })
})

describe('data URLs', () => {
  test('base64 and percent-encoded', () => {
    expect(Buffer.from(dataUrlBytes('data:text/plain;base64,aGk=')!).toString()).toBe('hi')
    expect(Buffer.from(dataUrlBytes('data:image/svg+xml,%3Csvg%2F%3E')!).toString()).toBe('<svg/>')
    expect(dataUrlBytes('img/a.png')).toBeNull()
  })
})
