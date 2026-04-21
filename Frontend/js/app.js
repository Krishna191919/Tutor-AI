// =======================
// APP CONTROLLER (FIXED)
// =======================

let activeChat = {
  id: Date.now(),
  messages: [],
};

let currentImageBase64 = null;
let currentImageType = null;
let currentTeachingMode = "friend";

// =======================
// SET MODE
// =======================
function setTeachingMode(mode) {
  currentTeachingMode = mode;

  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.classList.remove("active");
    if (btn.getAttribute("data-mode") === mode) {
      btn.classList.add("active");
    }
  });
}

// =======================
// INIT
// =======================
window.onload = function () {
  renderHistory();
};

// =======================
// NEW CHAT (SAVE OLD)
// =======================
function newChat() {
  const history = getHistory();

  if (activeChat.messages.length > 0) {
    history.unshift(activeChat);
    localStorage.setItem("chatHistory", JSON.stringify(history));
  }

  activeChat = {
    id: Date.now(),
    messages: [],
  };

  document.getElementById("chatMessages").innerHTML = "";
  clearQuestionInputs();
  clearImage();
  switchToWelcomeScreen();

  renderHistory();
}

// =======================
// IMAGE HANDLER
// =======================
function handleImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    currentImageBase64 = e.target.result.split(",")[1];
    currentImageType = file.type;
    showImagePreview(e.target.result);
  };

  reader.readAsDataURL(file);
}

function clearImage() {
  currentImageBase64 = null;
  currentImageType = null;
  hideImagePreviews();
}

// =======================
// MAIN ASK FUNCTION
// =======================
async function askAI() {
  const questionEl = getActiveQuestion();
  const question = questionEl.value.trim();

  if (!question && !currentImageBase64) return;

  switchToChatScreen();

  // ✅ show user message FIRST
  appendMessage("user", question || "📷 Image question");

  clearQuestionInputs();

  const imageBase64 = currentImageBase64;
  const imageType = currentImageType;
  clearImage();

  setSendLoading(true);
  showThinking();

  try {
    let answer = "";

    // =======================
    // 🖼️ IMAGE MODE
    // =======================
    if (imageBase64) {
      answer = await callGemini(
        question || "Solve this image",
        imageBase64,
        imageType,
      );
    } else {
      // =======================
      // 💬 TEXT MODE
      // =======================
      activeChat.messages.push({ role: "user", content: question });

      const history = getHistory() || [];

      const globalMemory = history
        .flatMap((chat) => chat.messages || [])
        .slice(-20);

      const finalMessages = [
        {
          role: "system",
          content: "Use previous chats only if relevant.",
        },
        ...globalMemory,
        ...activeChat.messages,
      ];

      answer = await callGroq(finalMessages);
    }

    removeThinking();

    // ✅ SAFE fallback here (CORRECT PLACE)
    appendMessage("assistant", answer || "⚠️ No response from AI");

    // Save to conversation
    activeChat.messages.push({
      role: "assistant",
      content: answer || "No response",
    });

    // Save to history (if using)
    saveCurrentChat();

    document.getElementById("readBtn").classList.remove("hidden");
  } catch (err) {
    removeThinking();

    console.error("❌ askAI error:", err);

    appendMessage("assistant", "⚠️ Error: " + err.message);
  } finally {
    setSendLoading(false);
  }
}
