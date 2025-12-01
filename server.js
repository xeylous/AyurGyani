import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sendRecommendation } from "./mailer.js";
import { BASE_PROMPT } from "./promptTemplate.js";
import { CONTINUE_PROMPT } from "./continuePrompt.js";
import cors from "cors"; // Added CORS import

dotenv.config();
const app = express();

// --- CORS Configuration ---
const allowedOrigins = [
  "https://ayur-sathi.vercel.app",
  "http://localhost:3000"
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl) or if the origin is in the allowed list
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS Error: Origin ${origin} not allowed.`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));
// --------------------------

app.use(express.json());

// AI Model
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// In-memory session storage
let conversationState = {};

//ping route for keeping server awake
app.get("/ping", (req, res) => {
  console.log(`🔄 Ping received at: ${new Date().toISOString()}`);
  res.status(200).send("💚 AyurSathi server is active");
});

// Health Route (monitoring/uptime check)
app.get("/health", (req, res) => {
  console.log(`🩺 Health check at ${new Date().toISOString()}`);
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});


app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const userId = req.body.userId || "guest_" + Date.now();

  if (!conversationState[userId]) {
    conversationState[userId] = { step: "greet" };
  }

  let state = conversationState[userId];
  let response = "";

  try {
    switch (state.step) {
      case "greet":
        response = "Namaste 🙏 Welcome to AyurSathi! What is your good name?";
        state.step = "ask_name";
        break;

      case "ask_name":
        state.name = userMessage;
        response = `Nice to meet you, ${state.name}! How can i help you?`;
        state.step = "ask_problem";
        break;

      case "ask_problem":
        state.problem = userMessage;
        const firstResponse = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: `${BASE_PROMPT}\n\nUser Input: ${userMessage}` }],
            },
          ],
        });
        response = firstResponse.response.text();
        state.step = "conversation";
        break;

      case "conversation":
        // If user wants to end the conversation
        if (
          userMessage.toLowerCase().includes("thank you") ||
          userMessage.toLowerCase().includes("thanks") ||
          userMessage.toLowerCase().includes("bye")
        ) {
          response = `You're most welcome, ${state.name} 🌿  Wishing you peace, balance, and good health. Take care 💚`;
          delete conversationState[userId];
          break;
        }

        // AI continues guiding based on the new message
        const chatResponse = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: `${CONTINUE_PROMPT}\n\nUser Input: ${userMessage}` }],
            },
          ],
        });
        response = chatResponse.response.text();
        break;

      default:
        response = "Namaste 🌿 Let's start fresh. What is your good name?";
        state.step = "ask_name";
    }
  } catch (error) {
    console.error("Error:", error);
    response = "Something went wrong, but don't worry — we will continue shortly 🌿";
  }

  res.json({ reply: response, step: state.step });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AyurSathi AI running on port ${PORT} 🚀`));