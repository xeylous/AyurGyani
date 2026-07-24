import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/env.js";
import { SYSTEM_AGENT_PROMPT } from "./prompts.js";
import { groqToolDeclarations, toolDeclarations, executeTool } from "../tools/index.js";
import { sessionStore } from "../memory/sessionStore.js";

// Initialize LLM Clients
let groqClient = null;
if (config.groqApiKey) {
  groqClient = new Groq({ apiKey: config.groqApiKey });
}

let geminiClient = null;
let geminiModel = null;
if (config.googleApiKey) {
  geminiClient = new GoogleGenerativeAI(config.googleApiKey);
  geminiModel = geminiClient.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_AGENT_PROMPT,
    tools: [{ functionDeclarations: toolDeclarations }]
  });
}

/**
 * Ranked preference list of Groq models (best capability & tool calling first)
 */
const PREFERRED_GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
  "gemma2-9b-it"
];

let cachedActiveGroqModels = null;
let lastModelFetchTime = 0;

/**
 * Dynamically query Groq API for active models and return ranked candidate list
 */
async function getGroqCandidateModels(groq) {
  const now = Date.now();
  if (cachedActiveGroqModels && (now - lastModelFetchTime < 5 * 60 * 1000)) {
    return cachedActiveGroqModels;
  }

  try {
    console.log("🔍 Querying Groq API for active model list...");
    const response = await groq.models.list();
    const activeModelIds = new Set(
      (response.data || [])
        .filter(m => m.active !== false)
        .map(m => m.id)
    );

    const availablePreferred = PREFERRED_GROQ_MODELS.filter(id => activeModelIds.has(id));
    const secondaryActive = Array.from(activeModelIds).filter(id => !PREFERRED_GROQ_MODELS.includes(id));
    
    cachedActiveGroqModels = [...availablePreferred, ...secondaryActive];
    lastModelFetchTime = now;

    console.log("✅ Active Groq Models discovered (ranked):", cachedActiveGroqModels.slice(0, 3));
    return cachedActiveGroqModels;
  } catch (err) {
    console.warn("⚠️ Unable to fetch dynamic Groq model list, using fallback defaults:", err.message);
    return PREFERRED_GROQ_MODELS;
  }
}

/**
 * Process a user message through the Enterprise Agentic Engine using Groq with Failover
 */
export async function processAgentMessage(userId, userMessage) {
  const session = await sessionStore.getSession(userId);
  const executedTools = [];

  // Direct Agentic Loop Execution (Bypass legacy name interrogation steps)
  if (session.step === "greet" || session.step === "ask_name" || session.step === "ask_problem") {
    await sessionStore.updateSession(userId, { step: "conversation" });
  }

  // Check for session exit keywords -> Delete session document from MongoDB upon chat end
  if (session.step === "conversation" && userMessage) {
    const lower = userMessage.toLowerCase();
    if (lower.includes("thank you") || lower.includes("thanks") || lower.includes("bye")) {
      const farewell = `You're most welcome, ${session.name || "friend"} 🌿 Wishing you peace, balance, and good health. Take care 💚`;
      await sessionStore.deleteSession(userId);
      return { reply: farewell, step: undefined, toolsExecuted: [], modelUsed: "Static Goodbye" };
    }
  }

  // Advance step to conversation for future turns
  if (session.step === "ask_problem") {
    await sessionStore.updateSession(userId, { problem: userMessage, step: "conversation" });
  }

  // Add user message to session history in MongoDB and sync local session history
  const updatedDoc = await sessionStore.addHistoryTurn(userId, "user", userMessage);
  if (updatedDoc && updatedDoc.history) {
    session.history = updatedDoc.history;
  } else if (session.history) {
    session.history.push({
      role: "user",
      parts: [{ text: userMessage }],
      timestamp: new Date().toISOString()
    });
  }

  // Step 2: Attempt Execution via Groq (Primary LLM)
  if (groqClient) {
    try {
      const candidateModels = await getGroqCandidateModels(groqClient);
      
      for (const targetModel of candidateModels) {
        try {
          console.log(`🚀 Executing Agentic Loop on Groq Model: '${targetModel}'...`);
          const result = await runGroqAgenticLoop(groqClient, targetModel, session, executedTools, userId);
          return {
            reply: result.reply,
            step: session.step,
            toolsExecuted: executedTools,
            modelUsed: `Groq (${targetModel})`
          };
        } catch (modelErr) {
          console.warn(`⚠️ Groq Model '${targetModel}' failed: ${modelErr.message}. Attempting failover to next model...`);
        }
      }
    } catch (groqErr) {
      console.error("❌ Groq Engine Failure:", groqErr.message);
    }
  }

  // Step 3: Fallback to Gemini if Groq fails or API key is unconfigured
  if (geminiModel) {
    console.log("⚡ Fallback: Executing via Google Gemini 2.5 Flash...");
    try {
      const result = await runGeminiAgenticLoop(geminiModel, session, executedTools, userId);
      return {
        reply: result.reply,
        step: session.step,
        toolsExecuted: executedTools,
        modelUsed: "Gemini 2.5 Flash (Fallback)"
      };
    } catch (geminiErr) {
      console.error("❌ Gemini Fallback Failure:", geminiErr.message);
    }
  }

  // Safe Fallback if all API calls fail
  const fallbackReply = "Namaste 🌿 I am experiencing a brief connection delay, but I am here to support your health. How else may I assist you?";
  return {
    reply: fallbackReply,
    step: session.step,
    toolsExecuted: executedTools,
    modelUsed: "Emergency Safe Fallback"
  };
}

/**
 * Execute Groq Function Calling & Completion Loop
 */
async function runGroqAgenticLoop(groq, modelName, session, executedTools, userId) {
  const messages = [
    { role: "system", content: SYSTEM_AGENT_PROMPT }
  ];

  (session.history || []).slice(-10).forEach(turn => {
    const role = turn.role === "model" ? "assistant" : "user";
    const textContent = Array.isArray(turn.parts)
      ? turn.parts.map(p => p.text || "").join("\n")
      : String(turn.parts || "");
    if (textContent.trim()) {
      messages.push({ role, content: textContent });
    }
  });

  let loopCount = 0;
  let finalReply = "";

  while (loopCount < 3) {
    loopCount++;

    const response = await groq.chat.completions.create({
      model: modelName,
      messages,
      tools: groqToolDeclarations,
      tool_choice: "auto",
      temperature: 0.6
    });

    const choice = response.choices?.[0];
    const message = choice?.message;

    if (!message) break;

    if (message.tool_calls && message.tool_calls.length > 0) {
      messages.push(message);

      for (const toolCall of message.tool_calls) {
        const fnName = toolCall.function.name;
        let fnArgs = {};
        try {
          fnArgs = JSON.parse(toolCall.function.arguments || "{}");
        } catch (e) {
          fnArgs = {};
        }

        console.log(`⚡ Groq Tool Call: '${fnName}' with args:`, fnArgs);
        
        let toolResult;
        try {
          toolResult = await executeTool(fnName, fnArgs);
        } catch (err) {
          toolResult = { success: false, error: err.message };
        }

        executedTools.push({ toolName: fnName, args: fnArgs, result: toolResult });
        await sessionStore.logToolExecution(userId, fnName, fnArgs, toolResult);

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult)
        });
      }
    } else {
      finalReply = message.content || "";
      break;
    }
  }

  if (!finalReply) {
    finalReply = "I am here to support your Ayurvedic journey 🌿 How else may I help?";
  }

  await sessionStore.addHistoryTurn(userId, "model", finalReply);
  return { reply: finalReply };
}

/**
 * Gemini Fallback Agent Loop
 */
async function runGeminiAgenticLoop(geminiModel, session, executedTools, userId) {
  const conversationHistory = (session.history || []).slice(-10).map(turn => ({
    role: turn.role,
    parts: turn.parts
  }));

  let responseResult = await geminiModel.generateContent({ contents: conversationHistory });
  let candidate = responseResult.response?.candidates?.[0];
  let functionCalls = candidate?.content?.parts?.filter(p => p.functionCall).map(p => p.functionCall) || [];

  let loopCount = 0;
  while (functionCalls.length > 0 && loopCount < 3) {
    loopCount++;
    const functionResponseParts = [];

    for (const call of functionCalls) {
      const toolResult = await executeTool(call.name, call.args);
      executedTools.push({ toolName: call.name, args: call.args, result: toolResult });
      await sessionStore.logToolExecution(userId, call.name, call.args, toolResult);

      functionResponseParts.push({
        functionResponse: { name: call.name, response: { name: call.name, content: toolResult } }
      });
    }

    conversationHistory.push({ role: "model", parts: candidate.content.parts });
    conversationHistory.push({ role: "user", parts: functionResponseParts });

    responseResult = await geminiModel.generateContent({ contents: conversationHistory });
    candidate = responseResult.response?.candidates?.[0];
    functionCalls = candidate?.content?.parts?.filter(p => p.functionCall).map(p => p.functionCall) || [];
  }

  const finalReply = responseResult.response?.text() || "Wishing you peace and balance 🌿";
  await sessionStore.addHistoryTurn(userId, "model", finalReply);
  return { reply: finalReply };
}
