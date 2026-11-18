import { describe, expect, test } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { convertClaatHtml, isClaatHtml } from '../claatHtml'
import { convertClaat, looksLikeClaat } from '../claat'
import { parseLab } from '../parser'

const dir = join(__dirname, 'fixtures')
const html = readFileSync(join(dir, 'claat-export.html'), 'utf8')
const json = readFileSync(join(dir, 'claat-codelab.json'), 'utf8')

describe('exported CLaaT folder (index.html)', () => {
  test('is recognised', () => {
    expect(isClaatHtml(html)).toBe(true)
    expect(isClaatHtml('<html><body><h1>Hi</h1></body></html>')).toBe(false)
  })

  const lab = parseLab(convertClaatHtml(html, json))

  test('keeps every step, in order, with durations, Overview as Step 0', () => {
    expect(lab.title).toBe('Build a Syllabus to Study Planner with AI')
    expect(lab.steps.map((s) => [s.label, s.title, s.duration])).toEqual([
      ['Step 0', 'Overview', 2],
      ['Step 1', 'Open AI Studio Dashboard', 12],
      ['Step 2', "Test it: don't just trust it", 4],
      ['Step 3', 'Prompt 2: add "Start studying" (fast)', 3],
      ['Step 4', 'Prompt 3: color-code it (fast)', 2],
      ['Step 5', 'Preview your finished app', 3],
      ['Step 6', 'Troubleshooting', 2],
      ['Step 7', 'MORE IDEAS - Build Your Own AI App', 5],
    ])
  })

  test('keeps callouts, code, tables, images and in-step headings', () => {
    expect(lab.steps[0].html).toContain('callout-warning')
    expect(lab.steps[0].html).toContain('src="img/f4cc6546e8ba03e.png"')
    expect(lab.steps[0].html).toMatch(/<h3[^>]*>What you(&#39;|')ll learn/)
    expect(lab.steps[1].html).toContain('Syllabus to Study Planner')
    expect(lab.steps[1].html).toContain('<pre')
    expect(lab.steps[6].html).toContain('<table')
    expect(lab.steps[6].html).toContain('Make my plan')
  })
})

describe('CLaaT .md with hand-numbered steps', () => {
  const md = `id: x\nauthors: Deepa Subramanian\nsummary: s\n\n# Lab\n\n## Overview\nDuration: 2\n\nhi\n\n## Step 1 · Open AI Studio\nDuration: 12\n\nopen\n\n## Step 2 - Test it\nok\n\n## Troubleshooting\nhelp\n`
  test('is still offered for conversion', () => expect(looksLikeClaat(md)).toBe(true))
  test('is renumbered without doubling "Step"', () => {
    expect(parseLab(convertClaat(md)).steps.map((s) => `${s.label}: ${s.title}`)).toEqual([
      'Step 0: Overview',
      'Step 1: Open AI Studio',
      'Step 2: Test it',
      'Step 3: Troubleshooting',
    ])
  })
})
