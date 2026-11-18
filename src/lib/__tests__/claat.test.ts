import { describe, expect, test } from 'vitest'
import { convertClaat, looksLikeClaat } from '../claat'
import { parseLab } from '../parser'

const CLAAT = `summary: Build your first web app
id: first-web-app
categories: Web
status: Published
authors: Deepa Subramanian, Someone Else
Feedback Link: https://example.com/feedback

# Build Your First Web App

## Overview
Duration: 0:02:00

In this codelab you'll build a small web app.

<aside class="positive">
This codelab is beginner friendly.
</aside>

## Set up your environment
Duration: 0:05:00

\`\`\`bash
npm create vite@latest
## not a step
\`\`\`

<aside class="negative">Do not commit your API key.</aside>

Positive
: Old-style tip box.

## Wrap up
Duration: 0:01:00

You're done!
`

describe('CLaaT import', () => {
  test('detects CLaaT files, and not StepLab files', () => {
    expect(looksLikeClaat(CLAAT)).toBe(true)
    expect(looksLikeClaat(convertClaat(CLAAT))).toBe(false)
    expect(looksLikeClaat('# Notes\n\n## Shopping\nmilk')).toBe(false)
  })

  test('converted lab parses into the right steps', () => {
    const lab = parseLab(convertClaat(CLAAT))
    expect(lab.title).toBe('Build Your First Web App')
    expect(lab.author).toBe('Deepa Subramanian')
    expect(lab.steps.map((s) => [s.label, s.title, s.duration])).toEqual([
      ['Step 0', 'Overview', 2],
      ['Step 1', 'Set up your environment', 5],
      ['Step 2', 'Wrap up', 1],
    ])
  })

  test('keeps code blocks and converts callouts', () => {
    const lab = parseLab(convertClaat(CLAAT))
    expect(lab.steps[0].html).toContain('callout-tip')
    expect(lab.steps[1].html).toContain('callout-warning')
    expect(lab.steps[1].html).toContain('callout-tip')
    expect(lab.steps[1].html).toContain('## not a step')
  })

  test('starts at Step 1 when the first section is not an overview', () => {
    const md = convertClaat('id: x\nauthors: A\n\n# T\n\n## Install\nhi\n\n## Run\nok')
    expect(md).toContain('## Step 1: Install')
    expect(md).toContain('## Step 2: Run')
  })
})
