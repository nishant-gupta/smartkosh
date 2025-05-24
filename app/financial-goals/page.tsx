"use client";
import { useEffect, useState } from "react";
import FinancialGoalWizard from "@/components/financial-goals/FinancialGoalWizard";
import { getIcon } from '@/utils/icons';
import { EditGoalForm } from '@/components/financial-goals/EditGoalForm';
import FinancialGoalCard from "@/components/financial-goals/FinancialGoalCard";
import PageLayout from "@/components/PageLayout";

function showGoals(goals: any[], handleEdit: (goal: any) => void, handleDelete: (goalId: string) => void) {
  return (
    <ul className="space-y-4">
      {goals
        .sort((a, b) => new Date(a.targetDate || 0).getTime() - new Date(b.targetDate || 0).getTime())
        .map(goal => (
          <FinancialGoalCard key={goal.id} goal={goal} onEdit={handleEdit} onDelete={handleDelete} />
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
    <PageLayout title="Financial Goals">
    <div className="p-6">
    <div className="flex justify-end items-center mb-6 w-full sm:w-auto">
        <button 
            onClick={handleGoalCreate} 
            className="px-3 py-1.5 bg-gray-900 text-white rounded-md flex items-center text-sm hover:bg-gray-800 w-full sm:w-auto"
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
        <h2 className="text-lg font-semibold mb-4">Your Goals</h2>
        {isLoading ? (
          showLoading()
        ) : (Array.isArray(goals) && goals.length === 0) ? (
          showNoGoals()
        ) : (
          showGoals(goals, handleEdit, handleDelete)
        )}
      </div>
    </div>
    </PageLayout>
  );
} 