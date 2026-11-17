import { useState, type DragEvent } from 'react'
import { Logo } from './Logo'
import { downloadFile } from '../lib/storage'
import { NavLinks, type NavActions } from './NavLinks'
import { SiteFooter } from './SiteFooter'
import { ThemeToggle } from './ThemeToggle'
import sample from '../labs/example-steplab.md?raw'
import template from '../labs/template.md?raw'

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
  onReadFiles: (files: File[]) => void
  nav: NavActions
  error: string | null
  hasSaved: boolean
  onResume: () => void
}

export function Home({ onOpen, onReadFiles, nav, error, hasSaved, onResume }: Props) {
  const [over, setOver] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

  function read(files: File[]) {
    setFileError(null)
    if (files.length) onReadFiles(files)
  }

  const drop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    read(Array.from(e.dataTransfer.files))
  }

  const message = fileError || error

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

      <section className="hero">
        <div className="hero-copy">
          <h1>Turn one markdown file into a step-by-step codelab.</h1>
          <p>
            Write <code>Step 1</code>, <code>Step 2</code>, <code>Step 3</code>. Drop the file here. Get an interactive
            tutorial with progress, copyable code and a finish line, and download it as one HTML file you can host
            anywhere.
          </p>
          <ul className="hero-points">
            <li>Runs in your browser. Your file never leaves your computer.</li>
            <li>No server, no account, no install.</li>
            <li>Open source.</li>
          </ul>
        </div>

        <div
          className={`drop${over ? ' over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setOver(true)
          }}
          onDragLeave={() => setOver(false)}
          onDrop={drop}
        >
          <Illustration />
          <h2 className="on-pointer">Drop your .md file here</h2>
          <h2 className="on-touch">Open your .md file</h2>
          <p className="drop-sub on-pointer">Drop its images too. You can also reopen a lab you downloaded (.html).</p>
          <p className="drop-sub on-touch">Pick it from Files, Drive or Downloads. Select its images at the same time.</p>
          {message && (
            <p className="drop-error" role="alert">
              {message}
            </p>
          )}
          <div className="drop-actions">
            <button className="btn btn-red" onClick={nav.onUpload}>
              Upload a markdown file
            </button>
            <button className="btn btn-ghost" onClick={() => onOpen(sample, 'example-steplab.md')}>
              Try the sample lab
            </button>
          </div>
          <div className="drop-links">
            <button className="link" onClick={() => onOpen(template, 'template.md')}>
              Open the feature template
            </button>
            <button className="link" onClick={() => downloadFile('steplab-template.md', template, 'text/markdown')}>
              Download template .md
            </button>
            {hasSaved && (
              <button className="link" onClick={onResume}>
                Continue your last lab
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="how" id="how">
        <h2>From notes to a workshop in three moves</h2>
        <div className="how-grid">
          <article>
            <span className="how-n">Write</span>
            <p>Use any editor. Each step is a heading that starts with “Step” and a number.</p>
          </article>
          <article>
            <span className="how-n">Upload</span>
            <p>Drop the file here. StepLab builds the step list, timer and progress bar as you watch.</p>
          </article>
          <article>
            <span className="how-n">Share</span>
            <p>Download a single HTML file and host it on GitHub Pages, or send it to attendees directly.</p>
          </article>
        </div>
      </section>

      <section className="format" id="format">
        <div>
          <h2>The format</h2>
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
            <li>A “Congratulations” pop-up appears when someone finishes the last step.</li>
            <li>
              <button className="link inline" onClick={() => onOpen(template, 'template.md')}>
                Open the template
              </button>{' '}
              to see every feature in action.
            </li>
          </ul>
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

      <SiteFooter />
    </div>
  )
}

function Illustration() {
  return (
    <svg className="illo" viewBox="0 0 320 120" aria-hidden="true">
      <g>
        <rect x="14" y="10" width="78" height="100" rx="10" className="i-file" />
        <path d="M70 10v20h22" className="i-fold" />
        <rect x="28" y="42" width="40" height="6" rx="3" className="i-line strong" />
        <rect x="28" y="58" width="50" height="5" rx="2.5" className="i-line" />
        <rect x="28" y="70" width="44" height="5" rx="2.5" className="i-line" />
        <rect x="28" y="86" width="36" height="6" rx="3" className="i-line strong" />
        <text x="53" y="32" textAnchor="middle" className="i-md">.md</text>
      </g>
      <path d="M112 60h52" className="i-arrow" />
      <path d="M156 52l10 8-10 8" className="i-arrow" />
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(186 ${16 + i * 32})`}>
          <rect width="120" height="24" rx="12" className={i === 1 ? 'i-step on' : 'i-step'} />
          <circle cx="12" cy="12" r="8" className={i === 1 ? 'i-dot on' : i === 0 ? 'i-dot done' : 'i-dot'} />
          <rect x="28" y="9" width={i === 1 ? 70 : 56} height="6" rx="3" className="i-txt" />
        </g>
      ))}
    </svg>
  )
}
