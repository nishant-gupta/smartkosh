'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import TransactionModal from '@/components/TransactionModal'

// Define NavItem props interface
interface NavItemProps {
  children: React.ReactNode;
  href: string;
  icon: string;
  isActive?: boolean;
}

// Transaction interface
interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  notes?: string;
  aiReviewNeeded?: boolean;
}

// Filter options
type DateFilter = 'this-month' | 'last-month' | 'this-year' | 'custom';
type CategoryFilter = 'all' | string;
type TypeFilter = 'all' | 'income' | 'expense' | 'transfer';
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'category';

export default function TransactionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Transaction state
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  
  // Modal state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>(undefined)
  const [transactionModalMode, setTransactionModalMode] = useState<'add' | 'edit'>('add')
  
  // Sidebar state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  
  // Filter and sort state
  const [dateFilter, setDateFilter] = useState<DateFilter>('this-month')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('date-desc')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // Fetch transactions from API
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/transactions?page=${currentPage}&limit=${itemsPerPage}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      setTransactions(data.transactions);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Authentication check and initial data load
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchTransactions();
    }
  }, [status, router, currentPage, itemsPerPage])
  
  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('.sidebar') && !target.closest('.hamburger-menu')) {
        setIsMobileMenuOpen(false);
      }
      
      // Close user menu when clicking outside
      if (isUserMenuOpen && !target.closest('.user-menu')) {
        setIsUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen, isUserMenuOpen]);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await signOut({ redirect: true, callbackUrl: '/login' });
  };
  
  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...transactions]
    
    // Apply date filter
    if (dateFilter === 'this-month') {
      const now = new Date()
      const thisMonth = now.getMonth()
      const thisYear = now.getFullYear()
      filtered = filtered.filter(transaction => {
        const date = new Date(transaction.date)
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear
      })
    } else if (dateFilter === 'last-month') {
      const now = new Date()
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
      const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
      filtered = filtered.filter(transaction => {
        const date = new Date(transaction.date)
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
      })
    } else if (dateFilter === 'this-year') {
      const thisYear = new Date().getFullYear()
      filtered = filtered.filter(transaction => {
        const date = new Date(transaction.date)
        return date.getFullYear() === thisYear
      })
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.category === categoryFilter)
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === typeFilter)
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortOption === 'date-desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      } else if (sortOption === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      } else if (sortOption === 'amount-desc') {
        return b.amount - a.amount
      } else if (sortOption === 'amount-asc') {
        return a.amount - b.amount
      } else if (sortOption === 'category') {
        return a.category.localeCompare(b.category)
      }
      return 0
    })
    
    setFilteredTransactions(filtered)
    setTotalPages(Math.ceil(filtered.length / itemsPerPage))
    
    // Reset to first page when filters change
    setCurrentPage(1)
  }, [transactions, dateFilter, categoryFilter, typeFilter, sortOption, itemsPerPage])
  
  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredTransactions.slice(startIndex, endIndex)
  }
  
  // Handler functions
  const handleOpenAddTransactionModal = () => {
    setSelectedTransaction(undefined)
    setTransactionModalMode('add')
    setIsTransactionModalOpen(true)
  }
  
  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setTransactionModalMode('edit')
    setIsTransactionModalOpen(true)
  }
  
  const handleCloseTransactionModal = () => {
    setIsTransactionModalOpen(false)
  }
  
  const handleSaveTransaction = async (transaction: Transaction) => {
    try {
      setIsSubmitting(true);
      
      if (transactionModalMode === 'add') {
        // Create new transaction
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transaction),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create transaction');
        }
        
        // Refresh transactions after successful creation
        fetchTransactions();
      } else {
        // Update existing transaction
        const response = await fetch(`/api/transactions/${transaction.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transaction),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update transaction');
        }
        
        // Refresh transactions after successful update
        fetchTransactions();
      }
      
      setIsTransactionModalOpen(false);
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Failed to save transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete transaction');
      }
      
      // Refresh transactions after successful deletion
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // fetchTransactions will be called due to the dependency in the useEffect
  }
  
  // Helper functions
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }
  
  const formatAmount = (amount: number, type: string): string => {
    return `${type === 'income' ? '+' : '-'}₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.abs(amount))}`
  }
  
  // Get unique categories for filter
  const getUniqueCategories = () => {
    const allCategories = transactions.map(t => t.category);
    return ['all', ...Array.from(new Set(allCategories))];
  }
  
  // Add a function to get category icons
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Income': '💰',
      'Salary': '💰',
      'Food': '🍔',
      'Utilities': '💡',
      'Transfer': '↔️',
      'Dining': '🍽️',
      'Shopping': '🛍️',
      'Entertainment': '🎬',
      'Travel': '✈️',
      'Health': '🏥',
      'Health & Medical': '🏥',
      'Personal Care': '💆',
      'Education': '📚',
      'Groceries': '🛒',
      'Housing': '🏠',
      'Transportation': '🚗',
      'Bills & Utilities': '📱',
      'Business': '💼',
      'Investments': '📈',
      'Rental Income': '🏘️',
      'Dividends': '💸',
      'Interest': '💹',
      'Gifts': '🎁',
      'Gifts & Donations': '🎁',
      'Refunds': '↩️',
      'Other': '📋'
    }
    return icons[category] || '📋'
  }
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-gray-900 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`sidebar fixed lg:sticky lg:top-0 w-64 bg-gray-900 text-white p-4 flex flex-col z-30 h-full lg:h-screen transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center space-x-2 mb-8">
          <span className="bg-white text-gray-900 p-1 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
          </span>
          <span className="font-bold">SmartKosh</span>
        </div>
        
        <div className="mb-8">
          <div className="text-sm text-gray-400">Free trial</div>
          <div className="text-sm">9 days left</div>
        </div>
        
        <nav className="flex-1 space-y-1">
          <NavItem href="/dashboard" icon="dashboard">Dashboard</NavItem>
          <NavItem href="/transactions" icon="transactions" isActive>Transactions</NavItem>
          <NavItem href="/analytics" icon="analytics">Analytics</NavItem>
          <NavItem href="/budget" icon="budget">Budget</NavItem>
          <NavItem href="/insights" icon="insights">Insights</NavItem>
        </nav>
        
        <div className="mt-auto pt-4 border-t border-gray-700">
          <NavItem href="/settings" icon="settings">Settings</NavItem>
          <div className="user-menu">
            <div 
              className="flex items-center mt-4 space-x-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-800"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                {session?.user?.name?.charAt(0) || 'U'}
              </div>
              <div className="text-sm flex-1">{session?.user?.name || 'User'}</div>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            
            {isUserMenuOpen && (
              <div className="pl-11 mt-1">
                <Link 
                  href="/profile" 
                  className="flex items-center space-x-2 py-2 px-3 text-sm hover:bg-gray-800 rounded-md"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Profile</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-2 py-2 px-3 text-sm hover:bg-gray-800 rounded-md w-full text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 lg:ml-0 p-4 lg:p-8">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
          <div className="flex justify-between items-center px-4 py-3">
            <div className="flex items-center">
              <button 
                className="lg:hidden mr-2 text-gray-500 hover:text-gray-700 focus:outline-none hamburger-menu"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg md:text-xl font-semibold">Transactions</h1>
            </div>
            
            <div className="flex space-x-4">
              <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button 
                onClick={handleOpenAddTransactionModal}
                className="bg-gray-900 text-white px-4 py-2 rounded-md flex items-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Add Transaction</span>
              </button>
            </div>
          </div>
        </div>

        {/* Existing transactions content - keep this part unchanged */}
        <div className="max-w-7xl mx-auto">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 mt-6">
            <div>
              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="this-year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            
            <div>
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Categories</option>
                {getUniqueCategories().filter(c => c !== 'all').map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            
            <div>
              <select 
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="date-desc">Sort by Date ↓</option>
                <option value="date-asc">Sort by Date ↑</option>
                <option value="amount-desc">Sort by Amount ↓</option>
                <option value="amount-asc">Sort by Amount ↑</option>
                <option value="category">Sort by Category</option>
              </select>
            </div>
          </div>
        
          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getCurrentPageItems().map(transaction => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.description}
                        </div>
                        {transaction.aiReviewNeeded && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            AI Review Needed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2 text-xl" title={transaction.category}>
                          {getCategoryIcon(transaction.category)}
                        </span>
                        <span className="text-sm text-gray-900">
                          {transaction.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {formatAmount(transaction.amount, transaction.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleEditTransaction(transaction)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                          title="Edit transaction"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="text-gray-400 hover:text-red-600 p-1"
                          title="Delete transaction"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, filteredTransactions.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredTransactions.length}</span> transactions
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Always show first page, last page, current page, and pages around current page
                      let pageToShow: number | null = null;
                      
                      if (totalPages <= 5) {
                        // If 5 or fewer pages, show all
                        pageToShow = i + 1;
                      } else if (currentPage <= 3) {
                        // Near the start
                        if (i < 4) {
                          pageToShow = i + 1;
                        } else {
                          pageToShow = totalPages;
                        }
                      } else if (currentPage >= totalPages - 2) {
                        // Near the end
                        if (i === 0) {
                          pageToShow = 1;
                        } else {
                          pageToShow = totalPages - 4 + i;
                        }
                      } else {
                        // In the middle
                        if (i === 0) {
                          pageToShow = 1;
                        } else if (i === 4) {
                          pageToShow = totalPages;
                        } else {
                          pageToShow = currentPage - 1 + (i - 1);
                        }
                      }
                      
                      // Show ellipsis instead of some page numbers
                      if (totalPages > 5) {
                        if (
                          (i === 1 && pageToShow !== 2) ||
                          (i === 3 && pageToShow !== totalPages - 1)
                        ) {
                          return (
                            <span
                              key={`ellipsis-${i}`}
                              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                            >
                              ...
                            </span>
                          );
                        }
                      }
                      
                      return (
                        <button
                          key={pageToShow}
                          onClick={() => handlePageChange(pageToShow!)}
                          className={`relative inline-flex items-center px-4 py-2 border ${
                            currentPage === pageToShow
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          } text-sm font-medium`}
                        >
                          {pageToShow}
                        </button>
                      );
                    })}
                    
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={handleCloseTransactionModal}
        onSave={handleSaveTransaction}
        transaction={selectedTransaction}
        mode={transactionModalMode}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}

// Navigation item component
function NavItem({ children, href, icon, isActive = false }: NavItemProps) {
  // Define icons with proper types
  const icons: { [key: string]: JSX.Element } = {
    dashboard: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    transactions: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    analytics: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    budget: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    insights: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    settings: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
  
  return (
    <Link href={href} className={`flex items-center space-x-3 px-3 py-2 rounded-md ${isActive ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>
      <span>{icons[icon]}</span>
      <span>{children}</span>
    </Link>
  )
} 