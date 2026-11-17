/** Friendly addresses for built-in labs: /sample-template and /sample. */
export const ROUTES = ['sample-template', 'sample'] as const
export type Route = (typeof ROUTES)[number]

const last = () => location.pathname.split('/').pop() || ''

/** The folder StepLab lives in: "/" locally, "/steplab/" on deepasubramanian.dev */
export function appRoot(): string {
  const p = location.pathname
  const seg = last()
  if ((ROUTES as readonly string[]).includes(seg) || seg === 'index.html') return p.slice(0, p.length - seg.length)
  return p.endsWith('/') ? p : p.slice(0, p.lastIndexOf('/') + 1)
}

export const currentRoute = (): Route | null => ((ROUTES as readonly string[]).includes(last()) ? (last() as Route) : null)

/** Updates the address bar without reloading. Step 1 has no #step-1; later steps add #step-N. */
export function setAddress(route: Route | null, keepSearch = false) {
  const url = appRoot() + (route ?? '') + (keepSearch ? location.search : '')
  try {
    history.replaceState(null, '', url)
  } catch {
    /* some embedded previews don't allow address changes */
  }
}
