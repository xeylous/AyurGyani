/**
 * Tool: Ayurvedic Remedy Finder
 * Maps health complaints or symptoms to traditional Ayurvedic remedies.
 */

const REMEDY_DATABASE = [
  {
    keywords: ["acidity", "heartburn", "acid", "reflux", "indigestion", "gastric"],
    condition: "Digestive Acidity & Pitta Imbalance",
    recommendedHerbs: ["Amla", "Fennel Seeds (Saunf)", "Licorice (Yashtimadhu)"],
    dietaryAdvice: "Avoid spicy, sour, fried foods. Drink lukewarm fennel infusion or fresh Amla juice.",
    lifestyleAdvice: "Eat meals at consistent times. Do not lie down immediately after dinner."
  },
  {
    keywords: ["sleep", "insomnia", "sleepless", "restless", "night", "stress"],
    condition: "Sleep Disruption & Vata Aggravation",
    recommendedHerbs: ["Ashwagandha", "Brahmi", "Warm Nutmeg Milk"],
    dietaryAdvice: "Sip warm golden milk (milk with turmeric & nutmeg) 30 minutes before bedtime.",
    lifestyleAdvice: "Practice 5 minutes of slow Nadi Shodhana (alternate nostril breathing). Disconnect screens early."
  },
  {
    keywords: ["cold", "cough", "congestion", "mucus", "sinus", "throat"],
    condition: "Kapha Respiratory Accumulation",
    recommendedHerbs: ["Tulsi", "Dry Ginger (Sunthi)", "Honey & Black Pepper"],
    dietaryAdvice: "Sip warm ginger-tulsi tea throughout the day. Avoid cold water and dairy products.",
    lifestyleAdvice: "Inhale warm herbal steam with eucalyptus or carom seeds (Ajwain)."
  },
  {
    keywords: ["joint", "knee", "pain", "stiffness", "arthritis", "inflammation"],
    condition: "Joint Stiffness & Vata Accumulation",
    recommendedHerbs: ["Turmeric", "Guggulu", "Shallaki (Boswellia)"],
    dietaryAdvice: "Include warm sesame oil or cow's Ghee in light meals to lubricate internal tissues.",
    lifestyleAdvice: "Apply warm sesame oil or Mahanarayana oil locally with gentle massage."
  },
  {
    keywords: ["skin", "acne", "rash", "itching", "glow"],
    condition: "Pitta Blood Heat (Rakta Dhatu Heat)",
    recommendedHerbs: ["Neem", "Manjistha", "Aloe Vera"],
    dietaryAdvice: "Drink fresh cucumber water or coconut water. Reduce deep-fried and salty snacks.",
    lifestyleAdvice: "Avoid direct harsh sun exposure during midday."
  }
];

export async function executeFindAyurvedicRemedy({ symptom }) {
  if (!symptom) {
    return { success: false, error: "Symptom description is required." };
  }

  const query = symptom.toLowerCase();
  const match = REMEDY_DATABASE.find(r => r.keywords.some(k => query.includes(k)));

  if (match) {
    return {
      success: true,
      found: true,
      remedy: match
    };
  }

  return {
    success: true,
    found: false,
    remedy: {
      condition: `General Support for ${symptom}`,
      recommendedHerbs: ["Ginger Tea", "Triphala", "Warm Water"],
      dietaryAdvice: "Focus on warm, freshly cooked, light meals. Sip warm water throughout the day.",
      lifestyleAdvice: "Maintain regular sleep cycles and gentle daily walking."
    }
  };
}

export const findAyurvedicRemedyDeclaration = {
  name: "find_ayurvedic_remedy",
  description: "Find classical Ayurvedic remedies, lifestyle guidelines, and herb suggestions for specific health concerns.",
  parameters: {
    type: "OBJECT",
    properties: {
      symptom: {
        type: "STRING",
        description: "The health issue, complaint, or symptom (e.g. acidity, insomnia, cold/cough, joint stiffness, acne)"
      }
    },
    required: ["symptom"]
  }
};
