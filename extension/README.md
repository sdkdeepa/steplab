# StepLab for VS Code and Antigravity

Write a step-by-step codelab in **one markdown file** and see it as an interactive lab while you type.

## Features

- **Live preview beside your file.** Steps, progress, time left, copyable code, callouts, slides with arrow buttons, YouTube videos, and the "Congratulations!" pop-up at the end. It follows your editor's light or dark theme.
- **Follows your cursor.** Move into `## Step 3` and the preview shows Step 3. Click a step in the preview and the editor jumps to it.
- **Export as HTML.** Saves one self-contained file, with images packed in, that you can host anywhere or send to attendees.
- **New Lab from Template.** Opens a lab that demonstrates every feature.
- **Insert Next Step** (`Ctrl+Alt+S` / `Cmd+Alt+S`) adds `## Step N:` with the right number.
- **Snippets:** `steplab` (new lab), `step0`, `step`, `slides`, `youtube`, `note`, `tip`, `warning`. In markdown files, type the name and press `Ctrl+Space` to see them (markdown hides suggestions by default).
- **Bring your CLaaT codelabs.** Run **StepLab: Convert CLaaT Codelab to StepLab** (or right-click a `.md` file) to turn a Google CLaaT codelab into a StepLab lab. StepLab also offers this when you open one. Your original file is never changed.
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
