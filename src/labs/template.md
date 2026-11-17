---
title: StepLab — every workshop steps made easy!
author: Your Name                                    # you: shown as the author and in the copyright line
linkedin: https://www.linkedin.com/in/your-profile   # optional: a LinkedIn link next to the copyright
copyright: © {year} {author}. All rights reserved.   # optional: write "none" to hide the copyright line
copyright_position: both                             # top, bottom or both
---

# StepLab - every workshop steps made easy!

Anything above "Step 1" is not shown as a step. Use it for notes to yourself.

## Step 1: How this template works
Duration: 3

This lab **is** the template. Each step shows one feature, plus the markdown that makes it. Copy what you need, delete the rest, and you have your own codelab.

### The settings at the top of the file

Everything between the two `---` lines is called *front matter*. StepLab reads these settings:

| Setting | What it does | Example |
| :-- | :-- | :-- |
| `title` | The lab title at the top of every step | `Build a chatbot` |
| `author` | **Your name.** Shown as "Written by", and used for `{author}` in the copyright line | `Jane Doe` |
| `linkedin` | Optional. Adds a LinkedIn link next to the copyright | `https://www.linkedin.com/in/jane-doe` |
| `copyright` | Optional. The copyright text. `{year}` and `{author}` are filled in for you. Write `none` to hide it. | `© {year} {author}` |
| `copyright_position` | Where the copyright line appears on every step: `top`, `bottom` or `both` | `both` |

Anything after a ` # ` on these lines is a note to yourself and is ignored.

### How a step starts

A step is any heading that starts with **Step** and a number. The optional `Duration:` line right under it sets the minutes.

~~~markdown
## Step 1: Set up your environment
Duration: 5

Your instructions go here.
~~~

> Tip: `# Step 2 - Title`, `### STEP 3. Title` and `## Step 4 · Title` also work. Steps are shown in the order they appear in the file.

### Start with Step 0: Overview / Introduction

Labs can start at **Step 0**. Use it for the overview: what people will build, what they'll learn and what they need.

~~~markdown
## Step 0: Overview
Duration: 2

What you'll build and what you need.

## Step 1: Set up
~~~

> Tip: A plain `## Overview` or `## Introduction` placed before Step 1 also becomes Step 0.

## Step 2: Format your text
Duration: 4

Here's every text style StepLab supports.

- **Bold text** with `**two stars**`
- *Italic text* with `*one star*`
- ***Bold and italic*** with `***three stars***`
- ~~Strikethrough~~ with `~~two tildes~~`
- `Inline code` with backticks
- A [link to the StepLab repo](https://github.com/your-username/steplab) with `[text](https://...)`
- A [link to another step](#step-5) with `[text](#step-5)`

### Lists

1. Numbered lists use `1.`, `2.`, `3.`
2. Nest a list by indenting two spaces:
   - like this
   - and this
3. Checklists work too:

- [x] Install Node.js
- [ ] Clone the repo

~~~markdown
**Bold**, *italic*, ***both***, ~~strikethrough~~, `code`
[A link](https://example.com) and [another step](#step-5)
~~~

## Step 3: Add code snippets in any language
Duration: 6

Put the language name after the three backticks. Every block gets syntax colors and a **Copy** button.

```bash
# Terminal
git clone https://github.com/your-username/steplab.git
cd steplab && npm install && npm run dev
```

```python
# Python
def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("developers"))
```

```javascript
// JavaScript
const steps = ['Write', 'Upload', 'Share']
steps.forEach((s, i) => console.log(`${i + 1}. ${s}`))
```

```typescript
// TypeScript
interface Step { title: string; minutes: number }
const total = (steps: Step[]) => steps.reduce((sum, s) => sum + s.minutes, 0)
```

```java
// Java
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, codelab!");
    }
}
```

```kotlin
// Kotlin + Jetpack Compose (Android)
@Composable
fun Greeting(name: String) {
    Column(modifier = Modifier.padding(16.dp)) {
        Text("Hello, $name!", style = MaterialTheme.typography.headlineMedium)
        Button(onClick = { /* next step */ }) { Text("Start") }
    }
}
```

```swift
// SwiftUI (iOS)
struct ContentView: View {
    @State private var count = 0
    var body: some View {
        VStack(spacing: 16) {
            Text("Tapped \(count) times").font(.title)
            Button("Tap me") { count += 1 }.buttonStyle(.borderedProminent)
        }
    }
}
```

```objectivec
// Objective-C (iOS)
#import <UIKit/UIKit.h>

@implementation ViewController
- (void)viewDidLoad {
    [super viewDidLoad];
    NSLog(@"Hello from Objective-C");
}
@end
```

```dart
// Dart + Flutter
class Counter extends StatelessWidget {
  const Counter({super.key});
  @override
  Widget build(BuildContext context) =>
      const Center(child: Text('Hello, Flutter!'));
}
```

```gradle
// build.gradle (Android)
dependencies {
    implementation "androidx.compose.material3:material3:1.2.1"
}
```

```go
// Go
package main

import "fmt"

func main() { fmt.Println("Hello from Go") }
```

```sql
-- SQL
SELECT name, COUNT(*) AS labs_finished
FROM attendees
GROUP BY name
ORDER BY labs_finished DESC;
```

```json
{
  "lab": "StepLab template",
  "steps": 8,
  "free": true
}
```

```yaml
# YAML
name: Deploy
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
```

```html
<!-- HTML -->
<button class="cta">Start the codelab</button>
```

```css
/* CSS */
.cta { background: #e8251a; color: white; border-radius: 12px; }
```

> Note: Mobile labs work too: use `kotlin`, `swift`, `objectivec`, `dart`, `java`, `gradle` and `xml` (Android layouts and manifests). Other languages include `c`, `cpp`, `csharp`, `php`, `ruby`, `rust`, `diff` and `shell`. If a language isn't recognized, the code still shows, just without colors.

## Step 4: Add tables and images
Duration: 4

### Tables

Use pipes `|` between columns. The colons in the second row set the alignment.

| Tool | Best for | Cost |
| :-- | :-- | --: |
| StepLab | Workshops and codelabs | $0 |
| Slides | Talks | $0 |
| Video | Async learning | $0 |

~~~markdown
| Tool | Best for | Cost |
| :-- | :-- | --: |
| StepLab | Workshops | $0 |
~~~

### Images

Write `![description](path "optional caption")`. A caption turns the image into a figure.

![Diagram: a markdown file goes into StepLab and comes out as an interactive lab and a single HTML file](labs/images/how-steplab-works.svg "How StepLab turns one markdown file into a lab")

~~~markdown
![What the image shows](labs/images/my-picture.png "Optional caption")
![Logo](https://example.com/logo.png)
~~~

> Tip: When you host on GitHub Pages, put images in `public/labs/images/`. When you only upload a file, use full `https://` image links. Download HTML packs the images into the file for you.

## Step 5: Add callouts
Duration: 2

Start a quote with **Note:**, **Tip:** or **Warning:** to get a colored callout.

> Note: Use notes for extra context people might want.

> Tip: Use tips for shortcuts and best practices.

> Warning: Use warnings for things that can break, cost money or leak secrets.

~~~markdown
> Note: Extra context.
> Tip: A helpful shortcut.
> Warning: Never commit your API key.
~~~

## Step 6: Add slides (Keynote, PowerPoint, Google Slides)
Duration: 6

### Option A: image slides with arrow buttons (works for every tool)

Export your slides as images, list them in a `slides` block, and StepLab shows them with **arrow buttons**, thumbnails, swipe on phones, ← → keys and full screen.

```slides
title: StepLab in 4 slides
labs/images/slide-1.svg | One markdown file, a whole workshop
labs/images/slide-2.svg | Steps come from your headings
labs/images/slide-3.svg | Slides and videos inside any step
labs/images/slide-4.svg | Download one file, host it anywhere
```

~~~markdown
```slides
title: My talk
labs/images/slide-1.png | Optional caption
labs/images/slide-2.png
https://example.com/slide-3.png
```
~~~

How to export slides as images:

| App | Steps |
| :-- | :-- |
| Keynote | File → Export To → Images… → PNG |
| PowerPoint | File → Save As (or Export) → PNG → All slides |
| Google Slides | File → Download → PDF, then convert the pages to PNG, or download one slide at a time as PNG |

### Option B: a live Google Slides or PowerPoint embed

Paste a published link instead of images. The deck plays inside the step with **its own** arrow buttons.

~~~markdown
```slides
title: My Google Slides deck
https://docs.google.com/presentation/d/e/YOUR-PUBLISHED-ID/pub
```
~~~

- **Google Slides:** File → Share → Publish to web → copy the link.
- **PowerPoint:** open the deck in PowerPoint for the web → File → Share → Embed → copy the `src` link. A public `https://…/deck.pptx` link works too.
- **Keynote:** there's no web embed, so use Option A.

## Step 7: Add a YouTube video
Duration: 3

### Option A: a clickable preview

The thumbnail opens the video on YouTube. This format also works in GitHub READMEs.

[![Google ADK Masterclass - July 2026](https://img.youtube.com/vi/JhmMuLfwPB0/maxresdefault.jpg)](https://youtu.be/JhmMuLfwPB0)

~~~markdown
[![Video title](https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg)](https://youtu.be/VIDEO_ID)
~~~

> Tip: `VIDEO_ID` is the part after `youtu.be/` or `watch?v=`. If the preview image doesn't appear, use `hqdefault.jpg` instead of `maxresdefault.jpg`.

### Option B: a player inside the step

Paste a YouTube link on its own line, and it becomes a video player:

https://youtu.be/JhmMuLfwPB0

To add a title, or to start at a certain time, use a `youtube` block:

```youtube
title: Google ADK Masterclass (starts at 1:00)
https://www.youtube.com/watch?v=JhmMuLfwPB0&t=60s
```

~~~markdown
https://www.youtube.com/watch?v=VIDEO_ID

```youtube
title: Optional title
https://youtu.be/VIDEO_ID?t=90
```
~~~

> Note: Players use YouTube's privacy-enhanced mode (youtube-nocookie.com). Normal watch links, `youtu.be` short links, Shorts and `t=` start times all work.

## Step 8: Make it yours
Duration: 2

You've seen every feature. To turn this into your own lab:

1. Change `author` and `linkedin` at the top of the file. The copyright line updates on every step.
2. Don't want a copyright line? Set `copyright: none`.
3. Want it only at the bottom? Set `copyright_position: bottom`.
4. Replace these steps with your own `## Step 1`, `## Step 2`…
5. Upload the file, or tap **Edit** to write right here, then **Download HTML** to share it.

When someone finishes the last step and taps **Finish**, they get the congratulations pop-up. Try it now!
