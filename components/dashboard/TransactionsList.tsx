'use client'

import { useState, useEffect } from 'react'

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  category: string
  type: 'income' | 'expense' | 'transfer'
  accountName: string
}

export default function TransactionsList() {
  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    // Simulate fetching transactions
    setTimeout(() => {
      // This would be replaced with actual API calls
      setTransactions([
        {
          id: '1',
          date: '2023-05-15',
          description: 'Salary deposit',
          amount: 3200,
          category: 'Income',
          type: 'income',
          accountName: 'Checking Account'
        },
        {
          id: '2',
          date: '2023-05-14',
          description: 'Grocery shopping',
          amount: 125.30,
          category: 'Food',
          type: 'expense',
          accountName: 'Credit Card'
        },
        {
          id: '3',
          date: '2023-05-12',
          description: 'Electric bill',
          amount: 87.45,
          category: 'Utilities',
          type: 'expense',
          accountName: 'Checking Account'
        },
        {
          id: '4',
          date: '2023-05-10',
          description: 'Transfer to savings',
          amount: 500,
          category: 'Transfer',
          type: 'transfer',
          accountName: 'Savings Account'
        },
        {
          id: '5',
          date: '2023-05-08',
          description: 'Restaurant dinner',
          amount: 68.50,
          category: 'Dining',
          type: 'expense',
          accountName: 'Credit Card'
        }
      ])
      setIsLoading(false)
    }, 1000)
  }, [])

  if (isLoading) {
    return (
      <div className="animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-between py-3 border-b">
            <div className="flex space-x-2">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Income': '💰',
      'Food': '🍔',
      'Utilities': '💡',
      'Transfer': '↔️',
      'Dining': '🍽️',
      'Shopping': '🛍️',
      'Entertainment': '🎬',
      'Travel': '✈️',
      'Health': '🏥',
      'Education': '📚'
    }
    return icons[category] || '📋'
  }

  return (
    <div className="space-y-1">
      {transactions.map(transaction => (
        <div key={transaction.id} className="flex items-center justify-between py-3 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-lg">
              {getCategoryIcon(transaction.category)}
            </div>
            <div>
              <p className="font-medium">{transaction.description}</p>
              <p className="text-sm text-gray-500">
                {formatDate(transaction.date)} • {transaction.accountName}
              </p>
            </div>
          </div>
          <div className={`font-medium ${
            transaction.type === 'income' ? 'text-green-600' : 
            transaction.type === 'expense' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {transaction.type === 'income' ? '+' : 
             transaction.type === 'expense' ? '-' : ''}
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(transaction.amount)}
          </div>
        </div>
      ))}
      
      <div className="mt-4 text-center">
        <button className="text-primary-600 hover:text-primary-700 font-medium">
          View all transactions
        </button>
      </div>
    </div>
  )
} 