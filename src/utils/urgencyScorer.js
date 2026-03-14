/**
 * Calculate urgency level for a customer support message.
 * Returns "High", "Medium", or "Low".
 */
export function calculateUrgency(message) {
  const lower = message.toLowerCase();
  let score = 50;

  // Critical outage signals: +40 if any match
  const criticalOutageTerms = ['production down', 'outage', 'data loss', 'security breach', 'site is down', 'app is down', 'completely down'];
  if (criticalOutageTerms.some(term => lower.includes(term))) {
    score += 40;
  }

  // Urgent language: +15 per match
  const urgentTerms = ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'blocking', 'blocked', 'losing money', 'deadline', 'p0', 'p1', 'sev1'];
  urgentTerms.forEach(term => {
    if (lower.includes(term)) score += 15;
  });

  // Error signals: +8 per match
  const errorTerms = ['error', 'crash', 'broken', 'not working', 'bug', 'failed', '500', '404'];
  errorTerms.forEach(term => {
    if (lower.includes(term)) score += 8;
  });

  // Frustration signals: +10 per match
  const frustrationTerms = ['frustrated', 'unacceptable', 'ridiculous', 'terrible', 'horrible', 'worst'];
  frustrationTerms.forEach(term => {
    if (lower.includes(term)) score += 10;
  });

  // Multiple exclamation marks (2+): +10 once
  if ((message.match(/!/g) || []).length >= 2) {
    score += 10;
  }

  // Low urgency language: -20 per match
  const lowUrgencyTerms = ['feature request', 'suggestion', 'would be nice', 'someday', 'eventually'];
  lowUrgencyTerms.forEach(term => {
    if (lower.includes(term)) score -= 20;
  });

  // Positive tone: -15 per match
  const positiveTerms = ['thank you', 'thanks', 'appreciate', 'happy', 'love', 'great', 'excellent', 'wonderful'];
  positiveTerms.forEach(term => {
    if (lower.includes(term)) score -= 15;
  });

  // Question with no error signals: -10
  const hasErrorSignal = errorTerms.some(term => lower.includes(term));
  if (message.includes('?') && score <= 55 && !hasErrorSignal) {
    score -= 10;
  }

  // Clamp to [0, 100]
  score = Math.min(100, Math.max(0, score));

  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}
