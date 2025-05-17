'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckIcon } from '@heroicons/react/24/outline'
import PageLayout from '@/components/PageLayout'
import { getIcon } from '@/utils/icons'

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
        message: 'Statement upload started! You will be notified when processing is complete.',
        count: 0
      })
      
      // Reset file after successful upload
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Redirect to transactions after 2 seconds
      setTimeout(() => {
        router.push('/transactions')
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
      <div className="max-w-4xl mx-auto mt-6">
        {/* <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold">Upload Bank Statement</h1>
          <Link 
            href="/transactions" 
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <span className="mr-1">←</span> Back to Transactions
          </Link>
        </div> */}
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          {uploadStatus && (
            <div className={`mb-6 p-4 rounded-md ${uploadStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {uploadStatus.success ? (
                <>
                  <div className="flex items-center">
                    <CheckIcon className="h-5 w-5 mr-2" />
                    <span className="font-medium">{uploadStatus.message}</span>
                  </div>
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
                <div className="text-gray-400">
                  {getIcon('upload-cloud-gray', { className: 'w-12 h-12 mb-4' })}
                </div>
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
                {getIcon('check-circle', { className: 'w-12 h-12 text-green-500 mb-4' })}
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
                <span>Required columns: S.No, date, notes, description, category, amount</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-gray-600 mr-2 mt-0.5" />
                <span>Date format: DD/MM/YYYY</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-gray-600 mr-2 mt-0.5" />
                <span>Amount format: -ve for expenses, +ve for income</span>
              </li>
            </ul>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-md text-sm">
              <p className="font-medium mb-2">Sample CSV structure:</p>
              <pre className="text-gray-600 overflow-x-auto">
{`S.No,date,notes,description,category,amount
1,15/04/2025,Monthly payment,Salary,Income,5000.00
2,16/04/2025,Grocery shopping,Walmart,Groceries,-120.50`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
} 