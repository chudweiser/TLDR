# TLDR Local

Too Long, Didn't Read (TLDR) is a Firefox extension that automatically summarizes long paragraphs using a local AI model running entirely on your machine.

No cloud APIs.
No subscriptions.
No data leaves your machine.

## How It Works

TLDR Local detects long paragraphs on any webpage and adds a concise TL;DR summary beneath them, powered by a local Ollama model.

## Requirements

- Firefox (regular release)
- [Ollama](https://ollama.com/download)
- Node.js 20+

## Quick Start

The easiest way to get started is the **desktop app**, which handles everything automatically.

### 1. Install Ollama

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**
Download and run the installer from https://ollama.com/download

### 2. Run the desktop app

```bash
git clone https://github.com/chudweiser/TLDR.git
cd TLDR/app
npm install
npm start
```

A setup wizard will open and:
1. Detect if Ollama is installed
2. Download the AI model if missing (~5 GB, one-time)
3. Start the background server
4. Minimize to your system tray

**Linux only** — if the window doesn't appear, run:
```bash
./electron-bin/electron --no-sandbox --disable-gpu main.js
```

### 3. Install the Firefox extension

Download the signed `.xpi` from the [releases page](https://github.com/chudweiser/TLDR/releases) and open it in Firefox.

## Manual Server Start (no Electron)

If you prefer to run the server manually without the desktop app:

```bash
cd TLDR
npm install
nohup npm start > tldr.log 2>&1 &
```

## Settings

Open the extension options to configure:

- **Character limit** — minimum paragraph length to trigger summarization (default: 500)

## Troubleshooting

**No summaries appearing:**
1. Make sure the desktop app is running (check your system tray)
2. Check the server is up: `curl http://127.0.0.1:8712/health`
3. Open F12 in Firefox and check the console for errors

**Server port already in use:**
```bash
pkill -f "node server/server.js"
npm start
```

**Desktop app won't open on Linux:**
```bash
cd ~/TLDR/app
./electron-bin/electron --no-sandbox --disable-gpu main.js
```
