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
- Node.js 20 or 22 LTS — **do not use Node 24 or 26**, Electron's binary downloader breaks on these versions. Download from [nodejs.org/en/download](https://nodejs.org/en/download) and select the LTS version.

## Quick Start

### 1. Install Ollama

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**
Download and run the installer from https://ollama.com/download

### 2. Clone the repo

```bash
git clone https://github.com/chudweiser/TLDR.git
cd TLDR/app
npm install
```

### 3. Start the app

**Linux:**
```bash
npm start
```

If the window doesn't appear (GPU issues), run instead:
```bash
./electron-bin/electron --no-sandbox --disable-gpu main.js
```

If `electron-bin` doesn't exist yet (first run), download it manually:
```bash
wget https://github.com/electron/electron/releases/download/v33.4.4/electron-v33.4.4-linux-x64.zip
unzip electron-v33.4.4-linux-x64.zip -d electron-bin
./electron-bin/electron --no-sandbox --disable-gpu main.js
```

**Windows:**

`npm start` may fail with "Electron failed to install correctly" — this is a known issue with Electron's binary downloader. Download it manually instead:

Open PowerShell and run:
```powershell
cd path\to\TLDR\app
Invoke-WebRequest -Uri "https://github.com/electron/electron/releases/download/v33.4.4/electron-v33.4.4-win32-x64.zip" -OutFile electron.zip
Expand-Archive -Path electron.zip -DestinationPath electron-bin
.\electron-bin\electron.exe .\app\main.js
```

### 4. Setup wizard

On first launch a setup wizard will:
1. Detect if Ollama is installed (opens download page if not)
2. Download the AI model if missing (~5 GB, one-time — keep the window open)
3. Start the background server
4. Minimize to your system tray

On subsequent launches it skips the wizard and goes straight to the tray.

### 5. Install the Firefox extension

Download the signed `.xpi` from the [releases page](https://github.com/chudweiser/TLDR/releases) and open it in Firefox — it installs permanently.

## Starting the app after first setup

**Linux:**
```bash
cd ~/TLDR/app
./electron-bin/electron --no-sandbox --disable-gpu main.js
```

**Windows:**
```powershell
cd path\to\TLDR\app
.\electron-bin\electron.exe main.js
```

## Settings

Open the extension options in Firefox (right-click the extension icon → Manage Extension → Preferences) to configure:

- **Character limit** — minimum paragraph length to trigger summarization (default: 500). After changing, reload any open tabs. | WIP, TO BE ADDED 6/3

## Troubleshooting

**No summaries appearing:**
1. Make sure the desktop app is running (check your system tray)
2. Check the server is up: `curl http://127.0.0.1:8712/health`
3. Open F12 in Firefox and check the console for errors from the content script

**Server port already in use (Linux):**
```bash
pkill -f "node server/server.js"
```

**Model download stuck:**
The model is ~5 GB — keep the window open and give it time. If it fails, relaunch the app and it will retry.
