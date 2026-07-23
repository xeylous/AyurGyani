/**
 * Tool: Safety & Contraindication Checker
 * Evaluates herb safety against medical conditions, pregnancy, or known contraindications.
 */

const SAFETY_RULES = [
  {
    herbs: ["ashwagandha"],
    conditions: ["pregnancy", "severe pitta", "hyperthyroid"],
    warning: "Ashwagandha is warming and invigorating. Avoid during pregnancy or active hyperthyroid unless under direct practitioner supervision."
  },
  {
    herbs: ["triphala"],
    conditions: ["pregnancy", "diarrhea", "loose motion"],
    warning: "Triphala promotes intestinal peristalsis. Avoid during diarrhea or pregnancy."
  },
  {
    herbs: ["turmeric", "guggulu"],
    conditions: ["blood thinners", "gallstones", "surgery"],
    warning: "High dose turmeric or Guggulu may interact with anti-coagulant (blood thinner) medications or before scheduled surgery."
  },
  {
    herbs: ["neem"],
    conditions: ["pregnancy", "trying to conceive"],
    warning: "Neem has strong detoxifying and cooling properties; avoid when pregnant or actively trying to conceive."
  }
];

export async function executeCheckSafetyContraindications({ herbs, condition }) {
  if (!herbs || !Array.isArray(herbs)) {
    return { success: false, error: "Herbs array is required." };
  }

  const warnings = [];
  const normalizedCondition = (condition || "").toLowerCase();

  for (const herb of herbs) {
    const normHerb = herb.toLowerCase();
    for (const rule of SAFETY_RULES) {
      if (rule.herbs.some(h => normHerb.includes(h))) {
        if (!normalizedCondition || rule.conditions.some(c => normalizedCondition.includes(c))) {
          warnings.push({ herb, warning: rule.warning });
        }
      }
    }
  }

  return {
    success: true,
    safe: warnings.length === 0,
    warnings: warnings.length > 0 ? warnings : ["No specific contraindications found for general consumption."]
  };
}

export const checkSafetyContraindicationsDeclaration = {
  name: "check_safety_contraindications",
  description: "Check if herbs have contraindications, warnings, or medication interaction risks for specific health conditions.",
  parameters: {
    type: "OBJECT",
    properties: {
      herbs: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "List of herb names to check (e.g. ['Ashwagandha', 'Triphala'])"
      },
      condition: {
        type: "STRING",
        description: "Special condition or concern (e.g. pregnancy, high blood pressure, blood thinners)"
      }
    },
    required: ["herbs"]
  }
};
