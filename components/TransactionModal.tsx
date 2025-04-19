'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Account {
  id: string;
  name: string;
  type: string;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: {
    id: string;
    accountId: string;
    amount: number;
    description: string;
    category: string;
    date: string;
    type: 'income' | 'expense' | 'transfer';
    notes?: string;
  };
  mode: 'add' | 'edit';
}

const EXPENSE_CATEGORIES = [
  'Food & Dining', 
  'Groceries',
  'Shopping',
  'Transportation',
  'Entertainment',
  'Bills & Utilities',
  'Health & Medical',
  'Housing',
  'Education',
  'Travel',
  'Personal Care',
  'Investments',
  'Gifts & Donations',
  'Other'
];

const INCOME_CATEGORIES = [
  'Salary',
  'Business',
  'Investments',
  'Rental Income',
  'Gifts',
  'Interest',
  'Dividends',
  'Refunds',
  'Other'
];

export default function TransactionModal({ isOpen, onClose, transaction, mode }: TransactionModalProps) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    accountId: '',
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().slice(0, 10),
    type: 'expense' as 'income' | 'expense' | 'transfer',
    notes: ''
  });

  // Mock accounts for testing
  const mockAccounts: Account[] = [
    { id: 'acc1', name: 'Main Checking', type: 'checking' },
    { id: 'acc2', name: 'Savings', type: 'savings' },
    { id: 'acc3', name: 'Credit Card', type: 'credit' }
  ];

  // Fetch user accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        // For demo purposes, use mock accounts
        // In production, uncomment the API call:
        /*
        const response = await fetch('/api/accounts');
        if (!response.ok) {
          throw new Error('Failed to fetch accounts');
        }
        const data = await response.json();
        setAccounts(data.accounts || []);
        */
        
        // Using mock accounts for testing
        setAccounts(mockAccounts);
        
        // Set default account if available and adding new transaction
        if (mockAccounts.length && mode === 'add') {
          setFormData(prev => ({
            ...prev,
            accountId: mockAccounts[0].id
          }));
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
        setError('Failed to load accounts. Please try again.');
      }
    };

    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen, mode]);

  // Populate form when editing existing transaction
  useEffect(() => {
    if (transaction && mode === 'edit') {
      setFormData({
        accountId: transaction.accountId,
        amount: transaction.amount.toString(),
        description: transaction.description,
        category: transaction.category,
        date: new Date(transaction.date).toISOString().slice(0, 10),
        type: transaction.type,
        notes: transaction.notes || ''
      });
    }
  }, [transaction, mode]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle transaction type change
  const handleTypeChange = (type: 'income' | 'expense' | 'transfer') => {
    setFormData(prev => ({
      ...prev,
      type,
      // Reset category when changing type
      category: ''
    }));
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validate form
      if (!formData.accountId || !formData.amount || !formData.description || !formData.category) {
        throw new Error('Please fill in all required fields');
      }

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const payload = {
        ...formData,
        amount
      };

      // For demo purposes only - simulate API call
      // In production, use the actual API
      /*
      // API endpoint and method based on mode
      const url = mode === 'add' ? '/api/transactions' : `/api/transactions/${transaction?.id}`;
      const method = mode === 'add' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong');
      }
      */
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Log the transaction for debugging
      console.log(`${mode === 'add' ? 'Adding' : 'Updating'} transaction:`, payload);

      // Success - close modal and refresh
      onClose();
      
      // In production, use router.refresh() to reload data
      // router.refresh();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete transaction
  const handleDelete = async () => {
    if (!transaction?.id || mode !== 'edit') return;
    
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // For demo purposes only - simulate API call
      // In production, use the actual API
      /*
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete transaction');
      }
      */
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Log the deletion for debugging
      console.log('Deleting transaction:', transaction.id);

      // Success - close modal and refresh
      onClose();
      // router.refresh();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {mode === 'add' ? 'Add Transaction' : 'Edit Transaction'}
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Transaction Type */}
            <div className="mb-4">
              <div className="flex rounded-md overflow-hidden border">
                <button
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  className={`flex-1 py-2 px-4 focus:outline-none ${
                    formData.type === 'income' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  className={`flex-1 py-2 px-4 focus:outline-none ${
                    formData.type === 'expense' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('transfer')}
                  className={`flex-1 py-2 px-4 focus:outline-none ${
                    formData.type === 'transfer' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Transfer
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="mb-4">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                  className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">USD</span>
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="mb-4">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Account */}
            <div className="mb-4">
              <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-1">
                Account *
              </label>
              <select
                id="accountId"
                name="accountId"
                value={formData.accountId}
                onChange={handleChange}
                required
                className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select an account</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description/Merchant *
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g., Walmart, Salary, etc."
                required
                className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Category */}
            <div className="mb-4">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a category</option>
                {formData.type === 'income' ? (
                  INCOME_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))
                ) : formData.type === 'expense' ? (
                  EXPENSE_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))
                ) : (
                  <option value="Transfer">Transfer</option>
                )}
              </select>
            </div>

            {/* Notes (Optional) */}
            <div className="mb-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Add additional details here..."
                className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              ></textarea>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md"
                >
                  Delete
                </button>
              )}

              <div className={`${mode === 'edit' ? '' : 'ml-auto'} space-x-2`}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md"
                >
                  {isLoading ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 