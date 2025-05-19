'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Package,
  PackageOpen,
  ShoppingCart,
  Truck,
  User,
  XCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useStore } from '@/contexts/store-context'
import React from 'react'

export default function OrderDetailPage({ params }) {
  // Next.js 13 방식으로 params 가져오기
  const unwrappedParams = React.use(params)
  const orderId = unwrappedParams.id
  
  const { toast } = useToast()
  const { data: session } = useSession()
  const router = useRouter()
  const { selectedStore } = useStore()
  
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [processingAction, setProcessingAction] = useState(false)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [currentAction, setCurrentAction] = useState(null)

  // 상태별 배지 스타일 설정
  const statusStyles = {
    pending: { variant: 'outline', label: '대기중' },
    processing: { variant: 'secondary', label: '처리중' },
    completed: { variant: 'default', label: '완료' },
    cancelled: { variant: 'destructive', label: '취소됨' },
  }

  // 발주 유형 변환
  const orderTypeLabels = {
    manual: '수동 발주',
    prediction: 'AI 발주',
  }

  // 발주 데이터 로드
  useEffect(() => {
    if (session && orderId) {
      fetchOrderDetails()
    }
  }, [session, orderId])

  // 발주 상세 정보 가져오기
  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/orders/${orderId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '발주 정보를 불러오는데 실패했습니다')
      }
      
      const data = await response.json()
      setOrder(data)
    } catch (error) {
      toast({
        title: '오류 발생',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 상태 변경 액션 시작
  const initiateAction = (action) => {
    setCurrentAction(action)
    setActionDialogOpen(true)
  }

  // 발주 상태 변경
  const updateOrderStatus = async (newStatus) => {
    try {
      setProcessingAction(true)
      
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '발주 상태 변경에 실패했습니다')
      }
      
      // 성공 시 발주 새로고침
      fetchOrderDetails()
      
      toast({
        title: '상태 변경 완료',
        description: `발주 상태가 ${statusStyles[newStatus]?.label || newStatus}(으)로 변경되었습니다.`,
      })
      
      setActionDialogOpen(false)
    } catch (error) {
      toast({
        title: '오류 발생',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setProcessingAction(false)
    }
  }

  // 로딩 중 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-lg font-medium">발주 정보를 불러오는 중...</h3>
        </div>
      </div>
    )
  }

  // 발주가 없는 경우
  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto">
          <div className="mb-6">
            <Button variant="ghost" className="gap-2" onClick={() => router.push('/orders')}>
              <ArrowLeft className="h-4 w-4" />
              발주 목록으로 돌아가기
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>발주 정보를 찾을 수 없습니다</CardTitle>
              <CardDescription>
                요청하신 발주 정보를 찾을 수 없거나 접근 권한이 없습니다.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => router.push('/orders')}>
                발주 목록으로 돌아가기
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container mx-auto">
        {/* 헤더 및 버튼 */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <Button variant="ghost" className="mr-4" onClick={() => router.push('/orders')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold mb-1">발주 #{order.id.slice(-6).toUpperCase()}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={statusStyles[order.status]?.variant || 'outline'} className="text-sm">
                  {statusStyles[order.status]?.label || order.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(order.createdAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })}
                </span>
                <Badge variant="outline">{orderTypeLabels[order.type] || order.type}</Badge>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-wrap gap-2">
            {order.status === 'pending' && (
              <Button className="gap-2" onClick={() => initiateAction('process')}>
                <Truck className="h-4 w-4" />
                발주 처리 시작
              </Button>
            )}
            {order.status === 'processing' && (
              <Button className="gap-2" onClick={() => initiateAction('complete')}>
                <CheckCircle className="h-4 w-4" />
                발주 완료 처리
              </Button>
            )}
            {['pending', 'processing'].includes(order.status) && (
              <Button variant="destructive" className="gap-2" onClick={() => initiateAction('cancel')}>
                <XCircle className="h-4 w-4" />
                발주 취소
              </Button>
            )}
          </div>
        </div>

        {/* 정보 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 발주 정보 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                발주 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">발주 번호</dt>
                  <dd className="text-sm font-medium">{order.id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">상태</dt>
                  <dd className="text-sm">
                    <Badge variant={statusStyles[order.status]?.variant || 'outline'}>
                      {statusStyles[order.status]?.label || order.status}
                    </Badge>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">생성일</dt>
                  <dd className="text-sm font-medium">
                    {format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">최종수정일</dt>
                  <dd className="text-sm font-medium">
                    {format(new Date(order.updatedAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">발주 유형</dt>
                  <dd className="text-sm font-medium">{orderTypeLabels[order.type] || order.type}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* 스토어 정보 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                스토어 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">스토어 이름</dt>
                  <dd className="text-sm font-medium">{order.store.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground mb-1">주소</dt>
                  <dd className="text-sm font-medium">{order.store.address}</dd>
                </div>
                {order.store.phone && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">연락처</dt>
                    <dd className="text-sm font-medium">{order.store.phone}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* 요약 정보 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                요약 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">상품 수</dt>
                  <dd className="text-sm font-medium">{order.orderItems.length}개</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">총 수량</dt>
                  <dd className="text-sm font-medium">
                    {order.orderItems.reduce((sum, item) => sum + item.quantity, 0)}개
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">총 금액</dt>
                  <dd className="text-sm font-medium">
                    {order.totalAmount.toLocaleString()}원
                  </dd>
                </div>
                {order.creator && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">발주자</dt>
                    <dd className="text-sm font-medium">{order.creator.name || order.creator.email}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* 발주 상품 목록 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">발주 상품 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>상품 정보</TableHead>
                    <TableHead className="w-20 text-right">단가</TableHead>
                    <TableHead className="w-20 text-right">수량</TableHead>
                    <TableHead className="w-20 text-right">금액</TableHead>
                    <TableHead className="w-28">상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.orderItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {item.product.imageUrl ? (
                            <div className="relative h-12 w-12 overflow-hidden rounded-md border">
                              <Image
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-gray-100">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{item.product.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.product.code}
                              {item.product.category && (
                                <span className="ml-2">{item.product.category.name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.product.price.toLocaleString()}원
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.quantity}개
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(item.quantity * item.product.price).toLocaleString()}원
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusStyles[item.status]?.variant || 'outline'}>
                          {statusStyles[item.status]?.label || item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 로봇 작업 섹션 */}
        {order.robotTasks && order.robotTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">로봇 작업</CardTitle>
              <CardDescription>발주와 연관된 로봇 작업 내역입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>로봇</TableHead>
                      <TableHead>항목</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>시작 시간</TableHead>
                      <TableHead>완료 시간</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.robotTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div className="font-medium">{task.robot.name}</div>
                          <div className="text-xs text-muted-foreground">
                            로봇 상태: {task.robot.status}
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.orderItems.find(item => item.id === task.orderItemId)?.product.name || '알 수 없음'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusStyles[task.status]?.variant || 'outline'}>
                            {statusStyles[task.status]?.label || task.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.startTime ? format(new Date(task.startTime), 'MM/dd HH:mm', { locale: ko }) : '-'}
                        </TableCell>
                        <TableCell>
                          {task.endTime ? format(new Date(task.endTime), 'MM/dd HH:mm', { locale: ko }) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 액션 다이얼로그 */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentAction === 'process' && '발주 처리 시작'}
              {currentAction === 'complete' && '발주 완료 처리'}
              {currentAction === 'cancel' && '발주 취소'}
            </DialogTitle>
            <DialogDescription>
              {currentAction === 'process' && '발주 처리를 시작하시겠습니까? 상태가 처리중으로 변경됩니다.'}
              {currentAction === 'complete' && '발주를 완료 처리하시겠습니까? 재고가 추가되고 상태가 완료로 변경됩니다.'}
              {currentAction === 'cancel' && '발주를 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)} disabled={processingAction}>
              취소
            </Button>
            <Button 
              onClick={() => {
                if (currentAction === 'process') updateOrderStatus('processing')
                else if (currentAction === 'complete') updateOrderStatus('completed')
                else if (currentAction === 'cancel') updateOrderStatus('cancelled')
              }}
              disabled={processingAction}
              variant={currentAction === 'cancel' ? 'destructive' : 'default'}
            >
              {processingAction && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 