chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {

        if (request.type !== "summarize")
            return false;

        fetch(
            "http://127.0.0.1:8712/summarize",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                    "application/json"
                },
                body: JSON.stringify({
                    text: request.text
                })
            }
        )
        .then((response) => response.json())
        .then((data) => {
            sendResponse(data);
        })
        .catch((error) => {
            console.error(error);

            sendResponse({
                summary: null
            });
        });

        return true;
    }
);
