// =====================================
// FINAL script.js
// Full Working Premium Version
// Replace complete script.js
// =====================================

const chatBox = document.getElementById("chatWindow");
const userInput = document.getElementById("userInput");
const sendBtn = document.querySelector(".inputBar button");





// =====================================
// ADD THIS IN script.js
// (paste above window.onload)
// REAL WORKING STREAK SYSTEM
// =====================================

function updateStreak() {
  const today = new Date().toDateString();

  let lastVisit = localStorage.getItem("lastVisit");
  let streak = parseInt(localStorage.getItem("studyStreak")) || 0;

  // first ever visit
  if (!lastVisit) {
    streak = 1;
  } else if (lastVisit !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayText = yesterday.toDateString();

    if (lastVisit === yesterdayText) {
      streak += 1; // consecutive day
    } else {
      streak = 1; // streak broken
    }
  }

  localStorage.setItem("lastVisit", today);
  localStorage.setItem("studyStreak", streak);

  const streakBox = document.getElementById("streakCount");

  if (streakBox) {
    streakBox.innerText = streak;
  }
}

// =====================================
// TIME
// =====================================
function getTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

// =====================================
// SAFE HTML
// =====================================
function escapeHTML(text) {
  const div = document.createElement("div");
  div.innerText = text;
  return div.innerHTML;
}

// =====================================
// ADD MESSAGE
// =====================================
function addMessage(text, type = "bot") {
  const row = document.createElement("div");
  row.className = `message-row ${type}`;

  const safeText = escapeHTML(text).replace(/\n/g, "<br>");

  row.innerHTML = `
    <div class="msg-wrap">
      <div class="bubble">${safeText}</div>
      <div class="time">${getTime()}</div>
    </div>
  `;

  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// =====================================
// TYPING
// =====================================
function showTyping() {
  const row = document.createElement("div");
  row.className = "message-row bot";
  row.id = "typingRow";

  row.innerHTML = `
    <div class="msg-wrap">
      <div class="bubble">Thinking...</div>
      <div class="time">${getTime()}</div>
    </div>
  `;

  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {
  const old = document.getElementById("typingRow");
  if (old) old.remove();
}

// =====================================
// BUTTON STATE
// =====================================
function setLoading(state) {
  if (state) {
    sendBtn.disabled = true;
    sendBtn.innerText = "Sending...";
    sendBtn.style.opacity = "0.7";
  } else {
    sendBtn.disabled = false;
    sendBtn.innerText = "Send ➜";
    sendBtn.style.opacity = "1";
  }
}

// =====================================
// API CALL
// =====================================
async function askBot(message) {
  try {
    const res = await fetch("https://study-planner-chatbot.onrender.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: message
      })
    });

    const data = await res.json();

    return data.reply || "No response received.";
  } catch (error) {
    return "Server unreachable ⚠️ Start backend first.";
  }
}

// =====================================
// SEND MESSAGE
// =====================================
async function handleSend() {
  const text = userInput.value.trim();

  if (!text) return;

  addMessage(text, "user");

  userInput.value = "";
  userInput.focus();

  setLoading(true);
  showTyping();

  const reply = await askBot(text);

  removeTyping();
  addMessage(reply, "bot");

  setLoading(false);
}

// =====================================
// NEW CHAT
// =====================================
function newChat() {
  chatBox.innerHTML = "";

  addMessage(
    "New chat started 🚀\nTell me your exam date, subjects, backlog or routine.",
    "bot"
  );

  userInput.focus();
}

// =====================================
// ENTER KEY
// =====================================
userInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    handleSend();
  }
});

// =====================================
// AUTO LOAD
// =====================================
window.onload = function () {
  chatBox.innerHTML = "";

 
  updateStreak();


  addMessage(
    "Hey 👋 I’m your premium Study Planner AI.\nTell me exam date, subjects, backlog or routine and I’ll build your comeback plan.",
    "bot"
  );

  userInput.focus();
};