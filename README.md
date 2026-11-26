# StepLab

Turn one markdown file into a step-by-step, Codelab-style tutorial, right in the browser.

Write `## Step 0`, `## Step 1`, `## Step 2`… and drop the file in. StepLab builds an interactive lab with a step timeline, progress bar, time left, copyable syntax-highlighted code, callouts, slides, videos, and a **Congratulations** pop-up with confetti at the end. Then **download the lab as one self-contained HTML file** and share or host it anywhere.

- **No server.** Everything runs in the browser, and files never leave your computer.
- **Simple stack.** React + TypeScript + Vite.
- **Free to host.** It's a static site, so it runs on Netlify's free plan, GitHub Pages or any static host.
- **Light and dark themes.** It follows the device setting until the visitor picks one, and downloaded labs have the toggle too.
- **Phone-friendly.** Swipe between steps, a full-screen editor, and downloads that work on phones.
- **Editor extension.** A live preview for VS Code and Antigravity IDE (see below).

> Inspired by Google's [codelabs tools](https://github.com/googlecodelabs/tools) (`claat`), which is no longer maintained. StepLab is a new, simpler project, not a fork.

## Quick start

```bash
git clone https://github.com/<you>/steplab.git
cd steplab
npm install
npm run dev        # open http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server with hot reload |
| `npm test` | Tests (Vitest) |
| `npm run build` | Static site in `dist/` (what Netlify runs) |
| `npm run build:single` | One self-contained `dist/index.html` |

## Make it yours (if you fork)

1. **`src/config.ts`:** set `CREATOR` (your name and LinkedIn URL, shown in the home page footer) and `STEPLAB_URL` (where "Made with StepLab" in downloaded labs links to, i.e. your hosted StepLab).
2. **`public/labs/`:** add your own labs, and replace or remove `example-steplab.md`.
3. **`LICENSE`:** keep the MIT license and its copyright line, and add your name if you make substantial changes.
4. **Extension (optional):** in `extension/package.json`, change `publisher`, `repository` and `bugs` to your own before publishing.

## Using StepLab

- **Start from a template** opens a lab that demonstrates every feature (`/sample-template`).
- **Try the sample lab** opens a short real example (`/sample`).
- **Format** shows every rule of the lab format, with an example and the mobile languages (`/format`).
- **Upload a markdown file** opens a pop-up with two tabs: **StepLab lab** and **Old CLaaT codelab**. Drag in your `.md` file **and its images** together, or browse for them. Labs downloaded from StepLab (`.html`) can be uploaded too, and they reopen for editing with their images.
- **Edit** shows the markdown beside the lab with a live preview, and **Save .md** downloads it.
- **Download HTML** saves one self-contained file, with images packed in.

### Use it as a desktop app (works offline)

On a computer, StepLab can be installed as an app and works without the internet after your first visit.

- **Install:** in Chrome or Edge, click **Install app** at the top of StepLab, or the install icon in the address bar. In Safari on a Mac, choose **File → Add to Dock**.
- **Offline:** writing, previewing, uploading and **Download HTML** all work. **Launch sandbox**, **Open in Colab** and videos still need the internet, and StepLab tells you when you're offline.
- **Updates:** when a new version is out, StepLab shows **A new version of StepLab is ready** with a **Reload** button.
- **Private as before:** only StepLab itself is saved for offline use. Your labs and images are never stored or sent anywhere.
- **Phones and tablets** use StepLab as a normal website, with no install and no offline copy.
- **Something stuck?** Open StepLab with `?reset` at the end of the address (for example `https://steplab.dev/?reset`). It removes the offline copy and loads the latest version.

## Writing a lab

~~~markdown
---
title: Build your first chatbot
author: Your Name
---

## Step 0: Overview
Duration: 2

What you'll build and what you need.

## Step 1: Set up your environment
Duration: 5

```bash
pip install flask
```

> Warning: Never commit your API key.
~~~

- A step starts at any `#`, `##` or `###` heading that begins with `Step <number>`. `## Step 1: Title`, `# Step 2 - Title`, `### STEP 3. Title` and `## Step 4 · Title` all work.
- **Step 0:** start with `## Step 0: Overview` (or `## Step 0: Introduction`). A plain `## Overview` before Step 1 also becomes Step 0.
- `Duration:` on the line right under a step heading sets its length: minutes (`5`, `5 min`) or minutes:seconds (`5:00`).
- Callouts: quotes starting with `Note:`, `Tip:` or `Warning:`, or `> aside positive` / `> aside negative`.
- Step headings inside code blocks are ignored.
- Link to another step with `[see Step 3](#step-3)`.

### Images

```markdown
![What the image shows](images/screenshot.png "Optional caption")
```

Use full `https://` links, or upload the images together with the `.md`. When hosting, put images in `public/labs/images/`.

### Slides (Keynote, PowerPoint, Google Slides)

Image slides get arrow buttons, thumbnails, swipe, arrow keys and full screen:

~~~markdown
```slides
title: My talk
labs/images/slide-1.png | Optional caption
labs/images/slide-2.png
```
~~~

Export slides as images first. In Keynote: File → Export To → Images. In PowerPoint: File → Save As/Export → PNG.

For a live Google Slides or PowerPoint embed, paste the published link instead. The deck then uses its own built-in arrows.

~~~markdown
```slides
https://docs.google.com/presentation/d/e/YOUR-PUBLISHED-ID/pub
```
~~~

### YouTube

A clickable preview card (also works in GitHub READMEs):

```markdown
[![Video title](https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg)](https://youtu.be/VIDEO_ID)
```

Or a player inside the step: a YouTube link on its own line, or a block with a title and start time:

~~~markdown
https://youtu.be/VIDEO_ID

```youtube
title: Intro video
https://www.youtube.com/watch?v=VIDEO_ID&t=90s
```
~~~

### Copyright line

~~~yaml
---
author: Jane Doe                                   # your name
linkedin: https://www.linkedin.com/in/jane-doe    # shown as linkedin.com/in/jane-doe
copyright: © {year} {author}. All rights reserved. # or: none
copyright_position: both                           # top, bottom or both
---
~~~

### Sandbox (GitHub Codespaces)

Give attendees a ready-to-use coding environment in their browser, with nothing to install. Add one line to the front matter:

~~~yaml
---
sandbox: your-name/your-sandbox-repo   # a GitHub repo with a .devcontainer folder
---
~~~

StepLab then shows a **Launch sandbox** button under the lab title, in the website, the downloaded HTML and the editor preview. It opens the repo in GitHub Codespaces, on the attendee's own free monthly hours.

To make the sandbox repo:

1. Create a public GitHub repo with the starter files for your lab.
2. Add `.devcontainer/devcontainer.json` with the tools the lab needs (for example a Node.js or Python image). On GitHub: **Code → Codespaces → ⋯ → Configure dev container**.
3. Test it: open `https://codespaces.new/your-name/your-sandbox-repo?quickstart=1` in a private window and follow your lab.

Example: [sdkdeepa/steplab-sandbox-node-api](https://github.com/sdkdeepa/steplab-sandbox-node-api), a 25-minute Node.js API lab with a `npm run check` script that checks each step. It's also the lab behind **Try a sandbox lab** on the home page.

### Notebook (Google Colab)

For Python, data and AI labs, give attendees a notebook they can run in the browser, free, with just a Google account. Add one line to the front matter:

~~~yaml
---
colab: https://github.com/your-name/your-repo/blob/main/notebooks/lab.ipynb
---
~~~

StepLab shows an **Open in Colab** button under the lab title (next to **Launch sandbox** if the lab has both), in the website, the downloaded HTML and the editor preview. Each attendee gets their own editable copy, so your notebook never changes.

These links work:

- A notebook on GitHub: `https://github.com/your-name/your-repo/blob/main/path/lab.ipynb` (the repo must be public)
- A Colab link: `https://colab.research.google.com/github/...` or `https://colab.research.google.com/drive/FILE_ID`
- A notebook in Google Drive: `https://drive.google.com/file/d/FILE_ID/view` (share it with **Anyone with the link**)

**In VS Code or Antigravity IDE:** if the notebook is on GitHub, the StepLab preview also shows **Open in editor**. It saves a copy as `notebooks/<name>.ipynb` next to your lab and opens it in the editor (it asks before replacing a copy you already have). To run it on Colab's free servers, install Google's [Colab extension](https://marketplace.visualstudio.com/items?itemName=google.colab) (also on Open VSX) and pick **Colab** as the kernel. Any other Jupyter kernel works too. Drive notebooks open in Colab in the browser.

> Note: A notebook running on a Colab server can't read files on your computer. If the lab needs data files, load them from a URL in the notebook, or upload them in Colab.

> Tip: Add a last step that reminds attendees to stop their codespace at [github.com/codespaces](https://github.com/codespaces) so it stops using their free hours.

See [`public/labs/template.md`](public/labs/template.md) for every feature, and [`public/labs/example-steplab.md`](public/labs/example-steplab.md) for a short real lab.

> Embedded videos and slides need an internet connection, and they play best when the lab is served from a website. Opened straight from your disk, some browsers block YouTube embeds.

## Host it (Netlify, free)

This repo includes a `netlify.toml`, so Netlify knows how to build it.

1. In Netlify, choose **Add new site → Import an existing project**, then pick your fork. Leave the build settings as they are.
2. You get an address like `your-steplab.netlify.app`. Add your own domain under **Domain management** if you like.

### Serve it from a folder on an existing Netlify site (e.g. `yourdomain.com/steplab`)

In your **main site's** `_redirects` file, add these lines **above** any `/*  /index.html  200` catch-all line:

```
/steplab    /steplab/    301!
/steplab/*  https://your-steplab.netlify.app/:splat  200!
```

The first line adds the trailing slash StepLab needs to find its files. The second serves StepLab under your domain. Both sites must be in the same Netlify team.

### Addresses

- `/sample-template` opens the feature template, `/sample` opens the sample lab, and `/format` opens the format guide.
- Step 1 has a clean address. Later steps add `#step-2`, `#step-3`, and so on.
- `netlify.toml` includes the rule that makes these addresses work when opened or refreshed. On other hosts, add an equivalent "serve `index.html` for unknown paths" rule.

### Hosting a downloaded lab

A downloaded lab is one HTML file, so any static host works (GitHub Pages, Netlify, your own site).

- **Rename it to `index.html` on your computer before uploading.** Then the site's main address opens the lab. Don't rename it with GitHub's ✏️ web editor: it can't load large files and saves them empty.
- **On GitHub Pages:** upload `index.html` to a public repo, then **Settings → Pages → Deploy from a branch → `main` / root**.
- **Keep images small.** Images are packed into the file, so resize big screenshots (about 1600px wide, or JPG/WebP) to keep the lab fast on phones.

### Moving from Google CLaaT

Have old CLaaT codelabs? StepLab converts both the `.md` you wrote and the folder `claat export` made (`index.html`, `codelab.json`, `img/`). Your original files are never changed.

- **On the website:** click **Upload a markdown file**, choose the **Old CLaaT codelab** tab, and pick or drag in the exported folder. It opens as a StepLab lab, ready to **Download HTML** or **Save .md**.
- **In VS Code / Antigravity IDE:** right-click the folder's `index.html` (or a CLaaT `.md`) and choose **Convert CLaaT Codelab to StepLab HTML** for the finished page in one step, or **Convert CLaaT Codelab to StepLab** for an editable `.steplab.md`. StepLab also offers both when you open a CLaaT codelab.

### Sharing a lab

Put `.md` files in `public/labs/` and share links like:

```
https://yourdomain.com/steplab/?lab=labs/my-workshop.md
https://yourdomain.com/steplab/?lab=labs/my-workshop.md#step-3
```

## Run it with Docker

Run StepLab on your own computer or server, for example behind a company firewall or at a workshop with poor Wi-Fi. The image is the built website served by nginx on port 8080. No database, no backend.

You need [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Mac or Windows) or Docker Engine (Linux). Open a terminal in the `steplab` folder.

> Tip: Before you start, open Docker Desktop and install any update it offers (**Check for updates** in its menu), then restart it. An outdated Docker Desktop makes the build fail. If you see "Cannot connect to the Docker daemon," Docker Desktop isn't running yet: open it and wait until it says it's running.

### Quickest: use the published image

No build needed. The same on every system:

```
docker run --rm -p 8080:8080 ghcr.io/sdkdeepa/steplab
```

Docker downloads StepLab the first time, then it opens at [localhost:8080](http://localhost:8080). It works on Intel and Apple Silicon Macs, Windows and Linux. To add your own labs, use the commands in step 3 below and replace `steplab` at the end with `ghcr.io/sdkdeepa/steplab`. To get a newer version later, run `docker pull ghcr.io/sdkdeepa/steplab`.

Prefer a fixed version? Use a version tag, for example `ghcr.io/sdkdeepa/steplab:0.1.4`.

### Or build it yourself

Use this if you changed StepLab's code, or forked it.

### 1. Build the image

The same on every system:

```
docker buildx build -t steplab .
```

Don't forget the `.` at the end: it tells Docker to build from this folder. The first build takes a few minutes. It runs the tests, so a broken build never makes an image. When it finishes, Docker prints a "View build details" link that opens the build in Docker Desktop.

### 2. Run StepLab

The same on every system:

```
docker run --rm -p 8080:8080 steplab
```

Open [localhost:8080](http://localhost:8080). Press **Ctrl+C** in the terminal to stop it.

### 3. Add your own labs (optional)

Put your labs in a folder named `my-labs` inside the `steplab` folder, then run the command for your system. Each command is one line.

**Mac or Linux** (Terminal, zsh or bash)

```bash
docker run --rm -p 8080:8080 -v "$PWD/my-labs:/usr/share/nginx/html/my-labs:ro" steplab
```

**Windows, PowerShell** (the default in Windows Terminal)

```powershell
docker run --rm -p 8080:8080 -v "${PWD}\my-labs:/usr/share/nginx/html/my-labs:ro" steplab
```

**Windows, Command Prompt**

```bat
docker run --rm -p 8080:8080 -v "%cd%\my-labs:/usr/share/nginx/html/my-labs:ro" steplab
```

**Windows, Git Bash**

```bash
MSYS_NO_PATHCONV=1 docker run --rm -p 8080:8080 -v "$(pwd -W)/my-labs:/usr/share/nginx/html/my-labs:ro" steplab
```

Then open a lab by its file name:

```
http://localhost:8080/?lab=my-labs/your-lab.md
```

Edit the lab, save, click `Done` and then refresh the page. The change shows with no rebuild. If a change doesn't show up on Windows, stop and start the container.

> Tip: In labs opened this way, image paths start from the site, not from the lab file. Write `![Login screen](my-labs/images/login.png)`, not `images/login.png`.

**Good to know**

- **Windows:** keep Docker Desktop on **Linux containers** (the default). StepLab's image is a Linux image.
- **Another port:** change the first number, for example `-p 3000:8080`, then open `localhost:3000`.
- **Desktop app and offline use** work at `http://localhost:8080`, including when Docker runs inside a virtual machine and you open the browser in that machine. From another computer, `http://<machine address>:8080` works as a normal website without install or offline, because browsers only allow offline apps on HTTPS or `localhost`. For the full app there, either put an HTTPS reverse proxy (such as Caddy, nginx or Traefik) in front of port 8080, or open an SSH tunnel and use `localhost`: `ssh -L 8080:localhost:8080 you@machine-address`.
- **Labs with a sandbox** keep their **Launch sandbox** button. The sandbox itself still runs in GitHub Codespaces.
- **Forks** publish their own image: push a version tag (for example `git tag v1.0.0 && git push origin v1.0.0`) and `.github/workflows/docker.yml` builds `ghcr.io/your-name/steplab`. Then make the package public under **your profile → Packages → steplab → Package settings**.

## VS Code and Antigravity IDE extension

`extension/` holds the StepLab editor extension: a live preview beside your markdown, Export as HTML, snippets (`step`, `step0`, `slides`, `youtube`…) and warnings for out-of-order steps and missing images. It reuses `src/lib`, so the preview matches the website.

```bash
cd extension
npm install
npm run package      # builds steplab-<version>.vsix
```

Install the `.vsix` with Extensions → `…` → **Install from VSIX**. To publish to Open VSX (used by Antigravity IDE) and the VS Code Marketplace, see [`extension/PUBLISHING.md`](extension/PUBLISHING.md).

## Project structure

```
src/
  config.ts                  Your name, LinkedIn and StepLab URL (edit when forking)
  labs/                      Built-in template, example lab and the sandbox demo lab
  lib/parser.ts              Step parsing (the core, framework-free and tested)
  lib/markdown.ts            Markdown → HTML (callouts, code, YouTube cards)
  lib/embeds.ts              YouTube, Google Slides, PowerPoint and image-deck markup
  lib/deck.ts                Slide deck arrows/swipe/keyboard (also copied into downloads)
  lib/sanitize.ts            DOMPurify with an allow-list for embeds
  lib/assets.ts              Images uploaded with a lab
  lib/importFiles.ts         Opens a .md + images, or reopens a downloaded .html
  lib/reopen.ts              Reads a downloaded .html back into markdown + images (shared by the website and the extension)
  lib/claat.ts               Converts CLaaT .md codelabs into StepLab labs
  lib/claatHtml.ts           Converts exported CLaaT folders (index.html) into StepLab labs
  lib/exportHtml.ts          Builds the downloadable single-file lab
  lib/sandbox.ts             Reads `sandbox:` and builds the Launch sandbox button
  lib/colab.ts               Reads `colab:`, builds the Open in Colab button, finds the notebook to download
  lib/frontMatter.ts         Reads a lab's front matter (shared by the parser and the extension)
  lib/routes.ts              /sample-template, /sample and /format addresses
  components/Home.tsx        Landing page
  components/FormatPage.tsx  Format guide page (/format) and the mobile languages section
  components/UploadDialog.tsx  Upload pop-up with drag and drop
  components/Viewer.tsx      Lab player: timeline, pager, live editor, download
  components/Congrats.tsx    Finish pop-up with confetti
  sandbox.css                Launch sandbox and Open in Colab button styles (website and editor preview)
public/labs/                 Labs served as files (for ?lab= links)
Dockerfile                   Docker image: builds StepLab, then serves it with nginx
docker/nginx.conf            nginx settings for the Docker image
.github/workflows/deploy.yml Deploys the website to GitHub Pages on every push to main
.github/workflows/ci.yml     Checks every pull request: tests, website, extension, Docker
.github/workflows/docker.yml Publishes the Docker image to ghcr.io when a version tag is pushed
.github/CODEOWNERS           Every change needs the maintainer's review
extension/                   VS Code / Antigravity IDE extension
```

## Mobile app labs

StepLab works for Android and iOS codelabs. Code blocks highlight `kotlin` (Jetpack Compose), `swift` (SwiftUI), `objectivec`, `dart` (Flutter), `java`, `gradle` and `xml`. Show simulator screenshots with images or a `slides` block, and demos with YouTube.

## Roadmap

- `npx steplab build my-lab.md` CLI that reuses `src/lib/parser.ts`
- A lab gallery page built from `public/labs/`
- Remember each learner's progress per lab
- Instructor mode that moves a workshop room through steps together
- An "Explain this step" AI button
- A completion certificate

## Contributing

PRs are welcome, especially new labs in `public/labs/`. Please read [CONTRIBUTING.md](CONTRIBUTING.md) first: every change goes through a pull request and needs the maintainer's approval. To report a security problem, see [SECURITY.md](SECURITY.md).

## License

MIT. Created by Deepa Subramanian.
