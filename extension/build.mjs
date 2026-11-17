import * as esbuild from 'esbuild'
const watch = process.argv.includes('--watch')
const common = { bundle: true, minify: !watch, sourcemap: watch, logLevel: 'info' }
const ctxs = await Promise.all([
  // Runs in the editor (Node)
  esbuild.context({ ...common, entryPoints: ['src/extension.ts'], outfile: 'dist/extension.js', platform: 'node', format: 'cjs', target: 'node18', external: ['vscode'] }),
  // Runs in the preview panel (browser). Shares the web app's src/lib.
  esbuild.context({
    ...common,
    entryPoints: { webview: 'src/webview.ts' },
    outdir: 'dist',
    platform: 'browser',
    format: 'iife',
    target: 'chrome114',
    loader: { '.svg': 'dataurl' },
  }),
])
if (watch) await Promise.all(ctxs.map((c) => c.watch()))
else {
  await Promise.all(ctxs.map((c) => c.rebuild()))
  await Promise.all(ctxs.map((c) => c.dispose()))
}
