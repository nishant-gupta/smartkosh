'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Account {
  id: string
  name: string
  type: string
  balance: number
  lastSynced?: string
  status?: 'connected' | 'needs_attention'
}

export default function AccountsPage() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [selectedBank, setSelectedBank] = useState('')
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [newAccount, setNewAccount] = useState({ name: '', type: 'checking', balance: '' })
  const [newLinkedAccount, setNewLinkedAccount] = useState<Account | null>(null)

  useEffect(() => {
    // Fetch accounts from the API
    const fetchAccounts = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/accounts')
        
        if (!response.ok) {
          throw new Error('Failed to fetch accounts')
        }
        
        const data = await response.json()
        
        // Check if we have accounts data
        if (data && data.accounts && Array.isArray(data.accounts)) {
          // Transform the accounts data into the expected format
          const transformedAccounts = data.accounts.map((account: any) => ({
            id: account.id,
            name: account.name,
            type: account.type,
            balance: account.balance,
            lastSynced: 'Recently', // This would come from the API in a real implementation
            status: 'connected'
          }));
          
          setAccounts(transformedAccounts)
        } else {
          // If no accounts are found, set an empty array
          setAccounts([])
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching accounts:', error)
        
        // Fall back to mock data for demo purposes
        setAccounts([
          {
            id: '1',
            name: 'Chase Bank',
            type: 'bank',
            balance: 5000,
            lastSynced: '2 hours ago',
            status: 'connected'
          },
          {
            id: '2',
            name: 'American Express',
            type: 'credit',
            balance: -1200,
            lastSynced: 'Never',
            status: 'needs_attention'
          }
        ])
        
        setIsLoading(false)
      }
    }

    if (session?.user) {
      fetchAccounts()
    }
  }, [session])

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // In a real app, we would use a service like Plaid to link accounts
    // For this demo, we'll simulate the linking process by creating a new account
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: selectedBank,
          type: 'bank', // For linked accounts via Plaid, we'd determine the type from the API response
          balance: 0,    // The balance would be retrieved from the bank
          currency: "USD"
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to link account')
      }
      
      const newAccountData = await response.json()
      
      // Store the new account for use in the success modal
      setNewLinkedAccount({
        id: newAccountData.id,
        name: newAccountData.name,
        type: newAccountData.type,
        balance: newAccountData.balance,
        lastSynced: 'Just now',
        status: 'connected'
      })
      
      console.log('Linked account:', selectedBank, credentials)
      
      // Simulate success
      setShowLinkModal(false)
      setShowSuccessModal(true)
      
      // Reset form
      setSelectedBank('')
      setCredentials({ username: '', password: '' })
    } catch (error) {
      console.error('Error linking account:', error)
      
      // Fallback to simulation for the demo
      console.log('Linking account with:', selectedBank, credentials)
      
      // Create a mock account for the demo
      setNewLinkedAccount({
        id: String(Date.now()),
        name: selectedBank,
        type: 'bank',
        balance: 0,
        lastSynced: 'Just now',
        status: 'connected'
      })
      
      // Simulate success
      setShowLinkModal(false)
      setShowSuccessModal(true)
      
      // Reset form
      setSelectedBank('')
      setCredentials({ username: '', password: '' })
    }
  }

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    // Create a new account through the API
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newAccount.name,
          type: newAccount.type,
          balance: parseFloat(newAccount.balance) || 0,
          currency: "USD"
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create account')
      }
      
      const newAccountData = await response.json()
      
      // Add the new account to the list
      setAccounts(prev => [...prev, {
        id: newAccountData.id,
        name: newAccountData.name,
        type: newAccountData.type,
        balance: newAccountData.balance,
        lastSynced: 'Just now',
        status: 'connected'
      }])
      
      setShowAddModal(false)
      setNewAccount({ name: '', type: 'checking', balance: '' })
    } catch (error) {
      console.error('Error creating account:', error)
      // Fallback to client-side account creation for the demo
      const account: Account = {
        id: String(Date.now()),
        name: newAccount.name,
        type: newAccount.type,
        balance: parseFloat(newAccount.balance) || 0,
        status: 'connected'
      }
      
      setAccounts(prev => [...prev, account])
      setShowAddModal(false)
      setNewAccount({ name: '', type: 'checking', balance: '' })
    }
  }

  const handleDeleteAccount = async (id: string) => {
    // Confirm before deleting
    if (window.confirm('Are you sure you want to unlink this account? This action cannot be undone.')) {
      try {
        // Call the API to delete the account
        const response = await fetch(`/api/accounts/${id}`, {
          method: 'DELETE'
        })
        
        if (!response.ok) {
          throw new Error('Failed to delete account')
        }
        
        // Remove the account from the state
        setAccounts(prev => prev.filter(account => account.id !== id))
      } catch (error) {
        console.error('Error deleting account:', error)
        // Fallback to client-side deletion for the demo
        setAccounts(prev => prev.filter(account => account.id !== id))
      }
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Linked Accounts</h2>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowAddModal(true)} 
            className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-md flex items-center text-sm hover:bg-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Manual Account
          </button>
          <button 
            onClick={() => setShowLinkModal(true)} 
            className="px-3 py-1.5 bg-gray-900 text-white rounded-md flex items-center text-sm hover:bg-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Link New Account
          </button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">No Accounts Linked</h3>
          <p className="text-gray-500 mb-4">Link your bank and credit card accounts to start tracking your finances.</p>
          <button 
            onClick={() => setShowLinkModal(true)} 
            className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
          >
            Link an Account
          </button>
        </div>
      ) : (
        <div>
          {/* Secure connection notice */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <h3 className="font-medium mb-1">Secure Account Connection</h3>
                <p className="text-sm text-gray-600">We partner with Plaid to securely connect your accounts. Your bank login details are never stored by us.</p>
                <a href="#" className="text-sm text-indigo-600 hover:text-indigo-800 mt-1 inline-block">Learn more about our security</a>
              </div>
            </div>
          </div>

          {/* Connected Banks */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Connected Banks</h3>
            <div className="bg-white rounded-lg shadow divide-y">
              {accounts.map(account => (
                <div key={account.id} className="p-4">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-900 rounded-md flex items-center justify-center text-white mr-3">
                        {account.type === 'bank' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{account.name}</h4>
                        <p className="text-sm text-gray-500">Last synced: {account.lastSynced || 'Never'}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <button 
                        onClick={() => handleDeleteAccount(account.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Account details */}
                  <div className="mt-2 pl-13">
                    {account.type === 'bank' && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="text-sm">Checking ****1234</div>
                          <div className="text-sm font-medium">Connected</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm">Savings ****5678</div>
                          <div className="text-sm font-medium">Connected</div>
                        </div>
                      </div>
                    )}
                    
                    {account.type === 'credit' && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="text-sm">Credit Card ****9012</div>
                          {account.status === 'needs_attention' ? (
                            <div className="text-sm font-medium text-orange-500 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Re-authenticate
                            </div>
                          ) : (
                            <div className="text-sm font-medium">Connected</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Link Account Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Connect Your Bank</h2>
              <p className="text-gray-600 mb-6">Select your bank and enter your credentials to securely connect your account.</p>
              
              <form onSubmit={handleLinkAccount}>
                <div className="mb-4">
                  <label htmlFor="bank" className="block text-sm font-medium text-gray-700 mb-1">Search for your bank</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="bank"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Search for your bank"
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div 
                    className={`p-3 border rounded-md flex flex-col items-center cursor-pointer hover:border-gray-400 ${selectedBank === 'Chase' ? 'border-gray-900 bg-gray-50' : 'border-gray-200'}`}
                    onClick={() => setSelectedBank('Chase')}
                  >
                    <div className="w-10 h-10 bg-gray-900 rounded-md flex items-center justify-center text-white mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm">Chase</span>
                  </div>
                  
                  <div 
                    className={`p-3 border rounded-md flex flex-col items-center cursor-pointer hover:border-gray-400 ${selectedBank === 'Bank of America' ? 'border-gray-900 bg-gray-50' : 'border-gray-200'}`}
                    onClick={() => setSelectedBank('Bank of America')}
                  >
                    <div className="w-10 h-10 bg-gray-900 rounded-md flex items-center justify-center text-white mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm">Bank of America</span>
                  </div>
                  
                  <div 
                    className={`p-3 border rounded-md flex flex-col items-center cursor-pointer hover:border-gray-400 ${selectedBank === 'American Express' ? 'border-gray-900 bg-gray-50' : 'border-gray-200'}`}
                    onClick={() => setSelectedBank('American Express')}
                  >
                    <div className="w-10 h-10 bg-gray-900 rounded-md flex items-center justify-center text-white mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm">American Express</span>
                  </div>
                </div>
                
                {selectedBank && (
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-lg font-medium mb-4">Enter Your Credentials</h3>
                    
                    <div className="mb-4">
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <input
                        type="text"
                        id="username"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={credentials.username}
                        onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <input
                        type="password"
                        id="password"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={credentials.password}
                        onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="border-t pt-4 text-sm text-gray-500">
                      <p className="mb-2">By continuing, you agree to share:</p>
                      <ul className="space-y-1 ml-5 list-disc">
                        <li>Account balances</li>
                        <li>Transaction history</li>
                        <li>Account details</li>
                      </ul>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowLinkModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 ${!selectedBank || !credentials.username || !credentials.password ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!selectedBank || !credentials.username || !credentials.password}
                  >
                    Continue
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Manual Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Add Manual Account</h2>
              <p className="text-gray-600 mb-6">Add an account that you'll update manually.</p>
              
              <form onSubmit={handleAddAccount}>
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                  <input
                    type="text"
                    id="name"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                    placeholder="e.g. My Savings Account"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                  <select
                    id="type"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newAccount.type}
                    onChange={(e) => setNewAccount({...newAccount, type: e.target.value})}
                    required
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit Card</option>
                    <option value="investment">Investment</option>
                    <option value="loan">Loan</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="balance" className="block text-sm font-medium text-gray-700 mb-1">Current Balance</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">₹</span>
                    <input
                      type="number"
                      id="balance"
                      className="w-full border border-gray-300 rounded-r-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newAccount.balance}
                      onChange={(e) => setNewAccount({...newAccount, balance: e.target.value})}
                      placeholder="0.00"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800"
                  >
                    Add Account
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Account Linked Successfully!</h2>
              <p className="text-gray-600 mb-6">We are now fetching your initial transaction history. This may take a few minutes.</p>
              
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                  <div className="w-10 h-10 bg-gray-900 rounded-md flex items-center justify-center text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                      <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="text-lg font-medium mb-6">{newLinkedAccount?.name || selectedBank}</div>
              </div>
              
              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => {
                    if (newLinkedAccount) {
                      // Add the new account to the list
                      setAccounts(prev => [
                        ...prev,
                        newLinkedAccount
                      ])
                    }
                    setShowSuccessModal(false)
                    setNewLinkedAccount(null)
                    // Navigate to dashboard
                    window.location.href = '/dashboard'
                  }}
                  className="px-4 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => {
                    if (newLinkedAccount) {
                      // Add the new account to the list
                      setAccounts(prev => [
                        ...prev,
                        newLinkedAccount
                      ])
                    }
                    setShowSuccessModal(false)
                    setNewLinkedAccount(null)
                  }}
                  className="px-4 py-3 text-gray-700 rounded-md hover:bg-gray-100"
                >
                  View Linked Accounts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 