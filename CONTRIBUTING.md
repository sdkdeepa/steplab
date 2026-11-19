# Contributing to StepLab

Thanks for helping make StepLab better. StepLab is used by workshop hosts, DevRel teams and teachers, and the extension has hundreds of installs, so every change is reviewed before it ships.

## The one rule

**Nothing reaches `main` without the maintainer's approval.**

- `main` is protected. You can't push to it directly, even with write access.
- Every change goes through a pull request (PR).
- Every PR needs an approving review from the code owner, [@sdkdeepa](https://github.com/sdkdeepa), and all checks must pass.
- Release tags (`v1.2.3`) can only be created by the maintainer. Tags publish the Docker image, so they're protected too.

## Ways to help

- **Report a bug:** open an issue with what you did, what you expected and what happened. Add the lab `.md` file if you can, and your browser or editor version.
- **Suggest a feature:** open an issue first and describe the problem it solves. Please wait for a reply before writing code, so your time isn't wasted on something that won't be merged.
- **Add a lab:** new labs in `public/labs/` are always welcome.
- **Fix a bug or improve the docs:** small, focused PRs are the easiest to review.

**Security problems:** please don't open a public issue. See [SECURITY.md](SECURITY.md).

## Set up

You need Node.js 22 or newer and Git.

```bash
git clone https://github.com/YOUR-NAME/steplab.git    # your fork
cd steplab
npm ci
npm run dev                                          # opens the website at localhost:5173
```

The extension lives in `extension/` and has its own packages:

```bash
cd extension
npm ci
npm run build
```

Docker is optional. See "Run it with Docker" in the [README](README.md).

## Make your change

1. **Fork** the repo and create a branch from `main` with a short, clear name, for example `fix/copy-button-safari` or `lab/flutter-basics`.
2. **Keep it focused:** one bug or one feature per PR. Unrelated cleanups go in their own PR.
3. **Match the existing style:** TypeScript, small functions, no new dependencies unless they're needed. If you add one, explain why in the PR.
4. **Add or update tests** for anything in `src/lib/`. The parser and converters are the core of StepLab, and tests keep them safe.
5. **Update the docs** when behavior changes: `README.md`, the templates (`src/labs/template.md`, `public/labs/template.md`, `extension/media/template.md`) and `extension/README.md` if the extension is affected.

## Check before you open a PR

Run these from the repo root. The same checks run automatically on every PR, and a PR can't be merged until they pass.

```bash
npm test               # all tests pass
npm run build          # the website builds
cd extension && npm run build && cd ..   # the extension builds
```

Then test by hand:

- [ ] Open the sample lab and a lab you wrote. Next, Back and copy buttons work.
- [ ] Check at **phone width** (about 390 px) and on desktop.
- [ ] Check **light and dark** themes.
- [ ] **Download HTML** and open the file. It still works offline.
- [ ] If you changed the extension: run `npm run package` in `extension/`, install the `.vsix` and try the preview.
- [ ] If you changed `Dockerfile` or `docker/`: `docker buildx build -t steplab .` and run it.

## Open the pull request

- Target the `main` branch.
- Fill in the PR template: what changed, why, and how you tested it. Screenshots help for anything visual.
- Link the issue it fixes, for example `Fixes #12`.
- Keep the PR up to date with `main` if asked.

The maintainer reviews PRs as time allows. Changes may be requested before approval. Please be patient, and feel free to leave a polite reminder after a week.

## Versions and releases (maintainer only)

StepLab uses **one shared version line**. Every release gets the next version number, and each part is published only when it changed.

| Part | Version lives in | Published |
|---|---|---|
| Website | `package.json` | every release (automatic on merge to `main`) |
| Docker image | the git tag `vX.Y.Z` | every release (automatic on the tag) |
| Extension | `extension/package.json` | only when `extension/` changed |

So the website and Docker image go 0.1.4 → 0.1.5 → 0.1.6, while the extension might go 0.1.4 → 0.1.6, skipping 0.1.5 because it didn't change. Skipped numbers are fine: the stores only need each new version to be higher than the last.

1. Bump `version` in `package.json` to the new number.
2. **If `extension/` changed:** set the same number in `extension/package.json` and add a section to `extension/CHANGELOG.md`. If it didn't change, leave both alone.
3. Merge to `main`. GitHub Pages deploys the website automatically.
4. Tag the release: `git tag vX.Y.Z && git push origin vX.Y.Z`. This publishes the Docker image to `ghcr.io/sdkdeepa/steplab`.
5. **Only if the extension changed:** run `npm run package` in `extension/` and publish the `.vsix` to Open VSX and the VS Code Marketplace (see `extension/PUBLISHING.md`).

Never reuse a version number. The stores and the image registry don't allow it.

## Never commit secrets

Don't commit tokens, passwords, `.env` files or personal notes. Store and API tokens are passwords. If one ever leaks, delete it right away and create a new one.

## Be kind

Be respectful and assume good intent. Harassment or personal attacks aren't tolerated, and the maintainer may close issues, PRs or comments that break this.

## License

By contributing, you agree that your contribution is licensed under the [MIT License](LICENSE), the same as StepLab.