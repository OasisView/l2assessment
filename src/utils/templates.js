/**
 * Recommendation Templates - Maps (category, urgency) to recommended actions.
 */

const actionTemplates = {
  "Urgent Outage": {
    High:   "Escalate immediately to on-call engineering. Declare incident, notify all stakeholders, and begin status page update.",
    Medium: "Page on-call engineer. Investigate scope and impact. Begin incident response protocol.",
    Low:    "Assign to senior engineer for investigation. Monitor for escalation."
  },
  "Technical Problem": {
    High:   "Escalate to engineering team immediately. Assign a senior engineer and open a P1 ticket.",
    Medium: "Assign to engineering queue. Reproduce the issue and create a bug ticket with steps to reproduce.",
    Low:    "Log in the bug tracker and assign to the next available engineer. Respond with troubleshooting steps."
  },
  "Billing Issue": {
    High:   "Escalate to billing team immediately. Review account charges and issue refund if applicable.",
    Medium: "Assign to billing team. Verify the charge, correct any errors, and follow up with the customer.",
    Low:    "Direct customer to the billing portal. Provide instructions for managing their subscription."
  },
  "Feature Request": {
    High:   "Log in the product backlog with high priority. Notify the product manager for review.",
    Medium: "Log in the product backlog. Thank the customer and let them know it will be reviewed.",
    Low:    "Log in the feature request tracker. Send a thank-you response acknowledging their suggestion."
  },
  "General Inquiry": {
    High:   "Respond promptly with detailed information. Escalate to a specialist if the question is complex.",
    Medium: "Respond with relevant documentation or FAQ links. Follow up if further help is needed.",
    Low:    "Send an automated or templated response with FAQ links. No immediate action required."
  }
};

/**
 * Get recommended action for a given category and urgency.
 */
export function getRecommendedAction(category, urgency) {
  return actionTemplates[category]?.[urgency] || "Review the message manually and assign to the appropriate team.";
}

/**
 * Returns the list of all valid categories.
 */
export function getAvailableCategories() {
  return ["Billing Issue", "Technical Problem", "Feature Request", "General Inquiry", "Urgent Outage"];
}

/**
 * Determines if a ticket should be escalated.
 * Escalates if: urgency is High, category is Urgent Outage, or (Billing Issue + Medium).
 */
export function shouldEscalate(category, urgency) {
  return urgency === "High" || category === "Urgent Outage" || (category === "Billing Issue" && urgency === "Medium");
}
