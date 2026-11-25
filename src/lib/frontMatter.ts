/**
 * Reads a lab's front matter (the `---` block at the top).
 * Kept in its own small file so the editor extension can read it without loading the markdown renderer.
 */

/** "value   # a comment" -> "value", and strips surrounding quotes. */
export const cleanMetaValue = (v: string) => v.replace(/\s+#\s.*$/, '').trim().replace(/^["']|["']$/g, '')

/**
 * Splits a lab into its front matter values and the rest of the text.
 * Keys are lower-cased with spaces turned into "_" ("Copyright Position" -> "copyright_position").
 * Expects "\n" line endings (call it after normalizing).
 */
export function splitFrontMatter(text: string): { meta: Record<string, string>; body: string } {
  const meta: Record<string, string> = {}
  const fm = text.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!fm) return { meta, body: text }
  for (const row of fm[1].split('\n')) {
    const m = row.match(/^(\w+)\s*:\s*(.*)$/)
    if (m) meta[m[1].trim().toLowerCase().replace(/\s+/g, '_')] = cleanMetaValue(m[2])
  }
  return { meta, body: text.slice(fm[0].length) }
}

/** Front matter values from any lab text (any line endings). */
export function readFrontMatter(source: string): Record<string, string> {
  return splitFrontMatter(source.replace(/\r\n?/g, '\n').replace(/^﻿/, '')).meta
}
