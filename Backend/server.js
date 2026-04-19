import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" })); // 10mb for image uploads

//  Prompt Enhancement Function
function enhancePrompt(question) {
  // If question is very short, enhance it naturally
  if (question.length < 50) {
    return (
      question +
      "\n\nCould you explain this in a way that helps me really understand it? It would help to know: What does this actually mean? Why should I care? Can you give me a good example?"
    );
  }

  // If question lacks clarity, ask for more context
  if (
    !question.includes("?") &&
    !question.toLowerCase().includes("explain") &&
    !question.toLowerCase().includes("how") &&
    !question.toLowerCase().includes("why") &&
    !question.toLowerCase().includes("what")
  ) {
    return (
      question +
      "\n\nHelp me understand this better with examples and real-world applications."
    );
  }

  return question;
}

//  Health check
app.get("/", (req, res) => {
  res.json({ status: "Study AI backend running!" });
});

//  Groq — text questions
app.post("/api/ask", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array required" });
    }

    // Enhance the latest user message
    const enhancedMessages = [...messages];
    if (enhancedMessages.length > 0) {
      const lastMsg = enhancedMessages[enhancedMessages.length - 1];
      if (lastMsg.role === "user" && typeof lastMsg.content === "string") {
        lastMsg.content = enhancePrompt(lastMsg.content);
      }
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + process.env.GROQ_KEY,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: enhancedMessages,
          temperature: 0.5,
          top_p: 0.7,
          max_tokens: 1500,
        }),
      },
    );

    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });
    res.json({ answer: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//  Gemini — image questions
app.post("/api/ask-image", async (req, res) => {
  try {
    const { question, base64, mimeType } = req.body;

    if (!base64 || !mimeType) {
      return res.status(400).json({ error: "base64 and mimeType required" });
    }

    let prompt =
      question ||
      "Please read this question carefully and solve it step by step.";

    // Enhance the prompt for better results
    prompt = enhancePrompt(prompt);

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" +
        process.env.GEMINI_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType, data: base64 } },
              ],
            },
          ],
        }),
      },
    );

    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });
    res.json({ answer: data.candidates[0].content.parts[0].text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Study AI backend running on http://localhost:${PORT}`);
});
