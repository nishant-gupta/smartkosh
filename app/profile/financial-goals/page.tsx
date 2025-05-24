"use client";
import { useEffect, useState } from "react";
import FinancialGoalWizard from "@/components/financial-goals/FinancialGoalWizard";
import { getIcon } from '@/utils/icons';
import { FINANCIAL_GOAL_TYPES, FINANCIAL_GOAL_STATUS_ICONS } from '@/utils/constants';
import { EditGoalForm } from '@/components/financial-goals/EditGoalForm';

function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount) || 0);
}

// Donut progress bar component
function DonutProgress({ value, size = 48, stroke = 6, color = '#000000', bg = '#e5e7eb' }: { value: number, size?: number, stroke?: number, color?: string, bg?: string }) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <svg width={size} height={size} className="block" style={{ minWidth: size, minHeight: size }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={bg}
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s' }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.22}
        fill="#374151"
        fontWeight="bold"
      >
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

function getGoalStatusIcon(goal: any) {
  // If goal is achieved
  if (goal.status === 'achieved' || (goal.currentAmount >= goal.targetAmount)) {
    return (
      <>
        {getIcon('check-circle', { className: 'h-5 w-5 text-green-500' })}
        <span className="sr-only">Goal achieved</span>
      </>
    );
  }
  // If goal is in progress but behind schedule (simple: less than 50% progress and more than 50% time elapsed)
  if (goal.status === 'in_progress' && goal.targetDate) {
    const now = new Date();
    const start = new Date(goal.createdAt || goal.startDate || now);
    const end = new Date(goal.targetDate);
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const timePct = total > 0 ? elapsed / total : 0;
    const progressPct = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
    if (timePct > 0.5 && progressPct < 0.5) {
      return (
        <>
          {getIcon('alert', { className: 'h-5 w-5 text-yellow-500' })}
          <span className="sr-only">Behind trajectory</span>
        </>
      );
    }
    if (timePct > 0.9 && progressPct < 0.9) {
      return (
        <>
          {getIcon('alert', { className: 'h-5 w-5 text-red-500' })}
          <span className="sr-only">Far behind trajectory</span>
        </>
      );
    }
    if (progressPct > timePct + 0.1) {
      return (
        <>
          {getIcon('check-circle', { className: 'h-5 w-5 text-green-500' })}
          <span className="sr-only">On track</span>
        </>
      );
    }
    // Default: in progress
    return (
      <>
        {getIcon('refresh', { className: 'h-5 w-5 text-blue-400' })}
        <span className="sr-only">In progress</span>
      </>
    );
  }
  // Paused or abandoned
  if (goal.status === 'paused') {
    return (
      <>
        {getIcon('pause', { className: 'h-5 w-5 text-gray-400' })}
        <span className="sr-only">Paused</span>
      </>
    );
  }
  if (goal.status === 'abandoned') {
    return (
      <>
        {getIcon('delete', { className: 'h-5 w-5 text-gray-400' })}
        <span className="sr-only">Abandoned</span>
      </>
    );
  }
  // Fallback
  return (
    <>
      {getIcon('info', { className: 'h-5 w-5 text-gray-400' })}
      <span className="sr-only">Status unknown</span>
    </>
  );
}

function getGoalStatusColor(goal: any) {

  //if goal is achieved or abandoned, return dark green
  if (goal.status === 'achieved' || (goal.currentAmount >= goal.targetAmount)) {
    return '#006400';
  }
  //if goal is in progress, return blue
  if (goal.status === 'in_progress') {
    return '#0000FF';
  }
  //if goal is paused, return gray
  if (goal.status === 'paused') {
    return '#808080';
  }
  return '#000000';
}

function showGoals(goals: any[], handleEdit: (goal: any) => void, handleDelete: (goalId: string) => void) {
  return (
    <ul className="space-y-4">
      {goals
        .sort((a, b) => new Date(a.targetDate || 0).getTime() - new Date(b.targetDate || 0).getTime())
        .map(goal => (
          <li key={goal.id} className="bg-white rounded-xl shadow flex items-center px-6 py-5">
            {/* Goal Icon */}
            <div className="flex-shrink-0 mr-6 text-2xl">
              {getIcon(FINANCIAL_GOAL_TYPES.find(g => g.value === goal.goalType)?.icon || 'target', { className: 'h-8 w-8' })}
            </div>
            {/* Goal Info */}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-lg mb-1 flex items-center gap-2">
                {goal.title}
                {getGoalStatusIcon(goal)}
              </div>
              <div className="text-sm text-gray-500 mb-1">
                Target: {formatCurrency(goal.targetAmount)} by {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString('en-GB') : "No date"}
              </div>
              <div className="text-sm text-gray-500 mb-1">Current: {formatCurrency(goal.currentAmount)}</div>
              <div className="flex items-center text-xs text-gray-400 gap-1">
                {getIcon(FINANCIAL_GOAL_STATUS_ICONS[goal.status] || 'info', { className: 'h-4 w-4' })}
                Status: {goal.status}
              </div>
            </div>
            {/* Donut Progress */}
            <div className="flex flex-col items-center justify-center ml-6 mr-6">
              <DonutProgress value={goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0} size={56} color={getGoalStatusColor(goal)} />
            </div>
            {/* Actions */}
            <div className="flex flex-col items-end gap-2">
              <button className="text-indigo-600 hover:bg-gray-100 rounded-full p-2" onClick={() => handleEdit(goal)} title="Edit">
                {getIcon('edit', { className: 'h-5 w-5' })}
              </button>
              <button className="text-red-600 hover:bg-gray-100 rounded-full p-2" onClick={() => handleDelete(goal.id)} title="Delete">
                {getIcon('delete', { className: 'h-5 w-5' })}
              </button>
            </div>
          </li>
        ))}
    </ul>
  );
}

function showNoGoals() {
  return (
    <div className="bg-white p-8 rounded-lg text-center">
      {getIcon('target', { className: 'h-12 w-12 mx-auto text-gray-400 mb-4' })}
      <h3 className="text-lg font-medium text-gray-900 mb-1">No goals</h3>
      <p className="text-gray-500">You don't have any financial goals yet.</p>
    </div>
  );
}

function showLoading() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="w-12 h-12 border-t-4 border-gray-900 border-solid rounded-full animate-spin"></div>
    </div>
  );
}

export default function FinancialGoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [editGoal, setEditGoal] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGoals = async () => {
    setIsLoading(true);
    const res = await fetch("/api/financial-goals");
    const data = await res.json();
    setGoals(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleGoalCreated = () => {
    setShowWizard(false);
    setEditGoal(null);
    fetchGoals();
  };

  const handleEdit = (goal: any) => {
    setEditGoal(goal);
  };

  const handleGoalCreate = () => {
    setShowWizard(true);
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm("Delete this goal?")) return;
    await fetch(`/api/financial-goals/${goalId}`, { method: "DELETE" });
    fetchGoals();
  };

  return (
    <div className="p-6">
    <div className="flex justify-end items-center mb-6">
        <button 
            onClick={handleGoalCreate} 
            className="px-3 py-1.5 bg-gray-900 text-white rounded-md flex items-center text-sm hover:bg-gray-800"
          >
            {getIcon('add', { className: 'h-4 w-4 mr-1 invert' })}
            Add New Goal
          </button>
        </div>
      {/* Render edit form or wizard as modal/dialog */}
      {(editGoal || showWizard) && (
        <>
          {editGoal ? (
            <EditGoalForm
              isOpen={!!editGoal}
              onClose={() => setEditGoal(null)}
              goal={editGoal || {}}
              onSave={async (updatedGoal) => {
                setIsLoading(true);
                try {
                  const res = await fetch(`/api/financial-goals/${updatedGoal.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedGoal),
                  });
                  if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Failed to update goal');
                  }
                  fetchGoals();
                } catch (err: any) {
                  // handle error
                } finally {
                  setIsLoading(false);
                }
              }}
            />
          ) : showWizard ? (
            <FinancialGoalWizard onComplete={handleGoalCreated} editGoal={editGoal} onClose={() => setShowWizard(false)} />
          ) : null}
        </>
      )}
      <div className="max-w-2xl mx-auto mt-8">        
        {isLoading ? (
          showLoading()
        ) : (Array.isArray(goals) && goals.length === 0) ? (
          showNoGoals()
        ) : (
          showGoals(goals, handleEdit, handleDelete)
        )}
      </div>


      </div>
  );
} 