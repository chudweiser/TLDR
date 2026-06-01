const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const OLLAMA_URL = "http://127.0.0.1:11434/api/chat";

app.post("/summarize", async (req, res) => {
    try {
        const { text } = req.body;

        const response = await fetch(OLLAMA_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "qwen2.5:7b-instruct",
                messages: [
                    {
                        role: "system",
                        content: "You are a concise summarizer. Output only 1-2 sentences. No commentary."
                    },
                    {
                        role: "user",
                        content: text
                    }
                ],
                stream: false
            })
        });

        const data = await response.json();

        const summary =
        data?.message?.content || null;

        if (!summary) {
            console.error("Bad Ollama response:", data);

            return res.status(500).json({
                error: "No summary returned",
                raw: data
            });
        }

        res.json({ summary });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "summarization failed"
        });
    }
});

app.listen(8712, () => {
    console.log("TLDR server running on http://127.0.0.1:8712");
});
