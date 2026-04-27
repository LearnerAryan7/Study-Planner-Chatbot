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
 if (chats.length > 12) chats.shift();
}

function isGreeting(msg) {
 const text = msg.toLowerCase().trim();
 return ["hi", "hello", "hey", "hii", "yo"].includes(text);
}

function isStudyRelated(msg) {
 const text = msg.toLowerCase();

 const words = [
   "study",
   "exam",
   "backlog",
   "math",
   "maths",
   "subject",
   "routine",
   "revision",
   "syllabus",
   "college",
   "school",
   "marks",
   "focus",
   "physics",
   "chemistry",
   "biology",
   "english",
   "history",
   "geography",
   "semester",
   "assignment",
   "test",
   "plan",
   "planner",
   "hours",
   "motivation"
 ];

 return words.some(word => text.includes(word));
}

// ==========================
// ROUTE
// ==========================
app.post("/chat", async (req, res) => {
 try {
   const message = req.body.message?.trim();

   if (!message) {
     return res.json({
       reply: "Type something and let’s build your study comeback 😏"
     });
   }

   if (!API_KEY) {
     return res.json({
       reply: "Groq API key missing. Add it inside .env file."
     });
   }

   // greeting
   if (isGreeting(message)) {
     return res.json({
       reply:
         "Hey 👋 What’s the mission today?\n\n• Exams\n• Backlog recovery\n• Weak subject\n• Daily routine"
     });
   }

   // study filter
   if (!isStudyRelated(message)) {
     return res.json({
       reply:
         "I’m built for study planning only 📚 Ask me about exams, backlog, routine, focus, timetable or subjects."
     });
   }

   // memory
   saveChat("User", message);

   const history = chats.join("\n");

   // ==========================
   // PROMPT
   // ==========================
   const prompt = `
You are Study Planner AI.

Identity:
You are a premium AI study coach for students.

Tone:
- Smart senior helping a junior
- Friendly and motivating
- Sharp, modern, human
- Never robotic
- Never repetitive

You help with:
- exam preparation
- backlog recovery
- weak subjects
- daily study routine
- productivity
- focus issues
- revision plans
- motivation
- realistic scheduling

Strict Rules:
- Only answer study-related topics
- Ignore unrelated questions politely
- Keep replies concise unless user asks detailed answer
- Usually 4 to 8 lines
- Use bullets / spacing when useful
- Personalize replies
- Ask follow-up when useful
- No fake assumptions
- No hallucinations
- No scolding tone
- Sound premium and practical

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
               "You are a premium AI study planner. Only discuss studies, exams, productivity and academic planning. Never invent context."
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

   saveChat("Bot", reply);

   return res.json({ reply });

 } catch (error) {
   console.log("ERROR:");
   console.log(error);

   return res.json({
     reply:
       "AI is unavailable right now ⚠️ Tell me exam date, subjects and daily hours. I’ll still guide you."
   });
 }
});

// ==========================
// START
// ==========================
app.listen(PORT, () => {
 console.log(`🚀 Server running on http://localhost:${PORT}`);
});
