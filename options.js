const limit = document.getElementById("limit");
const mode = document.getElementById("mode");

chrome.storage.local.get(
    {
        limit: 500,
        mode: "annotate"
    },
    data => {

        limit.value = data.limit;
        mode.value = data.mode;
    });

document
.getElementById("save")
.onclick = () => {

    chrome.storage.local.set({
        limit: Number(limit.value),
                            mode: mode.value
    });

    alert("Saved");
};
