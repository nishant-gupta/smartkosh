'use client'

import { useState, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import NotificationsMenu from './NotificationsMenu'
import { getIcon } from '@/utils/icons'

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function PageLayout({ children, title = 'Dashboard' }: PageLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Check authentication and set loading state
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-gray-900 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your financial dashboard...</p>
        </div>
      </div>
    )
  }
  
  if (status === 'unauthenticated') {
    router.push('/login')
    return null
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
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      
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
                {getIcon('menu', { className: 'h-6 w-6' })}
              </button>
              <h1 className="text-lg md:text-xl font-semibold">{title}</h1>
            </div>
            
            <div className="flex space-x-4">
              {pathname !== '/dashboard' && (
                <button
                  onClick={() => router.back()}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {getIcon('arrow-left', { className: 'h-5 w-5' })}
                </button>
              )}
              <button className="p-2 text-gray-700 hover:bg-gray-100 rounded-full">
                {getIcon('search', { className: 'h-5 w-5' })}
              </button>
              <NotificationsMenu />
            </div>
          </div>
        </div>
        
        {/* Page content */}
        {children}
      </div>
    </div>
  )
} 