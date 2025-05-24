export const TRANSACTION_TYPE = {
  EXPENSE: "EXPENSE",
  INCOME: "INCOME",
  SAVING: "SAVING"
};

export const EXPENSE_CATEGORIES = {
  FOOD_DINING: { name: "food-dining", label: "Food & Dining", color: "bg-purple-500", icon: "food-dining" },
  GROCERIES: { name: "groceries", label: "Groceries", color: "bg-emerald-500", icon: "groceries" },
  SHOPPING: { name: "shopping", label: "Shopping", color: "bg-pink-500", icon: "shopping" },
  TRANSPORTATION: { name: "transportation", label: "Transportation", color: "bg-blue-500", icon: "transportation" },
  ENTERTAINMENT: { name: "entertainment", label: "Entertainment", color: "bg-green-500", icon: "entertainment" },
  BILLS_UTILITIES: { name: "bills-utilities", label: "Bills & Utilities", color: "bg-yellow-500", icon: "bills-utilities" },
  HEALTH_MEDICAL: { name: "health-medical", label: "Health & Medical", color: "bg-red-500", icon: "health-medical" },
  HOUSING: { name: "housing", label: "Housing", color: "bg-indigo-600", icon: "housing" },
  EDUCATION: { name: "education", label: "Education", color: "bg-teal-500", icon: "education" },
  TRAVEL: { name: "travel", label: "Travel", color: "bg-cyan-500", icon: "travel" },
  PERSONAL_CARE: { name: "personal-care", label: "Personal Care", color: "bg-orange-500", icon: "personal-care" },
  INVESTMENTS: { name: "investments", label: "Investments", color: "bg-lime-500", icon: "investments" },
  GIFTS_DONATIONS: { name: "gifts-donations", label: "Gifts & Donations", color: "bg-amber-500", icon: "gifts-donations" },
  MAINTENANCE: { name: "maintenance", label: "Maintenance", color: "bg-amber-500", icon: "maintenance" },
  OTHER: { name: "other", label: "Other", color:"bg-gray-400", icon: "other" }
};

export const INCOME_CATEGORIES = 
{
  SALARY: { name: "salary", label: "Salary", color: "bg-violet-500", icon: "salary" },
  BUSINESS: { name: "business", label: "Business", color: "bg-rose-500", icon: "business" },
  INVESTMENTS: { name: "investments", label: "Investments", color: "bg-lime-500", icon: "investments" },
  RENTAL_INCOME: { name: "rental-income", label: "Rental Income", color: "bg-amber-500", icon: "rental-income" },
  GIFTS: { name: "gifts", label: "Gifts", color: "bg-amber-500", icon: "gifts" },
  INTEREST: { name: "interest", label: "Interest", color: "bg-amber-500", icon: "interest" },
  DIVIDENDS: { name: "dividends", label: "Dividends", color: "bg-amber-500", icon: "dividends" },
  REFUNDS: { name: "refunds", label: "Refunds", color: "bg-amber-500", icon: "refunds" },
  OTHER: { name: "other", label: "Other", color: "bg-gray-400", icon: "other" }
};

export const SAVING_CATEGORIES = 
{
  INVESTMENTS: { name: "investments", label: "Investments", color: "bg-lime-500", icon: "investments" },
  BANK_SAVINGS: { name: "bank-savings", label: "Bank Savings", color: "bg-amber-500", icon: "bank-savings" },
  FIXED_DEPOSIT: { name: "fixed-deposit", label: "Fixed Deposit", color: "bg-amber-500", icon: "fixed-deposit" },
  RETIREMENT: { name: "retirement", label: "Retirement", color: "bg-amber-500", icon: "retirement" },
  EMERGENCY_FUND: { name: "emergency-fund", label: "Emergency Fund", color: "bg-amber-500", icon: "emergency-fund" },
  EDUCATION_FUND: { name: "education-fund", label: "Education Fund", color: "bg-amber-500", icon: "education-fund" },
  STOCK_MARKET: { name: "stock-market", label: "Stock Market", color: "bg-amber-500", icon: "stock-market" },
  MUTUAL_FUNDS: { name: "mutual-funds", label: "Mutual Funds", color: "bg-amber-500", icon: "mutual-funds" },
  GOLD: { name: "gold", label: "Gold", color: "bg-amber-500", icon: "gold" },
  REAL_ESTATE: { name: "real-estate", label: "Real Estate", color: "bg-amber-500", icon: "real-estate" },
  OTHER: { name: "other", label: "Other", color: "bg-gray-400", icon: "other" }
};


export const FINANCIAL_GOAL_TYPES = [
  { value: "emergency_fund", label: "Emergency Fund", icon: "emergency-fund" },
  { value: "retirement", label: "Retirement", icon: "retirement" },
  { value: "purchase", label: "Big Purchase", icon: "shopping" },
  { value: "debt_repayment", label: "Pay Off Debt", icon: "card" },
  { value: "vacation", label: "Vacation", icon: "vacation" },
  { value: "custom", label: "Custom Goal", icon: "target" },
];

export const FINANCIAL_GOAL_STATUS_ICONS: Record<string, string> = {
  in_progress: 'refresh',
  achieved: 'check-circle',
  abandoned: 'delete',
  paused: 'pause',
};

export const FINANCIAL_GOAL_PRIORITIES = [
  { value: 1, label: "Highest" },
  { value: 2, label: "High" },
  { value: 3, label: "Medium" },
  { value: 4, label: "Low" },
  { value: 5, label: "Lowest" },
];