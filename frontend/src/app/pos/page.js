'use client'

import { useState, useRef, useEffect } from "react"
import {
  Card, CardHeader, CardTitle, CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Barcode, CreditCard, Wallet, ShoppingCart
} from "lucide-react"

export default function POSPage() {
  const productDB = [
    { barcode: "8801234567890", name: "초코우유", price: 1200 },
    { barcode: "8800000000001", name: "삼각김밥", price: 1100 },
    { barcode: "8809876543210", name: "컵라면", price: 1500 },
    { barcode: "8809999999999", name: "콜라 500ml", price: 1800 },
  ]

  const [barcode, setBarcode] = useState("")
  const [cart, setCart] = useState([])
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)

  // 13자리 숫자 자동 처리
  useEffect(() => {
    if (barcode.length === 13 && /^\d{13}$/.test(barcode)) {
      handleScan()
    }
  }, [barcode])

  const handleScan = () => {
    const found = productDB.find(p => p.barcode === barcode)
    if (!found) {
      alert("등록되지 않은 상품입니다.")
      setBarcode("")
      return
    }

    setCart(prevCart => {
      const exists = prevCart.find(item => item.barcode === barcode)
      if (exists) {
        return prevCart.map(item =>
          item.barcode === barcode
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        return [...prevCart, { ...found, quantity: 1 }]
      }
    })

    setBarcode("")
    setTimeout(() => inputRef.current?.focus(), 10)
  }

  const handlePayment = (type) => {
    alert(`${type} 결제가 완료되었습니다.`)
    setCart([])
    setOpen(false)
    setTimeout(() => inputRef.current?.focus(), 10)
  }

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="min-h-screen px-6 py-16 pt-32 bg-muted/30">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* 헤더 */}
        <div className="text-center space-y-3">
          <Badge variant="outline" className="text-sm px-4 py-1 border-muted-foreground/30">
            POS 계산 페이지
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight flex justify-center items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            상품 바코드 결제
          </h1>
          <p className="text-muted-foreground">바코드를 스캔하여 자동으로 상품을 장바구니에 추가하세요.</p>
        </div>

        {/* 바코드 입력 */}
        <div className="flex items-center gap-4">
          <Input
            ref={inputRef}
            placeholder="바코드 입력 (13자리)"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            inputMode="numeric"
            maxLength={13}
          />
          <Button onClick={handleScan}>
            <Barcode className="w-4 h-4 mr-2" />
            추가
          </Button>
        </div>

        {/* 장바구니 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              장바구니
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-muted-foreground">상품이 추가되지 않았습니다.</p>
            ) : (
              <ScrollArea className="h-[200px]">
                <ul className="space-y-2">
                  {cart.map((item, idx) => (
                    <li key={idx} className="flex justify-between border-b pb-1">
                      <span>{item.name} × {item.quantity}</span>
                      <span>{(item.price * item.quantity).toLocaleString()}원</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            )}
            <div className="flex justify-between mt-4 font-semibold text-lg">
              <span>총 결제금액</span>
              <span>{totalPrice.toLocaleString()}원</span>
            </div>
          </CardContent>
        </Card>

        {/* 결제 버튼 */}
        <div className="flex justify-center gap-6">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-36 text-base flex gap-2">
                <CreditCard className="w-5 h-5" />
                카드 결제
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>카드 결제를 진행하시겠습니까?</DialogTitle>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => handlePayment("카드")}>결제 완료</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-36 text-base flex gap-2">
                <Wallet className="w-5 h-5" />
                현금 결제
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>현금 결제를 진행하시겠습니까?</DialogTitle>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => handlePayment("현금")}>결제 완료</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
