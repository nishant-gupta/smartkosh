'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getIcon } from '@/utils/icons'
import PageLayout from '@/components/PageLayout';

interface Insight {
  id: string;
  type: string;
  summary: string;
  suggestedAction?: string;
  generatedAt: string;
  status: string;
  goal?: {
    id: string;
    title: string;
    status: string;
    currentAmount: number;
    targetAmount: number;
  };
}

export default function InsightsPage() {
  const { data: session } = useSession()
  const [insights, setInsights] = useState<Insight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [message, setMessage] = useState({ type: '', text: '' })

  const fetchInsights = async () => {
    if (!session?.user) return
    
    try {
      setIsLoading(true)
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(selectedType && { type: selectedType }),
        ...(selectedStatus && { status: selectedStatus })
      })

      const response = await fetch(`/api/insights?${queryParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch insights')
      }

      const data = await response.json()
      setInsights(data.insights)
      setTotalPages(data.pagination.pages)
      setMessage({ type: '', text: '' })
    } catch (error) {
      console.error('Error fetching insights:', error)
      setMessage({ type: 'error', text: 'Failed to fetch insights. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const updateInsightStatus = async (insightId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/insights/${insightId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update insight status')
      }

      // Update the local state
      setInsights(insights.map(insight => 
        insight.id === insightId 
          ? { ...insight, status: newStatus }
          : insight
      ))
      setMessage({ type: 'success', text: 'Insight status updated successfully!' })
    } catch (error) {
      console.error('Error updating insight status:', error)
      setMessage({ type: 'error', text: 'Failed to update insight status. Please try again.' })
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchInsights()
    }
  }, [session, page, selectedType, selectedStatus])

  const handleTypeChange = (type: string) => {
    setSelectedType(type)
    setPage(1)
  }

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status)
    setPage(1)
  }

  const getInsightIcon = (type: string): string => {
    switch (type) {
      case 'goal_suggestion':
        return '🎯'
      case 'goal_progress':
        return '📈'
      case 'spending_alert':
        return '⚠️'
      case 'general_advice':
        return '💡'
      default:
        return 'ℹ️'
    }
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800'
      case 'action_taken':
        return 'bg-green-100 text-green-800'
      case 'dismissed':
        return 'bg-gray-100 text-gray-800'
      case 'archived':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <PageLayout title="Insights">   
    <div className="p-6">
      {message.text && (
        <div className={`mb-4 p-3 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">AI Insights</h1>
        <button
          onClick={() => fetchInsights()}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {getIcon('refresh', { className: 'h-5 w-5' })}
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 mb-6">
        <select
          value={selectedType}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Types</option>
          <option value="goal_suggestion">Goal Suggestions</option>
          <option value="goal_progress">Goal Progress</option>
          <option value="spending_alert">Spending Alerts</option>
          <option value="general_advice">General Advice</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="action_taken">Action Taken</option>
          <option value="dismissed">Dismissed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center p-6">
            <div className="w-12 h-12 border-t-4 border-gray-900 border-solid rounded-full animate-spin mx-auto"></div>
          </div>
        ) : insights.length > 0 ? (
          insights.map((insight) => (
            <div
              key={insight.id}
              className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
            >
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{insight.summary}</h3>
                      {insight.suggestedAction && (
                        <p className="text-sm text-gray-600 mt-1">
                          Suggested Action: {insight.suggestedAction}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(insight.status)}`}>
                        {insight.status.replace('_', ' ')}
                      </span>
                      <div className="relative">
                        <button
                          onClick={() => {
                            const menu = document.getElementById(`status-menu-${insight.id}`);
                            if (menu) {
                              menu.classList.toggle('hidden');
                            }
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {getIcon('more', { className: 'h-5 w-5' })}
                        </button>
                        <div
                          id={`status-menu-${insight.id}`}
                          className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200"
                        >
                          <div className="py-1">
                            <button
                              onClick={() => updateInsightStatus(insight.id, 'action_taken')}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Mark as Action Taken
                            </button>
                            <button
                              onClick={() => updateInsightStatus(insight.id, 'dismissed')}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Dismiss
                            </button>
                            <button
                              onClick={() => updateInsightStatus(insight.id, 'archived')}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Archive
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {insight.goal && (
                    <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
                      <h4 className="font-medium">Linked Goal: {insight.goal.title}</h4>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Progress</span>
                          <span>
                            {insight.goal.currentAmount} / {insight.goal.targetAmount}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${(insight.goal.currentAmount / insight.goal.targetAmount) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow-sm border border-gray-200">
            No insights found. Try adjusting your filters or generate new insights.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
    </PageLayout>
  )
} 