'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { getNavIcon, getIcon } from '@/utils/icons'

// Define interfaces for component props
interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

interface NavItemProps {
  children: React.ReactNode;
  href: string;
  icon: string;
  isActive?: boolean;
}

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

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
  }, [isMobileMenuOpen, isUserMenuOpen, setIsMobileMenuOpen]);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await signOut({ redirect: true, callbackUrl: '/login' });
  };
  
  return (
    <div 
      className={`sidebar fixed lg:sticky lg:top-0 w-64 bg-gray-900 text-white p-4 flex flex-col z-30 h-full lg:h-screen transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      <div className="flex items-center space-x-2 mb-8">
        <span className="bg-white text-gray-900 p-1 rounded-md">
          {getIcon('logo', { className: 'h-5 w-5' })}
        </span>
        <span className="font-bold">SmartKosh</span>
      </div>
      
      <div className="mb-8">
        <div className="text-sm text-gray-400">Free trial</div>
        <div className="text-sm">9 days left</div>
      </div>
      
      <nav className="flex-1 space-y-1">
        <NavItem href="/dashboard" icon="dashboard" isActive={pathname === '/dashboard'}>Dashboard</NavItem>
        <NavItem href="/transactions" icon="transaction" isActive={pathname === '/transactions' || pathname.startsWith('/transactions/')}>Transactions</NavItem>
        <NavItem href="/financial-goals" icon="target" isActive={pathname === '/financial-goals'}>Financial Goals</NavItem>
        <NavItem href="/analytics" icon="analytics" isActive={pathname === '/analytics'}>Analytics</NavItem>
        <NavItem href="/budget" icon="budget" isActive={pathname === '/budget'}>Budget</NavItem>
        <NavItem href="/insights" icon="insights" isActive={pathname === '/insights'}>Insights</NavItem>
      </nav>
      
      <div className="mt-auto pt-4 border-t border-gray-700">
        <NavItem href="/settings" icon="settings" isActive={pathname === '/settings'}>Settings</NavItem>
        <div className="user-menu">
          <div 
            className="flex items-center mt-4 space-x-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-800"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              {session?.user?.name?.charAt(0) || 'U'}
            </div>
            <div className="text-sm flex-1">{session?.user?.name || 'User'}</div>
            {getIcon('chevron-down', { className: `h-4 w-4 invert transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}` })}
          </div>
          
          {isUserMenuOpen && (
            <div className="pl-11 mt-1">
              <Link 
                href="/profile" 
                className="flex items-center space-x-2 py-2 px-3 text-sm hover:bg-gray-800 rounded-md"
                onClick={() => setIsUserMenuOpen(false)}
              >
                {getIcon('profile', { className: 'h-4 w-4 invert' })}
                <span>Profile</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 py-2 px-3 text-sm hover:bg-gray-800 rounded-md w-full text-left"
              >
                {getIcon('logout', { className: 'h-4 w-4 invert' })}
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NavItem({ children, href, icon, isActive = false }: NavItemProps) {
  return (
    <Link href={href} className={`flex items-center space-x-3 px-3 py-2 rounded-md ${isActive ? 'bg-gray-800' : 'hover:bg-gray-800'}`}>
      <span>{getNavIcon(icon, { className: 'h-5 w-5 invert' })}</span>
      <span>{children}</span>
    </Link>
  )
} 