import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Required for browser-based calls (not recommended for production!)
});

const VALID_CATEGORIES = [
  "Billing Issue",
  "Technical Problem",
  "Feature Request",
  "General Inquiry",
  "Urgent Outage"
];

const SYSTEM_PROMPT = `You are a customer support triage assistant. Classify the customer message into exactly ONE of these categories:

- "Billing Issue" - payments, charges, invoices, refunds, subscription changes
- "Technical Problem" - bugs, errors, crashes, features not working, performance
- "Feature Request" - suggestions for new functionality or improvements
- "General Inquiry" - questions, info requests, account questions, positive feedback
- "Urgent Outage" - production down, data loss, security breach, full service unavailable

Respond with ONLY valid JSON in this exact shape, no markdown, no extra text:

{
  "category": "<one of the 5 categories above>",
  "confidence": <integer 0-100>,
  "reasoning": "One sentence explaining the classification."
}`;

export async function categorizeMessage(message) {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message }
      ],
      temperature: 0.1,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;

    try {
      // Strip markdown fences if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(cleanContent);

      // Validate category — fall back to General Inquiry if unknown
      const category = VALID_CATEGORIES.includes(parsed.category)
        ? parsed.category
        : "General Inquiry";

      // Clamp confidence to [0, 100]
      let confidence = null;
      if (typeof parsed.confidence === 'number') {
        confidence = Math.min(100, Math.max(0, Math.round(parsed.confidence)));
      }

      return { category, confidence, reasoning: parsed.reasoning || "" };
    } catch (parseError) {
      console.warn('Failed to parse AI response, using fallback:', parseError.message);
      return getMockCategorization(message);
    }
  } catch (error) {
    console.warn('Groq API failed, using mock response:', error.message);
    return getMockCategorization(message);
  }
}

function getMockCategorization(message) {
  const lower = message.toLowerCase();

  // Check order: Urgent Outage → Billing → Technical → Feature → General Inquiry
  if (['production down', 'outage', 'data loss', 'security breach', 'site is down', 'app is down', 'completely down'].some(term => lower.includes(term))) {
    return { category: "Urgent Outage", confidence: null, reasoning: "Message indicates a critical service outage or data loss event." };
  }

  if (['bill', 'payment', 'charge', 'invoice', 'refund', 'subscription', 'pricing'].some(term => lower.includes(term))) {
    return { category: "Billing Issue", confidence: null, reasoning: "Message relates to billing, payments, or subscription management." };
  }

  if (['bug', 'error', 'crash', 'broken', 'not working', 'failed', '500', '404', 'slow', 'performance'].some(term => lower.includes(term))) {
    return { category: "Technical Problem", confidence: null, reasoning: "Message describes a technical issue or software malfunction." };
  }

  if (['feature', 'suggestion', 'would be nice', 'improve', 'enhancement', 'add', 'wish', 'someday'].some(term => lower.includes(term))) {
    return { category: "Feature Request", confidence: null, reasoning: "Message contains a suggestion or request for new functionality." };
  }

  return { category: "General Inquiry", confidence: null, reasoning: "Message is a general question or does not match a more specific category." };
}
