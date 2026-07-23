/**
 * Tool: Herb Knowledge Lookup
 * Provides detailed botanical details, dosha affinity, and benefits for Ayurvedic herbs.
 */

const HERB_DATABASE = {
  ashwagandha: {
    name: "Ashwagandha (Withania somnifera)",
    doshaEffect: "Balances Vata & Kapha (may increase Pitta in excess)",
    benefits: [
      "Promotes deep, restful sleep and calms the nervous system",
      "Enhances physical strength, vitality, and stamina (Rasayana)",
      "Helps the body adapt to mental and emotional stress"
    ],
    precautions: "Avoid during acute fever or severe Pitta imbalance."
  },
  amla: {
    name: "Amla / Amalaki (Emblica officinalis)",
    doshaEffect: "Tridoshic (Balances Vata, Pitta, and Kapha — especially Pitta)",
    benefits: [
      "Rich in natural vitamin C and antioxidants",
      "Soothes digestive hyperacidity and stomach fire",
      "Supports hair health, skin glow, and liver rejuvenation"
    ],
    precautions: "Very mild; safe for general daily use."
  },
  triphala: {
    name: "Triphala (Blend of Amla, Haritaki, and Bibhitaki)",
    doshaEffect: "Tridoshic (Cleanses and balances all three doshas)",
    benefits: [
      "Gently supports regular bowel movements and colon detox",
      "Enhances nutrient absorption in the digestive tract",
      "Cleanses toxins (Ama) from body tissues"
    ],
    precautions: "Reduce dosage if loose stools occur; avoid during pregnancy."
  },
  tulsi: {
    name: "Tulsi / Holy Basil (Ocimum sanctum)",
    doshaEffect: "Balances Kapha & Vata (warms Pitta)",
    benefits: [
      "Supports clear respiratory airways and eases coughs",
      "Promotes mental clarity and lifts emotional heaviness",
      "Boosts natural immune defense against seasonal chills"
    ],
    precautions: "Use moderately in high summer heat if prone to Pitta acidity."
  },
  turmeric: {
    name: "Turmeric / Haridra (Curcuma longa)",
    doshaEffect: "Balances Kapha & Vata (can warm Pitta in large doses)",
    benefits: [
      "Supports joint comfort and healthy inflammatory response",
      "Purifies blood (Rakta Shodhana) and enhances skin radiance",
      "Aids liver function and fat metabolism"
    ],
    precautions: "Caution with blood-thinning medications."
  },
  shatavari: {
    name: "Shatavari (Asparagus racemosus)",
    doshaEffect: "Balances Pitta & Vata (cools and hydrates)",
    benefits: [
      "Soothes internal heat and digestive irritation",
      "Nourishes bodily tissues and reproductive system health",
      "Promotes emotional calm and hormonal balance"
    ],
    precautions: "Avoid if experiencing heavy Kapha congestion."
  },
  brahmi: {
    name: "Brahmi / Gotu Kola (Bacopa monnieri)",
    doshaEffect: "Tridoshic (Cools Pitta and calms Vata)",
    benefits: [
      "Enhances memory, focus, and cognitive clarity",
      "Calms an overactive, anxious mind before sleep",
      "Promotes nervous system health and stress resilience"
    ],
    precautions: "Take with warm water or milk for optimal assimilation."
  }
};

export async function executeLookupHerbDetails({ herbName }) {
  if (!herbName) {
    return { success: false, error: "Herb name is required." };
  }

  const key = herbName.toLowerCase().trim();
  const matchKey = Object.keys(HERB_DATABASE).find(k => key.includes(k) || k.includes(key));

  if (matchKey) {
    return {
      success: true,
      found: true,
      herb: HERB_DATABASE[matchKey]
    };
  }

  // Generic Ayurvedic herb template for unknown herbs
  return {
    success: true,
    found: false,
    herb: {
      name: herbName,
      doshaEffect: "Gentle traditional herbal support in Ayurveda",
      benefits: [
        `Appreciated in classical Ayurveda for soothing ${herbName}-related imbalances`,
        "Supports natural body equilibrium and tissue vitality"
      ],
      precautions: "Consult an Ayurvedic Practitioner for personalized dosages."
    }
  };
}

export const lookupHerbDetailsDeclaration = {
  name: "lookup_herb_details",
  description: "Search classical Ayurvedic knowledge base for herb benefits, dosha affinity, and precautions.",
  parameters: {
    type: "OBJECT",
    properties: {
      herbName: {
        type: "STRING",
        description: "Name of the herb (e.g. Ashwagandha, Amla, Triphala, Tulsi, Turmeric, Shatavari, Brahmi)"
      }
    },
    required: ["herbName"]
  }
};
