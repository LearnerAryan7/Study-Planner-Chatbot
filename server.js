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
// STUDY / EDUCATION FILTER
// ==========================
function isStudyRelated(msg) {
  const text = msg.toLowerCase();

  const keywords = [
    "study",
    "exam",
    "subject",
    "math",
    "maths",
    "science",
    "english",
    "physics",
    "chemistry",
    "biology",
    "history",
    "geography",
    "hours",
    "days",
    "daily",
    "prepare",
    "preparation",
    "class",
    "school",
    "college",
    "routine",
    "focus",
    "backlog",
    "revision",
    "syllabus",
    "marks",
    "semester",
    "assignment",
    "test",
    "machine",
    "learning",
    "ai",
    "coding",
    "programming",
    "dsa",
    "database",
    "algorithm",
    "planner",
    "plan",
    "motivation"
  ];

  return keywords.some(word => text.includes(word));
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
        reply: "Type something and let’s build your comeback 😏"
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
          "Hey 👋 What’s the mission today?\n\n• Exams\n• Backlog\n• Coding\n• Routine\n• Productivity"
      });
    }

    // Allow numbers + study keywords
    if (!isStudyRelated(message) && !/\d+/.test(message)) {
      return res.json({
        reply:
          "I’m built for study planning only 📚 Ask me about exams, backlog, routine, focus, timetable or subjects."
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
You are a premium AI assistant for students.

You help with:
- exams
- backlog recovery
- study plans
- coding roadmap
- productivity
- motivation
- subject guidance
- career learning paths

Tone:
- smart
- practical
- concise
- motivating
- modern
- human

Rules:
- Give useful answers
- Be concise unless detailed answer requested
- Use bullets where useful
- Personalize replies
- No fake assumptions
- No hallucinations

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
                "You are a premium AI assistant focused on studies, coding, exams, productivity and planning. Never invent facts."
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

    saveChat("Bot", reply);

    return res.json({ reply });

  } catch (error) {
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