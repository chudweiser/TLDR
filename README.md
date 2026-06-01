# TLDR Local

Too Long, Didn't Read (TLDR) is a browser extension that automatically summarizes long paragraphs using a local Ollama model.

No cloud APIs.
No subscriptions.
No data leaves your machine.

## Features

- Local AI via Ollama
- Automatic paragraph detection
- Works on dynamically loaded pages (Reddit, SPAs, etc.)
- Configurable character limit
- Annotate mode — adds TL;DR below the paragraph
- Replace mode — replaces paragraph with summary + "Show Original" button
- Chrome, Edge, Brave, Firefox
- Linux, Windows

## Requirements

- Node.js 20+
- Ollama — https://ollama.com/download

## Setup

### 1. Install Ollama

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**

Download and run the installer from https://ollama.com/download

### 2. Pull a model

```bash
ollama pull qwen2.5:7b-instruct
```

### 3. Clone and install

```bash
git clone https://github.com/chudweiser/TLDR.git
cd TLDR
npm install
```

### 4. Start the server

**Linux (persistent, survives closing terminal):**
```bash
nohup npm start > tldr.log 2>&1 &
```

**Linux (foreground, for debugging):**
```bash
npm start
```

**Windows:**
```cmd
npm start
```
Keep the terminal window open while using the extension.

The server runs on http://127.0.0.1:8712

## Load Extension

### Chrome / Edge / Brave

1. Open `chrome://extensions`
2. Enable **Developer Mode** (top right toggle)
3. Click **Load Unpacked**
4. Select the `TLDR` folder

### Firefox

1. Open `about:debugging`
2. Click **This Firefox**
3. Click **Load Temporary Add-on**
4. Select `manifest.json` inside the `TLDR` folder

> Note: Firefox temporary add-ons are removed on browser restart. You'll need to reload it each session until a signed version is available.

## Settings

Open the extension options page to configure:

- **Character limit** — minimum paragraph length to trigger summarization (default: 500)
- **Mode** — Annotate (adds TL;DR below) or Replace (swaps paragraph with summary)

## Troubleshooting

**No summaries appearing:**
1. Make sure Ollama is running: `ollama list`
2. Make sure the server is running: `curl http://127.0.0.1:8712/summarize` should not return a connection error
3. Check the browser console (F12) for errors from the content script

**Server port already in use:**
```bash
pkill -f "node server/server.js"
npm start
```

**Wrong model error:**
Make sure the model name in `server/server.js` matches exactly what `ollama list` shows.
