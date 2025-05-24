'use client'

import { useState } from 'react'

export default function ChangePasswordPage() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [message, setMessage] = useState({ text: '', type: '' })
  const [isSaving, setIsSaving] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage({ text: '', type: '' })

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ text: 'New passwords do not match', type: 'error' })
      setIsSaving(false)
      return
    }

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: formData.newPassword,

        })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ text: 'Password updated successfully', type: 'success' })
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setMessage({ text: data.message || 'Failed to update password', type: 'error' })
      }
    } catch (error) {
      setMessage({ text: 'An error occurred', type: 'error' })
    }

    setIsSaving(false)
  }

  return (
    <div className="p-6">
      {message.text && (
        <div className={`mb-4 p-3 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className={`px-3 py-1.5 bg-gray-900 text-white rounded-md flex items-center text-sm hover:bg-gray-800 w-full sm:w-auto ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
            disabled={isSaving}
          >
            {isSaving ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  )
} 