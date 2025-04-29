'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import TransactionModal from '@/components/TransactionModal'
import PageLayout from '@/components/PageLayout'

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
  type: 'income' | 'expense' | 'saving';
  notes?: string;
  aiReviewNeeded?: boolean;
}

// Filter options
type DateFilter = 'this-month' | 'last-month' | 'this-year' | 'custom';
type CategoryFilter = 'all' | string;
type TypeFilter = 'all' | 'income' | 'expense' | 'saving';
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
  const [totalTransactions, setTotalTransactions] = useState(0)
  
  // State for custom date range
  const [customDateRange, setCustomDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  // State to control date range modal
  const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState(false);
  
  // State to track if custom date range is applied
  const [isCustomDateApplied, setIsCustomDateApplied] = useState(false);
  
  // State to track validation errors
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);
  
  // Check if date range is valid (within 6 months)
  const isValidDateRange = () => {
    const startDate = new Date(customDateRange.startDate);
    const endDate = new Date(customDateRange.endDate);
    
    // Check if end date is after start date
    if (endDate < startDate) {
      setDateRangeError('End date cannot be before start date');
      return false;
    }
    
    // Check if range is no more than 6 months
    const sixMonthsLater = new Date(startDate);
    sixMonthsLater.setMonth(startDate.getMonth() + 6);
    
    if (endDate > sixMonthsLater) {
      setDateRangeError('Date range cannot exceed 6 months');
      return false;
    }
    
    setDateRangeError(null);
    return true;
  };
  
  // Fetch transactions from API
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      // Add date filters
      if (dateFilter === 'this-month') {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        params.append('startDate', firstDay.toISOString().split('T')[0]);
        params.append('endDate', lastDay.toISOString().split('T')[0]);
      } else if (dateFilter === 'last-month') {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        
        params.append('startDate', firstDay.toISOString().split('T')[0]);
        params.append('endDate', lastDay.toISOString().split('T')[0]);
      } else if (dateFilter === 'this-year') {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), 0, 1);
        const lastDay = new Date(now.getFullYear(), 11, 31);
        
        params.append('startDate', firstDay.toISOString().split('T')[0]);
        params.append('endDate', lastDay.toISOString().split('T')[0]);
      } else if (dateFilter === 'custom' && customDateRange.startDate && customDateRange.endDate) {
        params.append('startDate', customDateRange.startDate);
        params.append('endDate', customDateRange.endDate);
      }
      
      // Add category filter if selected
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      
      // Add type filter if selected
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      
      // Add sort option
      params.append('sort', sortOption);
      
      const response = await fetch(`/api/transactions?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      setTransactions(data.transactions || []);
      setFilteredTransactions(data.transactions || []);
      setTotalPages(data.pagination.pages || 1);
      setTotalTransactions(data.pagination.total || 0);
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
      
      // Check for refresh parameter
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('refresh') === 'true') {
        // Set date filter to "this-year" to ensure recently added transactions are visible
        setDateFilter('this-year');
        // Remove the refresh parameter from URL to avoid refreshing on subsequent page loads
        router.replace('/transactions');
      }
    }
  }, [status, router, currentPage, itemsPerPage]);
  
  // Re-fetch when filters or pagination changes
  useEffect(() => {
    if (status === 'authenticated') {
      fetchTransactions();
    }
  }, [dateFilter, categoryFilter, typeFilter, sortOption, currentPage, itemsPerPage, isCustomDateApplied]);
  
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
    // Skip client-side filtering since we're now filtering on the server
    // If necessary, we might need to handle some UI changes when filters change
    // Reset to first page when filters change
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [dateFilter, categoryFilter, typeFilter, sortOption]);
  
  // Get current page items
  const getCurrentPageItems = () => {
    return filteredTransactions;
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
    if (type === 'income') {
      return `+₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.abs(amount))}`
    } else if (type === 'saving') {
      return `↗₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.abs(amount))}`
    } else {
      return `-₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.abs(amount))}`
    }
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
  
  // Handler for date filter change
  const handleDateFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as DateFilter;
    setDateFilter(value);
    
    if (value === 'custom') {
      // Clear validation errors before opening modal
      setDateRangeError(null);
      // Open date range modal
      setIsDateRangeModalOpen(true);
    }
  };

  // Handle custom date apply
  const handleApplyCustomDate = () => {
    if (!isValidDateRange()) {
      return;
    }
    
    setIsDateRangeModalOpen(false);
    // Toggle this state to trigger the fetchTransactions effect
    setIsCustomDateApplied(prev => !prev);
    // Force page back to 1
    setCurrentPage(1);
  };
  
  // Function to handle exporting transactions
  const handleExportTransactions = async () => {
    try {
      setIsLoading(true);
      
      // Build query parameters - similar to fetchTransactions but without pagination
      const params = new URLSearchParams();
      
      // Add date filters
      if (dateFilter === 'this-month') {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        params.append('startDate', firstDay.toISOString().split('T')[0]);
        params.append('endDate', lastDay.toISOString().split('T')[0]);
      } else if (dateFilter === 'last-month') {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
        
        params.append('startDate', firstDay.toISOString().split('T')[0]);
        params.append('endDate', lastDay.toISOString().split('T')[0]);
      } else if (dateFilter === 'this-year') {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), 0, 1);
        const lastDay = new Date(now.getFullYear(), 11, 31);
        
        params.append('startDate', firstDay.toISOString().split('T')[0]);
        params.append('endDate', lastDay.toISOString().split('T')[0]);
      } else if (dateFilter === 'custom' && customDateRange.startDate && customDateRange.endDate) {
        params.append('startDate', customDateRange.startDate);
        params.append('endDate', customDateRange.endDate);
      }
      
      // Add category filter if selected
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      
      // Add type filter if selected
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      
      // Add sort option
      params.append('sort', sortOption);
      
      // Add export flag
      params.append('export', 'true');
      
      const response = await fetch(`/api/transactions/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to export transactions');
      }
      
      const data = await response.blob();
      
      // Generate a filename
      let filename = 'transactions';
      if (dateFilter === 'this-month') {
        const now = new Date();
        filename += `_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      } else if (dateFilter === 'last-month') {
        const now = new Date();
        let month = now.getMonth();
        let year = now.getFullYear();
        if (month === 0) {
          month = 12;
          year -= 1;
        }
        filename += `_${year}-${String(month).padStart(2, '0')}`;
      } else if (dateFilter === 'this-year') {
        const now = new Date();
        filename += `_${now.getFullYear()}`;
      } else if (dateFilter === 'custom') {
        filename += `_${customDateRange.startDate}_to_${customDateRange.endDate}`;
      }
      filename += '.csv';
      
      // Create download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting transactions:', error);
      alert('Failed to export transactions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
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
    <PageLayout title="Transactions">
      {/* Main content that is rendered inside the PageLayout */}
      <div>
        {/* Header with upload and add buttons */}
        <div className="flex justify-between items-center mb-4">
          <div></div> {/* Empty div for spacing */}
          <div className="flex space-x-4">
            <button
              onClick={handleExportTransactions}
              className="bg-gray-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <Link
              href="/transactions/upload"
              className="bg-gray-800 text-white px-4 py-2 rounded-md flex items-center space-x-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span className="hidden sm:inline">Upload</span>
            </Link>
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

        {/* Transactions content */}
        <div className="max-w-7xl mx-auto">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <select 
                value={dateFilter}
                onChange={handleDateFilterChange}
                className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="this-year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
              {dateFilter === 'custom' && (
                <div className="mt-2 flex items-center text-sm text-gray-600">
                  <span>{new Date(customDateRange.startDate).toLocaleDateString()}</span>
                  <span className="mx-2">-</span>
                  <span>{new Date(customDateRange.endDate).toLocaleDateString()}</span>
                  <button 
                    onClick={() => setIsDateRangeModalOpen(true)}
                    className="ml-2 text-indigo-600 hover:text-indigo-800"
                    title="Change date range"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </div>
              )}
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
                <option value="saving">Saving</option>
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

          {/* Transactions Table - Desktop View */}
          <div className="bg-white rounded-lg shadow overflow-hidden hidden md:block">
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
                      <span className={
                        transaction.type === 'income' 
                          ? 'text-green-600' 
                          : transaction.type === 'saving' 
                            ? 'text-blue-600' 
                            : 'text-red-600'
                      }>
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
          </div>

          {/* Transactions Cards - Mobile View */}
          <div className="md:hidden space-y-4">
            {getCurrentPageItems().map(transaction => (
              <div key={transaction.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">{formatDate(transaction.date)}</span>
                  <span className={
                    transaction.type === 'income' 
                      ? 'text-green-600 font-medium' 
                      : transaction.type === 'saving' 
                        ? 'text-blue-600 font-medium' 
                        : 'text-red-600 font-medium'
                  }>
                    {formatAmount(transaction.amount, transaction.type)}
                  </span>
                </div>
                
                <div className="font-medium mb-1">{transaction.description}</div>
                
                <div className="flex items-center text-sm text-gray-700 mb-3">
                  <span className="mr-2 text-lg">
                    {getCategoryIcon(transaction.category)}
                  </span>
                  <span>{transaction.category}</span>
                </div>
                
                {transaction.aiReviewNeeded && (
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      AI Review Needed
                    </span>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 mt-2 border-t pt-2">
                  <button 
                    onClick={() => handleEditTransaction(transaction)}
                    className="text-gray-500 hover:text-gray-700 p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleDeleteTransaction(transaction.id)}
                    className="text-gray-500 hover:text-red-600 p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
            
          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
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
                  {totalTransactions > 0 ? (
                    <>
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {(currentPage - 1) * itemsPerPage + filteredTransactions.length}
                      </span>{' '}
                      of <span className="font-medium">{totalTransactions}</span> transactions
                    </>
                  ) : (
                    'No transactions found'
                  )}
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
                  {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                    // Display page numbers with proper logic for handling up to 10 pages
                    let pageToShow: number | null = null;
                    
                    if (totalPages <= 10) {
                      // If 10 or fewer pages, show all
                      pageToShow = i + 1;
                    } else if (currentPage <= 5) {
                      // Near the start
                      if (i < 8) {
                        pageToShow = i + 1;
                      } else if (i === 8) {
                        return (
                          <span
                            key="ellipsis-end"
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                          >
                            ...
                          </span>
                        );
                      } else {
                        pageToShow = totalPages;
                      }
                    } else if (currentPage >= totalPages - 4) {
                      // Near the end
                      if (i === 0) {
                        pageToShow = 1;
                      } else if (i === 1) {
                        return (
                          <span
                            key="ellipsis-start"
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                          >
                            ...
                          </span>
                        );
                      } else {
                        pageToShow = totalPages - 9 + i;
                      }
                    } else {
                      // In the middle
                      if (i === 0) {
                        pageToShow = 1;
                      } else if (i === 1) {
                        return (
                          <span
                            key="ellipsis-start"
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                          >
                            ...
                          </span>
                        );
                      } else if (i === 9) {
                        pageToShow = totalPages;
                      } else if (i === 8) {
                        return (
                          <span
                            key="ellipsis-end"
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                          >
                            ...
                          </span>
                        );
                      } else {
                        // Show 5 pages around current page
                        pageToShow = currentPage - 3 + i;
                      }
                    }
                    
                    if (pageToShow === null) return null;
                    
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

      {/* Transaction Modal */}
      {isTransactionModalOpen && (
        <TransactionModal
          isOpen={isTransactionModalOpen}
          onClose={handleCloseTransactionModal}
          onSave={handleSaveTransaction}
          transaction={selectedTransaction}
          mode={transactionModalMode}
        />
      )}
      
      {/* Date Range Modal */}
      {isDateRangeModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Select Date Range</h2>
                <button 
                  onClick={() => setIsDateRangeModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={customDateRange.startDate}
                    onChange={(e) => {
                      setCustomDateRange(prev => ({...prev, startDate: e.target.value}));
                      setTimeout(isValidDateRange, 0); // Validate after state update
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={customDateRange.endDate}
                    onChange={(e) => {
                      setCustomDateRange(prev => ({...prev, endDate: e.target.value}));
                      setTimeout(isValidDateRange, 0); // Validate after state update
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                {dateRangeError && (
                  <div className="text-sm text-red-600 font-medium">
                    {dateRangeError}
                  </div>
                )}
                
                <div className="text-sm text-gray-500">
                  <p>Note: Maximum date range is 6 months</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsDateRangeModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustomDate}
                  disabled={!!dateRangeError}
                  className={`px-4 py-2 ${
                    dateRangeError
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gray-900 hover:bg-gray-800'
                  } text-white rounded-md`}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
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