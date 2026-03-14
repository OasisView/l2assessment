import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { categorizeMessage } from '../utils/llmHelper'
import { calculateUrgency } from '../utils/urgencyScorer'
import { getRecommendedAction, shouldEscalate } from '../utils/templates'

function AnalyzePage() {
  const [message, setMessage] = useState('')
  const [results, setResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const exampleMessage = localStorage.getItem('exampleMessage')
    if (exampleMessage) {
      setMessage(exampleMessage)
      localStorage.removeItem('exampleMessage')
    }
  }, [])

  const handleAnalyze = async () => {
    if (!message.trim()) {
      alert('Please enter a message to analyze')
      return
    }

    setIsLoading(true)
    setResults(null)

    try {
      const { category, confidence, reasoning } = await categorizeMessage(message)
      const urgency = calculateUrgency(message)
      const recommendedAction = getRecommendedAction(category, urgency)
      const escalate = shouldEscalate(category, urgency)

      const analysisResult = {
        message,
        category,
        confidence,
        urgency,
        recommendedAction,
        reasoning,
        escalate,
        timestamp: new Date().toISOString()
      }

      setResults(analysisResult)

      const history = JSON.parse(localStorage.getItem('triageHistory') || '[]')
      history.push(analysisResult)
      localStorage.setItem('triageHistory', JSON.stringify(history))
    } catch (error) {
      console.error('Error analyzing message:', error)
      alert('Error analyzing message. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setMessage('')
    setResults(null)
  }

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'Urgent Outage':     return 'bg-red-100 text-red-800'
      case 'Technical Problem': return 'bg-orange-100 text-orange-800'
      case 'Billing Issue':     return 'bg-yellow-100 text-yellow-800'
      case 'Feature Request':   return 'bg-purple-100 text-purple-800'
      default:                  return 'bg-blue-100 text-blue-800'
    }
  }

  const getConfidenceBarClass = (confidence) => {
    if (confidence >= 80) return 'bg-green-500'
    if (confidence >= 60) return 'bg-yellow-500'
    return 'bg-red-400'
  }

  const getUrgencyBadgeClass = (urgency) => {
    switch (urgency) {
      case 'High':   return 'bg-red-200 text-red-900'
      case 'Medium': return 'bg-yellow-200 text-yellow-900'
      default:       return 'bg-green-200 text-green-900'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analyze Customer Message</h1>
          <p className="text-gray-600 mb-6">
            Paste a customer support message below to automatically categorize and prioritize.
          </p>

          {/* Input Section */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Customer Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Paste customer message here..."
              className="w-full border border-gray-300 rounded-lg p-3 h-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <div className="text-sm text-gray-500 mt-1">
              {message.length} characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className={`flex-1 py-3 rounded-lg font-semibold ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </span>
              ) : (
                'Analyze Message'
              )}
            </button>
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Analysis Results</h2>

            {/* Escalation Banner */}
            {results.escalate === true && (
              <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-lg">
                <p className="text-red-800 font-semibold">Escalation Required — Route this ticket to engineering or billing immediately.</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Category */}
              <div>
                <div className="text-sm font-semibold text-gray-600 mb-1">Category</div>
                <div className={`inline-block px-4 py-2 rounded-lg font-semibold ${getCategoryBadgeClass(results.category)}`}>
                  {results.category}
                </div>
              </div>

              {/* Confidence */}
              <div>
                <div className="text-sm font-semibold text-gray-600 mb-1">
                  Confidence {results.confidence !== null ? `${results.confidence}%` : '—'}
                </div>
                {results.confidence !== null && (
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${getConfidenceBarClass(results.confidence)}`}
                      style={{ width: `${results.confidence}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Urgency */}
              <div>
                <div className="text-sm font-semibold text-gray-600 mb-1">Urgency Level</div>
                <div className={`inline-block px-4 py-2 rounded-lg font-semibold ${getUrgencyBadgeClass(results.urgency)}`}>
                  {results.urgency}
                </div>
              </div>

              {/* Recommended Action */}
              <div>
                <div className="text-sm font-semibold text-gray-600 mb-1">Recommended Action</div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-gray-800">{results.recommendedAction}</p>
                </div>
              </div>

              {/* AI Reasoning */}
              <div>
                <div className="text-sm font-semibold text-gray-600 mb-1">AI Reasoning</div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <ReactMarkdown>
                      {results.reasoning}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  const text = [
                    `Category: ${results.category}`,
                    `Confidence: ${results.confidence !== null ? results.confidence + '%' : 'N/A'}`,
                    `Urgency: ${results.urgency}`,
                    `Escalate: ${results.escalate}`,
                    `Recommendation: ${results.recommendedAction}`,
                    `Reasoning: ${results.reasoning}`
                  ].join('\n')
                  navigator.clipboard.writeText(text)
                  alert('Results copied to clipboard!')
                }}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-semibold"
              >
                Copy Results
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AnalyzePage
