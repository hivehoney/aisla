'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/contexts/store-context'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

// Create RecentOrders component within the same file
export default function RecentOrders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const { selectedStore } = useStore()
    const router = useRouter()
  
    useEffect(() => {
      async function fetchRecentOrders() {
        if (!selectedStore) return
        
        setLoading(true)
        try {
          const response = await fetch(`/api/orders?storeId=${selectedStore.id}&limit=5&sortBy=createdAt&sortOrder=desc`)
          const data = await response.json()
          setOrders(data.orders || [])
        } catch (error) {
          console.error('Error fetching recent orders:', error)
        } finally {
          setLoading(false)
        }
      }
  
      fetchRecentOrders()
    }, [selectedStore])
  
    return (
      <div className="w-full">
        {loading ? (
          <div className="flex justify-center p-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : orders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>주문번호</TableHead>
                <TableHead>상품</TableHead>
                <TableHead>주문일시</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">금액</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/orders/${order.id}`)}>
                  <TableCell className="font-medium">{order.id.slice(-6).toUpperCase()}</TableCell>
                  <TableCell>{order.orderItems.map(item => item.product.name).join(', ').slice(0, 20)}...</TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={
                      order.status === 'completed' ? 'default' :
                      order.status === 'processing' ? 'secondary' :
                      order.status === 'cancelled' ? 'destructive' : 'outline'
                    }>
                      {
                        order.status === 'pending' ? '대기중' :
                        order.status === 'processing' ? '처리중' :
                        order.status === 'completed' ? '완료' :
                        order.status === 'cancelled' ? '취소됨' : order.status
                      }
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {order.totalAmount ? order.totalAmount.toLocaleString() : '-'}원
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            최근 주문 내역이 없습니다.
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            className="gap-1 text-sm"
            onClick={() => router.push('/orders')}
          >
            모든 주문 보기
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    )
  }
  