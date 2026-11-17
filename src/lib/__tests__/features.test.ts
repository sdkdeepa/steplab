import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseLab } from '../parser'
import { parseYouTube, presentationEmbed, slidesHtml } from '../embeds'

describe('YouTube', () => {
  it('reads every common link shape', () => {
    for (const u of [
      'https://www.youtube.com/watch?v=ftOBvusMHjQ',
      'https://youtu.be/ftOBvusMHjQ',
      'https://youtube.com/shorts/ftOBvusMHjQ',
      'https://www.youtube.com/embed/ftOBvusMHjQ',
      'https://m.youtube.com/watch?v=ftOBvusMHjQ&feature=share',
    ])
      expect(parseYouTube(u)?.id).toBe('ftOBvusMHjQ')
    expect(parseYouTube('https://youtu.be/ftOBvusMHjQ?t=1m30s')?.start).toBe(90)
    expect(parseYouTube('https://www.youtube.com/watch?v=ftOBvusMHjQ&t=60s')?.start).toBe(60)
    expect(parseYouTube('https://evil.com/watch?v=ftOBvusMHjQ')).toBeNull()
  })
  it('turns a bare link and a youtube block into players', () => {
    const lab = parseLab('## Step 1: V\nhttps://youtu.be/ftOBvusMHjQ\n\n```youtube\ntitle: Intro\nhttps://youtu.be/ftOBvusMHjQ?t=5\n```\n\nSee [this](https://youtu.be/ftOBvusMHjQ) inline.')
    const html = lab.steps[0].html
    expect(html.match(/youtube-nocookie\.com\/embed\/ftOBvusMHjQ/g)?.length).toBe(2)
    expect(html).toContain('start=5')
    expect(html).toContain('Intro')
    expect(html).toContain('<a href="https://youtu.be/ftOBvusMHjQ"') // inline link stays a link
  })
})

describe('Slides', () => {
  it('builds an image deck with arrows, thumbnails and captions', () => {
    const html = slidesHtml('title: Deck\nimg/a.png | First\nimg/b.png\nhttps://x.com/c.jpg')
    expect(html).toContain('data-deck')
    expect(html.match(/<img src=/g)?.length).toBe(6) // 3 slides + 3 thumbs
    expect(html).toContain('deck-prev')
    expect(html).toContain('deck-next')
    expect(html).toContain('1 / 3')
    expect(html).toContain('First')
  })
  it('turns Google Slides and PowerPoint links into embeds', () => {
    expect(presentationEmbed('https://docs.google.com/presentation/d/e/2PACX-abc/pub?start=false')?.src).toBe(
      'https://docs.google.com/presentation/d/e/2PACX-abc/embed?start=false&loop=false&delayms=3000',
    )
    expect(presentationEmbed('https://docs.google.com/presentation/d/abc123/edit#slide=id.p')?.src).toContain('/d/abc123/embed')
    expect(presentationEmbed('https://example.com/talk.pptx')?.src).toBe(
      'https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fexample.com%2Ftalk.pptx',
    )
    expect(presentationEmbed('https://onedrive.live.com/embed?resid=1&em=2')?.kind).toBe('powerpoint')
    expect(slidesHtml('https://docs.google.com/presentation/d/e/X/pub')).toContain('<iframe')
  })
  it('warns when a slides block is empty', () => {
    expect(slidesHtml('title: Nothing')).toContain('No slides found')
  })
})

describe('Copyright', () => {
  const year = new Date().getFullYear()
  it('fills {name} and {year} and reads the position', () => {
    const lab = parseLab('---\nauthor: Jane Doe   # me\nlinkedin: https://www.linkedin.com/in/jane\ncopyright: © {year} {author}\ncopyright_position: bottom # comment\n---\n## Step 1: A')
    expect(lab.copyright).toEqual({ text: `© ${year} Jane Doe`, name: 'Jane Doe', linkedin: 'https://www.linkedin.com/in/jane', position: 'bottom' })
  })
  it('can be turned off, and defaults to none without settings', () => {
    expect(parseLab('---\nauthor: J\ncopyright: none\n---\n## Step 1: A').copyright).toBeNull()
    expect(parseLab('---\nauthor: J\n---\n## Step 1: A').copyright).toBeNull() // author alone = just "Written by"
    expect(parseLab('---\nname: Old\ncopyright: © {name}\n---\n## Step 1: A').copyright?.text).toBe('© Old') // older files
    expect(parseLab('## Step 1: A').copyright).toBeNull()
  })
  it('ignores LinkedIn links that are not LinkedIn', () => {
    expect(parseLab('---\nauthor: J\ncopyright: ©\nlinkedin: https://evil.com\n---\n## Step 1: A').copyright?.linkedin).toBeUndefined()
  })
})

describe('Template', () => {
  it('parses into 8 steps with every feature', () => {
    const lab = parseLab(readFileSync('src/labs/template.md', 'utf8'))
    expect(lab.steps.length).toBe(8)
    expect(lab.warnings).toEqual([])
    expect(lab.copyright?.position).toBe('both')
    const all = lab.steps.map((s) => s.html).join('\n')
    for (const lang of ['python', 'javascript', 'typescript', 'java', 'kotlin', 'swift', 'go', 'sql', 'json', 'yaml', 'html', 'css', 'bash'])
      expect(all).toContain(`<span>${lang}</span>`)
    expect(all).toContain('<table>')
    expect(all).toContain('<strong>')
    expect(all).toContain('<em>')
    expect(all).toContain('<del>')
    expect(all).toContain('class="figure"')
    expect(all).toContain('data-deck')
    expect(all).toContain('youtube-nocookie.com/embed/JhmMuLfwPB0')
    expect(all).toContain('class="yt-thumb"')
    expect(all).toContain('callout-tip')
  })
  it('does not treat "## Step" inside a ~~~ example as a real step', () => {
    const lab = parseLab('## Step 1: A\n~~~markdown\n```slides\n## Step 9: fake\n```\n~~~\n## Step 2: B')
    expect(lab.steps.map((s) => s.title)).toEqual(['A', 'B'])
  })
})

describe('Step 0', () => {
  it('accepts an explicit "## Step 0: Overview"', () => {
    const lab = parseLab('# Lab\n## Step 0: Overview\nIntro\n## Step 1: A\n## Step 2: B')
    expect(lab.steps.map((s) => [s.label, s.title])).toEqual([
      ['Step 0', 'Overview'],
      ['Step 1', 'A'],
      ['Step 2', 'B'],
    ])
    expect(lab.steps.map((s) => s.badge)).toEqual(['0', '1', '2'])
    expect(lab.warnings).toEqual([])
  })
  it('turns a plain "## Overview" before Step 1 into Step 0, keeping later ## lines inside it', () => {
    const lab = parseLab('# Lab\n\n## Introduction\nDuration: 3\n\nHi\n\n## What you need\n- Python\n\n## Step 1 · Set up\nDuration: 5:00\n\nGo')
    expect(lab.steps.map((s) => [s.label, s.title, s.duration])).toEqual([
      ['Step 0', 'Introduction', 3],
      ['Step 1', 'Set up', 5],
    ])
    expect(lab.steps[0].html).toContain('What you need')
    expect(lab.steps[1].html).not.toContain('Duration')
  })
  it('still starts at Step 1 when there is no overview', () => {
    expect(parseLab('## Step 1: A\n## Step 2: B').steps.map((s) => s.label)).toEqual(['Step 1', 'Step 2'])
  })
  it('ignores ## headings when there are no Step headings at all', () => {
    expect(parseLab('# Lab\n## Overview\ntext').steps).toEqual([])
  })
  it('does not read plain "key: value" lines as settings without --- lines', () => {
    const lab = parseLab('author: Someone\nsummary: x\n\n# Lab\n## Step 0: Overview\nhi')
    expect(lab.author).toBeUndefined()
    expect(lab.steps.length).toBe(1)
  })
})

describe('aside callouts', () => {
  it('turns "> aside negative" into a Warning and "> aside positive" into a Tip', () => {
    const [s] = parseLab("## Step 1: A\n> aside negative\n> **Don't paste personal information.** Use the sample.\n\n> aside positive\n> Nice work!").steps
    expect(s.html).toContain('callout-warning')
    expect(s.html).toContain('callout-tip')
    expect(s.html).not.toMatch(/aside (negative|positive)/i)
    expect(s.html).toContain("<strong>Don&#39;t paste personal information.</strong>")
  })
})

describe('YouTube preview cards and LinkedIn text', () => {
  it('turns [![title](thumb)](youtube) into a preview card with a play button', () => {
    const [s] = parseLab('## Step 1: A\n[![Google ADK Masterclass - July 2026](https://img.youtube.com/vi/JhmMuLfwPB0/maxresdefault.jpg)](https://youtu.be/JhmMuLfwPB0)').steps
    expect(s.html).toContain('class="yt-thumb"')
    expect(s.html).toContain('yt-play')
    expect(s.html).toContain('Google ADK Masterclass - July 2026')
    expect(s.html).not.toContain('youtube-nocookie') // a link, not an embedded player
  })
  it('shows the LinkedIn handle as the link text', async () => {
    const { linkedinText } = await import('../parser')
    expect(linkedinText('https://www.linkedin.com/in/jane-doe/')).toBe('linkedin.com/in/jane-doe')
    expect(linkedinText('https://example.com')).toBe('LinkedIn')
  })
})
