'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import TransactionModal from '@/components/TransactionModal'

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
}

interface CategoryItemProps {
  category: string;
  amount: string;
  percentage: number;
  color: string;
}

interface InsightItemProps {
  icon: string;
  text: string;
}

interface TransactionItemProps {
  icon: string;
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
  
  // Mock transactions for demonstration
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      accountId: 'acc1',
      amount: 42.50,
      description: 'Grubhub',
      category: 'Food & Dining',
      date: '2025-04-19',
      type: 'expense'
    },
    {
      id: '2',
      accountId: 'acc1',
      amount: 2125.00,
      description: 'Salary Deposit',
      category: 'Salary',
      date: '2025-04-15',
      type: 'income'
    },
    {
      id: '3',
      accountId: 'acc1',
      amount: 950.00,
      description: 'Rent Payment',
      category: 'Housing',
      date: '2025-04-10',
      type: 'expense'
    },
    {
      id: '4',
      accountId: 'acc1',
      amount: 78.35,
      description: 'Amazon',
      category: 'Shopping',
      date: '2025-04-08',
      type: 'expense'
    },
    {
      id: '5',
      accountId: 'acc1',
      amount: 45.82,
      description: 'Shell Gas Station',
      category: 'Transportation',
      date: '2025-04-05',
      type: 'expense'
    }
  ];
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      setIsLoading(false)
    }
  }, [status, router])
  
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
            amount="$4,250.00" 
            trend="+12%" 
            period="vs last month" 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            } 
          />
          <SummaryCard 
            title="TOTAL EXPENSES" 
            amount="$2,840.50" 
            trend="+8%" 
            period="vs last month" 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            } 
          />
          <SummaryCard 
            title="NET FLOW" 
            amount="$1,409.50" 
            trend="+23%" 
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
                  <div className="w-full h-full rounded-full border-8 border-gray-200"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-sm">
                    Spending Distribution Chart
                  </div>
                </div>
              </div>
              <div className="w-full md:w-1/2">
                <div className="space-y-4">
                  <CategoryItem category="Housing" amount="$950.00" percentage={34} color="bg-indigo-600" />
                  <CategoryItem category="Food & Dining" amount="$620.25" percentage={22} color="bg-purple-500" />
                  <CategoryItem category="Transportation" amount="$425.75" percentage={15} color="bg-blue-500" />
                  <CategoryItem category="Entertainment" amount="$350.00" percentage={12} color="bg-green-500" />
                  <CategoryItem category="Other" amount="$494.50" percentage={17} color="bg-gray-400" />
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
              {mockTransactions.map(transaction => (
                <TransactionItem 
                  key={transaction.id}
                  icon={getTransactionIcon(transaction.category)}
                  name={transaction.description}
                  date={formatDate(transaction.date)}
                  amount={formatAmount(transaction.amount, transaction.type)}
                  isNegative={transaction.type === 'expense'}
                  transaction={transaction}
                  onEdit={handleEditTransaction}
                />
              ))}
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
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={handleCloseTransactionModal}
        transaction={selectedTransaction}
        mode={transactionModalMode}
      />
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

function SummaryCard({ title, amount, trend, period, icon }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-start">
        <div className="text-xs text-gray-500">{title}</div>
        <div>{icon}</div>
      </div>
      <div className="text-2xl font-bold mt-2">{amount}</div>
      <div className="flex items-center mt-2 text-xs">
        <span className="text-green-600">{trend}</span>
        <span className="text-gray-500 ml-1">{period}</span>
      </div>
    </div>
  )
}

function CategoryItem({ category, amount, percentage, color }: CategoryItemProps) {
  return (
    <div>
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
    <div className="flex items-center justify-between p-3 hover:bg-gray-50">
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl mr-3">
          {icon}
        </div>
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-gray-500">{date}</div>
        </div>
      </div>
      <div className="flex items-center">
        <div className={`font-medium ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
          {amount}
        </div>
        {transaction && onEdit && (
          <button 
            onClick={() => onEdit(transaction)}
            className="ml-4 text-gray-400 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
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
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  return `${type === 'income' ? '+' : '-'}${formatter.format(amount)}`;
}

function getTransactionIcon(category: string): string {
  const categoryIcons: Record<string, string> = {
    'Food & Dining': '🍔',
    'Groceries': '🛒',
    'Housing': '🏠',
    'Transportation': '⛽',
    'Entertainment': '🎬',
    'Bills & Utilities': '💡',
    'Shopping': '🛍️',
    'Health & Medical': '🏥',
    'Personal Care': '💇',
    'Education': '📚',
    'Travel': '✈️',
    'Investments': '📈',
    'Salary': '🏦',
    'Business': '💼',
    'Gifts & Donations': '🎁',
    'Other': '📋'
  };
  
  return categoryIcons[category] || '💵';
}