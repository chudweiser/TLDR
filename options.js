const limit = document.getElementById("limit");
const status = document.getElementById("status");

chrome.storage.local.get({ limit: 500 }, data => {
    limit.value = data.limit;
});

document.getElementById("save").onclick = () => {
    chrome.storage.local.set({ limit: Number(limit.value) }, () => {
        status.style.display = "block";
        setTimeout(() => status.style.display = "none", 3000);
    });
};
