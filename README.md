# StepLab

Turn one markdown file into a step-by-step, Codelab-style tutorial, right in the browser.

Write `## Step 0`, `## Step 1`, `## Step 2`… and drop the file in. StepLab builds an interactive lab with a step timeline, progress bar, time left, copyable syntax-highlighted code, callouts, slides, videos, and a **Congratulations** pop-up with confetti at the end. Then **download the lab as one self-contained HTML file** and share or host it anywhere.

- **No server.** Everything runs in the browser, and files never leave your computer.
- **Simple stack.** React + TypeScript + Vite.
- **Free to host.** It's a static site, so it runs on Netlify's free plan, GitHub Pages or any static host.
- **Light and dark themes.** It follows the device setting until the visitor picks one, and downloaded labs have the toggle too.
- **Phone-friendly.** Swipe between steps, a full-screen editor, and downloads that work on phones.
- **Editor extension.** A live preview for VS Code and Antigravity (see below).

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
- **Upload a markdown file** opens a pop-up with two tabs: **StepLab lab** and **Old CLaaT codelab**. Drag in your `.md` file **and its images** together, or browse for them. Labs downloaded from StepLab (`.html`) can be uploaded too, and they reopen for editing with their images.
- **Edit** shows the markdown beside the lab with a live preview, and **Save .md** downloads it.
- **Download HTML** saves one self-contained file, with images packed in.

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

- `/sample-template` opens the feature template, and `/sample` opens the sample lab.
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
- **In VS Code / Antigravity:** right-click the folder's `index.html` (or a CLaaT `.md`) and choose **Convert CLaaT Codelab to StepLab HTML** for the finished page in one step, or **Convert CLaaT Codelab to StepLab** for an editable `.steplab.md`. StepLab also offers both when you open a CLaaT codelab.

### Sharing a lab

Put `.md` files in `public/labs/` and share links like:

```
https://yourdomain.com/steplab/?lab=labs/my-workshop.md
https://yourdomain.com/steplab/?lab=labs/my-workshop.md#step-3
```

## VS Code and Antigravity extension

`extension/` holds the StepLab editor extension: a live preview beside your markdown, Export as HTML, snippets (`step`, `step0`, `slides`, `youtube`…) and warnings for out-of-order steps and missing images. It reuses `src/lib`, so the preview matches the website.

```bash
cd extension
npm install
npm run package      # builds steplab-<version>.vsix
```

Install the `.vsix` with Extensions → `…` → **Install from VSIX**. To publish to Open VSX (used by Antigravity) and the VS Code Marketplace, see [`extension/PUBLISHING.md`](extension/PUBLISHING.md).

## Project structure

```
src/
  config.ts                  Your name, LinkedIn and StepLab URL (edit when forking)
  labs/                      Built-in template and example lab
  lib/parser.ts              Step parsing (the core, framework-free and tested)
  lib/markdown.ts            Markdown → HTML (callouts, code, YouTube cards)
  lib/embeds.ts              YouTube, Google Slides, PowerPoint and image-deck markup
  lib/deck.ts                Slide deck arrows/swipe/keyboard (also copied into downloads)
  lib/sanitize.ts            DOMPurify with an allow-list for embeds
  lib/assets.ts              Images uploaded with a lab
  lib/importFiles.ts         Opens a .md + images, or reopens a downloaded .html
  lib/claat.ts               Converts CLaaT .md codelabs into StepLab labs
  lib/claatHtml.ts           Converts exported CLaaT folders (index.html) into StepLab labs
  lib/exportHtml.ts          Builds the downloadable single-file lab
  lib/routes.ts              /sample-template and /sample addresses
  components/Home.tsx        Landing page
  components/UploadDialog.tsx  Upload pop-up with drag and drop
  components/Viewer.tsx      Lab player: timeline, pager, live editor, download
  components/Congrats.tsx    Finish pop-up with confetti
public/labs/                 Labs served as files (for ?lab= links)
extension/                   VS Code / Antigravity extension
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

PRs are welcome, especially new labs in `public/labs/`. Run `npm test` and check the lab at phone width before opening a PR.

## License

MIT. Created by Deepa Subramanian.
