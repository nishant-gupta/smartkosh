import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// Define interface for transaction data
interface TransactionData {
  id: string;
  date: Date;
  description: string;
  category: string;
  amount: number;
  type: string;
  notes: string | null;
  account: {
    name: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { accounts: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const sort = searchParams.get('sort') || 'date-desc'

    // Build where clause
    const whereClause: Prisma.TransactionWhereInput = {
      accountId: { in: user.accounts.map((account: { id: string }) => account.id) }
    }

    // Add date filter
    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    // Add category filter
    if (category && category !== 'all') {
      whereClause.category = category
    }

    // Add type filter
    if (type && type !== 'all') {
      whereClause.type = type as 'income' | 'expense' | 'saving'
    }

    // Determine sort order
    let orderBy: Prisma.TransactionOrderByWithRelationInput = {}
    switch (sort) {
      case 'date-desc':
        orderBy = { date: 'desc' }
        break
      case 'date-asc':
        orderBy = { date: 'asc' }
        break
      case 'amount-desc':
        orderBy = { amount: 'desc' }
        break
      case 'amount-asc':
        orderBy = { amount: 'asc' }
        break
      case 'category':
        orderBy = { category: 'asc' }
        break
      default:
        orderBy = { date: 'desc' }
    }

    // Fetch transactions
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy,
      select: {
        id: true,
        date: true,
        description: true,
        category: true,
        amount: true,
        type: true,
        notes: true,
        account: {
          select: {
            name: true
          }
        }
      }
    }) as TransactionData[]

    // Generate CSV content
    const headers = [
      'Date',
      'Description',
      'Category',
      'Type',
      'Amount',
      'Account',
      'Notes'
    ]

    // Create CSV rows
    const rows = transactions.map((transaction: TransactionData) => [
      transaction.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
      transaction.description,
      transaction.category,
      transaction.type,
      transaction.amount.toString(),
      transaction.account.name,
      transaction.notes || ''
    ])

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row: string[]) => row.map((cell: string) => {
        // Escape quotes and wrap values with commas in quotes
        if (cell.includes('"') || cell.includes(',')) {
          return `"${cell.replace(/"/g, '""')}"`
        }
        return cell
      }).join(','))
    ].join('\n')

    // Return CSV as response
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=transactions.csv'
      }
    })
  } catch (error) {
    console.error('Error exporting transactions:', error)
    return NextResponse.json({ error: 'Failed to export transactions' }, { status: 500 })
  }
} 