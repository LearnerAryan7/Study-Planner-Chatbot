require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const API_KEY = process.env.GROQ_API_KEY;

// ==========================
// MEMORY
// ==========================
let chats = [];

// ==========================
// HELPERS
// ==========================
function saveChat(role, text) {
  chats.push(`${role}: ${text}`);

  if (chats.length > 12) {
    chats.shift();
  }
}

function isGreeting(msg) {
  const text = msg.toLowerCase().trim();

  return ["hi", "hello", "hey", "hii", "yo"].includes(text);
}

// ==========================
// ROUTE
// ==========================
app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message?.trim();

    // empty input
    if (!message) {
      return res.json({
        reply: "Type something and let’s get started 😏"
      });
    }

    // api key check
    if (!API_KEY) {
      return res.json({
        reply: "Groq API key missing. Add it inside .env file."
      });
    }

    // greeting shortcut
    if (isGreeting(message)) {
      return res.json({
        reply:
          "Hey 👋 I’m ready.\nAsk me anything about studies, productivity, coding, career or planning."
      });
    }

    // save user chat
    saveChat("User", message);

    const history = chats.join("\n");

    // ==========================
    // PROMPT
    // ==========================
    const prompt = `
You are Study Planner AI.

Identity:
You are a premium AI assistant.

Core Strengths:
- studies
- exams
- productivity
- planning
- coding help
- career guidance
- motivation
- smart explanations

Tone:
- friendly
- modern
- practical
- human
- sharp
- never robotic

Rules:
- Give clear and useful answers
- Be concise unless detailed answer is requested
- Use bullets when useful
- Personalize when possible
- If user asks anything outside studies, still help politely
- Never invent fake facts
- Never act rude

Recent Chat:
${history}

Current User Message:
${message}
`;

    // ==========================
    // API CALL
    // ==========================
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are a premium AI assistant focused on studies, productivity, planning, coding, and helpful guidance. Handle any user query intelligently. Never invent facts."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 350
        })
      }
    );

    const data = await response.json();

    console.log("GROQ RESPONSE:");
    console.log(JSON.stringify(data, null, 2));

    let reply =
      "Hmm, something glitched. Ask me again and we’ll recover nicely 😏";

    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      reply = data.choices[0].message.content.trim();
    }

    // save bot reply
    saveChat("Bot", reply);

    return res.json({ reply });

  } catch (error) {
    console.log("ERROR:");
    console.log(error);

    return res.json({
      reply:
        "AI is unavailable right now ⚠️ Try again in a moment."
    });
  }
});

// ==========================
// START
// ==========================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});