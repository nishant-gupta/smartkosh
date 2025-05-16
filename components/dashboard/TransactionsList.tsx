import { useState, useEffect, ReactNode } from 'react'
import Link from 'next/link'
import { getTransactionIcon, getIcon } from '@/utils/icons'

interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  category: string
  type: 'income' | 'expense' | 'saving'
  accountId: string
}

interface TransactionItemProps {
  icon: ReactNode
  name: string
  date: string
  amount: string
  isNegative: boolean
  transaction?: Transaction
  onEdit?: (transaction: Transaction) => void
}

function TransactionItem({ 
  icon, 
  name, 
  date, 
  amount, 
  isNegative = false,
  transaction,
  onEdit 
}: TransactionItemProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{name}</p>
          <p className="text-xs text-gray-500">{date}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
          {amount}
        </span>
        {transaction && onEdit && (
          <button 
            onClick={() => onEdit(transaction)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          >
            {getIcon('edit', { className: 'h-4 w-4' })}
          </button>
        )}
      </div>
    </div>
  )
}

interface TransactionsListProps {
  limit?: number
  onEdit?: (transaction: Transaction) => void
  refreshTrigger?: number
}

export default function TransactionsList({ limit = 5, onEdit, refreshTrigger = 0 }: TransactionsListProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch(`/api/transactions?limit=${limit}`)
        if (!response.ok) throw new Error('Failed to fetch transactions')
        const data = await response.json()
        setTransactions(data.transactions || [])
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [limit, refreshTrigger])

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Format currency
  const formatCurrency = (amount: number): string => {
    const sign = amount < 0 ? '-' : '+'
    return `${sign}₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.abs(amount))}`
  }

  return (
    <div className="py-2">
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-t-2 border-gray-800 rounded-full animate-spin"></div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-gray-500 py-4 text-center">No transactions found</div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              icon={getTransactionIcon(transaction.category)}
              name={transaction.description}
              date={formatDate(transaction.date)}
              amount={formatCurrency(transaction.amount)}
              isNegative={transaction.amount < 0}
              transaction={transaction}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
      <button
        onClick={() => {}}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {getIcon('plus', { className: 'h-5 w-5' })}
        <span className="ml-2">Add Transaction</span>
      </button>
    </div>
  )
}