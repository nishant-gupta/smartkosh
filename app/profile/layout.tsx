'use client'

import { useState, ReactNode } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getIcon } from '@/utils/icons'

interface ProfileLayoutProps {
  children: ReactNode
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const getPageTitle = () => {
    switch (pathname) {
      case '/profile':
        return 'Profile Settings'
      case '/profile/financial-goals':
        return 'Financial Goals'
      case '/profile/notifications':
        return 'Notifications'
      case '/profile/basic':
        return 'Basic Information'
      case '/profile/financial':
        return 'Financial Information'
      case '/profile/accounts':
        return 'Linked Accounts'
      case '/profile/change-password':
        return 'Change Password'
      default:
        return 'Profile Settings'
    }
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
            {getIcon('bank', { className: 'h-5 w-5' })}
          </span>
          <span className="font-bold">SmartKosh</span>
        </div>
        
        <div className="mb-8">
          <div className="text-lg text-white font-medium">{getPageTitle()}</div>
        </div>
        
        <nav className="flex-1 space-y-1">
          <NavItem href="/profile/basic" isActive={pathname === '/profile' || pathname === '/profile/basic'}>
            <div className="flex items-center space-x-2">
              {getIcon('profile', { className: 'h-5 w-5 invert' })}
              <span>Basic Info</span>
            </div>
          </NavItem>
          <NavItem href="/profile/financial" isActive={pathname === '/profile/financial'}>
            <div className="flex items-center space-x-2">
              {getIcon('salary', { className: 'h-5 w-5 invert' })}
              <span>Financial Info</span>
            </div>
          </NavItem>
          <NavItem href="/profile/accounts" isActive={pathname === '/profile/accounts'}>
            <div className="flex items-center space-x-2">
              {getIcon('accounts', { className: 'h-5 w-5 invert' })}
              <span>Linked Accounts</span>
            </div>
          </NavItem>
          <NavItem href="/profile/financial-goals" isActive={pathname === '/profile/financial-goals'}>
            <div className="flex items-center space-x-2">
              {getIcon('target', { className: 'h-5 w-5 invert' })}
              <span>Financial Goals</span>
            </div>
          </NavItem>
          <NavItem href="/profile/notifications" isActive={pathname?.startsWith('/profile/notifications')}>
            <div className="flex items-center space-x-2">
              {getIcon('bell', { className: 'h-5 w-5 invert' })}
              <span>Notifications</span>
            </div>
          </NavItem>
          <NavItem href="/profile/change-password" isActive={pathname === '/profile/change-password'}>
            <div className="flex items-center space-x-2">
              {getIcon('key', { className: 'h-5 w-5 invert' })}
              <span>Change Password</span>
            </div>
          </NavItem>
        </nav>
        
        <div className="mt-auto pt-4 border-t border-gray-700">
          <div className="user-menu">
            <div className="flex items-center mt-4 space-x-3 px-3 py-2 rounded-md">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                {session?.user?.name?.charAt(0) || 'U'}
              </div>
              <div className="text-sm flex-1">{session?.user?.name || 'User'}</div>
            </div>
            
            <div className="pl-11 mt-1">
              <Link 
                href="/dashboard" 
                className="flex items-center space-x-2 py-2 px-3 text-sm hover:bg-gray-800 rounded-md"
              >
                {getIcon('dashboard', { className: 'h-4 w-4 invert' })}
                <span>Dashboard</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 py-2 px-3 text-sm hover:bg-gray-800 rounded-md w-full text-left"
              >
                {getIcon('logout', { className: 'h-4 w-4 invert' })}
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 lg:ml-0 p-4 lg:p-8">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white shadow-sm mb-6">
          <div className="flex justify-between items-center px-4 py-3">
            <div className="flex items-center">
              <button 
                className="lg:hidden mr-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {getIcon('menu', { className: 'h-6 w-6' })}
              </button>
              <h1 className="text-lg md:text-xl font-semibold">{getPageTitle()}</h1>
            </div>
            
            <div className="flex space-x-4">
              <Link href="/dashboard" className="p-2 text-gray-700 hover:bg-gray-100 rounded-md">
                <span className="flex items-center space-x-2">
                  {getIcon('arrow-left', { className: 'h-5 w-5' })}
                  <span className="hidden sm:inline">Back to Dashboard</span>
                </span>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Page content */}
        <div className="bg-white rounded-lg shadow">
          {children}
        </div>
      </div>
    </div>
  )
}

// Navigation item component
function NavItem({ children, href, isActive = false }: { children: ReactNode, href: string, isActive?: boolean }) {
  return (
    <Link href={href} className={`flex items-center space-x-3 px-3 py-2 rounded-md ${isActive ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>
      <span>{children}</span>
    </Link>
  )
} 