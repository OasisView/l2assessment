import Groq from 'groq-sdk';

/**
 * LLM Helper for categorizing customer support messages
 * Using Groq API for AI-powered categorization
 */

// Initialize Groq client
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true // Required for browser-based calls (not recommended for production!)
});

/**
 * System prompt for the AI with improved categorization rules
 */
const SYSTEM_PROMPT = `You are an AI assistant that analyzes customer support messages for a triage system.

Analyze the message and classify it into ONE of these categories:

**Categories:**
1. **Technical Problem** - Issues with software, servers, bugs, errors, crashes, performance problems
2. **Billing Issue** - Payment problems, subscription questions, refunds, pricing, invoices
3. **Feature Request** - Suggestions for new features or improvements to existing functionality
4. **General Inquiry** - Basic questions about products, services, how things work
5. **Complaint** - Dissatisfaction with service quality, product issues, disappointment (but no threats or abuse)
6. **Critical Escalation** - Harassment, threats, abusive language, staff misconduct, legal threats, violence, or safety concerns

**CRITICAL RULES:**
- ANY message mentioning threats, cursing at staff, harassment, or aggressive behavior MUST be "Critical Escalation"
- Complaints about poor service should be "Complaint" category, NOT "General Inquiry"
- Positive feedback should be "General Inquiry"

**Response Format:**
You must respond with ONLY valid JSON, no markdown formatting, no explanation text. Use this exact structure:

{
  "category": "category name from the list above",
  "reasoning": "brief explanation of why you chose this category"
}`;

/**
 * Categorize a customer support message using Groq AI
 * 
 * @param {string} message - The customer support message
 * @returns {Promise<{category: string, reasoning: string}>}
 */
export async function categorizeMessage(message) {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `Analyze this customer support message and respond with ONLY the JSON object, no other text:\n\n"${message}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    
    // Try to parse the JSON response
    try {
      // Remove any markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/```\n?/g, '');
      }
      
      const result = JSON.parse(cleanContent);
      
      // Validate the response has required fields
      if (!result.category || !result.reasoning) {
        throw new Error('Invalid response structure');
      }
      
      // Return only category and reasoning
      return {
        category: result.category,
        reasoning: result.reasoning
      };
    } catch (parseError) {
      console.warn('Failed to parse AI response, using fallback:', parseError.message);
      console.log('Raw response:', content);
      // Fall back to mock categorization
      return getMockCategorization(message);
    }
  } catch (error) {
    console.warn('Groq API failed, using mock response:', error.message);
    return getMockCategorization(message);
  }
}

/**
 * Mock categorization fallback (returns only category and reasoning)
 */
function getMockCategorization(message) {
  const lowerMessage = message.toLowerCase();
  
  // CRITICAL ESCALATION - Threats, harassment, abuse
  if (lowerMessage.includes('threaten') || lowerMessage.includes('sue') ||
      lowerMessage.includes('lawyer') || lowerMessage.includes('legal action') ||
      lowerMessage.includes('cursed') || lowerMessage.includes('curse') ||
      lowerMessage.includes('harass') || lowerMessage.includes('abuse') ||
      lowerMessage.includes('attack') || lowerMessage.includes('hurt') ||
      (lowerMessage.includes('worst') && lowerMessage.includes('staff'))) {
    return {
      category: "Critical Escalation",
      reasoning: "Message contains threatening language, harassment, or serious staff misconduct allegations that require immediate management attention."
    };
  }
  
  // COMPLAINT - Negative feedback without threats
  if ((lowerMessage.includes('awful') || lowerMessage.includes('terrible') ||
       lowerMessage.includes('horrible') || lowerMessage.includes('worst') ||
       lowerMessage.includes('disappointed') || lowerMessage.includes('frustrated') ||
       lowerMessage.includes('angry') || lowerMessage.includes('unacceptable')) &&
      !lowerMessage.includes('thank')) {
    return {
      category: "Complaint",
      reasoning: "Customer is expressing dissatisfaction with service or product quality. Requires attention to prevent escalation."
    };
  }
  
  // TECHNICAL PROBLEM
  if (lowerMessage.includes('bug') || lowerMessage.includes('error') || 
      lowerMessage.includes('broken') || lowerMessage.includes('not working') ||
      lowerMessage.includes('crash') || lowerMessage.includes('down') || 
      lowerMessage.includes('server') || lowerMessage.includes('loading forever') ||
      lowerMessage.includes('slow') || lowerMessage.includes('issue') ||
      (lowerMessage.includes('problem') && !lowerMessage.includes('no problem'))) {
    
    const isCritical = lowerMessage.includes('server') && (lowerMessage.includes('down') || lowerMessage.includes('crash'));
    
    return {
      category: "Technical Problem",
      reasoning: isCritical 
        ? "Server or critical system issue affecting service availability. Requires immediate technical attention."
        : "Technical issue reported that may be affecting user experience. Should be investigated and resolved."
    };
  }
  
  // BILLING ISSUE
  if (lowerMessage.includes('bill') || lowerMessage.includes('payment') || 
      lowerMessage.includes('charge') || lowerMessage.includes('invoice') ||
      lowerMessage.includes('credit card') || lowerMessage.includes('subscription') ||
      lowerMessage.includes('refund') || (lowerMessage.includes('cancel') && lowerMessage.includes('account')) ||
      lowerMessage.includes('upgrade')) {
    
    const isUrgent = lowerMessage.includes('charge') && (lowerMessage.includes('wrong') || lowerMessage.includes('unauthorized'));
    
    return {
      category: "Billing Issue",
      reasoning: isUrgent
        ? "Potential billing error or unauthorized charge. Requires immediate verification and resolution."
        : "Billing-related inquiry that needs attention from accounts team."
    };
  }
  
  // FEATURE REQUEST
  if (lowerMessage.includes('feature') || (lowerMessage.includes('add') && (lowerMessage.includes('please') || lowerMessage.includes('could'))) ||
      lowerMessage.includes('improve') || lowerMessage.includes('would like to see') ||
      lowerMessage.includes('suggestion') || lowerMessage.includes('wish') ||
      (lowerMessage.includes('could you') && lowerMessage.includes('add')) ||
      lowerMessage.includes('enhancement') || lowerMessage.includes('would be great') ||
      lowerMessage.includes('dark mode')) {
    return {
      category: "Feature Request",
      reasoning: "Customer is suggesting product improvements or new features. Valuable feedback for product team."
    };
  }
  
  // POSITIVE FEEDBACK
  if ((lowerMessage.includes('thank') || lowerMessage.includes('thanks') || lowerMessage.includes('appreciate') ||
       lowerMessage.includes('great') || lowerMessage.includes('amazing') || lowerMessage.includes('excellent')) &&
      !lowerMessage.includes('but') && !lowerMessage.includes('however') &&
      !lowerMessage.includes('awful') && !lowerMessage.includes('terrible')) {
    return {
      category: "General Inquiry",
      reasoning: "Positive feedback from satisfied customer. No action required but worth acknowledging."
    };
  }
  
  // GENERAL INQUIRY - Questions
  if (lowerMessage.includes('how') || lowerMessage.includes('what') || 
      lowerMessage.includes('when') || lowerMessage.includes('where') ||
      lowerMessage.includes('can i') || lowerMessage.includes('is there') ||
      lowerMessage.includes('?')) {
    return {
      category: "General Inquiry",
      reasoning: "Customer has questions about product or service. Needs informational response."
    };
  }
  
  // Fallback for ambiguous messages
  return {
    category: "General Inquiry",
    reasoning: "Message content doesn't match clear support patterns. May need manual review for proper handling."
  };
}