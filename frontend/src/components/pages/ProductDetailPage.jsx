'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ShoppingCart, ArrowLeft, Building2, Plus, Minus, FileText, Info } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { useStore } from '@/contexts/store-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CartBar } from '@/components/cart-bar'

export default function ProductDetailPage({ params }) {
  const unwrappedParams = React.use(params)
  const productId = unwrappedParams.id
  const router = useRouter()
  const { toast } = useToast()
  const { selectedStore, setSelectedStore, stores, hasStores } = useStore()
  const [product, setProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cartItemCount, setCartItemCount] = useState(0)
  const [cartTotal, setCartTotal] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const fetchProduct = async (storeId = null) => {
    try {
      let url = `/api/products/${productId}`;
      if (storeId) {
        url += `?storeId=${storeId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setProduct(data);
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "상품 정보를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
      router.push('/order/search');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (selectedStore && !isLoading) {
      fetchProduct(selectedStore.id);
    }
  }, [selectedStore]);

  const fetchCartInfo = async () => {
    if (!selectedStore) return
    
    try {
      const response = await fetch(`/api/cart?storeId=${selectedStore.id}`)
      const data = await response.json()
      setCartItemCount(data.items?.length || 0)
      setCartTotal(data.total || 0)
    } catch (error) {
      console.error('장바구니 정보 로딩 중 오류:', error)
    }
  }

  useEffect(() => {
    if (selectedStore) {
      fetchCartInfo()
    }
  }, [selectedStore])

  const handleStoreChange = (storeId) => {
    const store = stores.find(s => s.id === storeId)
    setSelectedStore(store)
  }

  const handleQuantityChange = (change) => {
    setQuantity(prev => Math.max(1, prev + change))
  }

  const handleQuantityInputChange = (e) => {
    const value = parseInt(e.target.value)
    if (isNaN(value) || value < 1) {
      setQuantity(1)
    } else if (value > 999) {
      setQuantity(999)
    } else {
      setQuantity(value)
    }
  }

  const handleAddToCart = async () => {
    try {
      // 스토어가 선택되지 않은 경우 메시지 표시
      if (!selectedStore) {
        toast({
          title: "스토어 선택 필요",
          description: "상품을 담기 위해서는 스토어를 선택해주세요.",
          variant: "destructive"
        })
        return
      }

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: quantity,
          storeId: selectedStore.id
        })
      })

      if (!response.ok) {
        throw new Error('장바구니 추가 중 오류가 발생했습니다')
      }

      // 장바구니 정보 업데이트
      fetchCartInfo()
      
      toast({
        title: "장바구니 추가",
        description: `${product.name} ${quantity}개가 장바구니에 추가되었습니다`,
        action: (
          <Button   
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/order/cart')}
            className="bg-white hover:bg-gray-100"
          >
            장바구니 가기
          </Button>
        ),
      })
      
      // 수량 초기화
      setQuantity(1)
    } catch (error) {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return <div className="container mx-auto py-8">로딩 중...</div>
  }

  if (!product) {
    return <div className="container mx-auto py-8">상품을 찾을 수 없습니다.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 상단 헤더 */}
      <div className="bg-white border-b">
        <div className="container mx-auto py-4">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            돌아가기
          </Button>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
        </div>
      </div>

      {/* 상품 상세 정보 */}
      <div className="container mx-auto py-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="grid md:grid-cols-2 gap-8 p-6">
            {/* 상품 이미지 */}
            <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
              {product.imageUrl ? (
                <div className="w-full h-full relative">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="object-contain w-full h-full"
                  />
                  {product.imageTag && (
                    <div className="absolute top-4 left-4">
                      <Badge 
                        variant={
                          product.imageTag.toLowerCase() === 'best' ? 'destructive' : 
                          product.imageTag.toLowerCase() === 'new' ? 'default' : 
                          'secondary'
                        }
                        className="px-2 py-1 text-sm font-bold uppercase"
                      >
                        {product.imageTag}
                      </Badge>
                    </div>
                  )}
                  {product.eventType && (
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" className="px-2 py-1 text-sm">
                        {product.eventType}
                      </Badge>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-muted-foreground">이미지 없음</span>
                </div>
              )}
            </div>

            {/* 상품 정보 */}
            <div className="space-y-6">
              <div>
                <Badge variant="secondary" className="mb-2">
                  {product.code}
                </Badge>
                <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
                <div className="flex flex-wrap gap-2 mb-2">
                  {product.category && (
                    <Badge variant="outline">{product.category.name}</Badge>
                  )}
                </div>
                
                {/* 태그 리스트 추가 */}
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {product.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="bg-slate-50">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm text-muted-foreground mb-1">판매가</h3>
                  <div>
                    {product.priceOriginal && product.priceOriginal > product.price ? (
                      <div className="mb-1">
                        <span className="line-through text-muted-foreground">
                          {product.priceOriginal.toLocaleString()}원
                        </span>
                        <Badge variant="destructive" className="ml-2">
                          {Math.round((1 - product.price / product.priceOriginal) * 100)}% 할인
                        </Badge>
                      </div>
                    ) : null}
                    <div className="text-2xl font-bold">
                      {product.price.toLocaleString()}원
                    </div>
                  </div>
                </div>

                {/* 상품 기본 정보 섹션 추가 */}
                <div className="grid grid-cols-2 gap-4 border rounded-lg p-4 bg-gray-50">
                  {product.location && (
                    <div>
                      <h3 className="text-sm text-muted-foreground mb-1">진열 위치</h3>
                      <div className="font-medium">{product.location}</div>
                    </div>
                  )}
                  
                  {product.expirationDays && (
                    <div>
                      <h3 className="text-sm text-muted-foreground mb-1">유통기한</h3>
                      <div className="font-medium">{product.expirationDays}일</div>
                    </div>
                  )}
                  
                  {product.quantity !== undefined && (
                    <div>
                      <h3 className="text-sm text-muted-foreground mb-1">주문 가능 수량</h3>
                      <div className="font-medium">{product.quantity || '제한없음'}</div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm text-muted-foreground mb-2">스토어 선택</h3>
                  <Select
                    value={selectedStore?.id}
                    onValueChange={(value) => handleStoreChange(value)}
                    modal={false}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="스토어를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedStore && product.inventories?.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-3">{selectedStore.name} 재고 정보</h3>
                    <div className="space-y-3">
                      {product.inventories.map(inventory => (
                        <div key={inventory.id} className="flex justify-between items-center border-b pb-2">
                          <div>
                            {inventory.location && (
                              <div className="text-sm font-medium">{inventory.location}</div>
                            )}
                            <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                              {inventory.receivedDate ? (
                                <span>입고: {new Date(inventory.receivedDate).toLocaleDateString()}</span>
                              ) : (
                                <span>입고: 정보 없음</span>
                              )}
                              {inventory.expirationDate ? (
                                <span>유통기한: {new Date(inventory.expirationDate).toLocaleDateString()}</span>
                              ) : (
                                <span>유통기한: 정보 없음</span>
                              )}
                            </div>
                          </div>
                          <Badge variant={inventory.quantity > 0 ? 'default' : 'destructive'}>
                            {inventory.quantity || 0}개
                          </Badge>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2">
                        <span className="font-medium">총 재고</span>
                        <Badge variant="outline" className="text-base px-3">
                          {product.inventories.reduce((sum, inv) => sum + (inv.quantity || 0), 0)}개
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm text-muted-foreground mb-2">수량</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <Button 
                      variant="outline" 
                      size="icon"
                      disabled={quantity <= 1}
                      onClick={() => handleQuantityChange(-1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    
                    <Input
                      type="number"
                      min="1"
                      max="999"
                      value={quantity}
                      onChange={handleQuantityInputChange}
                      className="w-20 text-center"
                    />
                    
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleQuantityChange(1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full h-12 text-lg"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {selectedStore ? '장바구니 담기' : '스토어 선택 후 담기'}
                </Button>
              </div>
            </div>
          </div>

          {/* 상품 상세 설명 */}
          <div className="border-t p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              상품 설명
            </h3>
            {product.description ? (
              <div className="bg-gray-50 rounded-lg p-4 border">
                <p className="whitespace-pre-line text-base">
                  {product.description}
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 border text-center text-muted-foreground">
                <Info className="h-5 w-5 mb-2 mx-auto" />
                <p>등록된 상품 설명이 없습니다.</p>
              </div>
            )}
          </div>

          {/* 판매 정보 섹션 추가 */}
          {product.sales && product.sales.length > 0 && (
            <div className="border-t p-6">
              <h3 className="text-lg font-semibold mb-4">최근 판매 내역</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border p-2 text-left">판매일시</th>
                      <th className="border p-2 text-right">수량</th>
                      <th className="border p-2 text-right">판매가</th>
                      <th className="border p-2 text-right">총액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.sales.map(sale => (
                      <tr key={sale.id} className="border-b">
                        <td className="border p-2">
                          {new Date(sale.saleTime).toLocaleString()}
                        </td>
                        <td className="border p-2 text-right">{sale.quantity}개</td>
                        <td className="border p-2 text-right">{sale.price.toLocaleString()}원</td>
                        <td className="border p-2 text-right">{sale.totalAmount.toLocaleString()}원</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 font-medium">
                      <td colSpan={2} className="border p-2">최근 판매 통계</td>
                      <td className="border p-2 text-right">
                        총 {product.sales.reduce((sum, sale) => sum + sale.quantity, 0)}개
                      </td>
                      <td className="border p-2 text-right">
                        {product.sales.reduce((sum, sale) => sum + sale.totalAmount, 0).toLocaleString()}원
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 하단 고정 장바구니 바 */}
      <CartBar itemCount={cartItemCount} total={cartTotal} />
    </div>
  )
} 