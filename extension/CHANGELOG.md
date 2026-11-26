# Changelog

## 0.1.11
- Clearer Colab steps on the extension page: what happens when you sign in, and how to switch to Colab if a kernel is already chosen.
- Store tags: added `gde`, `devrel` and `developer-advocate`.
- The reopen command is now named **Reopen Downloaded StepLab HTML for Editing**, so it's clear it only works on HTML downloaded from StepLab.
- The website (steplab.dev) can now be installed as a desktop app that works offline. The extension works as before.

## 0.1.10
- New: **Reopen Downloaded StepLab HTML for Editing.** Only have the StepLab HTML file you downloaded (from **Export as HTML** or the website)? Right-click it (or run the command) and StepLab saves the lab's `.md` and its images next to it, then opens the preview. It asks before replacing any file, and the downloaded StepLab HTML is never changed. StepLab also offers this when you open a downloaded StepLab HTML file in the editor. The website already does this when you upload a downloaded StepLab HTML file. Other HTML files can't be reopened.

## 0.1.9
- Fixed: the two demo GIFs on the extension page (Quick Start and Colab) now load.

## 0.1.8
- New: **Open the lab notebook in the editor.** When a lab's `colab:` link is a notebook on GitHub, the preview shows an **Open in editor** button next to **Open in Colab** (also in the Command Palette: **StepLab: Open Lab Notebook in Editor**). StepLab saves a copy as `notebooks/<name>.ipynb` next to your lab and opens it. If you already have a copy, StepLab asks before replacing it, so your changes are safe.
- Run it with Google's **Colab** extension (free Colab servers, sign in with Google) or any Jupyter kernel. StepLab shows a one-time tip about the Colab extension; it's optional.
- Google Drive notebooks keep opening in Colab in the browser, since they need a Google sign-in.

## 0.1.7
- New: **Open in Colab button.** Add `colab:` with a notebook link to a lab's front matter (a notebook on GitHub, or a Google Drive / Colab link) and StepLab shows an "Open in Colab" button under the title, in the preview and in exported HTML. Each attendee gets their own editable copy of the notebook in Google Colab. Works next to the Launch sandbox button. The template shows the line, commented out.
- StepLab has a new home: **https://steplab.dev**. The "Made with StepLab" link in exported HTML now points there (the old address redirects).

## 0.1.4
- New: **Launch sandbox button.** Add `sandbox: your-name/your-repo` to a lab's front matter and StepLab shows a "Launch sandbox" button under the title, in the preview and in exported HTML. It opens that GitHub repo in Codespaces, so attendees get a ready-to-use coding environment in the browser with nothing to install. The template shows the line, commented out.

## 0.1.3
- New: **Convert CLaaT Codelab to StepLab.** Works with both kinds of CLaaT codelab: the `.md` you wrote, or the folder `claat export` made (`index.html`, `codelab.json`, `img/`). The result is saved as `name.steplab.md` (inside the exported folder, so images keep working); your originals are never changed. Run it from the Command Palette or right-click a `.md` or `.html` file. StepLab also offers to convert when you open a CLaaT codelab. **One step to a StepLab page:** run **StepLab: Convert CLaaT Codelab to StepLab HTML** (or choose "StepLab HTML" when StepLab offers) to convert and export in one go. Steps you numbered by hand ("Step 1 · …") are renumbered cleanly, with Overview as Step 0.
- Fixed: the "building HTML…" message could keep spinning when exporting right after opening the preview.
- Exported HTML labs use more of wide screens: on desktops 1100px and wider, the step list sits further left and code blocks, images and slides get more room.

## 0.1.2
- Published under the `sdkdeepa` publisher (was `deepasubramanian`). The extension ID is now `sdkdeepa.steplab`.
- New name: StepLab: Codelabs from Markdown.
- Fixed: gray boxes behind each line inside code blocks in the preview (dark themes).
- Docs: in markdown files, press `Ctrl+Space` to see StepLab snippets.

## 0.1.1
- Fixed the template title.

## 0.1.0
- First release: live StepLab preview beside your markdown, follow-the-cursor, Export as HTML (single file with images packed in), New Lab from Template, Insert Next Step, snippets (`step`, `step0`, `steplab`, `slides`, `youtube`, `note`, `tip`, `warning`), warnings for out-of-order steps and missing images, and a step outline.
