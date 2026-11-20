import { useEffect, useMemo, useRef, useState } from 'react'
import { parseLab } from './lib/parser'
import { store } from './lib/storage'
import { Home } from './components/Home'
import { FormatPage } from './components/FormatPage'
import { Viewer } from './components/Viewer'
import template from './labs/template.md?raw'
import sample from './labs/example-steplab.md?raw'
import { currentRoute, setAddress, type Route } from './lib/routes'
import { readImages, type Assets } from './lib/assets'
import { prepareFiles } from './lib/importFiles'
import { UploadDialog } from './components/UploadDialog'

const KEY = 'steplab:source'

export default function App() {
  const saved = store.get(KEY)
  const [source, setSource] = useState<string | null>(() => {
    const route = currentRoute()
    if (route === 'sample-template') return template
    if (route === 'sample') return sample
    return location.hash.startsWith('#step-') ? saved : null
  })
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<'home' | 'format'>(() => (currentRoute() === 'format' ? 'format' : 'home'))
  const lab = useMemo(() => (source == null ? null : parseLab(source)), [source])
  const [upload, setUpload] = useState<{ files: File[]; error: string | null } | null>(null)
  const imageInput = useRef<HTMLInputElement>(null)
  const [assets, setAssets] = useState<Assets>({})

  // Hosted labs: /?lab=labs/my-lab.md
  useEffect(() => {
    const path = new URLSearchParams(location.search).get('lab')
    if (!path || !/^[\w\-./]+\.md$/.test(path) || path.includes('..')) return
    fetch(path)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then(setSource)
      .catch(() => setError(`Couldn't load ${path}.`))
  }, [])

  useEffect(() => {
    if (source != null) store.set(KEY, source)
  }, [source])

  const open = (md: string, name?: string) => {
    const parsed = parseLab(md)
    if (!parsed.steps.length) {
      setError(`${name ? `"${name}"` : 'That file'} has no steps. Start each step with a heading like "## Step 0: Overview" or "## Step 1: Set up".`)
      goHome()
      return
    }
    setError(null)
    setPage('home')
    const route: Route | null = md === template ? 'sample-template' : md === sample ? 'sample' : null
    setAddress(route)
    setSource(md)
    window.scrollTo({ top: 0 })
  }

  /** Opens a .md (+ images) or a StepLab .html download. Returns an error message, or null. */
  const openFiles = async (files: File[]): Promise<string | null> => {
    const r = await prepareFiles(files)
    if (!r.ok) return r.error
    setAssets(r.assets)
    setUpload(null)
    open(r.markdown, r.name)
    return null
  }

  /** Files dropped on the home page: open straight away, or show the pop-up with the problem. */
  const dropFiles = async (files: File[]) => {
    const err = await openFiles(files)
    if (err) setUpload({ files, error: err })
  }

  function goHome() {
    setAddress(null)
    document.title = 'StepLab'
    setPage('home')
    setSource(null)
    window.scrollTo({ top: 0 })
  }

  function goFormat() {
    setAddress('format')
    document.title = 'Lab format · StepLab'
    setPage('format')
    setSource(null)
    window.scrollTo({ top: 0 })
  }

  const nav = {
    onHome: goHome,
    onUpload: () => setUpload({ files: [], error: null }),
    onAddImages: () => imageInput.current?.click(),
    onTemplate: () => {
      setAssets({})
      open(template, 'template.md')
    },
    onFormat: goFormat,
  }

  return (
    <>
      {lab && source != null ? (
        <Viewer lab={lab} source={source} onSourceChange={setSource} nav={nav} assets={assets} onAddImages={nav.onAddImages} />
      ) : page === 'format' ? (
        <FormatPage onOpen={open} nav={nav} />
      ) : (
        <Home onOpen={open} onReadFiles={dropFiles} error={error} nav={nav} />
      )}
      {upload && (
        <UploadDialog
          initialFiles={upload.files}
          initialError={upload.error}
          onClose={() => setUpload(null)}
          onSubmit={openFiles}
        />
      )}
      <input
        ref={imageInput}
        type="file"
        multiple
        accept="image/*"
        hidden
        onChange={async (e) => {
          const more = await readImages(Array.from(e.target.files ?? []))
          setAssets((a) => ({ ...a, ...more }))
          e.target.value = ''
        }}
      />
    </>
  )
}
