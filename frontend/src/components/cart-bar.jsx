'use client'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from '@/contexts/store-context'

export function CartBar({ itemCount, total }) {
  const router = useRouter()
  const { selectedStore, setSelectedStore, stores, hasStores } = useStore()

  const handleStoreChange = (storeId) => {
    const store = stores.find(s => s.id === storeId)
    setSelectedStore(store)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
      <div className="container mx-auto py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {hasStores ? (
              <Select
                value={selectedStore?.id || ''}
                onValueChange={handleStoreChange}
              >
                <SelectTrigger className="w-[200px]">
                  <Building2 className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="스토어 선택" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Button
                variant="outline"
                onClick={() => router.push('/stores/new')}
                className="w-[200px]"
              >
                <Building2 className="mr-2 h-4 w-4" />
                스토어 등록하기
              </Button>
            )}
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <span className="font-medium">장바구니</span>
              <Badge variant="secondary">{itemCount}</Badge>
            </div>
            <div className="text-muted-foreground">
              총 <span className="font-medium text-foreground">{total.toLocaleString()}원</span>
            </div>
          </div>
          <Button 
            size="lg"
            onClick={() => router.push('/order/cart')}
            disabled={itemCount === 0}
          >
            장바구니 보기
          </Button>
        </div>
      </div>
    </div>
  )
} 