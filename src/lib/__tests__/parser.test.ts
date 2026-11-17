import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseLab } from '../parser'

describe('parseLab', () => {
  it('parses the sample lab', () => {
    const lab = parseLab(readFileSync('public/labs/example-steplab.md', 'utf8'))
    expect(lab.title).toBe('Build your first Gemini chatbot with Flask')
    expect(lab.author).toBe('Deepa Subramanian')
    expect(lab.steps.map((s) => s.title)).toEqual([
      'Overview', 'Set up your environment', 'Write the backend', 'Add the frontend', 'Wrap up',
    ])
    expect(lab.totalMinutes).toBe(26)
    expect(lab.warnings).toEqual([])
  })

  it('accepts heading variants, CRLF, and ignores step headings inside code', () => {
    const lab = parseLab('# My Lab\r\n# Step 1 - Intro\r\nhi\r\n```\n## Step 9: nope\n```\n### STEP 2. Two\nDuration: 4 min\n## Step 3\n')
    expect(lab.title).toBe('My Lab')
    expect(lab.steps.map((s) => [s.num, s.title, s.duration])).toEqual([[1, 'Intro', 0], [2, 'Two', 4], [3, 'Step 3', 0]])
  })

  it('warns when numbers are out of order', () => {
    const lab = parseLab('## Step 2: B\n## Step 1: A')
    expect(lab.warnings.length).toBe(2)
  })

  it('renders callouts and highlighted code', () => {
    const [s] = parseLab('## Step 1: X\n> Warning: careful\n\n```python\nprint("x")\n```').steps
    expect(s.html).toContain('callout-warning')
    expect(s.html).not.toMatch(/Warning:\s*careful/)
    expect(s.html).toContain('hljs-')
    expect(s.html).toContain('class="copy"')
  })

  it('returns no steps when there are no Step headings', () => {
    expect(parseLab('# Title\n## Intro\ntext').steps).toEqual([])
  })
})
