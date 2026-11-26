---
title: Basic StepLab lab
author: StepLab Tests
---

## Step 0: Overview
Duration: 1

What you'll build: a tiny Node.js server.

## Step 1: Set up
Duration: 2

Install the tools:

```bash
npm install express
```

## Step 2: Write the server
Duration: 3

```js
const app = require('express')()
app.get('/', (req, res) => res.send('Hello StepLab'))
app.listen(3000)
```

## Step 3: Done
Duration: 1

You built a server.
