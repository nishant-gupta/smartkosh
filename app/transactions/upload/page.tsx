'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckIcon } from '@heroicons/react/24/outline'
import PageLayout from '@/components/PageLayout'

export default function UploadStatementPage() {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean;
    message: string;
    count?: number;
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile)
      } else {
        setUploadStatus({
          success: false,
          message: 'Only CSV files are supported.'
        })
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile)
      } else {
        setUploadStatus({
          success: false,
          message: 'Only CSV files are supported.'
        })
      }
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = async () => {
    if (!file) return
    
    setIsUploading(true)
    setUploadStatus(null)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/transactions/upload', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload statement')
      }
      
      setUploadStatus({
        success: true,
        message: 'Statement uploaded successfully!',
        count: data.count
      })
      
      // Reset file after successful upload
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Redirect to transactions after 2 seconds
      setTimeout(() => {
        router.push('/transactions?refresh=true')
      }, 2000)
    } catch (error: any) {
      setUploadStatus({
        success: false,
        message: error.message || 'An error occurred during upload.'
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <PageLayout title="Upload Statement">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Upload Bank Statement</h1>
          <Link 
            href="/transactions" 
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <span className="mr-1">←</span> Back to Transactions
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          {uploadStatus && (
            <div className={`mb-6 p-4 rounded-md ${uploadStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {uploadStatus.success ? (
                <>
                  <div className="flex items-center">
                    <CheckIcon className="h-5 w-5 mr-2" />
                    <span className="font-medium">{uploadStatus.message}</span>
                  </div>
                  {uploadStatus.count && (
                    <p className="mt-1">
                      {uploadStatus.count} transactions have been imported.
                    </p>
                  )}
                </>
              ) : (
                <p>{uploadStatus.message}</p>
              )}
            </div>
          )}
          
          <div 
            className={`border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center 
              ${isDragging ? 'border-gray-900 bg-gray-50' : 'border-gray-300'} 
              ${file ? 'bg-gray-50' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {!file ? (
              <>
                <svg 
                  className="w-12 h-12 text-gray-400 mb-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" 
                  />
                </svg>
                <p className="text-xl font-medium mb-2">Drag and drop your statement file</p>
                <p className="text-gray-500 mb-4">or</p>
                <button
                  type="button"
                  onClick={handleBrowseClick}
                  className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600"
                >
                  Browse Files
                </button>
                <p className="text-gray-500 mt-4">Supported format: CSV only</p>
              </>
            ) : (
              <>
                <svg 
                  className="w-12 h-12 text-green-500 mb-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <p className="text-xl font-medium mb-2">File selected</p>
                <p className="text-gray-600 mb-4">{file.name}</p>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-600"
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={isUploading}
                    className={`px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-600 ${isUploading ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {isUploading ? 'Uploading...' : 'Upload Statement'}
                  </button>
                </div>
              </>
            )}
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          
          <div className="mt-10">
            <h3 className="text-lg font-medium mb-4">Expected CSV Format</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-gray-600 mr-2 mt-0.5" />
                <span>Required columns: S.No, Date, Notes, Description, Category, Withdrawal Amount, Deposit Amount</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-gray-600 mr-2 mt-0.5" />
                <span>Date format: YYYY-MM-DD</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-gray-600 mr-2 mt-0.5" />
                <span>Amount format: Withdrawal for expenses, Deposit for income</span>
              </li>
            </ul>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-md text-sm">
              <p className="font-medium mb-2">Sample CSV structure:</p>
              <pre className="text-gray-600 overflow-x-auto">
{`S.No,Date,Notes,Description,Category,Withdrawal Amount,Deposit Amount
1,2023-04-15,Monthly payment,Salary,Income,,5000.00
2,2023-04-16,Grocery shopping,Walmart,Groceries,120.50,
3,2023-04-18,Movie night,AMC Theaters,Entertainment,35.00,`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
} 