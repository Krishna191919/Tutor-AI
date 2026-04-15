//  history.js — Save, load, render history

const HISTORY_KEY = "studyAI_history";

//  Save
function saveToHistory(question, answer) {
  const history = getHistory();
  history.unshift({
    id: Date.now(),
    question: question,
    answer: answer,
    time: new Date().toLocaleString(),
  });
  // Keep max 50 items
  if (history.length > 50) history.pop();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

//  Get all
function getHistory() {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Render in sidebar
function renderHistory() {
  const history = getHistory();
  const list = document.getElementById("history-list");
  if (!list) return;

  if (history.length === 0) {
    list.innerHTML = '<p class="no-history">No history yet</p>';
    return;
  }

  list.innerHTML = history
    .map(
      (item, index) => `
    <div class="history-item" id="hist-${index}" onmouseenter="showHistoryMenu(${index})" onmouseleave="hideHistoryMenu(${index})">
      <div class="history-content" onclick="loadHistoryItem(${index})">
        <div class="history-question">${escapeHTML(item.question.substring(0, 38))}${item.question.length > 38 ? "…" : ""}</div>
        <div class="history-time">${item.time}</div>
      </div>
      <button class="history-menu-btn hidden" id="menu-${index}" onclick="deleteHistoryItem(${index}, event)" title="Delete chat">⋯</button>
    </div>
  `,
    )
    .join("");
}

// Show menu on hover
function showHistoryMenu(index) {
  const btn = document.getElementById(`menu-${index}`);
  if (btn) btn.classList.remove("hidden");
}

// Hide menu on leave
function hideHistoryMenu(index) {
  const btn = document.getElementById(`menu-${index}`);
  if (btn) btn.classList.add("hidden");
}

// Delete individual chat
function deleteHistoryItem(index, event) {
  event.stopPropagation(); // Prevent loading chat when deleting
  const history = getHistory();
  history.splice(index, 1);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}

// Load item into chat
function loadHistoryItem(index) {
  const history = getHistory();
  const item = history[index];
  if (!item) return;

  // Reset conversation with this item
  conversationMessages = [
    { role: "user", content: item.question },
    { role: "assistant", content: item.answer },
  ];

  // Switch to chat screen and render
  switchToChatScreen();
  const chatArea = document.getElementById("chatMessages");
  chatArea.innerHTML = "";
  appendMessage("user", item.question);
  appendMessage("assistant", item.answer);

  // Mark active
  document.querySelectorAll(".history-item").forEach((el, i) => {
    el.classList.toggle("active", i === index);
  });

  // Show read button
  document.getElementById("readBtn").classList.remove("hidden");
}

// Clear all
function clearHistory() {
  if (confirm("Clear all history? This cannot be undone.")) {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  }
}

// Show menu on hover
function showHistoryMenu(index) {
  const btn = document.getElementById(`menu-${index}`);
  if (btn) btn.classList.remove("hidden");
}

// Hide menu on leave
function hideHistoryMenu(index) {
  const btn = document.getElementById(`menu-${index}`);
  if (btn) btn.classList.add("hidden");
}

// Delete individual chat
function deleteHistoryItem(index, event) {
  event.stopPropagation(); // Prevent loading chat when deleting
  const history = getHistory();
  history.splice(index, 1);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}

//  Helper
function escapeHTML(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
