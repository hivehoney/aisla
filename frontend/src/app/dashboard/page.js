'use client'

import { useEffect, useState } from "react"
import {
  Card, CardHeader, CardTitle, CardContent,
} from "@/components/ui/card"
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import {
  PackageSearch, Store, Barcode, ListOrdered, LayoutDashboard, Pencil, Trash2
} from "lucide-react"

export default function DashboardPage() {
  const [products, setProducts] = useState([])
  const [newProduct, setNewProduct] = useState({ id: "", name: "", store: "", barcode: "" })

  useEffect(() => {
    setProducts([
      { id: "001", name: "초코우유", store: "GS25", barcode: "8801234567890" },
      { id: "002", name: "삼각김밥", store: "CU", barcode: "8800000000001" },
      { id: "003", name: "컵라면", store: "세븐일레븐", barcode: "8809876543210" }
    ])
  }, [])

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.store || !newProduct.barcode) return
    const newId = String(products.length + 1).padStart(3, '0')
    setProducts([...products, { ...newProduct, id: newId }])
    setNewProduct({ id: "", name: "", store: "", barcode: "" })
  }

  const handleDelete = (id) => {
    if (confirm("정말로 삭제하시겠습니까?")) {
      setProducts(products.filter(p => p.id !== id))
    }
  }

  const handleUpdate = (id) => {
    const product = products.find(p => p.id === id)
    if (confirm(`상품 "${product.name}" 을 수정하시겠습니까?\n(더미 동작입니다)`)) {
      alert("현재는 수정 기능이 API 없이 연결되어 있지 않습니다.")
    }
  }

  return (
    <div className="min-h-screen px-6 py-16 pt-32 bg-muted/30">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* 헤더 */}
        <div className="text-center space-y-4">
          <Badge variant="outline" className="text-sm px-4 py-1 border-muted-foreground/30">
            Dashboard
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight flex justify-center items-center gap-2">
            <LayoutDashboard className="w-7 h-7 text-primary" />
            상품 재고 현황판
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            실시간으로 수집된 편의점 상품 정보와 바코드 데이터를 한눈에 확인하세요.
          </p>
        </div>

        {/* 등록 버튼 */}
        <div className="flex justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="lg">+ 상품 등록</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>상품 등록</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="상품명"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                />
                <Input
                  placeholder="편의점 이름"
                  value={newProduct.store}
                  onChange={(e) => setNewProduct({ ...newProduct, store: e.target.value })}
                />
                <Input
                  placeholder="바코드 (스캐너 입력 지원)"
                  value={newProduct.barcode}
                  onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddProduct()
                  }}
                />
              </div>
              <DialogFooter className="pt-4">
                <Button onClick={handleAddProduct}>등록하기</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-6 gap-2">
              <PackageSearch className="w-6 h-6 text-primary" />
              <div className="text-2xl font-bold">{products.length}</div>
              <div className="text-sm text-muted-foreground">등록 상품</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-6 gap-2">
              <Store className="w-6 h-6 text-primary" />
              <div className="text-2xl font-bold">
                {new Set(products.map(p => p.store)).size}
              </div>
              <div className="text-sm text-muted-foreground">편의점 수</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-6 gap-2">
              <Barcode className="w-6 h-6 text-primary" />
              <div className="text-2xl font-bold">
                {products.filter(p => p.barcode).length}
              </div>
              <div className="text-sm text-muted-foreground">바코드 등록</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-6 gap-2">
              <ListOrdered className="w-6 h-6 text-primary" />
              <div className="text-2xl font-bold">실시간</div>
              <div className="text-sm text-muted-foreground">동기화 상태</div>
            </CardContent>
          </Card>
        </div>

        {/* 테이블 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <ListOrdered className="w-5 h-5" />
              상품 목록
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="w-full text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">상품 ID</TableHead>
                  <TableHead className="text-center">상품명</TableHead>
                  <TableHead className="text-center">편의점</TableHead>
                  <TableHead className="text-center">바코드</TableHead>
                  <TableHead className="text-center">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-center">{product.id}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="flex items-center gap-1">
                          <PackageSearch className="w-4 h-4 text-muted-foreground" />
                          {product.name || "-"}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Store className="w-3 h-3" />
                          {product.store || "-"}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Barcode className="w-3 h-3" />
                          {product.barcode || "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{product.store}</TableCell>
                    <TableCell className="text-center">{product.barcode || "-"}</TableCell>
                    <TableCell className="flex justify-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleUpdate(product.id)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
