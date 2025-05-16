'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { getIcon } from '@/utils/icons'

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
            {getIcon('add', { className: 'h-4 w-4 mr-1' })}
            Add Manual Account
          </button>
          <button 
            onClick={() => setShowLinkModal(true)} 
            className="px-3 py-1.5 bg-gray-900 text-white rounded-md flex items-center text-sm hover:bg-gray-800"
          >
            {getIcon('add', { className: 'h-4 w-4 mr-1 invert' })}
            Link New Account
          </button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            {getIcon('bank', { className: 'h-8 w-8 text-gray-400' })}
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
              {getIcon('secure', { className: 'h-6 w-6 text-gray-700 mr-3 mt-0.5' })}
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
                          getIcon('bank', { className: 'h-5 w-5 invert' })
                        ) : (
                          getIcon('bank', { className: 'h-5 w-5 invert' })
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
                        {getIcon('delete', { className: 'h-5 w-5' })}
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
                              {getIcon('warning', { className: 'h-4 w-4 mr-1' })}
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
                      {getIcon('search', { className: 'h-5 w-5 text-gray-400' })}
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
                      {getIcon('bank', { className: 'h-5 w-5' })}
                    </div>
                    <span className="text-sm">Chase</span>
                  </div>
                  
                  <div 
                    className={`p-3 border rounded-md flex flex-col items-center cursor-pointer hover:border-gray-400 ${selectedBank === 'Bank of America' ? 'border-gray-900 bg-gray-50' : 'border-gray-200'}`}
                    onClick={() => setSelectedBank('Bank of America')}
                  >
                    <div className="w-10 h-10 bg-gray-900 rounded-md flex items-center justify-center text-white mb-2">
                      {getIcon('bank', { className: 'h-5 w-5' })}
                    </div>
                    <span className="text-sm">Bank of America</span>
                  </div>
                  
                  <div 
                    className={`p-3 border rounded-md flex flex-col items-center cursor-pointer hover:border-gray-400 ${selectedBank === 'American Express' ? 'border-gray-900 bg-gray-50' : 'border-gray-200'}`}
                    onClick={() => setSelectedBank('American Express')}
                  >
                    <div className="w-10 h-10 bg-gray-900 rounded-md flex items-center justify-center text-white mb-2">
                      {getIcon('bank', { className: 'h-5 w-5' })}
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
                {getIcon('check', { className: 'h-8 w-8 text-white' })}
              </div>
              <h2 className="text-xl font-semibold mb-2">Account Linked Successfully!</h2>
              <p className="text-gray-600 mb-6">We are now fetching your initial transaction history. This may take a few minutes.</p>
              
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                  <div className="w-10 h-10 bg-gray-900 rounded-md flex items-center justify-center text-white">
                    {getIcon('bank', { className: 'h-5 w-5' })}
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