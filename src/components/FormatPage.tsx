import { useEffect } from 'react'
import { Logo } from './Logo'
import { NavLinks, type NavActions } from './NavLinks'
import { SiteFooter } from './SiteFooter'
import { ThemeToggle } from './ThemeToggle'
import template from '../labs/template.md?raw'
import './HomeExtras.css'

const FORMAT = `## Step 1: Set up your environment
Duration: 5

Install the tools:

\`\`\`bash
npm install
\`\`\`

> Tip: Keep each step to one task.

\`\`\`slides
labs/images/slide-1.png
labs/images/slide-2.png
\`\`\`

https://youtu.be/VIDEO_ID

## Step 2: Write the code
...`

interface Props {
  onOpen: (markdown: string, name?: string) => void
  nav: NavActions
}

/** The format guide, at /format. */
export function FormatPage({ onOpen, nav }: Props) {
  useEffect(() => {
    document.title = 'Lab format · StepLab'
  }, [])

  return (
    <div className="home">
      <header className="home-nav">
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); nav.onHome() }}>
          <Logo /> StepLab
        </a>
        <div className="home-nav-right">
          <NavLinks {...nav} variant="home" />
          <ThemeToggle />
        </div>
      </header>

      <section className="format format-page" id="format">
        <div>
          <h1>Lab format</h1>
          <p className="extras-sub">
            A lab is one markdown file. These are all the rules, and the template shows every feature in action.
          </p>
          <ul className="rules">
            <li>
              Start each step with <code>## Step 1: Title</code>. <code># Step 2 - Title</code> and{' '}
              <code>### STEP 3. Title</code> work too.
            </li>
            <li>
              Add <code>Duration: 5</code> (or <code>5:00</code>) under a step for its length in minutes.
            </li>
            <li>
              Start with <code>## Step 0: Overview</code> for an introduction. A plain <code>## Overview</code> before
              Step 1 also becomes Step 0.
            </li>
            <li>
              Start a quote with <code>Note:</code>, <code>Tip:</code> or <code>Warning:</code> to make a callout.
            </li>
            <li>
              Put <code>title:</code> and <code>author:</code> in front matter, or use a <code># Heading</code> for the
              title.
            </li>
            <li>
              Add a <code>```slides</code> block with image paths for a slide deck with arrow buttons, or paste a
              Google Slides or PowerPoint link for a live embed.
            </li>
            <li>Paste a YouTube link on its own line to embed the video.</li>
            <li>
              Add <code>author:</code>, <code>linkedin:</code> and <code>copyright:</code> to show a copyright line on every
              step, or <code>copyright: none</code> to hide it.
            </li>
            <li>
              Add <code>sandbox:</code> with a GitHub repo to show a “Launch sandbox” button that opens it in GitHub
              Codespaces.
            </li>
            <li>
              Add <code>colab:</code> with a notebook link (GitHub or Google Drive) to show an “Open in Colab” button. Each
              attendee gets their own copy of the notebook in Google Colab.
            </li>
            <li>A “Congratulations” pop-up appears when someone finishes the last step.</li>
          </ul>
          <div className="format-actions">
            <button className="btn btn-red" onClick={() => onOpen(template, 'template.md')}>
              Open the template
            </button>
          </div>
        </div>
        <div className="code">
          <div className="code-bar">
            <span>my-lab.md</span>
          </div>
          <pre>
            <code>{FORMAT}</code>
          </pre>
        </div>
      </section>

      <MobileSection />

      <SiteFooter />
    </div>
  )
}

/** Mobile code highlighting. Shown at the end of the home page and on the format page. */
export function MobileSection() {
  return (
    <section className="extras mobile-row" id="mobile">
      <div className="mobile-text">
        <h2>Built for mobile codelabs too</h2>
        <p className="extras-sub">
          Teaching Android or iOS? Code blocks are highlighted for the languages mobile workshops use.
        </p>
      </div>
      <div className="mobile-box">
        <ul className="lang-chips" aria-label="Highlighted mobile languages">
          <li><b>kotlin</b> Jetpack Compose</li>
          <li><b>swift</b> SwiftUI</li>
          <li><b>objectivec</b> Objective-C</li>
          <li><b>dart</b> Flutter</li>
          <li><b>java</b></li>
          <li><b>gradle</b></li>
          <li><b>xml</b></li>
        </ul>
        <p className="extras-sub mobile-hint">
          Write <code>```kotlin</code>, <code>```swift</code> and so on above a code block.
        </p>
      </div>
    </section>
  )
}
