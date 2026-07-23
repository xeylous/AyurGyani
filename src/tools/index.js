import { executeLookupHerbDetails, lookupHerbDetailsDeclaration } from "./herbTool.js";
import { executeFindAyurvedicRemedy, findAyurvedicRemedyDeclaration } from "./remedyTool.js";
import { executeAssessDoshaBalance, assessDoshaBalanceDeclaration } from "./doshaTool.js";
import { executeCheckSafetyContraindications, checkSafetyContraindicationsDeclaration } from "./safetyTool.js";
import { executeSendRecommendationEmail, sendRecommendationEmailDeclaration } from "./mailerTool.js";

/**
 * Native Gemini Tool Declarations
 */
export const toolDeclarations = [
  lookupHerbDetailsDeclaration,
  findAyurvedicRemedyDeclaration,
  assessDoshaBalanceDeclaration,
  checkSafetyContraindicationsDeclaration,
  sendRecommendationEmailDeclaration
];

/**
 * OpenAI / Groq Compatible Tool Declarations Schema
 */
export const groqToolDeclarations = toolDeclarations.map(decl => ({
  type: "function",
  function: {
    name: decl.name,
    description: decl.description,
    parameters: {
      type: "object",
      properties: Object.keys(decl.parameters.properties).reduce((acc, key) => {
        const prop = decl.parameters.properties[key];
        acc[key] = {
          type: prop.type.toLowerCase(),
          description: prop.description
        };
        if (prop.items) {
          acc[key].items = { type: prop.items.type.toLowerCase() };
        }
        return acc;
      }, {}),
      required: decl.parameters.required || []
    }
  }
}));

/**
 * Master Tool Execution Map
 */
const toolExecutors = {
  lookup_herb_details: executeLookupHerbDetails,
  find_ayurvedic_remedy: executeFindAyurvedicRemedy,
  assess_dosha_balance: executeAssessDoshaBalance,
  check_safety_contraindications: executeCheckSafetyContraindications,
  send_recommendation_email: executeSendRecommendationEmail
};

/**
 * Execute a tool by name with arguments
 */
export async function executeTool(name, args) {
  const executor = toolExecutors[name];
  if (!executor) {
    throw new Error(`Tool '${name}' is not registered in Tool Registry.`);
  }
  return await executor(args || {});
}
