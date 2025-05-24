import { getIcon } from '@/utils/icons';
import { FINANCIAL_GOAL_TYPES, FINANCIAL_GOAL_STATUS_ICONS } from '@/utils/constants';
import DonutProgress from '@/components/DonutProgress';

interface FinancialGoalCardProps {
  goal: {
    id: string;
    title: string;
    description?: string;
    goalType: string;
    targetAmount: number;
    currentAmount: number;
    targetDate?: Date;
    status: string;
  };
  onEdit: (goal: any) => void;
  onDelete: (goalId: string) => void;
}

function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount) || 0);
}

function getGoalStatusColor(goal: any) {
  if (goal.status === 'achieved' || (goal.currentAmount >= goal.targetAmount)) {
    return '#006400';
  }
  if (goal.status === 'in_progress') {
    return '#0000FF';
  }
  if (goal.status === 'paused') {
    return '#808080';
  }
  return '#000000';
}

function getGoalStatusIcon(goal: any) {
  return getIcon(FINANCIAL_GOAL_STATUS_ICONS[goal.status] || 'info', { className: 'h-4 w-4' });
}

function getGoalStatusLabel(goal: any) {
  switch (goal.status) {
    case 'achieved':
      return 'Achieved';
    case 'in_progress':
      return 'In Progress';
    case 'paused':
      return 'Paused';
    case 'abandoned':
      return 'Abandoned';
    default:
      return 'Unknown';
  }
}

export default function FinancialGoalCard({ goal, onEdit, onDelete }: FinancialGoalCardProps) {
  return (
    <li className="bg-white rounded-xl shadow flex items-center px-6 py-5">
      {/* Goal Icon */}
      <div className="flex-shrink-0 mr-6 text-2xl hidden sm:block">
        {getIcon(FINANCIAL_GOAL_TYPES.find(g => g.value === goal.goalType)?.icon || 'target', { className: 'h-8 w-8' })}
      </div>
      {/* Goal Info */}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-lg mb-1 flex items-center gap-2">
          {getIcon(FINANCIAL_GOAL_TYPES.find(g => g.value === goal.goalType)?.icon || 'target', { className: 'h-6 w-6 block sm:hidden' })}
          {goal.title}
          <div className="text-xs text-gray-400 group relative">
            {getGoalStatusIcon(goal)}
            <span className="sr-only">{goal.status}</span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {getGoalStatusLabel(goal)}
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-500 mb-1">
          <span className="hidden sm:inline">
            <b>Target:</b> {formatCurrency(goal.targetAmount)} by {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString('en-GB') : "No date"}
          </span>
          <span className="block sm:hidden">
            {formatCurrency(goal.targetAmount)}
          </span>
          <span className="block sm:hidden">
            {goal.targetDate ? new Date(goal.targetDate).toLocaleDateString('en-GB') : "No date"}
          </span>
        </div>
        <div className="text-sm text-gray-500 mb-1 hidden sm:block">
          <b>Current:</b> {formatCurrency(goal.currentAmount)}
        </div>
      </div>
      {/* Donut Progress */}
      <div className="flex flex-col items-center justify-center ml-6 mr-6">
        <DonutProgress value={goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0} size={56} color={getGoalStatusColor(goal)} />
      </div>
      {/* Actions */}
      <div className="flex flex-col items-end gap-2">
        <button className="text-indigo-600 hover:bg-gray-100 rounded-full p-2" onClick={() => onEdit(goal)} title="Edit">
          {getIcon('edit', { className: 'h-5 w-5' })}
        </button>
        <button className="text-red-600 hover:bg-gray-100 rounded-full p-2" onClick={() => onDelete(goal.id)} title="Delete">
          {getIcon('delete', { className: 'h-5 w-5' })}
        </button>
      </div>
    </li>
  );
} 