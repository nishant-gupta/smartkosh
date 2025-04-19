'use client'

import { useState } from 'react'

export default function AiAdvisor() {
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!question.trim()) return
    
    try {
      setIsLoading(true)
      setResponse('')
      
      // This would make an actual API call to your Next.js API route
      // const res = await fetch('/api/ai/financial-advice', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ question })
      // })
      // const data = await res.json()
      // setResponse(data.advice)
      
      // For demo, simulate API call
      setTimeout(() => {
        const demoResponses = [
          "Based on your spending patterns, I recommend setting aside 20% of your income for savings and investments. This follows the 50/30/20 rule - 50% for needs, 30% for wants, and 20% for savings.",
          "Looking at your expenses, you might consider reviewing your subscription services. Many people save $100-200 monthly by canceling unused subscriptions.",
          "For your financial goals, consider setting up automatic transfers to a high-yield savings account. Even small regular contributions of $50-100 per week can grow significantly over time.",
          "To improve your financial health, focus on building an emergency fund that covers 3-6 months of expenses before accelerating debt payments beyond minimums.",
          "For long-term growth, consider index fund investing which offers diversification at low cost. Start with small regular investments rather than waiting to invest a large sum."
        ]
        
        const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)]
        setResponse(randomResponse)
        setIsLoading(false)
      }, 1500)
      
    } catch (error) {
      console.error('Error getting AI advice:', error)
      setResponse('Sorry, I had trouble generating advice. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <p className="text-sm text-gray-600 mb-4">
        Ask for personalized financial advice based on your data
      </p>
      
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about budgeting, saving, investing..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary-600 text-white rounded-r-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isLoading || !question.trim()}
          >
            {isLoading ? 'Thinking...' : 'Ask'}
          </button>
        </div>
      </form>
      
      {isLoading && (
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          <span className="ml-2">AI is thinking</span>
        </div>
      )}
      
      {response && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">{response}</p>
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-gray-500">
          Suggested questions:
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            "How can I improve my savings?",
            "Where can I cut expenses?",
            "How to start investing?",
            "Tips for emergency fund?"
          ].map((q, i) => (
            <button
              key={i}
              onClick={() => setQuestion(q)}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 