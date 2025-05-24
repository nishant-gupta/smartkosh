'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import TransactionModal from '@/components/transactions/TransactionModal'
import TransactionsList from '@/components/dashboard/TransactionsList'
import PageLayout from '@/components/PageLayout'
import { getIcon, getNavIcon, getTransactionIcon } from '@/utils/icons'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, SAVING_CATEGORIES, TRANSACTION_TYPE } from '@/utils/constants'

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
  type: string;
  suggestedAction?: string;
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
  href?: string;
}

interface Transaction {
  id: string;
  amount: number;
  category: string;
  date: string;
  description: string;
  type: 'income' | 'expense' | 'saving' | 'transfer';
  accountId: string;
}

// Update the FinancialSummary type to include category
type FinancialSummary = {
  id: string;
  userId: string;
  year: number;
  month: number;
  type: string;
  amount: number;
  category: string;
  createdAt: Date;
  updatedAt: Date;
};

// Update the FinancialSummaryState type
type FinancialSummaryState = {
  income: {
    amount: number;
    trend: number;
  };
  expenses: {
    amount: number;
    trend: number;
  };
  savings: {
    amount: number;
    trend: number;
  };
  netFlow: {
    amount: number;
    trend: number;
  };
};

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
  const [activeTab, setActiveTab] = useState<'week' | 'month' | 'year'>('month')
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
  const [financialSummary, setFinancialSummary] = useState<FinancialSummaryState>({
    income: { amount: 0, trend: 0 },
    expenses: { amount: 0, trend: 0 },
    savings: { amount: 0, trend: 0 },
    netFlow: { amount: 0, trend: 0 }
  })
  
  // State for category spending
  const [categorySpending, setCategorySpending] = useState<Record<string, number>>({})
  
  // Additional state for pie chart hover functionality
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  
  // Add a new state for the overview tab selection
  const [activeOverviewTab, setActiveOverviewTab] = useState<'financial' | 'spending' | 'savings'>('financial')
  
  // Add state for savings categories
  const [savingsByCategory, setSavingsByCategory] = useState<Record<string, number>>({})
  
  // Add state for insights
  const [insights, setInsights] = useState<any[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  
  // Define category colors
  function getCategoryColor(categoryName: string): string {
    const allCategories = [
      ...Object.values(EXPENSE_CATEGORIES),
      ...Object.values(SAVING_CATEGORIES),
      ...Object.values(INCOME_CATEGORIES),
    ];
    const category = allCategories.find(cat => cat.name === categoryName);
    return category?.color || 'bg-gray-400';
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

  // Update the getDateRange function to return Date objects
  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (activeTab) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        endDate = new Date();
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return { startDate, endDate };
  };

  // Update the getPreviousPeriodRange function to return Date objects
  const getPreviousPeriodRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (activeTab) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 14));
        endDate = new Date(now.setDate(now.getDate() + 6));
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    return { startDate, endDate };
  };

  // Helper function to format date to YYYY-MM-DD
  const formatDateToYYYYMMDD = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Update the fetchFinancialSummary function
  const fetchFinancialSummary = async () => {
    if (!session?.user) return;

    try {
      const { startDate, endDate } = getDateRange();
      const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousPeriodRange();

      if (!startDate || !prevStartDate) {
        console.error('Invalid date range');
        return;
      }

      // Get current period summaries from API
      const currentRes = await fetch(`/api/financial-summary?year=${startDate.getFullYear()}&month=${startDate.getMonth() + 1}`);
      const currentSummaries = await currentRes.json();

      // Get previous period summaries from API
      const prevRes = await fetch(`/api/financial-summary?year=${prevStartDate.getFullYear()}&month=${prevStartDate.getMonth() + 1}`);
      const prevSummaries = await prevRes.json();

      // Calculate totals for current period
      const currentIncome = currentSummaries
        .filter((s: any) => s.type === TRANSACTION_TYPE.INCOME)
        .reduce((sum: number, s: any) => sum + Number(s.amount), 0);
      const currentExpenses = currentSummaries
        .filter((s: any) => s.type === TRANSACTION_TYPE.EXPENSE)
        .reduce((sum: number, s: any) => sum + Number(s.amount), 0);
      const currentSavings = currentSummaries
        .filter((s: any) => s.type === TRANSACTION_TYPE.SAVING)
        .reduce((sum: number, s: any) => sum + Number(s.amount), 0);
      const currentNetFlow = currentIncome - currentExpenses;

      // Calculate totals for previous period
      const prevIncome = prevSummaries
        .filter((s: any) => s.type === TRANSACTION_TYPE.INCOME)
        .reduce((sum: number, s: any) => sum + Number(s.amount), 0);
      const prevExpenses = prevSummaries
        .filter((s: any) => s.type === TRANSACTION_TYPE.EXPENSE)
        .reduce((sum: number, s: any) => sum + Number(s.amount), 0);
      const prevSavings = prevSummaries
        .filter((s: any) => s.type === TRANSACTION_TYPE.SAVING)
        .reduce((sum: number, s: any) => sum + Number(s.amount), 0);
      const prevNetFlow = prevIncome - prevExpenses;

      // Calculate trends and round to no decimal places
      const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      // Update state with calculated values
      setFinancialSummary({
        income: {
          amount: currentIncome,
          trend: calculateTrend(currentIncome, prevIncome)
        },
        expenses: {
          amount: currentExpenses,
          trend: calculateTrend(currentExpenses, prevExpenses)
        },
        savings: {
          amount: currentSavings,
          trend: calculateTrend(currentSavings, prevSavings)
        },
        netFlow: {
          amount: currentNetFlow,
          trend: calculateTrend(currentNetFlow, prevNetFlow)
        }
      });

      console.log(' ********currentSummaries', currentSummaries);

      // Calculate category spending
      const categorySpending = currentSummaries
        .filter((s: any) => s.type?.toUpperCase() === TRANSACTION_TYPE.EXPENSE)
        .reduce((acc: Record<string, number>, s: any) => {
          acc[s.category] = (acc[s.category] || 0) + Number(s.amount);
          return acc;
        }, {} as Record<string, number>);

      setCategorySpending(categorySpending);

      // Calculate savings by category
      const savingsByCategory = currentSummaries
        .filter((s: any) => s.type?.toUpperCase() === TRANSACTION_TYPE.SAVING)
        .reduce((acc: Record<string, number>, s: any) => {
          acc[s.category] = (acc[s.category] || 0) + Number(s.amount);
          return acc;
        }, {} as Record<string, number>);

      setSavingsByCategory(savingsByCategory);
    } catch (error) {
      console.error('Error fetching financial summary:', error);
    }
  };
  
  // Helper function to assign colors to savings categories
  const getSavingCategoryColor = (categoryName: string): string => {
    const category = Object.values(SAVING_CATEGORIES).find(cat => cat.name === categoryName);
    return category?.color || 'bg-blue-500';
  };
  
  const fetchInsights = async (generateNew = false) => {
    if (!session?.user) return;
    
    try {
      setIsLoadingInsights(true);
      const response = await fetch(
        generateNew 
          ? '/api/insights/generate'
          : '/api/insights?limit=5&status=new',
        {
          method: generateNew ? 'POST' : 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }
      
      const data = await response.json();
      setInsights(generateNew ? data.insights : data.insights);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setIsLoadingInsights(false);
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

  const handleDeleteTransaction = (transaction: Transaction) => {
    // open a modal to confirm the deletion
    setSelectedTransaction(transaction);
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
    <PageLayout title="Dashboard">
      <div>
        {/* Financial summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6 mb-6 mt-6">
          <SummaryCard 
            title="TOTAL INCOME" 
            amount={formatCurrency(financialSummary.income.amount)} 
            trend={financialSummary.income.trend.toString() + '%'} 
            period={`vs last ${activeTab}`} 
            icon={getIcon('arrow-up', { className: 'w-5 h-5 text-green-600' })}
          />
          <SummaryCard 
            title="TOTAL EXPENSES" 
            amount={formatCurrency(financialSummary.expenses.amount)} 
            trend={financialSummary.expenses.trend.toString() + '%'}
            trendColor={financialSummary.expenses.trend > 0 ? "text-red-600" : "text-green-600"}
            period={`vs last ${activeTab}`} 
            icon={getIcon('arrow-down', { className: 'w-5 h-5 text-red-600' })}
          />
          <SummaryCard 
            title="TOTAL SAVINGS" 
            amount={formatCurrency(financialSummary.savings.amount)} 
            trend={financialSummary.savings.trend.toString() + '%'} 
            period={`vs last ${activeTab}`} 
            icon={getIcon('savings', { className: 'w-5 h-5 text-blue-600' })}
          />
          <SummaryCard 
            title="NET FLOW" 
            amount={formatCurrency(financialSummary.netFlow.amount)} 
            trend={financialSummary.netFlow.trend.toString() + '%'}
            trendColor={financialSummary.netFlow.amount >= 0 ? "text-green-600" : "text-red-600"}
            period={`vs last ${activeTab}`} 
            icon={getIcon('net-flow', { className: 'w-5 h-5 text-purple-600' })}
          />
        </div>
        
        {/* Spending overview and insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b">
              <div className="flex space-x-1 bg-gray-100 rounded-md p-1 mb-3 sm:mb-0">
                <button 
                  className={`px-3 py-1 text-sm rounded-md ${activeOverviewTab === 'financial' ? 'bg-white shadow-sm' : ''}`}
                  onClick={() => setActiveOverviewTab('financial')}
                >
                  Financial Overview
                </button>
                <button 
                  className={`px-3 py-1 text-sm rounded-md ${activeOverviewTab === 'spending' ? 'bg-white shadow-sm' : ''}`}
                  onClick={() => setActiveOverviewTab('spending')}
                >
                  Spending Overview
                </button>
                <button 
                  className={`px-3 py-1 text-sm rounded-md ${activeOverviewTab === 'savings' ? 'bg-white shadow-sm' : ''}`}
                  onClick={() => setActiveOverviewTab('savings')}
                >
                  Savings Overview
                </button>
              </div>
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
            
            {/* Financial Overview Tab */}
            {activeOverviewTab === 'financial' && (
              <div className="p-4">
                <h3 className="font-medium mb-4">Income vs Expenses vs Savings</h3>
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-1/2 flex items-center justify-center mb-6 md:mb-0">
                    <div className="w-48 h-48 relative">
                      {financialSummary.income.amount > 0 || financialSummary.expenses.amount > 0 || financialSummary.savings.amount > 0 ? (
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          {/* Create concentric rings/donut chart */}
                          {/* Outer ring (Income) */}
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="40" 
                            fill="transparent" 
                            stroke="#10B981" 
                            strokeWidth="10"
                            strokeDasharray="251.2"
                            strokeDashoffset="0"
                          />
                          
                          {/* Middle ring (Expenses) */}
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="30" 
                            fill="transparent" 
                            stroke="#EF4444" 
                            strokeWidth="10"
                            strokeDasharray="188.4"
                            strokeDashoffset={financialSummary.income.amount > 0 ? 
                              (1 - financialSummary.expenses.amount / financialSummary.income.amount) * 188.4 : 0}
                          />
                          
                          {/* Inner ring (Savings) */}
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="20" 
                            fill="transparent" 
                            stroke="#3B82F6" 
                            strokeWidth="10"
                            strokeDasharray="125.6"
                            strokeDashoffset={financialSummary.income.amount > 0 ? 
                              (1 - financialSummary.savings.amount / financialSummary.income.amount) * 125.6 : 0}
                          />
                          
                          {/* Labels */}
                          <text x="50" y="50" fontSize="10" textAnchor="middle" fill="#4B5563" dominantBaseline="middle">
                            Financial
                          </text>
                        </svg>
                      ) : (
                        <>
                          <div className="w-full h-full rounded-full border-8 border-gray-200"></div>
                          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                            No financial data yet
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="w-full md:w-1/2">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded bg-green-500 mr-2"></div>
                          <span className="text-sm">Income (Outer Ring)</span>
                        </div>
                        <span className="font-medium">{formatCurrency(financialSummary.income.amount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded bg-red-500 mr-2"></div>
                          <span className="text-sm">Expenses (Middle Ring)</span>
                        </div>
                        <span className="font-medium">{formatCurrency(financialSummary.expenses.amount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded bg-blue-500 mr-2"></div>
                          <span className="text-sm">Savings (Inner Ring)</span>
                        </div>
                        <span className="font-medium">{formatCurrency(financialSummary.savings.amount)}</span>
                      </div>
                      <div className="pt-2 mt-2 border-t">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded bg-purple-500 mr-2"></div>
                            <span className="text-sm">Net Flow</span>
                          </div>
                          <span className={`font-medium ${financialSummary.netFlow.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(financialSummary.netFlow.amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Spending Overview Tab */}
            {activeOverviewTab === 'spending' && (
              <div className="p-4 flex flex-col md:flex-row">
                <div className="w-full md:w-1/2 flex items-center justify-center mb-6 md:mb-0">
                  <div className="w-48 h-48 relative">
                    {Object.keys(categorySpending).length > 0 ? (
                      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {/* Create pie slices */}
                        {Object.entries(categorySpending).map(([category, amount]) => {
                          // Calculate the slice position
                          let previousPercentage = 0;
                          for (const [otherCategory, otherAmount] of Object.entries(categorySpending)) {
                            if (otherCategory !== category) {
                              previousPercentage += otherAmount;
                            }
                          }
                          
                          // Convert percentages to coordinates on a circle
                          const startX = 50 + 40 * Math.cos(2 * Math.PI * previousPercentage / 100);
                          const startY = 50 + 40 * Math.sin(2 * Math.PI * previousPercentage / 100);
                          
                          const endPercentage = previousPercentage + amount;
                          const endX = 50 + 40 * Math.cos(2 * Math.PI * endPercentage / 100);
                          const endY = 50 + 40 * Math.sin(2 * Math.PI * endPercentage / 100);
                          
                          // Flag for large arc (> 180 degrees)
                          const largeArcFlag = amount > 50 ? 1 : 0;
                          
                          // Create SVG arc path
                          const path = `
                            M 50 50
                            L ${startX} ${startY}
                            A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY}
                            Z
                          `;
                          
                          // Get color from Tailwind class to hex mapping
                          const hexColor = tailwindToHex[getCategoryColor(category) || 'bg-gray-400'] || "#9ca3af";
                          
                          return (
                            <path
                              key={category}
                              d={path}
                              fill={hexColor}
                              className="hover:opacity-90 transition-opacity duration-200"
                              onMouseEnter={() => setHoveredCategory(category)}
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
                    {Object.keys(categorySpending).length > 0 ? (
                      Object.entries(categorySpending).map(([category, amount]) => (
                        <CategoryItem 
                          key={category}
                          category={category} 
                          amount={formatCurrency(amount)} 
                          percentage={Math.round((amount / Object.values(categorySpending).reduce((a, b) => a + b, 0)) * 100)} 
                          color={getCategoryColor(category)}
                          isHighlighted={hoveredCategory === category} 
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
            )}
            
            {/* Savings Overview Tab */}
            {activeOverviewTab === 'savings' && (
              <div className="p-4 flex flex-col md:flex-row">
                <div className="w-full md:w-1/2 flex items-center justify-center mb-6 md:mb-0">
                  <div className="w-48 h-48 relative">
                    {Object.keys(savingsByCategory).length > 0 ? (
                      <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {/* Create pie slices */}
                        {Object.entries(savingsByCategory).map(([category, amount]) => {
                          // Calculate the slice position
                          let previousPercentage = 0;
                          for (const [otherCategory, otherAmount] of Object.entries(savingsByCategory)) {
                            if (otherCategory !== category) {
                              previousPercentage += otherAmount;
                            }
                          }
                          
                          // Convert percentages to coordinates on a circle
                          const startX = 50 + 40 * Math.cos(2 * Math.PI * previousPercentage / 100);
                          const startY = 50 + 40 * Math.sin(2 * Math.PI * previousPercentage / 100);
                          
                          const endPercentage = previousPercentage + amount;
                          const endX = 50 + 40 * Math.cos(2 * Math.PI * endPercentage / 100);
                          const endY = 50 + 40 * Math.sin(2 * Math.PI * endPercentage / 100);
                          
                          // Flag for large arc (> 180 degrees)
                          const largeArcFlag = amount > 50 ? 1 : 0;
                          
                          // Create SVG arc path
                          const path = `
                            M 50 50
                            L ${startX} ${startY}
                            A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY}
                            Z
                          `;
                          
                          // Get color from Tailwind class to hex mapping
                          const hexColor = tailwindToHex[getCategoryColor(category) || 'bg-gray-400'] || "#3B82F6";
                          
                          return (
                            <path
                              key={category}
                              d={path}
                              fill={hexColor}
                              className="hover:opacity-90 transition-opacity duration-200"
                              onMouseEnter={() => setHoveredCategory(category)}
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
                          No savings data yet
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="w-full md:w-1/2">
                  <div className="space-y-4">
                    {Object.keys(savingsByCategory).length > 0 ? (
                      Object.entries(savingsByCategory).map(([category, amount]) => (
                        <CategoryItem 
                          key={category}
                          category={category} 
                          amount={formatCurrency(amount)} 
                          percentage={Math.round((amount / Object.values(savingsByCategory).reduce((a, b) => a + b, 0)) * 100)} 
                          color={getCategoryColor(category)}
                          isHighlighted={hoveredCategory === category} 
                        />
                      ))
                    ) : (
                      <div className="text-center text-gray-500">
                        No savings in this period
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-sm">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-semibold">AI Insights</h2>
              <button 
                className="text-gray-400 hover:text-gray-500"
                onClick={() => fetchInsights(true)}
                disabled={isLoadingInsights}
              >
                {isLoadingInsights ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                ) : (
                  getIcon('refresh', { className: 'h-5 w-5' })
                )}
              </button>
            </div>
            <div className="p-4 space-y-4">
              {insights.length > 0 ? (
                insights.map((insight, index) => (
                  <InsightItem 
                    key={insight.id}
                    icon={getInsightIcon(insight.type)}
                    text={insight.summary}
                    type={insight.type}
                    suggestedAction={insight.suggestedAction}
                  />
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No insights available. Click refresh to generate new insights.
                </div>
              )}
              {insights.length > 0 && (
                <div className="text-center mt-6">
                  <Link 
                    href="/insights"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    View More Insights
                  </Link>
                </div>
              )}
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
              <TransactionsList limit={5} onEdit={handleEditTransaction} onDelete={handleDeleteTransaction} refreshTrigger={refreshTrigger} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-4">
              <QuickAction 
                icon={getIcon('add', { className: 'w-5 h-5 invert' })}
                title="Add Transaction"
                onClick={handleOpenAddTransactionModal}
              />
              <QuickAction 
                icon={getIcon('upload', { className: 'w-5 h-5 invert' })}
                title="Upload Statement"
                href="/transactions/upload"
              />
              <QuickAction 
                icon={getIcon('budget', { className: 'w-5 h-5 invert' })}
                title="Set Budget Goal"
                href="/budget/goals"
              />
              <QuickAction 
                icon={getIcon('export', { className: 'w-5 h-5 invert' })}
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
    </PageLayout>
  )
}

function NavItem({ children, href, icon, isActive = false }: NavItemProps) {
  return (
    <Link href={href} className={`flex items-center space-x-3 px-3 py-2 rounded-md ${isActive ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>
      <span>{getNavIcon(icon)}</span>
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

function InsightItem({ icon, text, type, suggestedAction }: InsightItemProps) {
  return (
    <div className="flex space-x-3">
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-lg">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-700">{text}</p>
        {suggestedAction && (
          <p className="text-xs text-gray-500 mt-1">
            Suggested Action: {suggestedAction}
          </p>
        )}
      </div>
    </div>
  )
}

function getInsightIcon(type: string): string {
  switch (type) {
    case 'goal_suggestion':
      return '🎯';
    case 'goal_progress':
      return '📈';
    case 'spending_alert':
      return '⚠️';
    case 'general_advice':
      return '💡';
    default:
      return 'ℹ️';
  }
}

function TransactionItem({ 
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
          {transaction?.category ? getTransactionIcon(transaction.category) : getIcon('other', { className: 'w-5 h-5' })}
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
              {getIcon('edit', { className: 'w-4 h-4' })}
            </button>
            <button 
              onClick={() => {
                if (transaction && window.confirm('Are you sure you want to delete this transaction?')) {
                  fetch(`/api/transactions/${transaction.id}`, {
                    method: 'DELETE',
                  })
                  .then(response => {
                    if (response.ok) {
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
              {getIcon('delete', { className: 'w-4 h-4' })}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function QuickAction({ icon, title, href, onClick }: QuickActionProps & { onClick?: () => void }) {
  const content = (
    <>
      <div className="bg-gray-900 p-3 rounded-full text-indigo-600">
        {icon}
      </div>
      <div className="font-medium">{title}</div>
    </>
  );

  if (onClick) {
    return (
      <div 
        className="bg-white rounded-lg shadow p-4 flex items-center space-x-3 cursor-pointer hover:bg-gray-50"
        onClick={onClick}
      >
        {content}
      </div>
    );
  }

  // If no onClick is provided, href must be defined
  if (!href) {
    href = "#"; // Fallback to prevent errors
  }

  return (
    <Link 
      href={href}
      className="bg-white rounded-lg shadow p-4 flex items-center space-x-3 cursor-pointer hover:bg-gray-50"
    >
      {content}
    </Link>
  );
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
  
  if (type === 'income') {
    return `+${formatter.format(amount)}`;
  } else if (type === 'saving') {
    return `↗${formatter.format(amount)}`;
  } else {
    return `-${formatter.format(amount)}`;
  }
}