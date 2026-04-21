//  api.js — All API calls go through our backend

const BACKEND = "http://localhost:3000";

//  Groq via backend (text questions)
async function callGroq(messages, mode) {
  const response = await fetch(`${BACKEND}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      mode, // IMPORTANT ADD THIS
    }),
  });

  const data = await response.json();
  return data.answer;
}
//  Gemini via backend (image questions)
async function callGemini(question, base64, mimeType) {
  const response = await fetch(`${BACKEND}/api/ask-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, base64, mimeType }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.answer;
}
