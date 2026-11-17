---
title: Build your first Gemini chatbot with Flask
author: Deepa Subramanian
---

# Build your first Gemini chatbot with Flask

## Step 1: Overview
Duration: 2

In this codelab you will build a small chat app that answers questions about your community's events.

### What you'll learn
- How a codelab is split into steps from one markdown file
- How to call an LLM API from a Python backend
- How to serve a simple frontend

> Note: This is a sample lab. Replace it with your own content.

## Step 2: Set up your environment
Duration: 5

Create a project folder and a virtual environment:

```bash
mkdir chatbot && cd chatbot
python3 -m venv .venv
source .venv/bin/activate
pip install flask
```

> Warning: Never commit your API key. Put it in a `.env` file and add that file to `.gitignore`.

## Step 3: Write the backend
Duration: 10

Create `app.py`:

```python
from flask import Flask, request, jsonify
app = Flask(__name__)

@app.post("/chat")
def chat():
    q = request.json["question"]
    return jsonify(answer=f"You asked: {q}")
```

Run it with `flask run` and open **http://localhost:5000**.

## Step 4: Add the frontend
Duration: 8

1. Create `static/index.html`
2. Add a text box and a **Send** button
3. Call `fetch("/chat")` on click and show the answer

## Step 5: Wrap up
Duration: 1

You built a working chatbot. Next, try adding conversation memory or deploying it.
