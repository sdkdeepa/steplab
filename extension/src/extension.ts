import * as vscode from 'vscode'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as https from 'node:https'
import { convertClaat, looksLikeClaat } from '../../src/lib/claat'
import { convertClaatHtml, isClaatHtml } from '../../src/lib/claatHtml'
import { readColab, labNotebook, looksLikeNotebook } from '../../src/lib/colab'
import { readFrontMatter } from '../../src/lib/frontMatter'

/** Same rule as the web app: "## Step 3: Title", "# Step 2 - Title", "### STEP 1. Title", "## Step 4 · Title". */
const STEP_HEADING = /^#{1,3}\s*step\s*(\d+)\s*[:.)\-–—·•|]?\s*(.*)$/i
const SECTION_HEADING = /^##\s+(.+?)\s*#*\s*$/

interface StepLine {
  line: number
  num: number | null // null = "## Overview" before Step 1 (shown as Step 0)
  title: string
}

/** Finds where each step starts, skipping headings inside code fences. */
export function scanSteps(text: string): StepLine[] {
  const lines = text.split(/\r?\n/)
  let start = 0
  if (lines[0] === '---') {
    const end = lines.indexOf('---', 1)
    if (end > 0) start = end + 1
  }
  const out: StepLine[] = []
  let fence = ''
  let seenStep = false
  const hasSteps = lines.some((l) => STEP_HEADING.test(l))
  for (let i = start; i < lines.length; i++) {
    const l = lines[i]
    const f = l.match(/^\s{0,3}(`{3,}|~{3,})/)
    if (f) {
      if (!fence) fence = f[1]
      else if (f[1][0] === fence[0] && f[1].length >= fence.length && !l.trim().slice(f[1].length).trim()) fence = ''
      continue
    }
    if (fence) continue
    const m = l.match(STEP_HEADING)
    if (m) {
      seenStep = true
      out.push({ line: i, num: Number(m[1]), title: m[2].trim() })
      continue
    }
    const s = !seenStep && !out.length && hasSteps ? l.match(SECTION_HEADING) : null
    if (s) out.push({ line: i, num: null, title: s[1] })
  }
  return out
}

const isLab = (doc: vscode.TextDocument) => doc.languageId === 'markdown'

class Preview {
  static current: Preview | undefined
  private panel: vscode.WebviewPanel
  private doc: vscode.TextDocument
  private disposables: vscode.Disposable[] = []
  private ready = false
  private exportResolve: (() => void) | undefined
  private readyWaiters: (() => void)[] = []

  static show(ctx: vscode.ExtensionContext, doc: vscode.TextDocument) {
    if (Preview.current) {
      Preview.current.setDocument(doc)
      Preview.current.panel.reveal(vscode.ViewColumn.Beside, true)
      return Preview.current
    }
    Preview.current = new Preview(ctx, doc)
    return Preview.current
  }

  private constructor(private ctx: vscode.ExtensionContext, doc: vscode.TextDocument) {
    this.doc = doc
    this.panel = vscode.window.createWebviewPanel(
      'steplab.preview',
      this.title(),
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: this.roots() },
    )
    this.panel.iconPath = vscode.Uri.joinPath(ctx.extensionUri, 'media', 'icon.png')
    this.panel.webview.html = this.html()
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables)
    this.panel.webview.onDidReceiveMessage((m) => this.onMessage(m), null, this.disposables)

    let timer: NodeJS.Timeout | undefined
    vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document !== this.doc) return
        clearTimeout(timer)
        timer = setTimeout(() => this.update(), 200)
      },
      null,
      this.disposables,
    )
    vscode.window.onDidChangeActiveTextEditor(
      (ed) => {
        if (ed && isLab(ed.document) && ed.document !== this.doc) this.setDocument(ed.document)
      },
      null,
      this.disposables,
    )
    // Follow the cursor: moving into "## Step 3" shows Step 3.
    vscode.window.onDidChangeTextEditorSelection(
      (e) => {
        if (e.textEditor.document !== this.doc || !vscode.workspace.getConfiguration('steplab').get('followCursor', true)) return
        const line = e.selections[0].active.line
        const steps = scanSteps(this.doc.getText())
        let idx = -1
        steps.forEach((s, i) => s.line <= line && (idx = i))
        if (idx >= 0) this.panel.webview.postMessage({ type: 'goto', index: idx })
      },
      null,
      this.disposables,
    )
  }

  private roots() {
    const roots = [vscode.Uri.joinPath(this.ctx.extensionUri, 'dist'), vscode.Uri.joinPath(this.ctx.extensionUri, 'media')]
    const folder = vscode.workspace.getWorkspaceFolder(this.doc.uri)
    if (folder) roots.push(folder.uri)
    if (this.doc.uri.scheme === 'file') roots.push(vscode.Uri.file(path.dirname(this.doc.uri.fsPath)))
    return roots
  }

  /** The lab the preview is showing (for commands run while the preview has focus). */
  static currentDoc() {
    return Preview.current?.doc
  }

  private title() {
    return `StepLab: ${path.basename(this.doc.fileName)}`
  }

  setDocument(doc: vscode.TextDocument) {
    this.doc = doc
    this.panel.title = this.title()
    this.panel.webview.options = { enableScripts: true, localResourceRoots: this.roots() }
    this.panel.webview.html = this.html() // new <base> for relative image paths
    this.ready = false
  }

  private update() {
    if (!this.ready) return
    this.panel.webview.postMessage({ type: 'update', text: this.doc.getText(), fileName: this.doc.fileName })
  }

  /** Resolves once the preview has loaded and received the current text. */
  private whenReady(): Promise<void> {
    return this.ready ? Promise.resolve() : new Promise((r) => this.readyWaiters.push(r))
  }

  async exportHtml(): Promise<void> {
    await this.whenReady()
    if (Preview.current !== this) return
    return new Promise((resolve) => {
      // Never leave the progress spinning: give up after 30 seconds if the preview doesn't answer.
      const timer = setTimeout(() => {
        if (this.exportResolve) {
          this.exportResolve = undefined
          vscode.window.showErrorMessage('StepLab export timed out. Keep the preview open and try again.')
          resolve()
        }
      }, 30000)
      this.exportResolve = () => {
        clearTimeout(timer)
        resolve()
      }
      this.panel.webview.postMessage({ type: 'export' })
    })
  }

  private async onMessage(m: { type: string; html?: string; suggestedName?: string; message?: string; index?: number }) {
    if (m.type === 'ready') {
      this.ready = true
      this.update()
      this.readyWaiters.splice(0).forEach((r) => r())
    } else if (m.type === 'step' && typeof m.index === 'number') {
      // Clicking a step in the preview scrolls the editor to that heading.
      const steps = scanSteps(this.doc.getText())
      const s = steps[m.index]
      const editor = vscode.window.visibleTextEditors.find((e) => e.document === this.doc)
      if (s && editor) {
        const pos = new vscode.Position(s.line, 0)
        editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.AtTop)
      }
    } else if (m.type === 'exported' && m.html) {
      // The HTML is built: stop the "building HTML…" progress before asking where to save.
      this.exportResolve?.()
      this.exportResolve = undefined
      const base = this.doc.uri.scheme === 'file' ? path.dirname(this.doc.uri.fsPath) : undefined
      const target = await vscode.window.showSaveDialog({
        defaultUri: base ? vscode.Uri.file(path.join(base, m.suggestedName || 'lab.html')) : undefined,
        filters: { HTML: ['html'] },
        saveLabel: 'Export',
      })
      if (target) {
        await vscode.workspace.fs.writeFile(target, Buffer.from(m.html, 'utf8'))
        vscode.window.showInformationMessage(`Exported ${path.basename(target.fsPath)}`, 'Open in Browser').then((open) => {
          if (open) vscode.env.openExternal(target)
        })
      }
    } else if (m.type === 'notebook') {
      openLabNotebook(this.ctx, this.doc)
    } else if (m.type === 'exportError') {
      vscode.window.showErrorMessage(`StepLab export failed: ${m.message}`)
      this.exportResolve?.()
      this.exportResolve = undefined
    }
  }

  private html() {
    const w = this.panel.webview
    const asset = (f: string) => w.asWebviewUri(vscode.Uri.joinPath(this.ctx.extensionUri, 'dist', f))
    const nonce = [...Array(32)].map(() => Math.random().toString(36)[2]).join('')
    const docDir = this.doc.uri.scheme === 'file' ? w.asWebviewUri(vscode.Uri.file(path.dirname(this.doc.uri.fsPath))) : null
    const frames = [
      'https://www.youtube-nocookie.com',
      'https://docs.google.com',
      'https://onedrive.live.com',
      'https://*.sharepoint.com',
      'https://view.officeapps.live.com',
    ].join(' ')
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${w.cspSource} https: data: blob:; style-src ${w.cspSource} 'unsafe-inline'; font-src ${w.cspSource} data:; script-src 'nonce-${nonce}'; frame-src ${frames}; connect-src ${w.cspSource} https:;">
<meta name="viewport" content="width=device-width,initial-scale=1">
${docDir ? `<base href="${docDir}/">` : ''}
<link rel="stylesheet" href="${asset('webview.css')}">
<title>StepLab</title>
</head>
<body>
<div id="app"></div>
<script nonce="${nonce}" src="${asset('webview.js')}"></script>
</body>
</html>`
  }

  dispose() {
    this.exportResolve?.() // closing the preview mid-export ends the progress too
    this.exportResolve = undefined
    this.readyWaiters.splice(0).forEach((r) => r())
    Preview.current = undefined
    this.disposables.forEach((d) => d.dispose())
    this.panel.dispose()
  }
}

/* ---------- warnings in the editor ---------- */
function lint(doc: vscode.TextDocument, diagnostics: vscode.DiagnosticCollection) {
  if (!isLab(doc) || !vscode.workspace.getConfiguration('steplab').get('lint', true)) return
  const text = doc.getText()
  const steps = scanSteps(text)
  const out: vscode.Diagnostic[] = []
  const numbered = steps.filter((s) => s.num !== null)
  // Only lint files that look like StepLab labs
  if (!numbered.length) return diagnostics.set(doc.uri, [])

  const base = steps[0]?.num === 0 || steps[0]?.num === null ? 0 : 1
  steps.forEach((s, i) => {
    if (s.num !== null && s.num !== i + base) {
      const range = doc.lineAt(s.line).range
      const d = new vscode.Diagnostic(
        range,
        `"Step ${s.num}" is step ${i + base} in this file. StepLab shows steps in file order — renumber it to Step ${i + base}.`,
        vscode.DiagnosticSeverity.Warning,
      )
      d.source = 'StepLab'
      out.push(d)
    }
  })

  // Local images that don't exist (markdown images and slides blocks)
  if (doc.uri.scheme === 'file') {
    const dir = path.dirname(doc.uri.fsPath)
    const lines = text.split(/\r?\n/)
    let inSlides = false
    lines.forEach((l, i) => {
      if (/^\s*```\s*(slides|slide|deck)\s*$/i.test(l)) inSlides = true
      else if (inSlides && /^\s*```/.test(l)) inSlides = false
      const paths: { p: string; col: number }[] = []
      for (const m of l.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) paths.push({ p: m[1], col: m.index! + m[0].indexOf(m[1]) })
      if (inSlides) {
        const m = l.match(/^\s*(?:[-*]\s+)?([^\s|]+\.(?:png|jpe?g|gif|webp|svg|avif))/i)
        if (m) paths.push({ p: m[1], col: l.indexOf(m[1]) })
      }
      for (const { p, col } of paths) {
        if (/^(https?:|data:)/i.test(p)) continue
        const candidates = [path.resolve(dir, p), ...(vscode.workspace.workspaceFolders ?? []).flatMap((f) => [path.join(f.uri.fsPath, p), path.join(f.uri.fsPath, 'public', p)])]
        if (!candidates.some((c) => fs.existsSync(c))) {
          const d = new vscode.Diagnostic(
            new vscode.Range(i, col, i, col + p.length),
            `Image not found: ${p}`,
            vscode.DiagnosticSeverity.Warning,
          )
          d.source = 'StepLab'
          out.push(d)
        }
      }
    })
  }
  diagnostics.set(doc.uri, out)
}


/* ---------- CLaaT → StepLab ---------- */
/**
 * Converts a CLaaT codelab (its .md, an exported index.html, or the exported folder)
 * to name.steplab.md and returns where it was saved. Originals are never changed.
 * ifExists: 'ask' = Replace or cancel; 'reuse' = Replace or use the existing file.
 */
async function convertClaatAt(target: vscode.Uri | undefined, ifExists: 'ask' | 'reuse'): Promise<vscode.Uri | undefined> {
  let uri = target
  if (!uri) {
    const active = vscode.window.activeTextEditor?.document
    if (active && !active.isUntitled && /\.(md|html?)$/i.test(active.uri.fsPath)) uri = active.uri
  }
  if (!uri) {
    const picked = await vscode.window.showOpenDialog({
      canSelectMany: false,
      canSelectFolders: true,
      filters: { 'CLaaT codelab': ['md', 'html'] },
      title: 'Choose a CLaaT codelab: its .md file, or the exported folder / index.html',
    })
    if (!picked?.length) return
    uri = picked[0]
  }
  const stat = await vscode.workspace.fs.stat(uri)
  if (stat.type & vscode.FileType.Directory) uri = vscode.Uri.joinPath(uri, 'index.html')

  let text: string
  try {
    text = Buffer.from(await vscode.workspace.fs.readFile(uri)).toString('utf8')
  } catch {
    vscode.window.showErrorMessage(`Couldn't read ${uri.fsPath}.`)
    return
  }

  let converted: string
  let out: vscode.Uri
  if (/\.html?$/i.test(uri.fsPath)) {
    if (!isClaatHtml(text)) {
      vscode.window.showWarningMessage(`${path.basename(uri.fsPath)} isn't an exported CLaaT codelab.`)
      return
    }
    const folder = vscode.Uri.file(path.dirname(uri.fsPath))
    let json: string | undefined
    try {
      json = Buffer.from(await vscode.workspace.fs.readFile(vscode.Uri.joinPath(folder, 'codelab.json'))).toString('utf8')
    } catch {}
    converted = convertClaatHtml(text, json)
    let id = path.basename(folder.fsPath)
    try {
      id = JSON.parse(json ?? '{}').id || id
    } catch {}
    // Saved inside the exported folder, so its img/ paths keep working.
    out = vscode.Uri.joinPath(folder, `${id}.steplab.md`)
  } else {
    if (!looksLikeClaat(text)) {
      vscode.window.showWarningMessage(`${path.basename(uri.fsPath)} doesn't look like a CLaaT codelab.`)
      return
    }
    converted = convertClaat(text)
    out = vscode.Uri.file(uri.fsPath.replace(/\.md$/i, '') + '.steplab.md')
  }

  let exists = false
  try {
    await vscode.workspace.fs.stat(out)
    exists = true
  } catch {}
  if (exists) {
    const name = path.basename(out.fsPath)
    if (ifExists === 'reuse') {
      const pick = await vscode.window.showWarningMessage(
        `${name} already exists (you may have edited it). Use it as it is, or convert again from CLaaT?`,
        { modal: true },
        'Use existing',
        'Convert again',
      )
      if (!pick) return
      if (pick === 'Use existing') return out
    } else {
      const ok = await vscode.window.showWarningMessage(`${name} already exists. Replace it?`, { modal: true }, 'Replace')
      if (ok !== 'Replace') return
    }
  }
  await vscode.workspace.fs.writeFile(out, Buffer.from(converted, 'utf8'))
  return out
}

/* ---------- lab notebook → open and run it in the editor ---------- */
const NOTEBOOK_MAX_BYTES = 25 * 1024 * 1024
const COLAB_EXTENSION = 'google.colab'
const COLAB_TIP_OFF = 'steplab.colabTipOff'

/**
 * Downloads a public GitHub notebook (https only, size-capped, 30 s timeout).
 * Uses Node's https module rather than fetch so the editor's proxy settings apply.
 */
function download(url: string, redirects = 3): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'StepLab-VSCode' }, timeout: 30000 }, (res) => {
      const status = res.statusCode ?? 0
      if (status >= 300 && status < 400 && res.headers.location) {
        res.resume()
        const next = new URL(res.headers.location, url)
        if (next.protocol !== 'https:' || redirects <= 0) return reject(new Error('GitHub sent an unexpected redirect.'))
        return resolve(download(next.toString(), redirects - 1))
      }
      if (status !== 200) {
        res.resume()
        return reject(new Error(status === 404 ? 'GitHub says the notebook was not found (404). Check the link, and that the repository is public.' : `GitHub answered ${status}.`))
      }
      const chunks: Buffer[] = []
      let size = 0
      res.on('data', (c: Buffer) => {
        size += c.length
        if (size > NOTEBOOK_MAX_BYTES) {
          req.destroy()
          reject(new Error('The notebook is larger than 25 MB. Open it in Colab in the browser instead.'))
        } else chunks.push(c)
      })
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    })
    req.on('timeout', () => req.destroy(new Error('The download timed out. Check your internet connection and try again.')))
    req.on('error', reject)
  })
}

async function exists(uri: vscode.Uri) {
  try {
    await vscode.workspace.fs.stat(uri)
    return true
  } catch {
    return false
  }
}

/**
 * The lab's `colab:` notebook, opened in the editor:
 * saved as notebooks/<name>.ipynb next to the lab, never replacing a copy without asking.
 * Drive notebooks need a Google sign-in, so those open in Colab in the browser.
 */
async function openLabNotebook(ctx: vscode.ExtensionContext, doc: vscode.TextDocument) {
  const colab = readColab(readFrontMatter(doc.getText()).colab)
  if (!colab) {
    vscode.window.showInformationMessage('This lab has no notebook. Add a `colab:` line with a GitHub .ipynb link to its front matter.')
    return
  }
  const nb = labNotebook(colab)
  if (!nb) {
    const pick = await vscode.window.showInformationMessage(
      'This notebook is on Google Drive, so it opens in Colab in your browser. (Put the notebook on GitHub to open it here too.)',
      'Open in Colab',
    )
    if (pick) vscode.env.openExternal(vscode.Uri.parse(colab.url))
    return
  }

  let target: vscode.Uri
  if (doc.uri.scheme === 'file') {
    target = vscode.Uri.joinPath(vscode.Uri.file(path.dirname(doc.uri.fsPath)), 'notebooks', nb.name)
  } else {
    // Unsaved lab: ask where to put the notebook.
    const folder = vscode.workspace.workspaceFolders?.[0]?.uri
    const picked = await vscode.window.showSaveDialog({
      defaultUri: folder ? vscode.Uri.joinPath(folder, 'notebooks', nb.name) : undefined,
      filters: { 'Jupyter notebook': ['ipynb'] },
      saveLabel: 'Save notebook',
    })
    if (!picked) return
    target = picked
  }

  const shown = vscode.workspace.asRelativePath(target)
  let fetchFresh = true
  if (await exists(target)) {
    const pick = await vscode.window.showWarningMessage(
      `${shown} already exists and may have your changes. Open your copy, or replace it with a fresh copy from GitHub?`,
      { modal: true },
      'Open my copy',
      'Replace with fresh copy',
    )
    if (!pick) return
    fetchFresh = pick === 'Replace with fresh copy'
  }

  if (fetchFresh) {
    try {
      const bytes = await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: `StepLab: downloading ${nb.name}…` },
        () => download(nb.raw),
      )
      if (!looksLikeNotebook(bytes.toString('utf8'))) throw new Error("The file at that link isn't a Jupyter notebook.")
      await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(target, '..'))
      await vscode.workspace.fs.writeFile(target, bytes)
    } catch (err) {
      const pick = await vscode.window.showErrorMessage(
        `Couldn't download the notebook. ${err instanceof Error ? err.message : String(err)}`,
        'Open in Colab instead',
      )
      if (pick) vscode.env.openExternal(vscode.Uri.parse(colab.url))
      return
    }
  }

  try {
    const notebook = await vscode.workspace.openNotebookDocument(target)
    await vscode.window.showNotebookDocument(notebook, { viewColumn: vscode.ViewColumn.Active })
  } catch {
    await vscode.commands.executeCommand('vscode.open', target)
  }
  if (fetchFresh) vscode.window.setStatusBarMessage(`StepLab: saved ${shown}`, 5000)
  suggestColabExtension(ctx)
}

/** A one-time tip: Google's Colab extension runs notebooks on Colab's servers. Never required. */
async function suggestColabExtension(ctx: vscode.ExtensionContext) {
  if (vscode.extensions.getExtension(COLAB_EXTENSION) || ctx.globalState.get(COLAB_TIP_OFF)) return
  const pick = await vscode.window.showInformationMessage(
    "Tip: Google's Colab extension runs this notebook on Colab's servers (sign in with Google). Any other Jupyter kernel works too.",
    'Show Colab extension',
    "Don't show again",
  )
  if (pick === "Don't show again") await ctx.globalState.update(COLAB_TIP_OFF, true)
  else if (pick) {
    try {
      await vscode.commands.executeCommand('extension.open', COLAB_EXTENSION)
    } catch {
      await vscode.commands.executeCommand('workbench.extensions.search', COLAB_EXTENSION)
    }
  }
}

/* ---------- step outline (Ctrl/Cmd+Shift+O and the Outline view) ---------- */
class StepSymbols implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(doc: vscode.TextDocument) {
    const steps = scanSteps(doc.getText())
    return steps.map((s, i) => {
      const end = i + 1 < steps.length ? steps[i + 1].line - 1 : doc.lineCount - 1
      const range = new vscode.Range(s.line, 0, end, doc.lineAt(end).text.length)
      const label = `Step ${s.num ?? 0}: ${s.title}`
      return new vscode.DocumentSymbol(label, '', vscode.SymbolKind.Event, range, doc.lineAt(s.line).range)
    })
  }
}

export function activate(ctx: vscode.ExtensionContext) {
  const diagnostics = vscode.languages.createDiagnosticCollection('steplab')
  ctx.subscriptions.push(diagnostics)

  const activeLab = () => {
    const ed = vscode.window.activeTextEditor
    if (ed && isLab(ed.document)) return ed.document
    return undefined
  }

  ctx.subscriptions.push(
    vscode.commands.registerCommand('steplab.openPreview', () => {
      const doc = activeLab()
      if (!doc) return vscode.window.showInformationMessage('Open a markdown (.md) lab file first.')
      Preview.show(ctx, doc)
    }),

    vscode.commands.registerCommand('steplab.exportHtml', async () => {
      const doc = activeLab()
      if (!doc && !Preview.current) return vscode.window.showInformationMessage('Open a markdown (.md) lab file first.')
      const p = doc ? Preview.show(ctx, doc) : Preview.current!
      await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'StepLab: building HTML…' }, () => p.exportHtml())
    }),

    vscode.commands.registerCommand('steplab.newLab', async () => {
      const file = vscode.Uri.joinPath(ctx.extensionUri, 'media', 'template.md')
      const bytes = await vscode.workspace.fs.readFile(file)
      const doc = await vscode.workspace.openTextDocument({ language: 'markdown', content: Buffer.from(bytes).toString('utf8') })
      await vscode.window.showTextDocument(doc)
      Preview.show(ctx, doc)
    }),

    vscode.commands.registerCommand('steplab.insertStep', async () => {
      const ed = vscode.window.activeTextEditor
      if (!ed || !isLab(ed.document)) return
      const before = ed.document.getText(new vscode.Range(new vscode.Position(0, 0), ed.selection.active))
      const prev = scanSteps(before).filter((s) => s.num !== null)
      const next = prev.length ? (prev[prev.length - 1].num as number) + 1 : 1
      await ed.insertSnippet(new vscode.SnippetString(`## Step ${next}: \${1:Title}\nDuration: \${2:5}\n\n$0\n`))
    }),

    vscode.commands.registerCommand('steplab.importClaat', async (target?: vscode.Uri) => {
      const out = await convertClaatAt(target, 'ask')
      if (!out) return
      const doc = await vscode.workspace.openTextDocument(out)
      await vscode.window.showTextDocument(doc)
      Preview.show(ctx, doc)
      vscode.window.showInformationMessage(`Converted to StepLab: ${path.basename(out.fsPath)}. Your original files are unchanged.`)
    }),

    // One step: CLaaT codelab → StepLab page (.html). The .steplab.md is kept next to it for later edits.
    vscode.commands.registerCommand('steplab.exportClaatHtml', async (target?: vscode.Uri) => {
      const out = await convertClaatAt(target, 'reuse')
      if (!out) return
      const doc = await vscode.workspace.openTextDocument(out)
      const preview = Preview.show(ctx, doc)
      await vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'StepLab: converting and building HTML…' },
        () => preview.exportHtml(),
      )
    }),

    vscode.commands.registerCommand('steplab.openNotebook', () => {
      const doc = activeLab() ?? Preview.currentDoc()
      if (!doc) return vscode.window.showInformationMessage('Open a markdown (.md) lab file first.')
      return openLabNotebook(ctx, doc)
    }),

    vscode.languages.registerDocumentSymbolProvider({ language: 'markdown' }, new StepSymbols()),
    vscode.workspace.onDidOpenTextDocument((d) => {
      lint(d, diagnostics)
      offerClaatImport(d)
    }),
    vscode.workspace.onDidChangeTextDocument((e) => lint(e.document, diagnostics)),
    vscode.workspace.onDidCloseTextDocument((d) => diagnostics.delete(d.uri)),
  )
  vscode.workspace.textDocuments.forEach((d) => {
    lint(d, diagnostics)
    offerClaatImport(d)
  })
}

// Offer the conversion once per file per session when a CLaaT codelab is opened.
const offered = new Set<string>()
async function offerClaatImport(doc: vscode.TextDocument) {
  if (doc.uri.scheme !== 'file' || offered.has(doc.uri.toString())) return
  const isMd = doc.languageId === 'markdown' && looksLikeClaat(doc.getText())
  const isHtml = doc.languageId === 'html' && isClaatHtml(doc.getText())
  if (!isMd && !isHtml) return
  offered.add(doc.uri.toString())
  const choice = await vscode.window.showInformationMessage(
    `${path.basename(doc.uri.fsPath)} looks like a CLaaT codelab. Convert it to StepLab? (Your original stays as it is.)`,
    'StepLab HTML',
    'Editable .md',
    'Not now',
  )
  if (choice === 'StepLab HTML') vscode.commands.executeCommand('steplab.exportClaatHtml', doc.uri)
  else if (choice === 'Editable .md') vscode.commands.executeCommand('steplab.importClaat', doc.uri)
}

export function deactivate() {}
