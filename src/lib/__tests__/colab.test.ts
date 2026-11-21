import { describe, expect, it } from 'vitest'
import { readColab, colabButtonHtml } from '../colab'
import { parseLab } from '../parser'

const GH = 'https://colab.research.google.com/github/sdkdeepa/demo/blob/main/notebooks/lab.ipynb'

describe('readColab', () => {
  it('turns a GitHub notebook link into a Colab link', () => {
    expect(readColab('https://github.com/sdkdeepa/demo/blob/main/notebooks/lab.ipynb')).toEqual({ url: GH, source: 'github' })
  })

  it('keeps a Colab GitHub link as it is', () => {
    expect(readColab(GH)?.url).toBe(GH)
    expect(readColab(`${GH}?usp=sharing`)?.url).toBe(GH)
  })

  it('accepts Drive notebooks', () => {
    const id = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345'
    const url = `https://colab.research.google.com/drive/${id}`
    expect(readColab(url)).toEqual({ url, source: 'drive' })
    expect(readColab(`https://drive.google.com/file/d/${id}/view?usp=sharing`)?.url).toBe(url)
    expect(readColab(`https://drive.google.com/open?id=${id}`)?.url).toBe(url)
  })

  it('ignores empty values, "none" and anything that is not a notebook', () => {
    for (const v of [
      undefined,
      '',
      'none',
      'sdkdeepa/demo',
      'https://github.com/sdkdeepa/demo',
      'https://github.com/sdkdeepa/demo/blob/main/README.md',
      'https://github.com/sdkdeepa/demo/blob/main/../x.ipynb',
      'https://example.com/a/b/blob/main/x.ipynb',
      'javascript:alert(1)//x.ipynb',
      'https://drive.google.com/drive/folders/abc',
    ])
      expect(readColab(v)).toBeNull()
  })
})

describe('colab in a lab', () => {
  const md = (front: string) => `---\ntitle: Demo\n${front}---\n\n## Step 1: Start\nHello\n`

  it('is read from front matter', () => {
    expect(parseLab(md('colab: https://github.com/sdkdeepa/demo/blob/main/notebooks/lab.ipynb\n')).colab?.url).toBe(GH)
  })

  it('is null without a colab line, and works next to sandbox', () => {
    expect(parseLab(md('')).colab).toBeNull()
    const both = parseLab(md('sandbox: sdkdeepa/demo\ncolab: https://github.com/sdkdeepa/demo/blob/main/notebooks/lab.ipynb\n'))
    expect(both.sandbox).not.toBeNull()
    expect(both.colab).not.toBeNull()
  })

  it('builds the Open in Colab button only when set', () => {
    const lab = parseLab(md('colab: https://github.com/sdkdeepa/demo/blob/main/notebooks/lab.ipynb\n'))
    const html = colabButtonHtml(lab.colab)
    expect(html).toContain(`href="${GH}"`)
    expect(html).toContain('Open in Colab')
    expect(html).toContain('target="_blank"')
    expect(colabButtonHtml(lab.colab, false)).not.toContain('target=')
    expect(colabButtonHtml(null)).toBe('')
  })
})
