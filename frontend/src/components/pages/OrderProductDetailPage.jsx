'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus } from 'lucide-react'

export default function OrderProductDetailPage() {
  const { id } = useParams()
  const [quantity, setQuantity] = useState(1)
  const [product, setProduct] = useState(null)

  // TODO: API로 상품 정보 가져오기
  // useEffect(() => {
  //   fetchProduct(id)
  // }, [id])

  const handleQuantityChange = (newQuantity) => {
    setQuantity(Math.max(1, newQuantity))
  }

  const handleAddToCart = () => {
    // TODO: 장바구니 추가 로직
    console.log('Adding to cart:', { product, quantity })
  }

  if (!product) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center text-muted-foreground">
          상품 정보를 불러오는 중...
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="aspect-square bg-muted rounded-lg mb-4">
              {/* TODO: 상품 이미지 추가 */}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{product.name}</h2>
                <Badge variant="secondary">{product.code}</Badge>
              </div>
              <div className="text-3xl font-bold">
                {product.price.toLocaleString()}원
              </div>
              <div className="text-sm text-muted-foreground">
                재고: {product.stock}개
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>발주 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">수량</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(quantity - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                    className="w-16 text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">총 금액</span>
                <span className="font-medium">
                  {(product.price * quantity).toLocaleString()}원
                </span>
              </div>
            </div>
            <Button className="w-full" onClick={handleAddToCart}>
              장바구니에 추가
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 