/**
 * Tool: Dosha Assessor
 * Evaluates Vata, Pitta, and Kapha tendencies based on user inputs.
 */

export async function executeAssessDoshaBalance({ physicalTraits, digestion, sleep, mood }) {
  let vataScore = 0;
  let pittaScore = 0;
  let kaphaScore = 0;

  const combinedText = `${physicalTraits || ""} ${digestion || ""} ${sleep || ""} ${mood || ""}`.toLowerCase();

  // Vata markers: dry, cold, light, fast, irregular, anxiety, insomnia
  if (combinedText.includes("dry") || combinedText.includes("thin") || combinedText.includes("cold") || 
      combinedText.includes("anxious") || combinedText.includes("insomnia") || combinedText.includes("bloating")) {
    vataScore += 3;
  }

  // Pitta markers: hot, sharp, acidity, intense, sweating, irritability
  if (combinedText.includes("hot") || combinedText.includes("acid") || combinedText.includes("sweat") || 
      combinedText.includes("angry") || combinedText.includes("acne") || combinedText.includes("medium")) {
    pittaScore += 3;
  }

  // Kapha markers: heavy, calm, slow, oily, congestion, sleepiness
  if (combinedText.includes("heavy") || combinedText.includes("slow") || combinedText.includes("mucus") || 
      combinedText.includes("calm") || combinedText.includes("weight") || combinedText.includes("deep sleep")) {
    kaphaScore += 3;
  }

  // Determine dominant dosha
  let dominant = "Vata";
  if (pittaScore > vataScore && pittaScore >= kaphaScore) dominant = "Pitta";
  if (kaphaScore > vataScore && kaphaScore > pittaScore) dominant = "Kapha";

  const recommendations = {
    Vata: "Warm, grounding foods with healthy Ghee, routine daily habits, and soothing herbs like Ashwagandha.",
    Pitta: "Cooling foods, fresh green vegetables, coconut oil, and calming herbs like Amla and Shatavari.",
    Kapha: "Light, spicy, warm foods, active exercise, dry ginger, and invigorating herbs like Tulsi."
  };

  return {
    success: true,
    assessment: {
      dominantDosha: dominant,
      scores: { vata: vataScore, pitta: pittaScore, kapha: kaphaScore },
      guidance: recommendations[dominant]
    }
  };
}

export const assessDoshaBalanceDeclaration = {
  name: "assess_dosha_balance",
  description: "Evaluate user symptoms or physical/mental traits to estimate Vata, Pitta, or Kapha dominance and imbalance.",
  parameters: {
    type: "OBJECT",
    properties: {
      physicalTraits: { type: "STRING", description: "Body frame, skin type, temperature preference" },
      digestion: { type: "STRING", description: "Digestive tendency: irregular (Vata), acidic/sharp (Pitta), slow/heavy (Kapha)" },
      sleep: { type: "STRING", description: "Sleep pattern: light/interrupted, sound/hot, heavy/prolonged" },
      mood: { type: "STRING", description: "Emotional tendency: worry/anxiety, impatience/anger, calm/attachment" }
    }
  }
};
