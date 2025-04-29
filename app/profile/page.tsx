'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/profile/basic')
  }, [router])

  return (
    <div className="flex justify-center items-center p-6">
      <div className="text-center">
        <div className="w-12 h-12 border-t-4 border-gray-900 border-solid rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
} 