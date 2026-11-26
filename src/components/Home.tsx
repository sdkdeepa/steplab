import { useState, type DragEvent } from 'react'
import { filesFromDrop } from '../lib/importFiles'
import { Logo } from './Logo'
import { NavLinks, type NavActions } from './NavLinks'
import { SiteFooter } from './SiteFooter'
import { VSCODE_URL, OPENVSX_URL, DOCKER_IMAGE, DOCKER_GUIDE_URL } from '../config'
import { MobileSection } from './FormatPage'
import './HomeExtras.css'
import { ThemeToggle } from './ThemeToggle'
import sample from '../labs/example-steplab.md?raw'
import sandboxLab from '../labs/node-api.steplab.md?raw'

interface Props {
  onOpen: (markdown: string, name?: string) => void
  onReadFiles: (files: File[]) => void
  nav: NavActions
  error: string | null
}

export function Home({ onOpen, onReadFiles, nav, error }: Props) {
  const [over, setOver] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const dockerCmd = `docker run --rm -p 8080:8080 ${DOCKER_IMAGE}`

  const copyDocker = async () => {
    try {
      await navigator.clipboard.writeText(dockerCmd)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked: the command is still visible to copy by hand */
    }
  }

  function read(files: File[]) {
    setFileError(null)
    if (files.length) onReadFiles(files)
  }

  const drop = async (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    // filesFromDrop also opens dropped folders, such as an exported CLaaT folder
    read(await filesFromDrop(e.dataTransfer))
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
          <h1>
            Turn one markdown file into a <span className="hero-hl">step-by-step</span>{' '}codelab.
          </h1>
          <p>
            Write <code>Step 1</code>, <code>Step 2</code>, <code>Step 3</code>. Drop the file here. Get an interactive
            tutorial with progress, copyable code and a finish line, and download it as one HTML file you can host
            anywhere.
          </p>
          <ul className="hero-points">
            <li>Runs in your browser. Your file never leaves your computer.</li>
            <li>No signups required.</li>
            <li>Comes in your favorite IDE: VS Code and Antigravity IDE.</li>
            <li>Labs can launch a live sandbox, and StepLab runs in your own Docker container.</li>
            <li>Supports Mobile languages: Kotlin, Swift and Objective-C.</li>
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
          <p className="drop-sub on-pointer">Drop its images too. You can also reopen previously downloaded StepLab (.html), or drop an old CLaaT folder to convert it.</p>
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

      <section className="extras editor-row" id="editor">
        <div className="editor-text">
          <h2>Write labs in your editor</h2>
          <p className="extras-sub">
            The StepLab extension shows a live preview beside your markdown and exports the finished lab as one HTML file.
          </p>
        </div>
        <div className="install-grid">
          <a className="install-card" href={VSCODE_URL} target="_blank" rel="noopener noreferrer">
            <img src="icons/vscode.png" alt="" width="48" height="48" />
            <span>
              <small>Install for</small>
              <b>VS Code</b>
              <small>Visual Studio Marketplace</small>
            </span>
          </a>
          <a className="install-card" href={OPENVSX_URL} target="_blank" rel="noopener noreferrer">
            <img src="icons/antigravity.png" alt="" width="48" height="48" />
            <span>
              <small>Install for</small>
              <b>Antigravity IDE</b>
              <small>Open VSX Registry</small>
            </span>
          </a>
        </div>
      </section>

      <section className="extras" id="run">
        <h2>Hands-on, anywhere</h2>
        <div className="duo">
          <article className="duo-card" id="sandbox">
            <h3>Labs with a live sandbox</h3>
            <p>
              Add one line to your lab, <code>sandbox: your-name/your-repo</code>, and attendees get a ready-to-use coding
              environment in the browser through GitHub Codespaces. Nothing to install.
            </p>
            <div className="duo-actions">
              <button type="button" className="btn btn-red" onClick={() => onOpen(sandboxLab, 'node-api.steplab.md')}>
                Try a sandbox lab
              </button>
            </div>
          </article>
          <article className="duo-card" id="docker">
            <h3>Run StepLab in Docker</h3>
            <p>
              Host StepLab on your own computer or server, behind a firewall or at a workshop with poor Wi-Fi. One command,
              on Mac, Windows or Linux:
            </p>
            <div className="cmd">
              <code>{dockerCmd}</code>
              <button type="button" className="cmd-copy" onClick={copyDocker} aria-label="Copy the Docker command">
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="duo-actions">
              <a className="btn btn-outline" href={DOCKER_GUIDE_URL} target="_blank" rel="noopener noreferrer">
                Try with Docker
              </a>
            </div>
          </article>
        </div>
      </section>

      <MobileSection />

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
