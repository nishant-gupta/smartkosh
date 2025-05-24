'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getNotificationIcon, getIcon } from '@/utils/icons'

interface Notification {
  id: string
  title: string
  message: string
  type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO'
  read: boolean
  date: string
  createdAt: string
  relatedTo?: string
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString()
}

// Create a client component that uses search params
function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const pageSize = 10
  const totalPages = Math.ceil(totalCount / pageSize)
  
  // Get page from URL or default to 1
  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1')
    if (page !== currentPage) {
      setCurrentPage(page)
    }
  }, [searchParams, currentPage])
  
  // Fetch notifications for the current page
  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      
      // Calculate offset based on current page
      const offset = (currentPage - 1) * pageSize
      
      const response = await fetch(`/api/notifications?limit=${pageSize}&offset=${offset}&includeRead=true`)
      const data = await response.json()
      
      if (response.ok) {
        setNotifications(data.notifications)
        setTotalCount(data.totalCount || data.notifications.length)
      } else {
        console.error('Error fetching notifications:', data.error)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      })
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ markAll: true })
      })
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true }))
        )
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }
  
  // Navigate to a specific page
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      router.push(`/profile/notifications?page=${page}`)
    }
  }
  
  // Load notifications when page changes
  useEffect(() => {
    fetchNotifications()
  }, [currentPage])
  
  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="flex justify-end items-center mb-6">
        
          {notifications.some(n => !n.read) && (
            <button 
              onClick={markAllAsRead}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Mark all as read
            </button>
          )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-60">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : notifications.length > 0 ? (
        <>
          <div className="bg-white rounded-lg shadow">
            {notifications.map(notification => (
              <div 
              key={notification.id}
              className={`p-5 border-b border-gray-100 ${!notification.read ? 'bg-blue-50' : ''}`}>
                <div className="flex items-start">
                 {/* Icon based on notification type */}
                 <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                    notification.type === 'SUCCESS' ? 'bg-green-100 text-green-500' :
                    notification.type === 'WARNING' ? 'bg-yellow-100 text-yellow-500' :
                    notification.type === 'ERROR' ? 'bg-red-100 text-red-500' :
                    'bg-blue-100 text-blue-500'
                  }`}>
                    {notification.type === 'SUCCESS' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : notification.type === 'WARNING' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : notification.type === 'ERROR' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    )}
                    </div>
                  
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-base font-medium text-gray-900">{notification.title}</h3>
                      <div className="flex space-x-2">
                        <span className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                        
                        {!notification.read && (
                          <button 
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                    {notification.relatedTo && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {notification.relatedTo}
                        </span>
                      </div>
                    )}
                    </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  disabled={currentPage === 1}
                  onClick={() => goToPage(currentPage - 1)}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => goToPage(currentPage + 1)}
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
                    {totalCount > 0 ? (
                      <>
                        Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * pageSize, totalCount)}
                        </span>{' '}
                        of <span className="font-medium">{totalCount}</span> notifications
                      </>
                    ) : (
                      'No notifications found'
                    )}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => goToPage(currentPage - 1)}
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
                          onClick={() => goToPage(pageToShow!)}
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
                      onClick={() => goToPage(currentPage + 1)}
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
          )}
        </>
      ) : (
        <div className="bg-white p-8 rounded-lg text-center">
          {getIcon('bell', { className: 'h-12 w-12 mx-auto text-gray-400 mb-4' })}
          <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications</h3>
          <p className="text-gray-500">You don't have any notifications yet.</p>
        </div>
      )}
    </div>
  )
}

// Loading component for Suspense
function NotificationsLoading() {
  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
      </div>
      <div className="flex justify-center items-center h-60">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    </div>
  )
}

// Main page component with Suspense
export default function NotificationsCenter() {
  return (
    <Suspense fallback={<NotificationsLoading />}>
      <NotificationsContent />
    </Suspense>
  )
} 