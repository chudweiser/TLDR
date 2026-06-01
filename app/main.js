const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, shell } = require("electron");
const { spawn, exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");

// ── State ────────────────────────────────────────────────────────────────────

let tray = null;
let wizardWindow = null;
let serverProcess = null;
let ollamaProcess = null;

const CONFIG_PATH = path.join(app.getPath("userData"), "config.json");
const IS_WIN = process.platform === "win32";
const OLLAMA_BIN = IS_WIN ? "ollama.exe" : "ollama";
const MODEL = "qwen2.5:7b-instruct";
const SERVER_PORT = 8712;

// ── Config ───────────────────────────────────────────────────────────────────

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH))
            return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
    } catch {}
    return { setupDone: false };
}

function saveConfig(data) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
}

// ── Ollama ───────────────────────────────────────────────────────────────────

function checkOllamaInstalled() {
    return new Promise((resolve) => {
        exec(`${OLLAMA_BIN} --version`, (err) => resolve(!err));
    });
}

function checkOllamaRunning() {
    return new Promise((resolve) => {
        const req = http.get("http://127.0.0.1:11434", (res) => {
            resolve(res.statusCode < 500);
        });
        req.on("error", () => resolve(false));
        req.setTimeout(2000, () => { req.destroy(); resolve(false); });
    });
}

function checkModelInstalled() {
    return new Promise((resolve) => {
        exec(`${OLLAMA_BIN} list`, (err, stdout) => {
            if (err) return resolve(false);
            resolve(stdout.includes(MODEL.split(":")[0]));
        });
    });
}

function startOllama() {
    return new Promise((resolve) => {
        ollamaProcess = spawn(OLLAMA_BIN, ["serve"], {
            detached: true,
            stdio: "ignore"
        });
        ollamaProcess.unref();
        // Give it a moment to start
        setTimeout(resolve, 2500);
    });
}

function pullModel(onProgress) {
    return new Promise((resolve, reject) => {
        const proc = spawn(OLLAMA_BIN, ["pull", MODEL]);

        proc.stdout.on("data", (data) => {
            const line = data.toString().trim();
            if (line) onProgress(line);
        });

        proc.stderr.on("data", (data) => {
            const line = data.toString().trim();
            if (line) onProgress(line);
        });

        proc.on("close", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Pull exited with code ${code}`));
        });
    });
}

// ── TLDR Server ──────────────────────────────────────────────────────────────

function startTLDRServer() {
    const serverPath = path.join(__dirname, "server.js");
    serverProcess = spawn(process.execPath, [serverPath], {
        stdio: "ignore"
    });
    serverProcess.unref();
}

function checkServerRunning() {
    return new Promise((resolve) => {
        const req = http.get(`http://127.0.0.1:${SERVER_PORT}/health`, (res) => {
            resolve(res.statusCode === 200);
        });
        req.on("error", () => resolve(false));
        req.setTimeout(2000, () => { req.destroy(); resolve(false); });
    });
}

// ── Tray ─────────────────────────────────────────────────────────────────────

function buildTrayIcon() {
    // 16x16 simple "T" icon as base64 PNG
    const iconB64 =
        "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAA" +
        "iklEQVQ4jWNgoBIQJlPzfwb8/8+ABy9evGBgYGBguH//PkMDAwMDNze3/z8/v8ZGBgY/v//z" +
        "8P//gYGBgSE3N5eBgYGBwcnJiYGBgYGBiYmJgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGB" +
        "gYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYEB9D8ABwAA//8DAHhgJf8AAAAASUVORK5CYII=";

    try {
        return nativeImage.createFromDataURL(`data:image/png;base64,${iconB64}`);
    } catch {
        return nativeImage.createEmpty();
    }
}

async function createTray() {
    const icon = buildTrayIcon();
    tray = new Tray(icon);
    tray.setToolTip("TLDR Local");
    await updateTrayMenu();
}

async function updateTrayMenu() {
    if (!tray) return;

    const ollamaOk = await checkOllamaRunning();
    const serverOk = await checkServerRunning();

    const menu = Menu.buildFromTemplate([
        {
            label: "TLDR Local",
            enabled: false
        },
        { type: "separator" },
        {
            label: `Ollama  ${ollamaOk ? "✓ Running" : "✗ Stopped"}`,
            enabled: false
        },
        {
            label: `Server  ${serverOk ? "✓ Running" : "✗ Stopped"}`,
            enabled: false
        },
        { type: "separator" },
        {
            label: "Restart Services",
            click: restartServices
        },
        {
            label: "Extension Setup Guide",
            click: () => shell.openExternal("https://github.com/chudweiser/TLDR#load-extension")
        },
        { type: "separator" },
        {
            label: "Quit",
            click: () => {
                if (serverProcess) serverProcess.kill();
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(menu);

    // Refresh status every 15 seconds
    setTimeout(updateTrayMenu, 15000);
}

async function restartServices() {
    if (serverProcess) serverProcess.kill();

    const ollamaRunning = await checkOllamaRunning();
    if (!ollamaRunning) await startOllama();

    startTLDRServer();
    await updateTrayMenu();
}

// ── Wizard Window ─────────────────────────────────────────────────────────────

function createWizardWindow() {
    wizardWindow = new BrowserWindow({
        width: 560,
        height: 520,
        resizable: false,
        frame: false,
        center: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js")
        }
    });

    wizardWindow.loadFile(path.join(__dirname, "wizard.html"));
}

// ── IPC handlers (wizard → main) ──────────────────────────────────────────────

ipcMain.handle("wizard:start", async () => {
    // Step 1: check ollama installed
    const installed = await checkOllamaInstalled();
    if (!installed) {
        return { step: "no-ollama", message: "Ollama not found. Please install it first." };
    }

    // Step 2: start ollama if not running
    const running = await checkOllamaRunning();
    if (!running) {
        await startOllama();
    }

    // Step 3: check model
    const hasModel = await checkModelInstalled();
    if (!hasModel) {
        return { step: "need-model", message: `Model ${MODEL} not found. Ready to download (~5GB).` };
    }

    return { step: "ready" };
});

ipcMain.handle("wizard:pull-model", async (event) => {
    try {
        await pullModel((line) => {
            if (wizardWindow && !wizardWindow.isDestroyed())
                wizardWindow.webContents.send("pull-progress", line);
        });
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle("wizard:finish", async () => {
    saveConfig({ setupDone: true });
    startTLDRServer();

    if (wizardWindow && !wizardWindow.isDestroyed())
        wizardWindow.close();

    await createTray();
    await updateTrayMenu();
    return { success: true };
});

ipcMain.handle("wizard:open-ollama", () => {
    shell.openExternal("https://ollama.com/download");
});

// ── App Lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
    app.setName("TLDR Local");

    // Don't show in taskbar/dock — tray only
    if (app.dock) app.dock.hide();

    const config = loadConfig();

    if (!config.setupDone) {
        createWizardWindow();
    } else {
        // Returning user — start services silently
        const ollamaRunning = await checkOllamaRunning();
        if (!ollamaRunning) await startOllama();
        startTLDRServer();
        await createTray();
    }
});

app.on("window-all-closed", (e) => {
    // Keep running in tray even when all windows closed
    e.preventDefault();
});
