require("dotenv").config();
const express = require("express");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();
app.use(express.json());

// Only share these files (keeps .env safe)
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/index.html", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/style.css", (req, res) => res.sendFile(path.join(__dirname, "style.css")));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// If a model errors, only edit these two lines
const FAST = "gemini-3.1-flash-lite-preview";
const STRONG = "gemini-3.5-flash";

const SYSTEM_PROMPT = `You are Inferno AI, a friendly and clear assistant.
Reply like ChatGPT or Claude: direct, short, easy to read.
RULES:
- Give the answer first or very early. No long intros.
- For math: show ONE short method with a few numbered steps, then a final answer line. Do not add extra methods unless asked.
- Write math in plain text only: x², √25, π, ±, ×, ÷, →, and fractions like (5 + 1) / 2.
- NEVER use LaTeX. Never use the $ sign, never use backslashes like \\frac, \\sqrt, \\pm, \\Rightarrow, \\mathbf.
- Use short paragraphs and simple bullet points. Use bold only for key words.
- Keep answers as short as possible while still being correct.`;

// Only hard questions use the slower STRONG model
function pickModel(text) {
  const hard = /(prove|proof|derive|debug|algorithm|optimi[sz]e|step by step in detail|complexity|integral|differential)/i;
  return text.length > 400 || hard.test(text) ? STRONG : FAST;
}

// Safety net: turns leftover LaTeX into plain symbols
function cleanText(t) {
  return t
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1) / ($2)")
    .replace(/\\sqrt\{([^{}]*)\}/g, "√($1)")
    .replace(/\\(?:mathbf|text|mathrm)\{([^{}]*)\}/g, "$1")
    .replace(/\\pm/g, "±")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\(?:Rightarrow|rightarrow|to)/g, "→")
    .replace(/\\pi/g, "π")
    .replace(/\\cdot/g, "·")
    .replace(/\$+/g, "");
}

async function askModel(model, text) {
  const result = await ai.models.generateContent({
    model,
    contents: text,
    config: { systemInstruction: SYSTEM_PROMPT, temperature: 0.4 },
  });
  return result.text;
}

async function handleChat(req, res) {
  try {
    const body = req.body || {};
    const text = String(body.message || body.prompt || body.question || "").trim();
    if (!text) return res.status(400).json({ error: "Please type a question." });

    const first = pickModel(text);
    const second = first === FAST ? STRONG : FAST;

    let answer;
    try {
      answer = await askModel(first, text);
    } catch (e) {
      console.log("First model failed:", first, "-", e.message);
      answer = await askModel(second, text);
    }

    const reply = cleanText(answer || "Sorry, I got an empty answer. Try again.");
    res.json({ reply, response: reply, answer: reply, text: reply });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Something went wrong. Please try again in a moment." });
  }
}

app.post(["/chat", "/api/chat", "/ask", "/api/ask", "/generate"], handleChat);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Inferno AI running at http://localhost:${PORT}`));