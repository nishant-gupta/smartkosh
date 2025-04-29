import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import uploadQueue from '@/lib/queue'

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
      const fileName = file.name
      
      // Create a background job for processing
      const job = await prisma.backgroundJob.create({
        data: {
          userId: actualUserId,
          type: 'transaction_upload',
          status: 'pending',
          progress: 0,
          result: {
            fileName,
            accountId: defaultAccountId,
            totalLines: fileContent.split('\n').length - 1 // Subtract header
          }
        }
      })
      
      // Create initial notification
      await prisma.notification.create({
        data: {
          userId: actualUserId,
          title: 'CSV Upload Started',
          message: `Your file "${fileName}" is being processed in the background.`,
          type: 'info',
          relatedTo: 'transaction_upload',
          data: { jobId: job.id }
        }
      });
      
      // Add job to Bull queue instead of using setTimeout
      await uploadQueue.add({
        jobId: job.id,
        fileContent,
        userId: actualUserId,
        accountId: defaultAccountId
      }, {
        // Job options can be specified here as well
        attempts: 3,
        removeOnComplete: true
      });
      
      console.log(`Job ${job.id} added to queue for processing`);
      
      // Return the job ID to the client
      return NextResponse.json({
        success: true,
        message: 'File upload started and is being processed',
        jobId: job.id
      });
      
    } catch (error: any) {
      console.error('Error in file processing or validation:', error)
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