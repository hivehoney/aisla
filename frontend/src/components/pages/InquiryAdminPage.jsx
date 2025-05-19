'use client'

import { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from 'date-fns'
import Link from 'next/link'

export default function InquiryAdminPage() {
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    fetchInquiries()
  }, [])
  
  const fetchInquiries = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/inquiries')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '문의 목록을 불러오는데 실패했습니다.')
      }
      
      setInquiries(data.inquiries)
    } catch (err) {
      console.error('문의 목록 불러오기 오류:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  const updateInquiryStatus = async (id, status) => {
    try {
      const response = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '상태 업데이트에 실패했습니다.')
      }
      
      // Update local state
      setInquiries(inquiries.map(inquiry => 
        inquiry.id === id ? { ...inquiry, status } : inquiry
      ))
    } catch (err) {
      console.error('상태 업데이트 오류:', err)
      alert(err.message)
    }
  }
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">대기중</Badge>
      case 'replied':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">답변완료</Badge>
      case 'closed':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">종료</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">문의 관리</h1>
        <div className="text-center p-8">로딩 중...</div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">문의 관리</h1>
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">문의 관리</h1>
      
      {inquiries.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/10">
          문의 내역이 없습니다.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {inquiries.map(inquiry => (
            <Card key={inquiry.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-1">
                  <CardTitle className="text-lg">{inquiry.subject || '제목 없음'}</CardTitle>
                  {getStatusBadge(inquiry.status)}
                </div>
                <CardDescription className="text-xs">
                  {format(new Date(inquiry.createdAt), 'yyyy-MM-dd HH:mm')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="whitespace-pre-wrap break-words text-sm mb-3 max-h-40 overflow-y-auto">
                  {inquiry.message}
                </div>
                
                {inquiry.response && (
                  <div className="mt-3 p-3 bg-muted/20 rounded text-sm">
                    <div className="font-semibold mb-1">답변:</div>
                    <div className="whitespace-pre-wrap break-words">
                      {inquiry.response}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0 gap-2 flex justify-between">
                <Button 
                  variant="secondary" 
                  size="sm"
                  asChild
                >
                  <Link href={`/admin/inquiries/${inquiry.id}/response`}>상세 답변</Link>
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateInquiryStatus(inquiry.id, 'replied')}
                    disabled={inquiry.status === 'replied'}
                  >
                    답변완료
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => updateInquiryStatus(inquiry.id, 'closed')}
                    disabled={inquiry.status === 'closed'}
                  >
                    종료
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 