'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Minus, Building2, ArrowLeft, RefreshCw, CheckCircle } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { useStore } from '@/contexts/store-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function OrderCartPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { selectedStore, setSelectedStore, stores, hasStores } = useStore()
  const [cartItems, setCartItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [storeCartCounts, setStoreCartCounts] = useState({})

  // 데이터 정규화 함수 수정
  const normalizeCartItem = (item) => {
    if (!item?.product) return null;
    return {
      id: item.id,
      name: item.product.name,
      code: item.product.code,
      price: parseFloat(item.product.price),
      quantity: parseInt(item.quantity) || 1,
      imageUrl: item.product.imageUrl,
      productId: item.product.id,
      createdAt: item.createdAt,
      imageTag: item.product.imageTag,
      tags: item.product.tags || []
    }
  }

  // 모든 스토어의 장바구니 아이템 개수 가져오기
  const fetchAllStoreCarts = async () => {
    if (!stores || stores.length === 0) return;
    
    const counts = {};
    
    try {
      for (const store of stores) {
        const response = await fetch(`/api/cart?storeId=${store.id}`);
        const data = await response.json();
        
        if (response.ok) {
          const normalizedItems = (data.items || [])
            .map(normalizeCartItem)
            .filter(item => item !== null);
            
          counts[store.id] = normalizedItems.length;
        }
      }
      
      setStoreCartCounts(counts);
    } catch (error) {
      console.error('스토어 장바구니 개수 가져오기 오류:', error);
    }
  }

  // 장바구니 데이터 로드 함수 수정
  const fetchCartItems = async (storeId) => {
    if (!storeId) {
      setCartItems([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/cart?storeId=${storeId}`)
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error)
      
      // 데이터 정규화 처리 및 정렬
      const normalizedItems = (data.items || [])
        .map(normalizeCartItem)
        .filter(item => item !== null)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      
      setCartItems(normalizedItems)
      
      // 현재 스토어의 장바구니 개수 업데이트
      setStoreCartCounts(prev => ({
        ...prev,
        [storeId]: normalizedItems.length
      }));
    } catch (error) {
      console.error('Cart fetch error:', error)
      toast({
        title: "오류 발생",
        description: "장바구니 정보를 불러오는데 실패했습니다.",
        variant: "destructive"
      })
      setCartItems([])
    } finally {
      setIsLoading(false)
    }
  }

  // 스토어 변경 처리
  const handleStoreChange = (storeId) => {
    const store = stores.find(s => s.id === storeId);
    setSelectedStore(store);
  }

  // 스토어 장바구니 초기화
  const handleClearStoreCart = async (storeId) => {
    if (!storeId) return;
    
    try {
      const response = await fetch(`/api/cart/clear`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storeId })
      });
      
      if (!response.ok) throw new Error('장바구니 초기화 중 오류가 발생했습니다');
      
      // 현재 활성화된 스토어의 장바구니라면 UI도 초기화
      if (selectedStore?.id === storeId) {
        setCartItems([]);
      }
      
      // 장바구니 개수 업데이트
      setStoreCartCounts(prev => ({
        ...prev,
        [storeId]: 0
      }));
      
      toast({
        title: "장바구니 초기화",
        description: "장바구니가 성공적으로 초기화되었습니다",
      });
    } catch (error) {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive"
      });
    }
  }

  // 컴포넌트 마운트 시 모든 스토어의 장바구니 개수 가져오기
  useEffect(() => {
    fetchAllStoreCarts();
  }, [stores]);

  // 스토어가 변경될 때마다 장바구니 데이터 로드
  useEffect(() => {
    if (selectedStore?.id) {
      fetchCartItems(selectedStore.id)
    } else {
      setCartItems([])
      setIsLoading(false)
    }
  }, [selectedStore])

  // 수량 변경 처리 함수 수정
  const handleQuantityChange = async (itemId, newQuantity) => {
    // 최대 수량 검증 (999로 제한)
    const validatedQuantity = Math.min(Math.max(1, newQuantity), 999)
    
    // 기존 아이템 상태 저장
    const previousItems = [...cartItems]
    
    // Optimistic Update
    setCartItems(cartItems.map(item => 
      item.id === itemId 
        ? { ...item, quantity: validatedQuantity }
        : item
    ))

    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          quantity: validatedQuantity,
          cartItemId: itemId
        })
      })

      if (!response.ok) throw new Error('수량 변경 중 오류가 발생했습니다')
      // 성공 시에는 아무것도 하지 않음 (이미 UI가 업데이트됨)
    } catch (error) {
      // 실패 시 이전 상태로 되돌림
      setCartItems(previousItems)
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  // 상품 삭제 처리 함수 수정
  const handleRemoveItem = async (itemId) => {
    // 기존 아이템 상태 저장
    const previousItems = [...cartItems]
    
    // Optimistic Update
    setCartItems(cartItems.filter(item => item.id !== itemId))

    // 장바구니 개수 업데이트
    if (selectedStore?.id) {
      setStoreCartCounts(prev => ({
        ...prev,
        [selectedStore.id]: prev[selectedStore.id] - 1
      }));
    }

    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cartItemId: itemId })
      })

      if (!response.ok) throw new Error('상품 삭제 중 오류가 발생했습니다')
      
      toast({
        title: "상품 삭제",
        description: "장바구니에서 상품이 삭제되었습니다",
      })
    } catch (error) {
      // 실패 시 이전 상태로 되돌림
      setCartItems(previousItems)
      if (selectedStore?.id) {
        setStoreCartCounts(prev => ({
          ...prev,
          [selectedStore.id]: prev[selectedStore.id] + 1
        }));
      }
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  // 상품 상세보기 처리 함수 추가
  const handleProductClick = (productId) => {
    router.push(`/products/${productId}`)
  }

  // 발주하기 처리
  const handleOrder = async () => {
    if (!selectedStore) {
      toast({
        title: "스토어 선택 필요",
        description: "발주할 스토어를 선택해주세요",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storeId: selectedStore.id,
          items: cartItems
        })
      })

      if (!response.ok) throw new Error('발주 처리 중 오류가 발생했습니다')
      
      toast({
        title: "발주 완료",
        description: "발주가 정상적으로 처리되었습니다",
      })
      
      // 장바구니 개수 업데이트
      if (selectedStore?.id) {
        setStoreCartCounts(prev => ({
          ...prev,
          [selectedStore.id]: 0
        }));
      }
      
      router.push('/orders')
    } catch (error) {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  // 상품 가격 포맷팅을 위한 헬퍼 함수 추가
  const formatPrice = (price) => {
    return typeof price === 'number' ? price.toLocaleString() : '0'
  }

  // totalAmount 계산 로직 수정
  const totalAmount = cartItems.reduce((sum, item) => {
    const price = Number(item?.price) || 0
    const quantity = Number(item?.quantity) || 0
    return sum + (price * quantity)
  }, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 */}
      <div className="bg-white border-b">
        <div className="container mx-auto py-4">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push('/order/search')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            상품 검색으로 돌아가기
          </Button>
          <h1 className="text-2xl font-semibold">발주 장바구니</h1>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto py-6">
        {/* 스토어 선택 표 영역 - 상단으로 이동 */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>스토어 선택</CardTitle>
            </CardHeader>
            <CardContent>
              {!hasStores ? (
                <Button
                  variant="outline"
                  onClick={() => router.push('/stores/new')}
                  className="w-full"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  스토어 등록하기
                </Button>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">선택</TableHead>
                        <TableHead>스토어명</TableHead>
                        <TableHead className="text-center">장바구니</TableHead>
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
                          <TableCell className="text-center">
                            {storeCartCounts[store.id] > 0 ? (
                              <Badge>{storeCartCounts[store.id]}개</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">비어있음</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClearStoreCart(store.id);
                              }}
                              disabled={!storeCartCounts[store.id] || storeCartCounts[store.id] === 0}
                            >
                              <RefreshCw className="mr-1 h-3 w-3" />
                              초기화
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 장바구니 상품 목록 */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  로딩 중...
                </CardContent>
              </Card>
            ) : !selectedStore ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  위에서 스토어를 선택해주세요
                </CardContent>
              </Card>
            ) : cartItems.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  장바구니가 비어있습니다
                </CardContent>
              </Card>
            ) : (
              cartItems.map((item) => {
                if (!item || !item.name || !item.price) return null;

                return (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* 상품 이미지 - 클릭 가능하도록 수정 */}
                        <div 
                          className="flex-shrink-0 cursor-pointer" 
                          onClick={() => handleProductClick(item.productId)}
                        >
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full text-gray-400">
                                <Building2 className="w-8 h-8" />
                              </div>
                            )}
                            {item.imageTag && (
                              <div className="absolute top-0 left-0 m-1">
                                <Badge 
                                  variant={
                                    item.imageTag.toLowerCase() === 'best' ? 'destructive' : 
                                    item.imageTag.toLowerCase() === 'new' ? 'default' : 
                                    'secondary'
                                  }
                                  className="px-1 py-0 text-xs font-bold uppercase"
                                >
                                  {item.imageTag}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 상품 정보 및 수량 조절 */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              {/* 상품명 클릭 가능하도록 수정 */}
                              <div className="flex items-center gap-2">
                                <span 
                                  className="font-medium cursor-pointer hover:text-blue-600 transition-colors"
                                  onClick={() => handleProductClick(item.productId)}
                                >
                                  {item.name}
                                </span>
                                <Badge variant="secondary">{item.code}</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {item.price.toLocaleString()}원
                              </div>
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.tags.map((tag, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      #{tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleQuantityChange(item.id, (item?.quantity || 1) - 1)}
                                disabled={item?.quantity === 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                max="999"
                                value={item?.quantity || 1}
                                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                                className="w-16 text-center"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleQuantityChange(item.id, (item?.quantity || 1) + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {/* 총 금액 표시 */}
                          <div className="mt-2 text-sm font-medium text-right">
                            총 {(item.price * (item.quantity || 1)).toLocaleString()}원
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* 주문 요약 */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>주문 요약</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">총 상품 금액</span>
                  <span className="font-medium">{totalAmount.toLocaleString()}원</span>
                </div>
                <Button 
                  className="w-full" 
                  disabled={cartItems.length === 0 || !selectedStore}
                  onClick={handleOrder}
                >
                  발주하기
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 