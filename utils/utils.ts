import { TRANSACTION_TYPE } from "./constants"

  // Helper functions
  export const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }
  
  export const formatAmount = (amount: number, type: string): string => {
    if (type === TRANSACTION_TYPE.INCOME) {
      return `+₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.abs(amount))}`
    } else if (type === TRANSACTION_TYPE.SAVING) {
      return `↗₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.abs(amount))}`
    } else {
      return `-₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.abs(amount))}`
    }
  }

  export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)
  }