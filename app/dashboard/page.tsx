'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import TransactionModal from '@/components/TransactionModal'
import TransactionsList from '@/components/dashboard/TransactionsList'

// We'll use inline SVGs instead of heroicons
// Icons
// import { 
//   ArrowUpIcon, 
//   ArrowDownIcon, 
//   ScaleIcon,
//   PlusIcon,
//   ArrowUpOnSquareIcon,
//   DocumentTextIcon,
//   CogIcon
// } from '@heroicons/react/24/outline'

// Define interfaces for our component props
interface NavItemProps {
  children: React.ReactNode;
  href: string;
  icon: string;
  isActive?: boolean;
}

interface SummaryCardProps {
  title: string;
  amount: string;
  trend: string;
  period: string;
  icon: ReactNode;
  trendColor?: string;
}

interface CategoryItemProps {
  category: string;
  amount: string;
  percentage: number;
  color: string;
  isHighlighted?: boolean;
}

interface InsightItemProps {
  icon: string;
  text: string;
}

interface TransactionItemProps {
  icon: React.ReactNode;
  name: string;
  date: string;
  amount: string;
  isNegative?: boolean;
  transaction?: Transaction;
  onEdit?: (transaction: Transaction) => void;
}

interface QuickActionProps {
  icon: ReactNode;
  title: string;
  href: string;
}

interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  type: 'income' | 'expense' | 'transfer';
  notes?: string;
}

// Define Tailwind color mapping to hex values
const tailwindToHex: Record<string, string> = {
  "bg-indigo-600": "#4f46e5",
  "bg-purple-500": "#a855f7",
  "bg-emerald-500": "#10b981",
  "bg-blue-500": "#3b82f6",
  "bg-green-500": "#22c55e",
  "bg-yellow-500": "#eab308",
  "bg-pink-500": "#ec4899",
  "bg-red-500": "#ef4444",
  "bg-orange-500": "#f97316",
  "bg-teal-500": "#14b8a6",
  "bg-cyan-500": "#06b6d4",
  "bg-lime-500": "#84cc16",
  "bg-amber-500": "#f59e0b",
  "bg-violet-500": "#8b5cf6",
  "bg-rose-500": "#f43f5e",
  "bg-green-600": "#16a34a",
  "bg-gray-400": "#9ca3af"
};

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('month')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>(undefined)
  const [transactionModalMode, setTransactionModalMode] = useState<'add' | 'edit'>('add')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // State for real transactions data
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  // New state for financial summary
  const [financialSummary, setFinancialSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netFlow: 0,
    incomeTrend: '+0%',
    expensesTrend: '+0%',
    netFlowTrend: '+0%'
  })
  
  // State for category spending
  const [categorySpending, setCategorySpending] = useState<Array<{
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }>>([])
  
  // Additional state for pie chart hover functionality
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  
  // Define category colors
  const categoryColors: Record<string, string> = {
    "Housing": "bg-indigo-600",
    "Food & Dining": "bg-purple-500",
    "Groceries": "bg-emerald-500",
    "Transportation": "bg-blue-500",
    "Entertainment": "bg-green-500",
    "Bills & Utilities": "bg-yellow-500",
    "Shopping": "bg-pink-500",
    "Health & Medical": "bg-red-500",
    "Personal Care": "bg-orange-500",
    "Education": "bg-teal-500",
    "Travel": "bg-cyan-500",
    "Investments": "bg-lime-500",
    "Gifts & Donations": "bg-amber-500",
    "Salary": "bg-violet-500",
    "Business": "bg-rose-500",
    "Income": "bg-green-600",
    "Other": "bg-gray-400"
  }
  
  // Fetch accounts data 
  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/accounts');
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  // Get date range based on active tab
  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;
    
    if (activeTab === 'week') {
      // Get current week (Sunday to Saturday)
      const day = now.getDay(); // 0 = Sunday, 6 = Saturday
      startDate = new Date(now);
      startDate.setDate(now.getDate() - day); // Go to last Sunday
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6); // Saturday
    } else if (activeTab === 'month') {
      // Current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (activeTab === 'year') {
      // Current year
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    }
    
    return {
      startDate: startDate?.toISOString().split('T')[0],
      endDate: endDate?.toISOString().split('T')[0]
    };
  };

  // New function to fetch transactions and calculate financial summary
  const fetchFinancialSummary = async () => {
    try {
      // Get date range based on active tab
      const { startDate, endDate } = getDateRange();
      
      // Fetch transactions for the selected period
      const response = await fetch(`/api/transactions?startDate=${startDate}&endDate=${endDate}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      const periodTransactions = data.transactions || [];
      
      // Calculate totals
      let totalIncome = 0;
      let totalExpenses = 0;
      
      // Track spending by category
      const categories: Record<string, number> = {};
      
      periodTransactions.forEach((transaction: Transaction) => {
        if (transaction.type === 'income') {
          totalIncome += transaction.amount;
        } else if (transaction.type === 'expense') {
          totalExpenses += transaction.amount;
          
          // Add to category totals for expenses only
          const category = transaction.category || 'Other';
          categories[category] = (categories[category] || 0) + transaction.amount;
        }
      });
      
      const netFlow = totalIncome - totalExpenses;
      
      // For now, we'll set static trends until we implement historical comparison
      setFinancialSummary({
        totalIncome,
        totalExpenses,
        netFlow,
        incomeTrend: '+12%',  // These would ideally be calculated from previous month's data
        expensesTrend: '+8%',
        netFlowTrend: netFlow > 0 ? '+23%' : '-10%'
      });
      
      // Calculate category percentages and prepare for display
      if (totalExpenses > 0) {
        const categoryData = Object.entries(categories)
          .map(([category, amount]) => ({
            category,
            amount,
            percentage: Math.round((amount / totalExpenses) * 100),
            color: categoryColors[category] || 'bg-gray-400'
          }))
          .sort((a, b) => b.amount - a.amount) // Sort by amount descending
          .slice(0, 5); // Take top 5 categories
        
        // If we have more than 5 categories, add an "Other" category with the remaining amount
        if (Object.keys(categories).length > 5) {
          const topCategoriesAmount = categoryData.reduce((sum, item) => sum + item.amount, 0);
          const otherAmount = totalExpenses - topCategoriesAmount;
          
          if (otherAmount > 0) {
            categoryData.push({
              category: 'Other',
              amount: otherAmount,
              percentage: Math.round((otherAmount / totalExpenses) * 100),
              color: 'bg-gray-400'
            });
          }
        }
        
        setCategorySpending(categoryData);
      } else {
        setCategorySpending([]);
      }
    } catch (error) {
      console.error('Error fetching financial summary:', error);
    }
  };
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      setIsLoading(false)
      // Fetch accounts data when authenticated
      fetchAccounts()
      // Fetch financial summary
      fetchFinancialSummary()
    }
  }, [status, router])

  // Refresh summary when transactions change or active tab changes
  useEffect(() => {
    if (status === 'authenticated') {
      fetchFinancialSummary();
    }
  }, [refreshTrigger, activeTab, status]);
  
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
  
  const handleOpenAddTransactionModal = () => {
    setSelectedTransaction(undefined);
    setTransactionModalMode('add');
    setIsTransactionModalOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setTransactionModalMode('edit');
    setIsTransactionModalOpen(true);
  };

  const handleCloseTransactionModal = () => {
    setIsTransactionModalOpen(false);
  };
  
  const handleSaveTransaction = async (transaction: Transaction) => {
    try {
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
          throw new Error('Failed to create transaction');
        }
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
          throw new Error('Failed to update transaction');
        }
      }
      
      // Close modal and reset
      setIsTransactionModalOpen(false);
      
      // Refresh accounts data after transaction changes
      fetchAccounts();
      
      // Increment refresh trigger to reload transactions list
      setRefreshTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Failed to save transaction. Please try again.');
    }
  };
  
  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0, // No decimal places for Rupees
    }).format(amount);
  };
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-gray-900 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your financial dashboard...</p>
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
          <NavItem href="/dashboard" icon="dashboard" isActive>Dashboard</NavItem>
          <NavItem href="/transactions" icon="transactions">Transactions</NavItem>
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
                className="lg:hidden mr-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg md:text-xl font-semibold">Dashboard</h1>
            </div>
            
            <div className="flex space-x-4">
              <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <button 
                className="bg-gray-900 text-white px-4 py-2 rounded-md flex items-center space-x-2"
                onClick={handleOpenAddTransactionModal}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Add Transaction</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Financial summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-6">
          <SummaryCard 
            title="TOTAL INCOME" 
            amount={formatCurrency(financialSummary.totalIncome)} 
            trend={financialSummary.incomeTrend} 
            period="vs last month" 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            } 
          />
          <SummaryCard 
            title="TOTAL EXPENSES" 
            amount={formatCurrency(financialSummary.totalExpenses)} 
            trend={financialSummary.expensesTrend}
            trendColor={financialSummary.expensesTrend.startsWith('+') ? "text-red-600" : "text-green-600"}
            period="vs last month" 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            } 
          />
          <SummaryCard 
            title="NET FLOW" 
            amount={formatCurrency(financialSummary.netFlow)} 
            trend={financialSummary.netFlowTrend}
            trendColor={financialSummary.netFlow >= 0 ? "text-green-600" : "text-red-600"}
            period="vs last month" 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            } 
          />
        </div>
        
        {/* Spending overview and insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b">
              <h2 className="font-semibold mb-2 sm:mb-0">Spending Overview</h2>
              <div className="flex space-x-1 bg-gray-100 rounded-md p-1 w-full sm:w-auto">
                <button 
                  className={`px-3 py-1 text-sm rounded-md ${activeTab === 'week' ? 'bg-white shadow-sm' : ''}`}
                  onClick={() => setActiveTab('week')}
                >
                  Week
                </button>
                <button 
                  className={`px-3 py-1 text-sm rounded-md ${activeTab === 'month' ? 'bg-white shadow-sm' : ''}`}
                  onClick={() => setActiveTab('month')}
                >
                  Month
                </button>
                <button 
                  className={`px-3 py-1 text-sm rounded-md ${activeTab === 'year' ? 'bg-white shadow-sm' : ''}`}
                  onClick={() => setActiveTab('year')}
                >
                  Year
                </button>
              </div>
            </div>
            <div className="p-4 flex flex-col md:flex-row">
              <div className="w-full md:w-1/2 flex items-center justify-center mb-6 md:mb-0">
                <div className="w-48 h-48 relative">
                  {categorySpending.length > 0 ? (
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      {/* Create pie slices */}
                      {categorySpending.map((category, index) => {
                        // Calculate the slice position
                        let previousPercentage = 0;
                        for (let i = 0; i < index; i++) {
                          previousPercentage += categorySpending[i].percentage;
                        }
                        
                        // Convert percentages to coordinates on a circle
                        const startX = 50 + 40 * Math.cos(2 * Math.PI * previousPercentage / 100);
                        const startY = 50 + 40 * Math.sin(2 * Math.PI * previousPercentage / 100);
                        
                        const endPercentage = previousPercentage + category.percentage;
                        const endX = 50 + 40 * Math.cos(2 * Math.PI * endPercentage / 100);
                        const endY = 50 + 40 * Math.sin(2 * Math.PI * endPercentage / 100);
                        
                        // Flag for large arc (> 180 degrees)
                        const largeArcFlag = category.percentage > 50 ? 1 : 0;
                        
                        // Create SVG arc path
                        const path = `
                          M 50 50
                          L ${startX} ${startY}
                          A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY}
                          Z
                        `;
                        
                        // Get color from Tailwind class to hex mapping
                        const hexColor = tailwindToHex[category.color] || "#9ca3af";
                        
                        return (
                          <path
                            key={category.category}
                            d={path}
                            fill={hexColor}
                            className="hover:opacity-90 transition-opacity duration-200"
                            onMouseEnter={() => setHoveredCategory(category.category)}
                            onMouseLeave={() => setHoveredCategory(null)}
                            stroke="#fff"
                            strokeWidth="1"
                          />
                        );
                      })}
                      
                      {/* White circle in the middle for donut effect */}
                      <circle cx="50" cy="50" r="25" fill="white" />
                    </svg>
                  ) : (
                    <>
                      <div className="w-full h-full rounded-full border-8 border-gray-200"></div>
                      <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                        No expense data yet
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <div className="space-y-4">
                  {categorySpending.length > 0 ? (
                    categorySpending.map((category, index) => (
                      <CategoryItem 
                        key={index}
                        category={category.category} 
                        amount={formatCurrency(category.amount)} 
                        percentage={category.percentage} 
                        color={category.color}
                        isHighlighted={hoveredCategory === category.category} 
                      />
                    ))
                  ) : (
                    <div className="text-center text-gray-500">
                      No expenses in this period
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-semibold">AI Insights</h2>
              <button className="text-gray-400 hover:text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              <InsightItem 
                icon="🍽️" 
                text="Your spending on Dining Out is up 15% this month compared to last month." 
              />
              <InsightItem 
                icon="💰" 
                text="You saved 33% of your income this month, exceeding your goal of 25%." 
              />
              <div className="text-center mt-6">
                <button className="text-sm text-gray-600 hover:text-gray-900">
                  View More Insights
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent transactions and quick actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-semibold">Recent Transactions</h2>
              <Link href="/transactions" className="text-sm text-gray-600 hover:text-gray-900">
                View All
              </Link>
            </div>
            <div className="divide-y">
              <TransactionsList limit={5} onEdit={handleEditTransaction} refreshTrigger={refreshTrigger} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-4">
              <QuickAction 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                } 
                title="Add Transaction" 
                href="#"
                onClick={handleOpenAddTransactionModal}
              />
              <QuickAction 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                } 
                title="Upload Statement" 
                href="#" 
              />
              <QuickAction 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
                title="Set Budget Goal"
                href="/budget/goals"
              />
              <QuickAction 
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                title="Export Report"
                href="/reports/export"
              />
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
    </div>
  )
}

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

function SummaryCard({ title, amount, trend, period, icon, trendColor = "text-green-600" }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-start">
        <div className="text-xs text-gray-500">{title}</div>
        <div>{icon}</div>
      </div>
      <div className="text-2xl font-bold mt-2">{amount}</div>
      <div className="flex items-center mt-2 text-xs">
        <span className={trendColor}>{trend}</span>
        <span className="text-gray-500 ml-1">{period}</span>
      </div>
    </div>
  )
}

function CategoryItem({ category, amount, percentage, color, isHighlighted = false }: CategoryItemProps) {
  return (
    <div className={`${isHighlighted ? 'bg-gray-50 rounded-md p-1 -m-1' : ''} transition-all duration-150`}>
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center">
          <span className={`w-3 h-3 ${color} rounded-full mr-2`}></span>
          <span className="text-sm">{category}</span>
        </div>
        <span className="text-sm font-medium">{amount}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  )
}

function InsightItem({ icon, text }: InsightItemProps) {
  return (
    <div className="flex space-x-3">
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-700">{text}</p>
      </div>
    </div>
  )
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
          <div className="flex gap-1">
            <button 
              onClick={() => onEdit(transaction)}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-edit">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
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
                      // You would typically refresh your transactions list here
                      window.location.reload();
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
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-trash-2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickAction({ icon, title, href, onClick }: QuickActionProps & { onClick?: () => void }) {
  return (
    <div 
      className="bg-white rounded-lg shadow p-4 flex items-center space-x-3 cursor-pointer hover:bg-gray-50"
      onClick={onClick}
    >
      <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
        {icon}
      </div>
      <div className="font-medium">{title}</div>
    </div>
  )
}

// Helper functions for formatting
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatAmount(amount: number, type: string): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
  return `${type === 'income' ? '+' : '-'}${formatter.format(amount)}`;
}

function getTransactionIcon(category: string): JSX.Element {
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
    'Entertainment': renderIcon(<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2z" />),
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
}