import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

///
// 🧠 BASE SYSTEM PROMPT
///
const baseSystemPrompt = `You are StudyAI.

You can act in TWO modes:

1. STUDY MODE:
- explain concepts clearly
- help with homework
- give examples

2. CASUAL CHAT MODE:
- talk like a normal friend
- no teaching tone
- no “how can I help you”
- no repeating questions
- just natural conversation

RULES:
- detect user intent automatically
- if user is casual → be casual
- if user is academic → be tutor
- avoid repeating the same greeting
`;
///
// 🎯 MODE PROMPTS
///
const modePrompts = {
  friend: `
Talk like a friendly human.

- Be casual and natural
- Use phrases like "basically", "think of it like"
- Keep answers simple
- Avoid robotic explanations
`,
  coding: "Give working code first, then explain simply.",
  theory: "Explain concepts deeply but clearly.",
  math: "Solve step-by-step with clear reasoning.",
  exam: "Give short, exam-focused answers.",
};

///
// ⚙️ MODEL SETTINGS (DYNAMIC)
///
function getModelSettings(mode) {
  switch (mode) {
    case "friend":
      return { temperature: 0.85, top_p: 0.95 };
    case "coding":
      return { temperature: 0.3, top_p: 0.6 };
    case "math":
      return { temperature: 0.2, top_p: 0.5 };
    case "exam":
      return { temperature: 0.4, top_p: 0.7 };
    default:
      return { temperature: 0.6, top_p: 0.8 };
  }
}

///
// 🏠 HEALTH CHECK
///
app.get("/", (req, res) => {
  res.json({ status: "Study AI backend running!" });
});

///
// 🤖 TEXT AI
///

app.post("/api/ask", async (req, res) => {
  console.log("🔥 /api/ask HIT");

  try {
    const { messages, mode = "friend" } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array required" });
    }

    const systemMessage = {
      role: "system",
      content:
        baseSystemPrompt +
        "\nMODE:\n" +
        (modePrompts[mode] || modePrompts.friend),
    };

    const finalMessages = [systemMessage];

    // ✅ FIX: define BEFORE fetch
    const { temperature, top_p } = getModelSettings(mode);

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
          messages: finalMessages,
          temperature,
          top_p,
          max_tokens: 1500,
          frequency_penalty: 0.3,
          presence_penalty: 0.4,
        }),
      },
    );

    // ✅ SAFE CHECK
    const text = await response.text();

    if (!response.ok) {
      console.error("Groq API Error:", text);
      return res.status(500).json({ error: text });
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("❌ Invalid JSON:", text);
      return res.status(500).json({ error: "Invalid API response" });
    }

    if (!data?.choices?.[0]?.message?.content) {
      console.error("Invalid response:", data);
      return res.status(500).json({ error: "Invalid AI response" });
    }

    res.json({
      answer: data.choices[0].message.content,
    });
  } catch (err) {
    console.error("🔥 Server Crash:", err);
    res.status(500).json({ error: err.message });
  }
});

///
// 🖼️ IMAGE AI (UNCHANGED BUT SAFE)
///
app.post("/api/ask", async (req, res) => {
  console.log("🔥 /api/ask HIT");

  try {
    const { messages, mode = "friend" } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array required" });
    }

    // 🧠 system message
    const systemMessage = {
      role: "system",
      content:
        baseSystemPrompt +
        "\nMODE:\n" +
        (modePrompts[mode] || modePrompts.friend),
    };

    // ✅ FIX: include USER messages properly
    const safeMessages = messages
      .filter(
        (m) =>
          m &&
          typeof m.role === "string" &&
          typeof m.content === "string" &&
          m.content.trim() !== "",
      )
      .slice(-20);

    const finalMessages = [systemMessage, ...safeMessages];

    const { temperature, top_p } = getModelSettings(mode);

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
          messages: finalMessages,
          temperature,
          top_p,
          max_tokens: 1200,
        }),
      },
    );

    const text = await response.text();

    if (!response.ok) {
      console.error("❌ Groq Error:", text);
      return res.status(500).json({ error: text });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: "Invalid JSON from AI" });
    }

    const answer = data?.choices?.[0]?.message?.content;

    if (!answer) {
      return res.status(500).json({ error: "Empty AI response" });
    }

    res.json({ answer });
  } catch (err) {
    console.error("🔥 Server Crash:", err);
    res.status(500).json({ error: err.message });
  }
});

///
// 🚀 START SERVER
///
app.listen(PORT, () => {
  console.log(`✅ Study AI backend running on http://localhost:${PORT}`);
});
34;
