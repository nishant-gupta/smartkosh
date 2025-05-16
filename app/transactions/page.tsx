'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import TransactionModal from '@/components/TransactionModal'
import PageLayout from '@/components/PageLayout'
import { getIcon } from '@/utils/icons'

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
          <div className="flex space-x-4 mt-4">
            <button
              onClick={handleExportTransactions}
              className="bg-gray-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
            >
              {getIcon('export', { className: 'h-4 w-4 invert' })}
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <Link
              href="/transactions/upload"
              className="bg-gray-800 text-white px-4 py-2 rounded-md flex items-center space-x-2"
            >
              {getIcon('upload', { className: 'h-4 w-4 invert' })}
              <span className="hidden sm:inline">Upload</span>
            </Link>
            <button
              onClick={handleOpenAddTransactionModal}
              className="bg-gray-900 text-white px-4 py-2 rounded-md flex items-center space-x-2"
            >
              {getIcon('add', { className: 'h-4 w-4 invert' })}
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
                    {getIcon('chevron-right', { className: 'h-4 w-4' })}
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
                          {getIcon('edit', { className: 'h-4 w-4' })}
                        </button>
                        <button 
                          onClick={() => handleDeleteTransaction(transaction.id)}
                          className="text-gray-400 hover:text-red-600 p-1"
                          title="Delete transaction"
                        >
                          {getIcon('delete', { className: 'h-4 w-4' })}
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
                    {getIcon('edit', { className: 'h-5 w-5' })}
                  </button>
                  <button 
                    onClick={() => handleDeleteTransaction(transaction.id)}
                    className="text-gray-500 hover:text-red-600 p-1"
                  >
                    {getIcon('delete', { className: 'h-5 w-5' })}
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
                    {currentPage === 1 ? (
                      getIcon('chevron-left-disabled', { className: 'h-5 w-5' })
                    ) : (
                      getIcon('chevron-left', { className: 'h-5 w-5' })
                    )}
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
                    {currentPage === totalPages ? (
                      getIcon('chevron-right-disabled', { className: 'h-5 w-5' })
                    ) : (
                      getIcon('chevron-right', { className: 'h-5 w-5' })
                    )}
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
                  {getIcon('close', { className: 'h-6 w-6' })}
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
