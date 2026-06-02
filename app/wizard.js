const heading    = document.getElementById("heading");
const subtext    = document.getElementById("subtext");
const btnPrimary = document.getElementById("btn-primary");
const btnSec     = document.getElementById("btn-secondary");
const log        = document.getElementById("log");
btnPrimary.addEventListener("click", () => primaryAction());
btnSec.addEventListener("click", () => secondaryAction());

const s1 = document.getElementById("s1");
const s2 = document.getElementById("s2");
const s3 = document.getElementById("s3");

let state = "checking"; // checking | no-ollama | need-model | pulling | finishing | done

function setStep(el, status) {
    el.className = "step " + status;
    const icon = el.querySelector(".step-icon");
    if (status === "done")    icon.textContent = "✓";
    if (status === "active")  icon.textContent = el.id.replace("s","");
    if (status === "waiting") icon.textContent = el.id.replace("s","");
}

function setPrimary(label, enabled) {
    btnPrimary.innerHTML = label;
    btnPrimary.disabled = !enabled;
}

function appendLog(line) {
    log.classList.add("visible");
    log.textContent += line + "\n";
    log.scrollTop = log.scrollHeight;
}

async function primaryAction() {
    if (state === "no-ollama") {
        window.tldr.openOllama();
        return;
    }

    if (state === "need-model") {
        await pullModel();
        return;
    }

    if (state === "ready") {
        await finish();
        return;
    }
}

function secondaryAction() {
    window.tldr.openOllama();
}

async function pullModel() {
    state = "pulling";
    setStep(s2, "active");
    heading.textContent = "Downloading AI model";
    subtext.textContent = "This is a one-time ~5 GB download. Keep this window open.";
    setPrimary("Downloading…", false);
    btnSec.style.display = "none";

    window.tldr.onProgress((line) => appendLog(line));

    const result = await window.tldr.pullModel();

    if (!result.success) {
        heading.textContent = "Download failed";
        subtext.textContent = result.error || "Something went wrong. Please try again.";
        setPrimary("Retry", true);
        state = "need-model";
        return;
    }

    setStep(s2, "done");
    await finish();
}

async function finish() {
    state = "finishing";
    setStep(s3, "active");
    heading.textContent = "Starting services";
    subtext.textContent = "Almost there — starting the local server…";
    setPrimary("Starting…", false);

    const result = await window.tldr.finish();

    if (!result.success) {
        heading.textContent = "Something went wrong";
        subtext.textContent = "Could not start the server. Check that port 8712 is free.";
        setPrimary("Try again", true);
        state = "ready";
        return;
    }

    setStep(s3, "done");
    state = "done";
    heading.textContent = "You're all set!";
    subtext.textContent = "TLDR Local is running in your system tray. Install the browser extension and you're good to go.";
    setPrimary("✓ Finish", true);
    btnPrimary.onclick = () => {}; // already finished, button just closes
}

// ── Boot ──────────────────────────────────────────────────────────────────────

(async () => {
    const result = await window.tldr.start();

    if (result.step === "no-ollama") {
        state = "no-ollama";
        setStep(s1, "active");
        heading.textContent = "Ollama not found";
        subtext.textContent = "Ollama is required to run AI models locally. It's free and takes about a minute to install.";
        document.getElementById("s1-detail").textContent = "Not installed";
        btnSec.style.display = "block";
        btnSec.textContent = "Open Ollama website";
        setPrimary("I've installed Ollama — retry", true);
        btnPrimary.onclick = async () => {
            heading.textContent = "Checking again…";
            setPrimary('<span class="status-dot spin"></span> Checking…', false);
            const r2 = await window.tldr.start();
            handleStartResult(r2);
        };
        return;
    }

    handleStartResult(result);
})();

function handleStartResult(result) {
    if (result.step === "no-ollama") {
        state = "no-ollama";
        setStep(s1, "active");
        heading.textContent = "Ollama not found";
        subtext.textContent = "Ollama is required. Please install it first, then come back.";
        btnSec.style.display = "block";
        btnSec.textContent = "Open Ollama website";
        setPrimary("I've installed it — retry", true);
        btnPrimary.onclick = async () => {
            const r = await window.tldr.start();
            handleStartResult(r);
        };
        return;
    }

    if (result.step === "need-model") {
        state = "need-model";
        setStep(s1, "done");
        setStep(s2, "active");
        document.getElementById("s1-detail").textContent = "Found ✓";
        heading.textContent = "Almost ready";
        subtext.textContent = "Ollama is installed. We just need to download the AI model (~5 GB).";
        setPrimary("Download model", true);
        return;
    }

    if (result.step === "ready") {
        state = "ready";
        setStep(s1, "done");
        setStep(s2, "done");
        document.getElementById("s1-detail").textContent = "Found ✓";
        document.getElementById("s2-detail").textContent = "Already installed ✓";
        heading.textContent = "Ready to go";
        subtext.textContent = "Everything is in place. Click Launch to start TLDR Local.";
        setPrimary("Launch", true);
    }
}
