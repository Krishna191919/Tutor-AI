const HISTORY_KEY = "studyAI_history";

// GET
// =======================
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

// SAVE (ONLY )
// =======================
function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// RENDER
// =======================
function renderHistory() {
  const history = getHistory();
  const list = document.getElementById("history-list");

  if (!list) return;

  if (history.length === 0) {
    list.innerHTML = "<p>No chats yet</p>";
    return;
  }

  list.innerHTML = history
    .map((chat, i) => {
      let firstMsg = "New Chat";

      if (chat.messages && Array.isArray(chat.messages)) {
        const msg = chat.messages.find((m) => m.role === "user");
        if (msg) firstMsg = msg.content;
      } else if (chat.question) {
        // support old format
        firstMsg = chat.question;
      }

      return `
        <div class="history-item">
          <div onclick="loadHistoryItem(${i})">
            ${firstMsg.slice(0, 40)}
          </div>
          <button 
            class="delete-btn"
            onclick="deleteHistoryItem(${i}, event)"
          >🗑</button>
        </div>
      `;
    })
    .join("");
}

// LOAD CHAT
// =======================
function loadHistoryItem(index) {
  const history = getHistory();
  const chat = history[index];
  if (!chat) return;

  activeChat = {
    id: chat.id,
    messages: [...chat.messages],
  };

  document.getElementById("chatMessages").innerHTML = "";

  chat.messages.forEach((msg) => {
    appendMessage(msg.role, msg.content);
  });
}

// DELETE CHAT
// =======================
function deleteHistoryItem(index, e) {
  e.stopPropagation();

  const history = getHistory();
  history.splice(index, 1);

  saveHistory(history);
  renderHistory();
}

// =======================
// SAVE CURRENT CHAT
// =======================
function saveCurrentChat() {
  const history = getHistory();

  if (!activeChat || !activeChat.messages || activeChat.messages.length === 0) {
    return;
  }

  const existingIndex = history.findIndex((chat) => chat.id === activeChat.id);

  if (existingIndex !== -1) {
    history[existingIndex] = activeChat;
  } else {
    history.unshift(activeChat);
  }

  saveHistory(history); // ✅ cleaner
  renderHistory();
}
