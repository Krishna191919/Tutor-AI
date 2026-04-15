//  ui.js — All UI updates and rendering

//  Screen switching
function switchToChatScreen() {
  document.getElementById("welcomeScreen").classList.add("hidden");
  document.getElementById("chatScreen").classList.remove("hidden");
}

function switchToWelcomeScreen() {
  document.getElementById("welcomeScreen").classList.remove("hidden");
  document.getElementById("chatScreen").classList.add("hidden");
}

//  Append a chat message
function appendMessage(role, content) {
  const chatArea = document.getElementById("chatMessages");

  const div = document.createElement("div");
  div.classList.add("chat-message", role);

  if (role === "assistant") {
    div.innerHTML = marked.parse(content);
  } else {
    div.innerText = content;
  }

  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
  return div;
}

//  Thinking indicator
function showThinking() {
  const chatArea = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.classList.add("chat-message", "assistant", "thinking");
  div.id = "thinkingMsg";
  div.innerText = "Thinking…";
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function removeThinking() {
  const el = document.getElementById("thinkingMsg");
  if (el) el.remove();
}

//  Set send button state
function setSendLoading(loading) {
  const btns = document.querySelectorAll(".send-btn");
  btns.forEach((btn) => {
    btn.disabled = loading;
    btn.innerText = loading ? "…" : "↑";
  });
}

//  Get active question input
function getActiveQuestion() {
  const welcomeVisible = !document
    .getElementById("welcomeScreen")
    .classList.contains("hidden");
  const id = welcomeVisible ? "questionWelcome" : "questionChat";
  return document.getElementById(id);
}

//  Clear question inputs
function clearQuestionInputs() {
  document.getElementById("questionWelcome").value = "";
  document.getElementById("questionChat").value = "";
  // Reset heights
  document.getElementById("questionWelcome").style.height = "auto";
  document.getElementById("questionChat").style.height = "auto";
}

//  Auto resize textarea
function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 160) + "px";
}

//  Handle Enter key
function handleKey(event, screen) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    askAI();
  }
}

//  Image preview
function showImagePreview(src) {
  // Welcome screen preview
  const welcomePreview = document.getElementById("imagePreviewWelcome");
  const welcomeImg = document.getElementById("previewImgWelcome");
  welcomePreview.classList.remove("hidden");
  welcomeImg.src = src;

  // Chat screen preview
  const chatPreview = document.getElementById("imagePreviewChat");
  const chatImg = document.getElementById("previewImgChat");
  chatPreview.classList.remove("hidden");
  chatImg.src = src;
}

function hideImagePreviews() {
  document.getElementById("imagePreviewWelcome").classList.add("hidden");
  document.getElementById("imagePreviewChat").classList.add("hidden");
  document.getElementById("previewImgWelcome").src = "";
  document.getElementById("previewImgChat").src = "";
}

//  Read aloud
let isSpeaking = false;
let availableVoices = window.speechSynthesis.getVoices() || [];

// Load voices when they're ready
window.speechSynthesis.addEventListener("voiceschanged", () => {
  availableVoices = window.speechSynthesis.getVoices();
});

function readAloud() {
  const btn = document.getElementById("readBtn");
  const messages = document.querySelectorAll(
    ".chat-message.assistant:not(.thinking)",
  );
  if (messages.length === 0) return;

  const lastMessage = messages[messages.length - 1];
  const text = lastMessage.innerText;

  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    btn.innerText = "🔊 Read last answer";
    btn.classList.remove("speaking");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.lang = "en-US";

  // Set female voice
  const voices = availableVoices.length
    ? availableVoices
    : window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    availableVoices = voices;
    const femaleVoice = voices.find((voice) => {
      const name = voice.name.toLowerCase();
      return (
        name.includes("female") ||
        name.includes("woman") ||
        name.includes("zira") ||
        name.includes("samantha") ||
        name.includes("victoria") ||
        name.includes("alloy")
      );
    });
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    } else {
      utterance.voice = voices[0];
    }
  }

  utterance.onstart = () => {
    isSpeaking = true;
    btn.innerText = "⏹ Stop reading";
    btn.classList.add("speaking");
  };

  utterance.onend = () => {
    isSpeaking = false;
    btn.innerText = "🔊 Read last answer";
    btn.classList.remove("speaking");
  };

  window.speechSynthesis.speak(utterance);
}
