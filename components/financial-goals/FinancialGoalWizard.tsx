"use client";
import { useState, useEffect } from "react";
import { FINANCIAL_GOAL_TYPES, FINANCIAL_GOAL_PRIORITIES } from '@/utils/constants';
import { getIcon } from '@/utils/icons';
import Modal from '../Modal';
import { formatCurrency, formatDate } from "@/utils/utils";
import ProgressStepper from "../ProgressStepper";

function monthsBetween(start: Date, end: Date) {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
}

const steps = [1, 2, 3, 4, 5];

export default function FinancialGoalWizard({ onComplete, editGoal, onClose }: { onComplete: () => void, editGoal?: any, onClose: () => void }) {
  const [step, setStep] = useState(1);

  // Wizard state
  const [goalType, setGoalType] = useState<string>(editGoal?.goalType || "");
  const [title, setTitle] = useState(editGoal?.title || "");
  const [description, setDescription] = useState(editGoal?.description || "");
  const [targetAmount, setTargetAmount] = useState<number | "">(editGoal?.targetAmount || "");
  const [targetDate, setTargetDate] = useState<string>(editGoal?.targetDate ? new Date(editGoal.targetDate).toISOString().split("T")[0] : "");
  const [currentAmount, setCurrentAmount] = useState<number | "">(editGoal?.currentAmount || "");
  const [monthlyContribution, setMonthlyContribution] = useState<number | "">(editGoal?.monthlyContributionEstimate || "");
  const [priority, setPriority] = useState<number>(editGoal?.priority || 3);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editGoal) {
      setGoalType(editGoal.goalType || "");
      setTitle(editGoal.title || "");
      setDescription(editGoal.description || "");
      setTargetAmount(editGoal.targetAmount || "");
      setTargetDate(editGoal.targetDate ? new Date(editGoal.targetDate).toISOString().split("T")[0] : "");
      setCurrentAmount(editGoal.currentAmount || "");
      setMonthlyContribution(editGoal.monthlyContributionEstimate || "");
      setPriority(editGoal.priority || 3);
    }
  }, [editGoal]);

  // Step 5: Auto-calculate monthly contribution
  const autoMonthly = (() => {
    if (
      !targetAmount ||
      !currentAmount ||
      !targetDate ||
      isNaN(Number(targetAmount)) ||
      isNaN(Number(currentAmount))
    )
      return '';
    const months = monthsBetween(new Date(), new Date(targetDate));
    if (months <= 0) return '';
    return Math.ceil((Number(targetAmount) - Number(currentAmount)) / months);
  })();

  // Step navigation
  const next = () => setStep((s) => s + 1);
  const prev = () => setStep((s) => s - 1);

  // Submit handler
  const handleSubmit = async () => {
    setLoading(true);
    const method = editGoal ? "PUT" : "POST";
    const url = editGoal ? `/api/financial-goals/${editGoal.id}` : "/api/financial-goals";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title || FINANCIAL_GOAL_TYPES.find((g) => g.value === goalType)?.label,
        description,
        goalType: goalType,
        targetAmount: Number(targetAmount),
        currentAmount: Number(currentAmount),
        targetDate: targetDate ? new Date(targetDate) : null,
        monthlyContributionEstimate: Number(monthlyContribution) || autoMonthly,
        priority,
        status: 'in_progress',
        source: 'user_created',
        acceptedByUser: true,
      }),
    });
    setLoading(false);
    if (onComplete) onComplete();
    setStep(1);
  };

  return (
    <Modal isOpen={true} onClose={onClose} className="max-w-lg">
      <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {getIcon('target', { className: 'h-6 w-6' })}
            <h2 className="text-xl font-semibold">{editGoal ? 'Edit Goal' : 'Create a Financial Goal'}</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            {getIcon('x', { className: 'h-6 w-6' })}
          </button>
        </div>
        <ProgressStepper step={step} steps={steps} className="mb-6" />
        {step === 1 && (
          <div>
            <div className="mb-4 font-semibold">What is your goal?</div>
            <div className="grid grid-cols-2 gap-3">
              {FINANCIAL_GOAL_TYPES.map((g) => (
                <button
                  key={g.value}
                  className={`border rounded p-3 flex flex-col items-center ${goalType === g.value ? 'border-gray-600 bg-gray-600 text-white' : 'border-gray-200'}`}
                  onClick={() => setGoalType(g.value)}
                >
                  <span className="text-2xl mb-1">{getIcon(g.icon, { className: `h-8 w-8 ${goalType === g.value ? 'invert' : ''}` })}</span>
                  <span>{g.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded" disabled={!goalType} onClick={next}>Next</button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <div className="mb-4 font-semibold">Give your goal a name and description</div>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Goal Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Goal Title"
                required
                className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-3 w-full sm:w-auto">
              <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md w-full sm:w-auto" onClick={prev}>Back</button>
              <button className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded w-full sm:w-auto" disabled={!title} onClick={next}>Next</button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <div className="mb-4 font-semibold">Set your target amount and date</div>
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
                  value={Math.abs(Number(targetAmount)) || ''}
                  onChange={e => setTargetAmount(Number(e.target.value))}
                  placeholder="0"
                  min="1"
                  step="1"
                  required
                  className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">INR</span>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-1">Target Date *</label>
              <input
                type="date"
                name="targetDate"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-3 w-full sm:w-auto">
              <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md w-full sm:w-auto" onClick={prev}>Back</button>
              <button className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded w-full sm:w-auto" disabled={!targetAmount || !targetDate} onClick={next}>Next</button>
            </div>
          </div>
        )}
        {step === 4 && (
          <div>
            <div className="mb-4 font-semibold">How much have you saved so far?</div>
            <div className="mb-4">
              <label htmlFor="currentAmount" className="block text-sm font-medium text-gray-700 mb-1">
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
                  value={Math.abs(Number(currentAmount)) || ''}
                  onChange={e => setCurrentAmount(Number(e.target.value))}
                  placeholder="0"
                  min="1"
                  step="1"
                  required
                  className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">INR</span>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-1">Priority</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={priority}
                onChange={e => setPriority(Number(e.target.value))}
              >
                {FINANCIAL_GOAL_PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-3 w-full sm:w-auto">
              <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md w-full sm:w-auto" onClick={prev}>Back</button>
              <button className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded w-full sm:w-auto" disabled={currentAmount === ""} onClick={next}>Next</button>
            </div>
          </div>
        )}
        {step === 5 && (
          <div>
            <div className="mb-4 font-semibold">Review your goal</div>
            <div className="mb-2"><b>Goal:</b> {title || FINANCIAL_GOAL_TYPES.find(g => g.value === goalType)?.label}</div>
            <div className="mb-2"><b>Description:</b> {description || <span className="text-gray-400">(none)</span>}</div>
            <div className="mb-2"><b>Target:</b> ₹{formatCurrency(Number(targetAmount) || 0)} by {formatDate(targetDate)}</div>
            <div className="mb-2"><b>Current:</b> ₹{formatCurrency(Number(currentAmount) || 0)}</div>
            <div className="mb-2"><b>Priority:</b> {FINANCIAL_GOAL_PRIORITIES.find(p => p.value === priority)?.label}</div>
            <div className="mb-2"><b>Estimated Monthly Contribution:</b> ₹{formatCurrency(Number(monthlyContribution) || Number(autoMonthly) || 0)}</div>
            <div className="flex flex-col sm:flex-row justify-between gap-3 w-full sm:w-auto">
              <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md w-full sm:w-auto" onClick={prev}>Back</button>
              <button className="bg-gray-900 hover:bg-gray-800 text-white py-2 px-4 rounded-md w-full sm:w-auto" onClick={handleSubmit} disabled={loading}>{loading ? 'Saving...' : (editGoal ? 'Update Goal' : 'Create Goal')}</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
} 