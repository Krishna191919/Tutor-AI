//  app.js — Main controller
// Ties api.js + history.js + ui.js together

let conversationMessages = [];
let currentImageBase64 = null;
let currentImageType = null;
let currentTeachingMode = "friend"; // Default mode: 'friend', 'coding', 'theory', 'math', 'exam'

//  Set teaching mode
function setTeachingMode(mode) {
  currentTeachingMode = mode;
  // Highlight active mode button
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.getAttribute("data-mode") === mode) {
      btn.classList.add("active");
    }
  });
}

//  Init
window.onload = function () {
  renderHistory();
};

//  New Chat
function newChat() {
  conversationMessages = [];
  clearQuestionInputs();
  clearImage();
  clearDocument();
  switchToWelcomeScreen();
  document.getElementById("readBtn").classList.add("hidden");
  document.getElementById("chatMessages").innerHTML = "";

  // Remove active from history
  document.querySelectorAll(".history-item").forEach((el) => {
    el.classList.remove("active");
  });
}

//  Handle image upload
function handleImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const base64 = e.target.result;
    currentImageBase64 = base64.split(",")[1];
    currentImageType = file.type;
    showImagePreview(base64);
  };
  reader.readAsDataURL(file);
}

function clearImage() {
  currentImageBase64 = null;
  currentImageType = null;
  hideImagePreviews();
  document
    .querySelectorAll("input[type='file']")
    .forEach((i) => (i.value = ""));
}

//  Main ask function
async function askAI() {
  const questionEl = getActiveQuestion();
  const question = questionEl.value.trim();

  if (!question && !currentImageBase64) {
    questionEl.focus();
    return;
  }

  // Switch to chat screen if on welcome
  switchToChatScreen();

  // Show user message
  appendMessage("user", question || "📷 Image question");

  // Clear input and image
  clearQuestionInputs();
  const imageBase64 = currentImageBase64;
  const imageType = currentImageType;
  clearImage();

  setSendLoading(true);
  showThinking();

  try {
    let answer;

    if (imageBase64) {
      // Mode-specific system prompts
      const modePrompts = {
        friend:
          "You are a thoughtful, knowledgeable learning companion. Explain concepts naturally and conversationally, like you're talking to a friend. Be genuine and warm. Think through things step-by-step. Use good analogies and real examples. Help them understand WHY something matters and HOW to use it. Be encouraging but honest.",
        coding:
          "You are an expert coding mentor. Focus on practical, working code examples. Show the code first, then explain it. Include best practices, common pitfalls, and debugging tips. Write clean, well-commented code. Be direct and technical but still friendly. Show real-world use cases.",
        theory:
          "You are a theoretical expert who loves deep concepts. Explain fundamental principles, not just how things work. Use formal definitions and concepts. Show underlying mathematics or logic. Reference key theorems, models, or frameworks. Be precise and academic but make it understandable.",
        math: "You are a mathematics tutor. Show formulas, derivations, and proofs. Use mathematical notation clearly. Walk through calculations step-by-step, explaining WHY each step works. Include diagrams when helpful. Share common calculation mistakes. Be rigorous and precise.",
        exam: "You are an exam prep tutor. Test their understanding with follow-ups. Point out common mistakes exam takers make. Teach exam strategies and time management. Focus on what's likely on tests. Be supportive but challenging. Help them practice, not just memorize.",
      };

      // Add base system prompt based on mode
      requestMessages.push({
        role: "system",
        content: modePrompts[currentTeachingMode] || modePrompts.friend,
      });
      conversationMessages.push({ role: "assistant", content: answer });
    } else {
      conversationMessages.push({ role: "user", content: question });

      const requestMessages = [];

      // Always add base system prompt
      requestMessages.push({
        role: "system",
        content:
          "You are a thoughtful, knowledgeable learning companion. You explain concepts naturally and conversationally, like you're talking to a friend. Be genuine and warm. When someone asks something, think through it carefully and explain your reasoning step-by-step so they can follow along. Use good analogies and real examples to make ideas stick. Don't just give facts—help them understand WHY something matters and HOW to use it. Be encouraging but honest. Use clear formatting with headings, bullet points, and examples. End with a helpful tip or something to think about next.",
      });

      // Add document context if uploaded
      if (uploadedDocuments && uploadedDocuments.length > 0) {
        const docContext = uploadedDocuments
          .map(
            (doc) =>
              `**${doc.name}** (${countWords(doc.text)} words):\n${doc.text}`,
          )
          .join("\n\n---\n\n");

        requestMessages.push({
          role: "system",
          content:
            uploadedDocuments.length > 1
              ? `You're helping a student who uploaded multiple documents: ${uploadedDocuments.map((d) => `"${d.name}"`).join(", ")}. Think through these materials thoughtfully. Draw connections between them naturally. Explain what they have in common, where they differ, and what the student can learn from comparing them. Be conversational and help them see the bigger picture. Use the documents as your reference, and share insights like you're thinking through this together.\n\n${docContext.substring(0, 18000)}`
              : `You're helping a student with "${uploadedDocuments[0].name}". This is their learning material, so reference it naturally when answering. Explain things clearly, share insights you find in it, and help them understand the deeper meaning. Be conversational like you're working through this together.\n\n${docContext.substring(0, 18000)}`,
        });
      }

      requestMessages.push(...conversationMessages);
      answer = await callGroq(requestMessages);
      conversationMessages.push({ role: "assistant", content: answer });
    }
    removeThinking();
    appendMessage("assistant", answer);

    // Show read aloud button
    document.getElementById("readBtn").classList.remove("hidden");

    // Save to history
    saveToHistory(question || "Image question", answer);
    renderHistory();
  } catch (err) {
    removeThinking();
    appendMessage("assistant", "⚠️ Error: " + err.message);
  } finally {
    setSendLoading(false);
  }
}
