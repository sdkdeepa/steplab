import * as vscode from 'vscode'
import * as fs from 'node:fs'
import * as path from 'node:path'

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
  private exportResolve: ((v: void) => void) | null = null

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

  exportHtml(): Promise<void> {
    return new Promise((resolve) => {
      this.exportResolve = resolve
      this.panel.webview.postMessage({ type: 'export' })
    })
  }

  private async onMessage(m: { type: string; html?: string; suggestedName?: string; message?: string; index?: number }) {
    if (m.type === 'ready') {
      this.ready = true
      this.update()
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
      const base = this.doc.uri.scheme === 'file' ? path.dirname(this.doc.uri.fsPath) : undefined
      const target = await vscode.window.showSaveDialog({
        defaultUri: base ? vscode.Uri.file(path.join(base, m.suggestedName || 'lab.html')) : undefined,
        filters: { HTML: ['html'] },
        saveLabel: 'Export',
      })
      if (target) {
        await vscode.workspace.fs.writeFile(target, Buffer.from(m.html, 'utf8'))
        const open = await vscode.window.showInformationMessage(`Exported ${path.basename(target.fsPath)}`, 'Open in Browser')
        if (open) vscode.env.openExternal(target)
      }
      this.exportResolve?.()
    } else if (m.type === 'exportError') {
      vscode.window.showErrorMessage(`StepLab export failed: ${m.message}`)
      this.exportResolve?.()
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
      // give a freshly opened panel a moment to load
      await new Promise((r) => setTimeout(r, 400))
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

    vscode.languages.registerDocumentSymbolProvider({ language: 'markdown' }, new StepSymbols()),
    vscode.workspace.onDidOpenTextDocument((d) => lint(d, diagnostics)),
    vscode.workspace.onDidChangeTextDocument((e) => lint(e.document, diagnostics)),
    vscode.workspace.onDidCloseTextDocument((d) => diagnostics.delete(d.uri)),
  )
  vscode.workspace.textDocuments.forEach((d) => lint(d, diagnostics))
}

export function deactivate() {}
