'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { format } from 'date-fns'

export default function InquiryResponsePage({ id }) {
  const router = useRouter()
  
  const [inquiry, setInquiry] = useState(null)
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    fetchInquiry()
  }, [id])
  
  const fetchInquiry = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/inquiries/${id}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '문의를 불러오는데 실패했습니다.')
      }
      
      setInquiry(data.inquiry)
      if (data.inquiry.response) {
        setResponse(data.inquiry.response)
      }
    } catch (err) {
      console.error('문의 불러오기 오류:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!response.trim()) {
      alert('답변을 입력해주세요.')
      return
    }
    
    try {
      setSubmitting(true)
      
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response,
          status: 'replied'
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || '답변 등록에 실패했습니다.')
      }
      
      // Redirect back to inquiries list
      router.push('/admin/inquiries')
      router.refresh()
    } catch (err) {
      console.error('답변 등록 오류:', err)
      setError(err.message)
    } finally {
      setSubmitting(false)
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
        <h1 className="text-2xl font-bold mb-6">문의 답변</h1>
        <div className="text-center p-8">로딩 중...</div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">문의 답변</h1>
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
        <Button 
          className="mt-4"
          onClick={() => router.push('/admin/inquiries')}
        >
          목록으로 돌아가기
        </Button>
      </div>
    )
  }
  
  if (!inquiry) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">문의 답변</h1>
        <div className="text-center p-8 border rounded-lg bg-muted/10">
          문의를 찾을 수 없습니다.
        </div>
        <Button 
          className="mt-4"
          onClick={() => router.push('/admin/inquiries')}
        >
          목록으로 돌아가기
        </Button>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">문의 답변</h1>
        <Button 
          variant="outline"
          onClick={() => router.push('/admin/inquiries')}
        >
          목록으로
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle>{inquiry.subject || '제목 없음'}</CardTitle>
            {getStatusBadge(inquiry.status)}
          </div>
          <div className="text-sm text-muted-foreground">
            {format(new Date(inquiry.createdAt), 'yyyy-MM-dd HH:mm')}
          </div>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap break-words">
            {inquiry.message}
          </div>
        </CardContent>
      </Card>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="response" className="block font-medium mb-2">
            답변 작성
          </label>
          <Textarea
            id="response"
            rows={8}
            placeholder="답변을 입력해주세요"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            required
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/inquiries')}
            disabled={submitting}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={submitting}
          >
            {submitting ? '제출 중...' : '답변 등록'}
          </Button>
        </div>
      </form>
    </div>
  )
} 