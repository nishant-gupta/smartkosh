'use client'

import { useState, useEffect } from 'react'

export default function FinancialOverview() {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0
  })

  useEffect(() => {
    // Simulate data fetching
    setTimeout(() => {
      // This would be replaced with actual API calls
      setData({
        totalBalance: 12450.72,
        totalIncome: 3200,
        totalExpenses: 1850.28,
        netSavings: 1349.72
      })
      setIsLoading(false)
    }, 1000)
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <OverviewCard
        title="Total Balance"
        value={data.totalBalance}
        format="currency"
        trend="neutral"
      />
      <OverviewCard
        title="Monthly Income"
        value={data.totalIncome}
        format="currency"
        trend="positive"
      />
      <OverviewCard
        title="Monthly Expenses"
        value={data.totalExpenses}
        format="currency"
        trend="negative"
      />
      <OverviewCard
        title="Net Savings"
        value={data.netSavings}
        format="currency"
        trend={data.netSavings > 0 ? "positive" : "negative"}
      />
    </div>
  )
}

type TrendType = 'positive' | 'negative' | 'neutral'

interface OverviewCardProps {
  title: string
  value: number
  format: 'currency' | 'percentage' | 'number'
  trend: TrendType
}

function OverviewCard({ title, value, format, trend }: OverviewCardProps) {
  const formatValue = () => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value)
    }
    if (format === 'percentage') {
      return `${value.toFixed(1)}%`
    }
    return value.toLocaleString()
  }

  const trendColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }

  const trendIcons = {
    positive: '↑',
    negative: '↓',
    neutral: '•'
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-2 text-3xl font-semibold">{formatValue()}</p>
      <div className={`mt-2 flex items-center ${trendColors[trend]}`}>
        <span className="mr-1">{trendIcons[trend]}</span>
        <span className="text-sm">
          {trend === 'positive' ? '+8.2% from last month' : 
           trend === 'negative' ? '-4.5% from last month' : 
           'No change from last month'}
        </span>
      </div>
    </div>
  )
} 