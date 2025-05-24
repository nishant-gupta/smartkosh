'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function FinancialInfoPage() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    yearlyIncome: '',
    occupation: '',
    incomeSource: '',
    taxBracket: '',
    savingsGoal: '',
    financialGoals: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (session?.user) {
      // Fetch financial profile from the API
      const fetchFinancialProfile = async () => {
        try {
          const response = await fetch('/api/profile/financial')
          if (!response.ok) {
            throw new Error('Failed to fetch financial information')
          }

          const data = await response.json()
          
          // Update form data with the retrieved financial profile
          setFormData({
            yearlyIncome: data.yearlyIncome || '',
            occupation: data.occupation || '',
            incomeSource: data.incomeSource || '',
            taxBracket: data.taxBracket || '',
            savingsGoal: data.savingsGoal || '',
            financialGoals: data.financialGoals || '',
          })
          
          setIsLoading(false)
        } catch (error) {
          console.error('Error fetching financial profile:', error)
          // If the API call fails, continue with empty values
          setIsLoading(false)
        }
      }

      fetchFinancialProfile()
    }
  }, [session])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage({ type: '', text: '' })

    try {
      // Update financial profile through the API
      const response = await fetch('/api/profile/financial', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update financial information')
      }
      
      const data = await response.json()
      
      setMessage({ type: 'success', text: 'Financial information updated successfully!' })
    } catch (error: any) {
      console.error('Error updating financial information:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to update financial information. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <div className="w-12 h-12 border-t-4 border-gray-900 border-solid rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="p-6">      
      {message.text && (
        <div className={`mb-4 p-3 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Yearly Income */}
          <div>
            <label htmlFor="yearlyIncome" className="block text-sm font-medium text-gray-700 mb-1">Yearly Income</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">₹</span>
              <input
                type="number"
                id="yearlyIncome"
                name="yearlyIncome"
                value={formData.yearlyIncome}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-r-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Enter your annual income before taxes</p>
          </div>
          
          {/* Occupation */}
          <div>
            <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
            <input
              type="text"
              id="occupation"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Software Engineer, Doctor, Business Owner"
            />
          </div>
          
          {/* Income Source */}
          <div>
            <label htmlFor="incomeSource" className="block text-sm font-medium text-gray-700 mb-1">Primary Income Source</label>
            <select
              id="incomeSource"
              name="incomeSource"
              value={formData.incomeSource}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select income source</option>
              <option value="Salary">Salary</option>
              <option value="Business">Business</option>
              <option value="Investments">Investments</option>
              <option value="Freelance">Freelance</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          {/* Tax Bracket */}
          <div>
            <label htmlFor="taxBracket" className="block text-sm font-medium text-gray-700 mb-1">Tax Bracket</label>
            <select
              id="taxBracket"
              name="taxBracket"
              value={formData.taxBracket}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select tax bracket</option>
              <option value="0-5%">0-5%</option>
              <option value="5-10%">5-10%</option>
              <option value="10-20%">10-20%</option>
              <option value="20-30%">20-30%</option>
              <option value="30%+">30%+</option>
            </select>
          </div>
          
          {/* Savings Goal */}
          <div>
            <label htmlFor="savingsGoal" className="block text-sm font-medium text-gray-700 mb-1">Monthly Savings Goal</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">₹</span>
              <input
                type="number"
                id="savingsGoal"
                name="savingsGoal"
                value={formData.savingsGoal}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-r-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>
          </div>
          
          {/* Financial Goals */}
          <div>
            <label htmlFor="financialGoals" className="block text-sm font-medium text-gray-700 mb-1">Financial Goals</label>
            <textarea
              id="financialGoals"
              name="financialGoals"
              value={formData.financialGoals}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Describe your short and long-term financial goals"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <button
            type="submit"
            className={`px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600 ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
            disabled={isSaving}
          >
            {isSaving ? 'Updating...' : 'Save Financial Information'}
          </button>
        </div>
      </form>
    </div>
  )
} 