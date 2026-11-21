# StepLab for VS Code and Antigravity

Write a step-by-step codelab in **one markdown file** and see it as an interactive lab while you type.

## Features

- **Live preview beside your file.** Steps, progress, time left, copyable code, callouts, slides with arrow buttons, YouTube videos, and the "Congratulations!" pop-up at the end. It follows your editor's light or dark theme.
- **Follows your cursor.** Move into `## Step 3` and the preview shows Step 3. Click a step in the preview and the editor jumps to it.
- **Export as HTML.** Saves one self-contained file, with images packed in, that you can host anywhere or send to attendees.
- **New Lab from Template.** Opens a lab that demonstrates every feature.
- **Insert Next Step** (`Ctrl+Alt+S` / `Cmd+Alt+S`) adds `## Step N:` with the right number.
- **Snippets:** `steplab` (new lab), `step0`, `step`, `slides`, `youtube`, `note`, `tip`, `warning`. In markdown files, type the name and press `Ctrl+Space` to see them (markdown hides suggestions by default).
- **Bring your CLaaT codelabs.** Works with a CLaaT `.md` or an exported CLaaT folder (`index.html` + `img/`). **StepLab: Convert CLaaT Codelab to StepLab HTML** gives you the finished StepLab page in one step; **StepLab: Convert CLaaT Codelab to StepLab** gives you an editable `.steplab.md`. Both are on the right-click menu of `.md` and `.html` files, and StepLab offers them when you open a CLaaT codelab. Your original files are never changed.
- **Launch sandbox button.** Add `sandbox: your-name/your-repo` to the front matter and the lab gets a button that opens that GitHub repo in Codespaces, a ready-to-use coding environment in the browser. It also appears in exported HTML.
- **Open in Colab button.** Add `colab:` with a notebook link (GitHub or Google Drive) and the lab gets a button that opens it in Google Colab, where each attendee gets their own copy. It also appears in exported HTML.
- **Warnings** for out-of-order step numbers and image paths that don't exist.
- **Step outline** in the Outline view and Go to Symbol (`Ctrl+Shift+O` / `Cmd+Shift+O`).

## The format

~~~markdown
---
title: Build your first chatbot
author: Your Name
---

## Step 0: Overview
Duration: 2

What you'll build.

## Step 1: Set up
Duration: 5

```bash
pip install flask
```
~~~

Open the preview with the ▶ button in the editor title bar, or `Ctrl+Alt+L` / `Cmd+Alt+L`.

## Also on the web

Labs written here also work at [deepasubramanian.dev/steplab](https://deepasubramanian.dev/steplab/).

Created by Deepa Subramanian · MIT licensed
