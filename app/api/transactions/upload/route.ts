import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { parse } from 'csv-parse/sync'

// Function to parse the CSV file content
function parseCSV(content: string) {
  try {
    // Parse CSV content
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    })
    
    // Get current year for validation
    const currentYear = new Date().getFullYear()
    
    // Validate and transform records
    return records.map((record: any) => {
      // Check for required fields
      if (!record.Date || !record.Description) {
        throw new Error('CSV must contain Date and Description columns')
      }
      
      // Parse and validate date
      let parsedDate = new Date(record.Date)
      
      // If date is invalid or year is too far in the past, default to today's date
      if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < (currentYear - 3)) {
        console.log(`Invalid or old date ${record.Date}, defaulting to today for record:`, record)
        parsedDate = new Date()
      }
      
      // Determine transaction type and amount
      let amount = 0
      let type = 'expense'
      
      // Check if "Withdrawal Amount" exists and has a value
      if (record['Withdrawal Amount'] && parseFloat(record['Withdrawal Amount']) > 0) {
        amount = parseFloat(record['Withdrawal Amount'])
        type = 'expense'
      } 
      // Check if "Deposit Amount" exists and has a value
      else if (record['Deposit Amount'] && parseFloat(record['Deposit Amount']) > 0) {
        amount = parseFloat(record['Deposit Amount'])
        type = 'income'
      } else {
        throw new Error('Each row must have either Withdrawal Amount or Deposit Amount')
      }
      
      // Log the record being processed
      console.log('Processing CSV record:', { 
        date: parsedDate.toISOString(),
        description: record.Description,
        category: record.Category || 'Uncategorized',
        notes: record.Notes || null,
        amount,
        type
      })
      
      // Map CSV record to transaction model
      return {
        date: parsedDate,
        description: record.Description,
        category: record.Category || 'Uncategorized',
        amount,
        type,
        notes: record.Notes || null
      }
    })
  } catch (error: any) {
    console.error('CSV parsing error details:', error)
    throw new Error(`CSV parsing error: ${error.message}`)
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      console.log('Upload failed: No session user found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    console.log('Session user data:', {
      name: session.user.name,
      email: session.user.email,
      id: (session.user as any).id
    })
    
    // Get user ID from session or look it up by email
    const userId = (session.user as any).id;
    const userEmail = session.user.email;
    
    if (!userId && !userEmail) {
      console.log('Upload failed: No user ID or email in session')
      return NextResponse.json(
        { error: 'User not properly authenticated' },
        { status: 401 }
      )
    }
    
    // If we don't have ID but have email, look up the user
    let actualUserId;
    if (!userId && userEmail) {
      console.log('Looking up user by email:', userEmail)
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true }
      });
      
      if (!user) {
        console.log('Upload failed: User not found by email:', userEmail)
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      actualUserId = user.id;
      console.log('Found user ID from email lookup:', actualUserId)
    } else {
      actualUserId = userId;
      console.log('Using user ID from session:', actualUserId)
    }
    
    // Verify user exists and get accounts
    console.log('Fetching user accounts for ID:', actualUserId)
    const user = await prisma.user.findUnique({
      where: { id: actualUserId },
      include: { accounts: true }
    })
    
    if (!user) {
      console.log('Upload failed: User not found by ID:', actualUserId)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Check if user has any accounts
    if (user.accounts.length === 0) {
      console.log('Upload failed: User has no accounts:', actualUserId)
      return NextResponse.json(
        { error: 'Please create an account before importing transactions' },
        { status: 400 }
      )
    }
    
    // Use the first account as default
    const defaultAccountId = user.accounts[0].id
    console.log('Using account for import:', defaultAccountId, 'Account name:', user.accounts[0].name)
    
    // Process multipart form data to get file
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      console.log('Upload failed: No file in request')
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }
    
    console.log('File received:', file.name, 'Size:', file.size, 'Type:', file.type)
    
    // Check file type (should be CSV)
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      console.log('Upload failed: Invalid file type:', file.type)
      return NextResponse.json(
        { error: 'Only CSV files are supported' },
        { status: 400 }
      )
    }
    
    try {
      // Read file content
      const fileContent = await file.text()
      console.log('File content sample (first 200 chars):', fileContent.substring(0, 200))
      
      // Parse CSV data
      console.log('Parsing CSV data')
      const transactions = parseCSV(fileContent)
      console.log('Successfully parsed', transactions.length, 'transactions')
      
      // Save transactions to database in a transaction
      console.log('Starting database transaction to save', transactions.length, 'transactions')
      const result = await prisma.$transaction(async (tx) => {
        const createdTransactions = []
        
        for (const transaction of transactions) {
          console.log('Creating transaction:', {
            userId: actualUserId,
            accountId: defaultAccountId,
            date: transaction.date,
            description: transaction.description,
            category: transaction.category,
            amount: transaction.amount,
            type: transaction.type
          })
          
          const createdTransaction = await tx.transaction.create({
            data: {
              userId: actualUserId,
              accountId: defaultAccountId,
              date: transaction.date,
              description: transaction.description,
              category: transaction.category,
              amount: transaction.amount,
              type: transaction.type,
              notes: transaction.notes
            }
          })
          
          createdTransactions.push(createdTransaction)
        }
        
        // Update account balance based on the new transactions
        console.log('Updating account balance for account:', defaultAccountId)
        const account = await tx.account.findUnique({
          where: { id: defaultAccountId }
        })
        
        if (account) {
          let newBalance = account.balance
          console.log('Current account balance:', newBalance)
          
          for (const transaction of transactions) {
            if (transaction.type === 'income') {
              newBalance += transaction.amount
              console.log(`Added income: ${transaction.amount}, new balance: ${newBalance}`)
            } else if (transaction.type === 'expense') {
              newBalance -= transaction.amount
              console.log(`Subtracted expense: ${transaction.amount}, new balance: ${newBalance}`)
            }
          }
          
          console.log('Setting final account balance to:', newBalance)
          await tx.account.update({
            where: { id: defaultAccountId },
            data: { balance: newBalance }
          })
        }
        
        return createdTransactions
      })
      
      console.log('Upload completed successfully. Created', result.length, 'transactions')
      return NextResponse.json({
        success: true,
        count: result.length,
        message: `Successfully imported ${result.length} transactions`
      })
    } catch (error: any) {
      console.error('Error in file processing or transaction creation:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to process file' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error importing transactions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import transactions' },
      { status: 500 }
    )
  }
} 