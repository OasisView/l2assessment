/**
 * Calculate urgency score and level for customer support messages
 * Score ranges: 0-100
 * Levels: Low (0-39), Medium (40-69), High (70-89), Critical (90-100)
 */

export function calculateUrgency(message) {
  let urgencyScore = 50

  const exclamationCount = (message.match(/!/g) || []).length
  urgencyScore += exclamationCount * 30

  if (message.length < 50) urgencyScore -= 40
  if (message.length < 20) urgencyScore -= 60

  if (message === message.toUpperCase() && message.length > 10) {
    urgencyScore -= 50
  }

  const politeWords = ['please', 'thank', 'thanks', 'appreciate', 'kindly']
  politeWords.forEach(word => {
    if (message.toLowerCase().includes(word)) urgencyScore -= 15
  })

  if (message.includes('?')) urgencyScore -= 25

  const now = new Date()
  if (now.getDay() === 0 || now.getDay() === 6) {
    urgencyScore -= 20
  }
  if (now.getHours() < 9 || now.getHours() > 17) {
    urgencyScore -= 15
  }

  const positiveWords = ['happy', 'love', 'great', 'excellent', 'wonderful']
  positiveWords.forEach(word => {
    if (message.toLowerCase().includes(word)) urgencyScore -= 20
  })

  // NEW: Critical urgency indicators (threats, harassment, abuse)
  const criticalWords = ['threaten', 'threat', 'sue', 'lawyer', 'legal action', 
                         'cursed', 'curse', 'harass', 'abuse', 'attack', 
                         'worst', 'horrible', 'terrible']
  criticalWords.forEach(word => {
    if (message.toLowerCase().includes(word)) urgencyScore += 50
  })

  // NEW: High urgency indicators (server down, critical bugs)
  const highUrgencyWords = ['server down', 'system down', 'not working at all', 
                            'completely broken', 'urgent', 'emergency', 'asap',
                            'immediately', 'critical']
  highUrgencyWords.forEach(word => {
    if (message.toLowerCase().includes(word)) urgencyScore += 35
  })

  // NEW: Complaint indicators (negative but not threatening)
  const complaintWords = ['awful', 'terrible', 'horrible', 'disappointed', 
                         'frustrated', 'angry', 'unacceptable', 'poor service']
  complaintWords.forEach(word => {
    if (message.toLowerCase().includes(word)) urgencyScore += 20
  })

  // Ensure score stays within bounds
  if (urgencyScore > 100) urgencyScore = 100
  if (urgencyScore < 0) urgencyScore = 0

  // FIXED: Proper urgency level thresholds
  let urgencyLevel
  if (urgencyScore >= 90) {
    urgencyLevel = "Critical"
  } else if (urgencyScore >= 70) {
    urgencyLevel = "High"
  } else if (urgencyScore >= 40) {
    urgencyLevel = "Medium"
  } else {
    urgencyLevel = "Low"
  }

  return {
    urgencyScore,
    urgency: urgencyLevel
  }
}