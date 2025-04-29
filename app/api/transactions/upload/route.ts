import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import uploadQueue from '@/lib/queue'

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get user ID - prioritize quick lookup
    const userId = (session.user as any).id || session.user.email;
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }
    
    // Process multipart form data to get file - do this early
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }
    
    // Check file type (should be CSV)
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      return NextResponse.json({ error: 'Only CSV files are supported' }, { status: 400 })
    }
    
    try {
      // Read file content
      const fileContent = await file.text()
      const fileName = file.name
      
      // Create a minimal job record
      const job = await prisma.backgroundJob.create({
        data: {
          userId: typeof userId === 'string' ? userId : '', // Fall back to empty string
          type: 'transaction_upload',
          status: 'pending',
          progress: 0,
          result: { fileName }
        }
      })
      
      // Add to queue without waiting for additional DB operations
      uploadQueue.add({
        jobId: job.id,
        fileContent,
        userId: typeof userId === 'string' ? userId : '',
        fileName
      }, {
        attempts: 3,
        removeOnComplete: true
      }).catch(error => {
        console.error('Failed to add job to queue:', error);
      });
      
      // Respond immediately - don't wait for queue
      return NextResponse.json({
        success: true,
        message: 'File received and will be processed',
        jobId: job.id
      });
      
    } catch (error: any) {
      console.error('Error in file processing:', error)
      return NextResponse.json({ error: error.message || 'Failed to process file' }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error in upload handler:', error)
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
  }
} 