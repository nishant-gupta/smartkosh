import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  category: string
  type: 'income' | 'expense' | 'transfer'
  accountId: string
  account?: {
    name: string
    type: string
  }
  notes?: string
}

interface TransactionsListProps {
  limit?: number
  onEdit?: (transaction: Transaction) => void
  refreshTrigger?: number
}

export default function TransactionsList({ limit = 5, onEdit, refreshTrigger = 0 }: TransactionsListProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/transactions?limit=${limit}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }
      
      const data = await response.json()
      setTransactions(data.transactions)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setError('Failed to load recent transactions')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [limit, refreshTrigger])

  // Helper function to get transaction icon based on category
  const getTransactionIcon = (category: string): JSX.Element => {
    const renderIcon = (pathElement: JSX.Element) => (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {pathElement}
      </svg>
    );
    
    const categoryIcons: Record<string, JSX.Element> = {
      'Food & Dining': renderIcon(<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v18H3z M7 7h.01M7 12h.01M7 17h.01M12 7h.01M12 12h.01M12 17h.01M17 7h.01M17 12h.01M17 17h.01" />),
      'Groceries': renderIcon(<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />),
      'Housing': renderIcon(<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />),
      'Transportation': renderIcon(<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m0 0v8m0-8l-8 8m4-8v8" />),
      'Entertainment': renderIcon(<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />),
      'Bills & Utilities': renderIcon(<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />),
      'Shopping': renderIcon(<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />),
      'Health & Medical': renderIcon(<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.5l7.5-7.5 7.5 7.5m-15 6l7.5-7.5 7.5 7.5" />),
      'Personal Care': renderIcon(<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.5 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM15.5 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />),
      'Education': renderIcon(<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />),
      'Travel': renderIcon(<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />),
      'Investments': renderIcon(<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />),
      'Salary': renderIcon(<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />),
      'Business': renderIcon(<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />),
      'Gifts & Donations': renderIcon(<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112.83 1.83l-2.83 2.83m0-8a2 2 0 100 4 2 2 0 000-4zm0 0l-8 6h16l-8-6z" />),
      'Income': renderIcon(<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />),
      'Other': renderIcon(<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />)
    };
    
    return categoryIcons[category] || renderIcon(<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />);
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="py-2">
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-t-2 border-gray-800 rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 py-4">{error}</div>
      ) : transactions.length === 0 ? (
        <div className="text-gray-500 py-4 text-center">No transactions found</div>
      ) : (
        <div className="divide-y">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between py-3 px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                  {getTransactionIcon(transaction.category)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.type === 'income' ? '+' : '-'}₹{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.abs(transaction.amount))}
                </span>
                {onEdit && (
                  <div className="flex justify-end space-x-2">
                    <button 
                      onClick={() => onEdit(transaction)}
                      className="text-gray-400 hover:text-gray-600 p-1"
                      title="Edit transaction"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => {
                        if (transaction && window.confirm('Are you sure you want to delete this transaction?')) {
                          fetch(`/api/transactions/${transaction.id}`, {
                            method: 'DELETE',
                          })
                          .then(response => {
                            if (response.ok) {
                              // Refresh transactions
                              fetchTransactions();
                            } else {
                              alert('Failed to delete transaction');
                            }
                          })
                          .catch(error => {
                            console.error('Error:', error);
                            alert('An error occurred while deleting the transaction');
                          });
                        }
                      }}
                      className="text-gray-400 hover:text-red-600 p-1"
                      title="Delete transaction"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}