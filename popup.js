const enabledCheckbox = document.getElementById("enabled");

function loadSettings() {
    chrome.storage.local.get(["enabled"], (result) => {
        enabledCheckbox.checked = result.enabled !== false;
    });
}

function saveSettings() {
    chrome.storage.local.set({
        enabled: enabledCheckbox.checked
    });
}

enabledCheckbox.addEventListener("change", saveSettings);

document.addEventListener("DOMContentLoaded", loadSettings);
