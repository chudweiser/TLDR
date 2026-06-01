console.log("TLDR content script loaded");

chrome.storage.local.get(
    {
        enabled: true,
        mode: "annotate",
        limit: 500
    },
    (settings) => {

        console.log("Settings:", settings);

        if (!settings.enabled) {
            console.log("TLDR disabled");
            return;
        }

        // Track already-processed paragraphs to avoid duplicates
        const processed = new WeakSet();

        function processParagraph(paragraph) {

            if (processed.has(paragraph))
                return;

            const text = paragraph.innerText?.trim();

            if (!text)
                return;

            if (text.length < settings.limit)
                return;

            processed.add(paragraph);

            console.log(
                "Long paragraph found:",
                text.substring(0, 100)
            );

            chrome.runtime.sendMessage(
                {
                    type: "summarize",
                    text
                },
                (response) => {

                    if (!response) {
                        console.error("No response");
                        return;
                    }

                    if (!response.summary) {
                        console.error("No summary");
                        return;
                    }

                    if (settings.mode === "replace") {

                        const original = text;

                        paragraph.innerHTML = "";

                        const summary = document.createElement("div");
                        summary.textContent = response.summary;

                        const button = document.createElement("button");
                        button.textContent = "Show Original";

                        button.addEventListener("click", () => {
                            paragraph.textContent = original;
                        });

                        paragraph.appendChild(summary);
                        paragraph.appendChild(button);

                    } else {

                        const tldr = document.createElement("div");

                        tldr.innerHTML =
                        "<em>TL;DR: " +
                        response.summary +
                        "</em>";

                        tldr.style.marginTop = "8px";
                        tldr.style.padding = "4px";
                        tldr.style.borderLeft = "3px solid #888";

                        paragraph.after(tldr);
                    }
                }
            );
        }

        function scanAll() {
            document.querySelectorAll("p").forEach(processParagraph);
        }

        // Initial scan
        console.log("Scanning page");
        scanAll();

        // Watch for dynamically loaded content (Reddit, SPAs, etc.)
        const observer = new MutationObserver(() => {
            scanAll();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
);
