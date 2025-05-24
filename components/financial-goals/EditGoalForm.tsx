'use client';

import { useState } from 'react';
import { getIcon } from '@/utils/icons';
import Modal from '../Modal';
import { FINANCIAL_GOAL_PRIORITIES, FINANCIAL_GOAL_STATUS } from '@/utils/constants';

interface EditGoalFormProps {
  isOpen: boolean;
  onClose: () => void;
  goal: any;
  onSave: (goal: any) => void;
}

export function EditGoalForm({ isOpen, onClose, goal, onSave }: EditGoalFormProps) {
  const [form, setForm] = useState({
    title: goal.title || '',
    description: goal.description || '',
    targetAmount: goal.targetAmount || '',
    currentAmount: goal.currentAmount || '',
    targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '',
    priority: goal.priority || 3,
    status: goal.status || 'in_progress',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const errors: { [key: string]: string } = {};
    if (!form.title) errors.title = 'Title is required';
    if (form.targetAmount === '' || isNaN(Number(form.targetAmount)) || Number(form.targetAmount) < 1) errors.targetAmount = 'Target amount must be at least 1';
    if (form.currentAmount === '' || isNaN(Number(form.currentAmount)) || Number(form.currentAmount) < 0) errors.currentAmount = 'Current amount must be 0 or more';
    if (!form.targetDate) errors.targetDate = 'Target date is required';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }
    try {
      const payload = {
        ...goal,
        ...form,
        targetAmount: Number(form.targetAmount),
        currentAmount: Number(form.currentAmount),
        priority: Number(form.priority),
      };
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {getIcon('target', { className: 'h-6 w-6' })}
            <h2 className="text-xl font-semibold">Edit Goal</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            {getIcon('x', { className: 'h-6 w-6' })}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            {fieldErrors.title && <div className="text-red-600 text-xs mt-1">{fieldErrors.title}</div>}
          </div>
          {/* Amount */}
          <div className="mb-4">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Target Amount *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  id="targetAmount"
                  name="targetAmount"
                  value={Math.abs(Number(form.targetAmount)) || ''}
                  onChange={handleChange}
                  placeholder="0"
                  min="1"
                  step="1"
                  className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">INR</span>
                </div>
              </div>
              {fieldErrors.targetAmount && <div className="text-red-600 text-xs mt-1">{fieldErrors.targetAmount}</div>}
            </div>
            {/* Current Amount */}
            <div className="mb-4">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Current Amount *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  id="currentAmount"
                  name="currentAmount"
                  value={Math.abs(Number(form.currentAmount)) || ''}
                  onChange={handleChange}
                  placeholder="0"
                  min="1"
                  step="1"
                  className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">INR</span>
                </div>
              </div>
              {fieldErrors.currentAmount && <div className="text-red-600 text-xs mt-1">{fieldErrors.currentAmount}</div>}
            </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Date *</label>
            <input
              type="date"
              name="targetDate"
              value={form.targetDate}
              onChange={handleChange}
              className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            {fieldErrors.targetDate && <div className="text-red-600 text-xs mt-1">{fieldErrors.targetDate}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Add details about your goal (optional)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              {FINANCIAL_GOAL_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              {
              FINANCIAL_GOAL_STATUS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gray-900 hover:bg-gray-800 text-white py-2 px-4 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
            >
              {loading ? 'Saving...' : 'Update Goal'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
} 