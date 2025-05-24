'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function BasicInfoPage() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    dob: '',
    address: '',
    currentPassword: '',
    newPassword: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    if (session?.user) {
      // Fetch user profile from the API
      const fetchUserProfile = async () => {
        try {
          const response = await fetch('/api/profile')
          if (!response.ok) {
            throw new Error('Failed to fetch profile')
          }

          const data = await response.json()
          
          // Format date of birth from ISO to YYYY-MM-DD (HTML date input format)
          let formattedDob = ''
          if (data.dob) {
            const date = new Date(data.dob)
            formattedDob = date.toISOString().split('T')[0]
          }
          
          // Update form data with the retrieved user profile
          setFormData({
            ...formData,
            email: data.email || '',
            name: data.name || '',
            // Include profile fields from the API response
            phone: data.phone || '',
            dob: formattedDob,
            address: data.address || '',
            currentPassword: '',
            newPassword: '',
          })
          
          setIsLoading(false)
        } catch (error) {
          console.error('Error fetching user profile:', error)
          // Fall back to session data if API fails
          setFormData({
            ...formData,
            email: session.user.email || '',
            name: session.user.name || '',
          })
          setIsLoading(false)
        }
      }

      fetchUserProfile()
    }
  }, [session])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage({ type: '', text: '' })

    try {
      // Update the user profile through the API
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }
      
      // Clear password fields on successful update
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
      }))
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (error: any) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to update profile. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <div className="w-12 h-12 border-t-4 border-gray-900 border-solid rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      
      {message.text && (
        <div className={`mb-4 p-3 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Email Address */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              readOnly
            />
          </div>
          
          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          {/* Phone Number */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="+1 (XXX) XXX-XXXX"
            />
          </div>
          
          {/* Date of Birth */}
          <div>
            <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              id="dob"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          {/* Address */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Enter your full address"
            />
          </div>
          <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className={`px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600 ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
            disabled={isSaving}
          >
            {isSaving ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </div>
    </form>
    </div>
  )
} 