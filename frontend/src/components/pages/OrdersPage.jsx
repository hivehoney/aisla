'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  ChevronDown,
  Filter,
  Loader2,
  PackageOpen,
  RefreshCw,
  Search,
  ShoppingCart,
  Truck,
  Building2,
  Plus,
  Trash2,
  CheckCircle,
  FileText,
  XCircle,
  Eye,
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useStore } from '@/contexts/store-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function OrdersPage() {
  const { toast } = useToast()
  const { data: session } = useSession()
  const router = useRouter()
  const { selectedStore, setSelectedStore } = useStore()
  
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [stores, setStores] = useState([])
  const [storesLoading, setStoresLoading] = useState(true)
  
  // 발주 생성 관련 상태
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newOrderItems, setNewOrderItems] = useState([
    { productId: '', quantity: 1 }
  ])
  const [products, setProducts] = useState([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  
  // 스토어별 발주 상태 통계
  const [storeOrderStats, setStoreOrderStats] = useState({})

  // 상태별 배지 스타일 설정
  const statusStyles = {
    pending: { variant: 'outline', label: '대기중' },
    processing: { variant: 'secondary', label: '처리중' },
    completed: { variant: 'default', label: '완료' },
    cancelled: { variant: 'destructive', label: '취소됨' },
  }

  // 스토어 목록 로드
  useEffect(() => {
    fetchStores()
  }, [session])

  // 스토어 목록 가져오기
  const fetchStores = async () => {
    if (!session?.user) return
    
    setStoresLoading(true)
    try {
      const response = await fetch('/api/stores')
      
      if (!response.ok) {
        throw new Error('스토어 목록을 불러오는데 실패했습니다')
      }
      
      const data = await response.json()
      setStores(data)
      
      // 스토어가 있지만 선택된 스토어가 없는 경우 첫 번째 스토어 선택
      if (data.length > 0 && !selectedStore) {
        setSelectedStore(data[0])
      }
    } catch (error) {
      toast({
        title: '오류 발생',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setStoresLoading(false)
    }
  }

  // 스토어 변경 핸들러
  const handleStoreChange = (storeId) => {
    const store = stores.find(s => s.id === storeId)
    if (store) {
      setSelectedStore(store)
    }
  }

  // 발주 내역 불러오기
  useEffect(() => {
    if (selectedStore) {
      fetchOrders()
    }
  }, [selectedStore, statusFilter, sortBy, sortOrder])

  // 발주 내역 가져오기
  const fetchOrders = async () => {
    if (!selectedStore) return
    
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        storeId: selectedStore.id,
        sortBy,
        sortOrder
      })
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      
      const response = await fetch(`/api/orders?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('발주 내역을 불러오는데 실패했습니다')
      }
      
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      toast({
        title: '오류 발생',
        description: error.message,
        variant: 'destructive'
      })
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  // 상품 목록 가져오기
  const fetchProducts = async () => {
    if (!selectedStore) return
    
    setIsLoadingProducts(true)
    try {
      const response = await fetch(`/api/products?storeId=${selectedStore.id}&limit=100`)
      
      if (!response.ok) {
        throw new Error('상품 목록을 불러오는데 실패했습니다')
      }
      
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      toast({
        title: '오류 발생',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsLoadingProducts(false)
    }
  }

  // 발주 생성 다이얼로그가 열릴 때 상품 목록 로드
  useEffect(() => {
    if (isCreateDialogOpen && selectedStore) {
      fetchProducts()
    }
  }, [isCreateDialogOpen, selectedStore])

  // 새 발주 아이템 추가
  const addOrderItem = () => {
    setNewOrderItems([...newOrderItems, { productId: '', quantity: 1 }])
  }

  // 발주 아이템 정보 변경
  const updateOrderItem = (index, field, value) => {
    const updatedItems = [...newOrderItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setNewOrderItems(updatedItems)
  }

  // 발주 아이템 삭제
  const removeOrderItem = (index) => {
    const updatedItems = [...newOrderItems]
    updatedItems.splice(index, 1)
    setNewOrderItems(updatedItems)
  }

  // 발주 생성 처리
  const handleCreateOrder = async () => {
    if (!selectedStore) {
      toast({
        title: '스토어 선택 필요',
        description: '발주할 스토어를 선택해주세요',
        variant: 'destructive'
      })
      return
    }

    // 유효성 검사
    const validItems = newOrderItems.filter(item => item.productId && item.quantity > 0)
    if (validItems.length === 0) {
      toast({
        title: '유효한 발주 항목 필요',
        description: '최소 하나 이상의 유효한 상품을 추가해주세요',
        variant: 'destructive'
      })
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId: selectedStore.id,
          items: validItems,
          type: 'manual'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '발주 생성에 실패했습니다')
      }
      
      const data = await response.json()
      
      toast({
        title: '발주 생성 완료',
        description: '발주가 성공적으로 생성되었습니다.',
      })
      
      // 다이얼로그 닫기 및 상태 초기화
      setIsCreateDialogOpen(false)
      setNewOrderItems([{ productId: '', quantity: 1 }])
      
      // 발주 목록 새로고침
      fetchOrders()
    } catch (error) {
      toast({
        title: '오류 발생',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsCreating(false)
    }
  }

  // 검색 기능
  const handleSearch = (e) => {
    e.preventDefault()
    // 실제 검색은 API에서 수행할 수 있지만 여기서는 클라이언트 필터링만 구현
    // 실제 구현 시 API에 검색 쿼리 전달하는 것으로 수정 필요
  }

  // 발주 상세 페이지로 이동
  const viewOrderDetails = (orderId) => {
    router.push(`/orders/${orderId}`)
  }

  // 발주 상태 변경
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) {
        throw new Error('발주 상태 변경에 실패했습니다')
      }
      
      // 성공 시 발주 목록 새로고침
      fetchOrders()
      
      toast({
        title: '상태 변경 완료',
        description: '발주 상태가 변경되었습니다',
      })
    } catch (error) {
      toast({
        title: '오류 발생',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  // 스토어별 발주 통계 가져오기
  const fetchStoreOrderStats = async () => {
    if (!stores || stores.length === 0) return
    
    try {
      const stats = {}
      
      for (const store of stores) {
        const response = await fetch(`/api/orders/stats?storeId=${store.id}`)
        
        if (response.ok) {
          const data = await response.json()
          stats[store.id] = data
        }
      }
      
      setStoreOrderStats(stats)
    } catch (error) {
      console.error('스토어 발주 통계 로드 오류:', error)
    }
  }

  // 스토어 목록 로드 후 통계 가져오기
  useEffect(() => {
    if (stores.length > 0 && !storesLoading) {
      fetchStoreOrderStats()
    }
  }, [stores, storesLoading])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="container mx-auto">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">발주 내역</h1>
              <p className="text-muted-foreground">
                발주 내역을 확인하고 관리할 수 있습니다.
              </p>
            </div>
            
            {/* 발주 생성 버튼 */}
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              {selectedStore && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      발주 생성
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>새 발주 생성</DialogTitle>
                      <DialogDescription>
                        발주할 상품과 수량을 입력하세요. 한 번에 여러 상품을 발주할 수 있습니다.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
                      {isLoadingProducts ? (
                        <div className="py-8 flex justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : products.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          등록된 상품이 없습니다
                        </div>
                      ) : (
                        newOrderItems.map((item, index) => (
                          <div key={index} className="flex gap-3 items-start">
                            <div className="flex-1">
                              <Select
                                value={item.productId}
                                onValueChange={(value) => updateOrderItem(index, 'productId', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="상품 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                  {products.map(product => (
                                    <SelectItem key={product.id} value={product.id}>
                                      {product.name} ({product.price.toLocaleString()}원)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-24">
                              <Input
                                type="number"
                                placeholder="수량"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                              />
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => removeOrderItem(index)}
                              disabled={newOrderItems.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                      
                      <Button
                        variant="outline"
                        onClick={addOrderItem}
                        className="w-full mt-2"
                        disabled={isLoadingProducts}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        상품 추가
                      </Button>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                        disabled={isCreating}
                      >
                        취소
                      </Button>
                      <Button 
                        onClick={handleCreateOrder}
                        disabled={isCreating || isLoadingProducts}
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            처리 중...
                          </>
                        ) : '발주 생성'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* 스토어 선택 표 영역 - 항상 표시 */}
          {!storesLoading && stores.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>스토어 선택</CardTitle>
                <CardDescription>스토어를 선택하여 발주 내역을 확인하세요</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">선택</TableHead>
                        <TableHead>스토어명</TableHead>
                        <TableHead>주소</TableHead>
                        <TableHead>발주 현황</TableHead>
                        <TableHead className="text-right">관리</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stores.map((store) => (
                        <TableRow 
                          key={store.id} 
                          className={selectedStore?.id === store.id ? "bg-muted/50" : ""}
                          onClick={() => handleStoreChange(store.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <TableCell className="text-center">
                            {selectedStore?.id === store.id && (
                              <CheckCircle className="h-4 w-4 text-primary mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            <span className="flex items-center">
                              <Building2 className="h-4 w-4 mr-2" />
                              {store.name}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {store.address}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {storeOrderStats[store.id] ? (
                                <>
                                  {storeOrderStats[store.id].pending > 0 && (
                                    <Badge variant="outline" className="text-xs">
                                      대기 {storeOrderStats[store.id].pending}
                                    </Badge>
                                  )}
                                  {storeOrderStats[store.id].processing > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      처리중 {storeOrderStats[store.id].processing}
                                    </Badge>
                                  )}
                                  {storeOrderStats[store.id].completed > 0 && (
                                    <Badge variant="default" className="text-xs">
                                      완료 {storeOrderStats[store.id].completed}
                                    </Badge>
                                  )}
                                  {storeOrderStats[store.id].cancelled > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      취소 {storeOrderStats[store.id].cancelled}
                                    </Badge>
                                  )}
                                  {storeOrderStats[store.id].total === 0 && (
                                    <span className="text-xs text-muted-foreground">발주 내역 없음</span>
                                  )}
                                  
                                  {storeOrderStats[store.id].totalRobotTasks > 0 && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-6 px-1 py-0 min-w-0">
                                            <Badge variant="secondary" className="text-xs">
                                              로봇 {storeOrderStats[store.id].totalRobotTasks}
                                            </Badge>
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="p-2">
                                          <div className="text-xs">
                                            {Object.entries(storeOrderStats[store.id].robotTaskStats || {}).map(([status, count]) => (
                                              <div key={status} className="flex justify-between gap-2">
                                                <span>{status === 'pending' ? '대기' : status === 'processing' ? '처리중' : status === 'completed' ? '완료' : status}:</span>
                                                <span>{count}개</span>
                                              </div>
                                            ))}
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </>
                              ) : (
                                <div className="flex items-center">
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  <span className="text-xs text-muted-foreground">로딩 중...</span>
                                </div>
                              )}
                            </div>
                            {storeOrderStats[store.id]?.recentOrdersAmount > 0 && (
                              <div className="mt-1 text-xs text-muted-foreground">
                                최근 발주: {storeOrderStats[store.id].recentOrdersAmount.toLocaleString()}원
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/stores/${store.id}`);
                                }}
                                title="스토어 관리"
                              >
                                <FileText className="h-4 w-4" />
                                <span className="sr-only">스토어 관리</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/order/search?storeId=${store.id}`);
                                }}
                                title="발주하기"
                              >
                                <ShoppingCart className="h-4 w-4" />
                                <span className="sr-only">발주하기</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 스토어가 없는 경우 */}
          {!storesLoading && stores.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>스토어 등록 필요</CardTitle>
                <CardDescription>
                  발주 내역을 관리하려면 먼저 스토어를 등록해주세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => router.push('/stores/new')}
                >
                  스토어 등록하기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* 필터 및 검색 */}
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap gap-3">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[150px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="상태 필터" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">모든 상태</SelectItem>
                        <SelectItem value="pending">대기중</SelectItem>
                        <SelectItem value="processing">처리중</SelectItem>
                        <SelectItem value="completed">완료</SelectItem>
                        <SelectItem value="cancelled">취소됨</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[150px]">
                        <ChevronDown className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="정렬 기준" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">발주일</SelectItem>
                        <SelectItem value="updatedAt">업데이트일</SelectItem>
                        <SelectItem value="totalAmount">금액</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </Button>

                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={fetchOrders}
                      disabled={!selectedStore}
                    >
                      <RefreshCw className="h-4 w-4" />
                      새로고침
                    </Button>
                  </div>
                  
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="발주 번호 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full md:w-auto"
                    />
                    <Button type="submit" disabled={!selectedStore}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>

              {/* 발주 목록 테이블 */}
              <div className="bg-white rounded-lg shadow">
                {!selectedStore ? (
                  <div className="p-12 text-center">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">스토어를 선택해주세요</h3>
                    <p className="text-muted-foreground mb-4">
                      발주 내역을 확인하려면 위에서 스토어를 선택해주세요.
                    </p>
                  </div>
                ) : isLoading ? (
                  <div className="p-12 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="p-12 text-center">
                    <PackageOpen className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
                    <h3 className="text-lg font-medium mb-2">발주 내역이 없습니다</h3>
                    <p className="text-muted-foreground mb-4">
                      아직 발주 내역이 없거나 선택한 필터에 해당하는 발주가 없습니다.
                    </p>
                    <Button 
                      onClick={() => router.push('/order/search')}
                      className="gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      발주하러 가기
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>발주 번호</TableHead>
                          <TableHead>타입</TableHead>
                          <TableHead>상태</TableHead>
                          <TableHead>발주일</TableHead>
                          <TableHead>총액</TableHead>
                          <TableHead>상품 수</TableHead>
                          <TableHead>로봇</TableHead>
                          <TableHead className="text-right">관리</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.isArray(orders) && orders.length > 0 ? (
                          orders.map((order) => (
                            <TableRow key={order.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">
                                <span 
                                  className="cursor-pointer hover:text-primary hover:underline"
                                  onClick={() => viewOrderDetails(order.id)}
                                >
                                  {order.id.slice(-6).toUpperCase()}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {order.type === 'manual' ? '수동 발주' : 
                                   order.type === 'prediction' ? 'AI 발주' : order.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusStyles[order.status]?.variant || 'outline'}>
                                  {statusStyles[order.status]?.label || order.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                                {order.completedAt && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    완료: {format(new Date(order.completedAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {order.totalAmount ? (
                                  <span className="font-medium">{order.totalAmount.toLocaleString()}원</span>
                                ) : (
                                  <Badge variant="outline" className="text-xs">계산 중</Badge>
                                )}
                              </TableCell>
                              <TableCell>{order.orderItems?.length || 0}개</TableCell>
                              <TableCell>
                                {order.robotTasks && order.robotTasks.length > 0 ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 px-2">
                                          <Badge variant="secondary" className="gap-1">
                                            <span>{order.robotTasks.length}개</span>
                                            <span className="text-xs">작업</span>
                                          </Badge>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" align="center" className="max-w-[300px]">
                                        <div className="text-xs font-medium mb-1">로봇 작업 현황</div>
                                        <div className="grid grid-cols-3 gap-1 text-xs">
                                          <div>대기: {order.robotTasks.filter(task => task.status === 'pending').length}개</div>
                                          <div>진행: {order.robotTasks.filter(task => task.status === 'processing').length}개</div>
                                          <div>완료: {order.robotTasks.filter(task => task.status === 'completed').length}개</div>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  <span className="text-xs text-muted-foreground">없음</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end space-x-1">
                                  <TooltipProvider delayDuration={300}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => viewOrderDetails(order.id)}
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="left">
                                        <p>상세 보기</p>
                                      </TooltipContent>
                                    </Tooltip>

                                    {order.status === 'pending' && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => updateOrderStatus(order.id, 'processing')}
                                          >
                                            <Truck className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left">
                                          <p>처리 시작</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                    
                                    {order.status === 'processing' && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => updateOrderStatus(order.id, 'completed')}
                                          >
                                            <CheckCircle className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left">
                                          <p>완료 처리</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                    
                                    {['pending', 'processing'].includes(order.status) && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-600"
                                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                          >
                                            <XCircle className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left">
                                          <p>발주 취소</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </TooltipProvider>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              {isLoading ? (
                                <div className="flex justify-center items-center">
                                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                  발주 내역을 불러오는 중입니다...
                                </div>
                              ) : (
                                <div className="text-muted-foreground">발주 내역이 없습니다</div>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

