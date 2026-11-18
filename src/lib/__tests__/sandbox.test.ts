import { describe, expect, it } from 'vitest'
import { readSandbox, sandboxButtonHtml } from '../sandbox'
import { parseLab } from '../parser'

const LINK = 'https://codespaces.new/sdkdeepa/steplab-sandbox-node-api?quickstart=1'

describe('readSandbox', () => {
  it('accepts owner/repo', () => {
    expect(readSandbox('sdkdeepa/steplab-sandbox-node-api')).toEqual({ repo: 'sdkdeepa/steplab-sandbox-node-api', url: LINK })
  })

  it('accepts GitHub and Codespaces links', () => {
    for (const v of [
      'https://github.com/sdkdeepa/steplab-sandbox-node-api',
      'https://github.com/sdkdeepa/steplab-sandbox-node-api/',
      'https://github.com/sdkdeepa/steplab-sandbox-node-api.git',
      'https://codespaces.new/sdkdeepa/steplab-sandbox-node-api?quickstart=1',
    ])
      expect(readSandbox(v)?.url).toBe(LINK)
  })

  it('ignores empty, "none" and anything that is not a GitHub repo', () => {
    for (const v of [undefined, '', 'none', 'off', 'just-a-name', 'https://example.com/a/b', 'a/b/c', '"><script>/x', 'javascript:alert(1)/x', 'owner/..'])
      expect(readSandbox(v)).toBeNull()
  })
})

describe('sandbox in a lab', () => {
  const md = (front: string) => `---\ntitle: Demo\n${front}---\n\n## Step 1: Start\nHello\n`

  it('is read from front matter', () => {
    expect(parseLab(md('sandbox: sdkdeepa/steplab-sandbox-node-api\n')).sandbox?.url).toBe(LINK)
    expect(parseLab(md('sandbox: sdkdeepa/steplab-sandbox-node-api   # Node 22\n')).sandbox?.url).toBe(LINK)
  })

  it('is null when the lab has no sandbox line', () => {
    expect(parseLab(md('')).sandbox).toBeNull()
  })

  it('builds the Launch sandbox button only when set', () => {
    const lab = parseLab(md('sandbox: sdkdeepa/steplab-sandbox-node-api\n'))
    const html = sandboxButtonHtml(lab.sandbox)
    expect(html).toContain(`href="${LINK}"`)
    expect(html).toContain('target="_blank"')
    expect(html).toContain('Launch sandbox')
    expect(sandboxButtonHtml(lab.sandbox, false)).not.toContain('target=')
    expect(sandboxButtonHtml(parseLab(md('')).sandbox)).toBe('')
  })
})
