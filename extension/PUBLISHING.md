# Publishing StepLab (VS Code + Antigravity IDE)

Antigravity IDE installs extensions from **Open VSX** (open-vsx.org). VS Code uses the **Visual Studio Marketplace**. Publish the same `.vsix` file to both stores. Neither has an app-store-style review queue.

## 0. Try it yourself first

Both VS Code and Antigravity IDE can install a `.vsix` file directly:
Extensions view → `…` menu → **Install from VSIX…** → pick `steplab-0.1.0.vsix`. In Antigravity IDE you can also drag the file into the Extensions pane.

Then open any `.md` lab and press ▶ in the editor title bar, or `Cmd/Ctrl+Alt+L`.

## 1. Before publishing

In `extension/package.json`:
- `publisher`: currently `sdkdeepa`. It must exactly match the publisher ID you create below.
- `repository` and `bugs`: replace `sdkdeepa` with your GitHub username or org.
- Bump `version` for every release (0.1.0 → 0.1.1 …) and add a line to `CHANGELOG.md`.

Then build the package:

```bash
cd extension
npm install
npm run package        # creates steplab-<version>.vsix
```

## 2. Open VSX (for Antigravity IDE), one-time setup

1. Create an account at **accounts.eclipse.org**, and put your **GitHub username** in the profile.
2. Go to **open-vsx.org**, log in with GitHub, then open your avatar → **Settings** → **Log in with Eclipse**.
3. On the same profile page, click **Show Publisher Agreement** and sign it. This is the *Publisher Agreement*, not the Eclipse Contributor Agreement. Publishing fails without it.
4. Go to **Settings → Access Tokens → Generate New Token** and copy it. It's shown only once.
5. Create your namespace. It must equal `publisher` in package.json:

   ```bash
   npx ovsx create-namespace sdkdeepa -p <OPEN_VSX_TOKEN>
   ```

   Optional: claim ownership of the namespace, so no one else can publish under it. See the Open VSX wiki page "Namespace Access".

### Publish

```bash
npx ovsx publish steplab-0.1.0.vsix -p <OPEN_VSX_TOKEN>
```

## 3. Visual Studio Marketplace (for VS Code), one-time setup

1. Sign in at **marketplace.visualstudio.com/manage** with a Microsoft account and create a publisher with ID `sdkdeepa`.
2. Either upload the `.vsix` on that page (**New extension → Visual Studio Code**), or publish from the terminal with an Azure DevOps Personal Access Token that has the **Marketplace → Manage** scope:

   ```bash
   npx vsce login sdkdeepa
   npx vsce publish --no-dependencies
   ```

## 4. Every release after that

```bash
npm version patch            # bumps version in package.json
npm run package
npx ovsx publish steplab-*.vsix -p <OPEN_VSX_TOKEN>
npx vsce publish --packagePath steplab-*.vsix
```

To automate releases, store the tokens as GitHub secrets (`OVSX_PAT`, `VSCE_PAT`) and run the same commands in a GitHub Action.
