'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { 
  Sparkles, 
  Robot, 
  Brain, 
  LucideLineChart, 
  ShoppingCart, 
  ChevronDown, 
  Check, 
  Bell, 
  Plus, 
  Filter, 
  Settings, 
  Clock, 
  Package, 
  Zap, 
  ArrowRight, 
  Store, 
  BarChart4, 
  Search,
  Layers 
} from 'lucide-react'
import { useStore } from '@/contexts/store-context'

export default function AIOrderPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { selectedStore, stores } = useStore()
  
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('recommend')
  const [threshold, setThreshold] = useState(10)
  const [autoOrder, setAutoOrder] = useState(false)
  const [notificationEnabled, setNotificationEnabled] = useState(true)
  
  // Dummy data
  const dummyRecommendations = [
    { id: '1', name: '농심 신라면 120g', quantity: 24, currentStock: 5, reason: '빠른 소진율', confidence: 92 },
    { id: '2', name: '서울우유 1000ml', quantity: 15, currentStock: 3, reason: '재고 부족', confidence: 88 },
    { id: '3', name: '롯데 칠성사이다 1.5L', quantity: 12, currentStock: 4, reason: '정기 발주', confidence: 85 },
    { id: '4', name: '코카콜라 500ml', quantity: 20, currentStock: 6, reason: '수요 증가', confidence: 90 },
    { id: '5', name: '하리보 골드베렌 100g', quantity: 8, currentStock: 2, reason: '재고 부족', confidence: 78 },
    { id: '6', name: '오리온 초코파이 12개입', quantity: 10, currentStock: 3, reason: '정기 발주', confidence: 82 },
    { id: '7', name: '맥스봉 군옥수수', quantity: 15, currentStock: 0, reason: '품절 임박', confidence: 95 },
  ]
  
  const dummyHistory = [
    { id: '101', date: '2023-10-25', items: 12, status: '완료', total: 157800 },
    { id: '102', date: '2023-10-18', items: 8, status: '완료', total: 96500 },
    { id: '103', date: '2023-10-11', items: 15, status: '완료', total: 203400 },
  ]
  
  const dummyTrends = [
    { category: '음료', trend: '증가', percent: 12, products: ['코카콜라', '칠성사이다', '아이시스 2L'] },
    { category: '과자', trend: '안정', percent: 2, products: ['새우깡', '포카칩', '오감자'] },
    { category: '라면', trend: '증가', percent: 8, products: ['신라면', '진라면', '안성탕면'] },
    { category: '아이스크림', trend: '감소', percent: -5, products: ['메로나', '비비빅', '슈퍼콘'] },
  ]
  
  const [recommendations, setRecommendations] = useState(dummyRecommendations)
  const [selectedItems, setSelectedItems] = useState([])
  
  const handleSelectAll = () => {
    if (selectedItems.length === recommendations.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(recommendations.map(item => item.id))
    }
  }
  
  const handleSelectItem = (id) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id)
      } else {
        return [...prev, id]
      }
    })
  }
  
  const handleThresholdChange = (value) => {
    setThreshold(value[0])
    
    // Simulate filtering based on threshold
    setTimeout(() => {
      if (value[0] <= 5) {
        setRecommendations(dummyRecommendations)
      } else if (value[0] <= 15) {
        setRecommendations(dummyRecommendations.filter(item => item.confidence > 80))
      } else {
        setRecommendations(dummyRecommendations.filter(item => item.confidence > 90))
      }
    }, 300)
  }
  
  const handleAddToCart = () => {
    setLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      const itemCount = selectedItems.length
      
      if (itemCount > 0) {
        toast({
          title: "장바구니에 추가됨",
          description: `${itemCount}개 상품이 장바구니에 추가되었습니다.`,
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
      } else {
        toast({
          title: "선택된 상품 없음",
          description: "장바구니에 추가할 상품을 선택해주세요.",
          variant: "destructive"
        })
      }
      
      setLoading(false)
    }, 1500)
  }
  
  const generateAIPrediction = () => {
    setLoading(true)
    
    // Simulate AI processing
    setTimeout(() => {
      toast({
        title: "AI 분석 완료",
        description: "최적의 발주 추천이 업데이트되었습니다.",
      })
      
      // Shuffle and update recommendations for visual effect
      const shuffled = [...dummyRecommendations]
        .sort(() => 0.5 - Math.random())
        .map(item => ({
          ...item,
          quantity: Math.floor(Math.random() * 20) + 5,
          confidence: Math.floor(Math.random() * 15) + 80
        }))
      
      setRecommendations(shuffled)
      setLoading(false)
    }, 2000)
  }
  
  const toggleAutoOrder = () => {
    setAutoOrder(!autoOrder)
    
    toast({
      title: !autoOrder ? "자동 발주 활성화" : "자동 발주 비활성화",
      description: !autoOrder 
        ? "재고가 부족할 때 자동으로 발주가 진행됩니다." 
        : "자동 발주가 중지되었습니다.",
    })
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 페이지 헤더 */}
      <div className="bg-white border-b">
        <div className="container mx-auto py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">AI 발주</h1>
                <Badge className="bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 text-white border-none">
                  NEW
                </Badge>
              </div>
              <p className="text-muted-foreground mt-2">
                인공지능이 분석한 매장 데이터를 기반으로 최적의 발주를 추천해드립니다.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={generateAIPrediction}
                disabled={loading}
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <Brain className="h-4 w-4" />
                )}
                AI 재분석
              </Button>
              <Button 
                className="gap-2"
                onClick={handleAddToCart}
                disabled={loading || selectedItems.length === 0}
              >
                <ShoppingCart className="h-4 w-4" />
                {selectedItems.length > 0 
                  ? `선택한 ${selectedItems.length}개 담기` 
                  : '장바구니에 담기'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 메인 컨텐츠 */}
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* 좌측 설정 패널 */}
          <div className="col-span-12 md:col-span-3">
            <div className="space-y-6">
              {/* 스토어 선택 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    스토어 선택
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select defaultValue={selectedStore?.id}>
                    <SelectTrigger>
                      <SelectValue placeholder="스토어를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores?.map(store => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      )) || (
                        <SelectItem value="demo">데모 스토어</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
              
              {/* AI 설정 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    AI 설정
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="ai-threshold">신뢰도 임계값 ({threshold}%)</Label>
                    </div>
                    <Slider 
                      id="ai-threshold" 
                      defaultValue={[10]} 
                      max={20} 
                      step={1}
                      onValueChange={handleThresholdChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      더 높은 값은 더 정확한 예측을, 낮은 값은 더 많은 추천 결과를 제공합니다.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="auto-order">자동 발주</Label>
                      <Switch 
                        id="auto-order" 
                        checked={autoOrder}
                        onCheckedChange={toggleAutoOrder}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      스토어의 재고가 임계값 이하로 내려가면 자동으로 발주합니다.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="notifications">발주 알림</Label>
                      <Switch
                        id="notifications"
                        checked={notificationEnabled}
                        onCheckedChange={() => setNotificationEnabled(!notificationEnabled)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      AI가 발주를 추천할 때 알림을 받습니다.
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* 통계 요약 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart4 className="h-4 w-4" />
                    통계 요약
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">평균 발주 주기</span>
                      <span className="font-medium">7.2일</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">월 평균 발주액</span>
                      <span className="font-medium">842,500원</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">재고 회전율</span>
                      <span className="font-medium">4.3회/월</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">상품 품절률</span>
                      <span className="font-medium text-amber-600">3.2%</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full">
                      상세 보고서
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* 우측 메인 컨텐츠 */}
          <div className="col-span-12 md:col-span-9">
            <Tabs defaultValue="recommend" value={activeTab} onValueChange={setActiveTab}>
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="recommend" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    AI 추천
                  </TabsTrigger>
                  <TabsTrigger value="trends" className="flex items-center gap-2">
                    <LucideLineChart className="h-4 w-4" />
                    판매 추세
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    AI 발주 내역
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Filter className="h-4 w-4" />
                        필터
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Check className="h-4 w-4 mr-2" />
                        <span>모든 카테고리</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>음료</DropdownMenuItem>
                      <DropdownMenuItem>과자/스낵</DropdownMenuItem>
                      <DropdownMenuItem>라면/가공식품</DropdownMenuItem>
                      <DropdownMenuItem>생활용품</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input placeholder="검색" className="w-[200px] pl-9" />
                  </div>
                </div>
              </div>
              
              <TabsContent value="recommend" className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle>AI 발주 추천</CardTitle>
                      {autoOrder && (
                        <Badge variant="outline" className="flex items-center gap-1 border-green-500 text-green-600">
                          <Zap className="h-3 w-3" />
                          자동 발주 활성화
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      판매 패턴, 재고 수준, 시즌 요인을 분석하여 최적의 발주량을 추천합니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleSelectAll}
                      >
                        {selectedItems.length === recommendations.length 
                          ? '전체 선택 해제' 
                          : '전체 선택'}
                      </Button>
                      
                      <div className="text-sm text-muted-foreground">
                        총 {recommendations.length}개 상품 중 {selectedItems.length}개 선택됨
                      </div>
                    </div>
                    
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40px]">선택</TableHead>
                            <TableHead>상품명</TableHead>
                            <TableHead className="text-center">발주 추천</TableHead>
                            <TableHead className="text-center">현재고</TableHead>
                            <TableHead className="text-center">추천 이유</TableHead>
                            <TableHead className="text-center">신뢰도</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recommendations.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="h-24 text-center">
                                추천 상품이 없습니다. 기준을 낮추고 다시 시도해보세요.
                              </TableCell>
                            </TableRow>
                          ) : (
                            recommendations.map((item) => (
                              <TableRow key={item.id} className={item.currentStock === 0 ? 'bg-red-50' : ''}>
                                <TableCell>
                                  <input
                                    type="checkbox"
                                    checked={selectedItems.includes(item.id)}
                                    onChange={() => handleSelectItem(item.id)}
                                    className="h-4 w-4 rounded border-gray-300"
                                  />
                                </TableCell>
                                <TableCell className="font-medium flex items-center gap-2">
                                  {item.name}
                                  {item.currentStock === 0 && (
                                    <Badge variant="destructive" className="text-[10px]">품절임박</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">{item.quantity}개</TableCell>
                                <TableCell className={`text-center ${item.currentStock < 5 ? 'text-red-600 font-medium' : ''}`}>
                                  {item.currentStock}개
                                </TableCell>
                                <TableCell className="text-center">{item.reason}</TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-center gap-2">
                                    <div 
                                      className={`h-2 w-16 rounded-full overflow-hidden bg-gray-200`}
                                    >
                                      <div 
                                        className={`h-full ${
                                          item.confidence > 90 
                                            ? 'bg-green-500' 
                                            : item.confidence > 80 
                                              ? 'bg-blue-500' 
                                              : 'bg-amber-500'
                                        }`}
                                        style={{ width: `${item.confidence}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm">{item.confidence}%</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-6">
                    <div className="text-sm text-muted-foreground">
                      마지막 AI 분석: 오늘 13:45
                    </div>
                    <Button 
                      onClick={handleAddToCart}
                      disabled={loading || selectedItems.length === 0}
                      className="gap-2"
                    >
                      {loading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      ) : (
                        <ShoppingCart className="h-4 w-4" />
                      )}
                      선택 상품 장바구니 담기
                    </Button>
                  </CardFooter>
                </Card>
                
                {/* 알림 카드 */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Bell className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-blue-800 mb-1">발주 알림</h3>
                        <p className="text-sm text-blue-700">
                          지난 주 대비 음료 카테고리 판매량이 12% 증가했습니다. 
                          주말을 대비해 콜라와 사이다의 추가 발주를 고려해보세요.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="trends">
                <Card>
                  <CardHeader>
                    <CardTitle>판매 추세 분석</CardTitle>
                    <CardDescription>
                      지난 30일간의 판매 데이터를 기반으로 카테고리별 판매 추세를 분석했습니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {dummyTrends.map((trend, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium">{trend.category}</h3>
                            <Badge 
                              variant={
                                trend.trend === '증가' 
                                  ? 'default' 
                                  : trend.trend === '감소' 
                                    ? 'destructive' 
                                    : 'outline'
                              }
                            >
                              {trend.trend === '증가' && '+'}
                              {trend.percent}% {trend.trend}
                            </Badge>
                          </div>
                          <div 
                            className="h-2 w-full rounded-full overflow-hidden bg-gray-200"
                          >
                            <div 
                              className={`h-full ${
                                trend.trend === '증가' 
                                  ? 'bg-green-500' 
                                  : trend.trend === '감소' 
                                    ? 'bg-red-500' 
                                    : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.abs(trend.percent) * 5 + 20}%` }}
                            ></div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {trend.products.map((product, i) => (
                              <Badge key={i} variant="outline" className="bg-white">
                                {product}
                              </Badge>
                            ))}
                            <Button size="sm" variant="ghost" className="h-6 text-xs px-2">
                              <Plus className="h-3 w-3 mr-1" />
                              더 보기
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-6">
                    <Button variant="outline" className="gap-2">
                      <Package className="h-4 w-4" />
                      상품별 분석
                    </Button>
                    <Button className="gap-2">
                      <Layers className="h-4 w-4" />
                      상세 인사이트
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle>AI 발주 내역</CardTitle>
                    <CardDescription>
                      AI가 추천하여 발주된 주문 내역입니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>주문 ID</TableHead>
                          <TableHead>날짜</TableHead>
                          <TableHead className="text-center">상품 수</TableHead>
                          <TableHead className="text-center">상태</TableHead>
                          <TableHead className="text-right">금액</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dummyHistory.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.id}</TableCell>
                            <TableCell>{order.date}</TableCell>
                            <TableCell className="text-center">{order.items}개</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {order.total.toLocaleString()}원
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                상세보기
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
