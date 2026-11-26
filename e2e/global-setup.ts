import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const SAMPLES = fileURLToPath(new URL('./fixtures/', import.meta.url))

function fingerprint(dir: string, out = new Map<string, string>()) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) fingerprint(p, out)
    else out.set(relative(SAMPLES, p), createHash('sha256').update(readFileSync(p)).digest('hex'))
  }
  return out
}

/**
 * The master sample files in e2e/fixtures must never change during a run.
 * Fingerprints them before the tests, and fails the run if any was changed, added or removed.
 */
export default function globalSetup() {
  const before = fingerprint(SAMPLES)
  return () => {
    const after = fingerprint(SAMPLES)
    const changed = [...new Set([...before.keys(), ...after.keys()])].filter((k) => before.get(k) !== after.get(k))
    if (changed.length) throw new Error(`The tests changed master sample files in e2e/fixtures: ${changed.join(', ')}`)
  }
}
