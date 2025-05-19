'use client'

import { useState, useEffect, useRef } from 'react'
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
    Layers,
    AlertCircle,
    History
} from 'lucide-react'
import { useStore } from '@/contexts/store-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import AIPrediction from '@/components/AIPrediction'
import AIHistoryCard from '@/components/AIHistoryCard'

export default function AIOrderPage() {
    const router = useRouter()
    const { toast } = useToast()
    const { selectedStore, setSelectedStore, stores, hasStores } = useStore()

    const [loading, setLoading] = useState(false)
    const [threshold, setThreshold] = useState(70)
    const [autoOrder, setAutoOrder] = useState(false)
    const [notificationEnabled, setNotificationEnabled] = useState(true)
    const [aiTrigger, setAiTrigger] = useState(0)
    const [refreshTrigger, setRefreshTrigger] = useState(false)
    const [selectedItems, setSelectedItems] = useState([])
    const aiPredictionRef = useRef(null)

    // 스토어 통계 상태 추가
    const [storeStats, setStoreStats] = useState({
        avgOrderCycle: 0,
        avgMonthlyOrderAmount: 0,
        inventoryTurnover: 0,
        outOfStockRate: 0,
        isLoading: false
    })

    // 스토어가 변경될 때마다 통계 데이터 가져오기
    useEffect(() => {
        if (selectedStore?.id) {
            fetchStoreStats(selectedStore.id);
        }
    }, [selectedStore]);

    // 스토어 통계 데이터 가져오기
    const fetchStoreStats = async (storeId) => {
        setStoreStats(prev => ({ ...prev, isLoading: true }));
        try {
            const response = await fetch(`/api/stores/stats?storeId=${storeId}`);
            
            if (!response.ok) {
                throw new Error('통계 데이터를 가져오는데 실패했습니다.');
            }
            
            const data = await response.json();
            
            if (data.success) {
                setStoreStats({
                    avgOrderCycle: data.data.avgOrderCycle,
                    avgMonthlyOrderAmount: data.data.avgMonthlyOrderAmount,
                    inventoryTurnover: data.data.inventoryTurnover,
                    outOfStockRate: data.data.outOfStockRate,
                    isLoading: false
                });
            }
        } catch (error) {
            console.error("통계 데이터 로딩 오류:", error);
            toast({
                title: "통계 데이터 로딩 오류",
                description: error.message,
                variant: "destructive"
            });
            setStoreStats(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleThresholdChange = (value) => {
        setThreshold(value[0])
    }

    const generateAIPrediction = () => {
        setLoading(true)
        // AI 트리거 증가 (컴포넌트 재분석 트리거)
        setAiTrigger(prev => prev + 1)
    }

    const toggleAutoOrder = () => {
        setAutoOrder(!autoOrder)

        toast({
            title: !autoOrder ? "자동 장바구니 활성화" : "자동 장바구니 비활성화",
            description: !autoOrder
                ? "예측분석이 완료되면 자동으로 장바구니에 추가됩니다."
                : "자동 장바구니가 중지되었습니다.",
        })
    }

    const handleStoreChange = (value) => {
        setSelectedStore(prev => {
            if (prev?.id !== value) {
                return stores.find(store => store.id === value)
            }
            return prev
        })
    }

    // 히스토리 페이지로 이동하기
    const goToHistoryPage = () => {
        router.push('/order/ai/history')
    }


    // AI Prediction 완료 핸들러 추가
    const handleAIPredictionComplete = async (recommendedItems) => {
        // 자동 장바구니 기능이 활성화된 경우 상품을 자동으로 장바구니에 추가
        if (autoOrder && Array.isArray(recommendedItems) && recommendedItems.length > 0) {
            const addPromises = recommendedItems.map(async (product) => {
                try {
                    const response = await fetch('/api/cart', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            storeId: selectedStore.id,
                            productId: product.id,  // 데이터베이스 상의 상품 ID 사용
                            quantity: product.req_amount || 1  // AI 추천 수량 사용
                        })
                    });
    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || `상품 추가 실패: ${product.name}`);
                    }
    
                    return await response.json();
                } catch (error) {
                    console.error("장바구니 추가 오류:", error);
                    return null;
                }
            });

            try{
                const results = await Promise.all(addPromises);
                const successfulAdds = results.filter(result => result !== null);
                
                if (successfulAdds.length > 0) {
                    toast({
                        title: "[자동모드] 장바구니에 추가 완료",
                    description: `${successfulAdds.length}개의 상품이 장바구니에 추가되었습니다.`,
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
                        title: "[자동모드] 장바구니 추가 실패",
                        description: "장바구니에 추가할 상품이 없습니다.",
                    })
                } 
            } catch (error) {
                console.error("장바구니 추가 오류:", error);toast({
                        title: "[자동모드] 장바구니에 추가 완료",
                    title: "[자동모드] 장바구니 추가 오류",
                    description: error.message,
                    variant: "destructive"
                })
            }
        }
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
                                disabled={loading || selectedStore === null}
                            >
                                {loading ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                ) : (
                                    <div className="relative">
                                        <Brain className="h-4 w-4 text-primary" />
                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                    </div>
                                )}
                                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-medium">
                                    AI 분석시작
                                </span>
                            </Button>
                            {/* <Button
                                className="gap-2"
                                onClick={handleAddToCart}
                                disabled={loading || selectedItems.length === 0}
                            >
                                <ShoppingCart className="h-4 w-4" />
                                {selectedItems.length > 0
                                    ? `선택한 ${selectedItems.length}개 담기`
                                    : '장바구니에 담기'}
                            </Button> */}
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
                                    <Select defaultValue={selectedStore?.id} onValueChange={handleStoreChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="스토어를 선택하세요" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.isArray(stores) && stores.length > 0 ? (
                                                stores.map(store => (
                                                    <SelectItem key={store.id} value={store.id}>
                                                        {store.name}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="demo" disabled>스토어가 없습니다</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>

                            {/* AI 히스토리 카드 */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <History className="h-4 w-4" />
                                            AI 히스토리
                                        </CardTitle>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 gap-1"
                                            onClick={goToHistoryPage}
                                        >
                                            <History className="h-3.5 w-3.5" />
                                            히스토리 페이지
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <AIHistoryCard 
                                        selectedStoreId={selectedStore?.id}
                                    />
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
                                            defaultValue={[70]}
                                            max={100}
                                            step={1}
                                            onValueChange={handleThresholdChange}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            더 높은 값은 비교적 더 정확한 예측을, 낮은 값은 추상적인 예측을 제공합니다.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between space-x-2">
                                            <Label htmlFor="auto-order">자동 장바구니</Label>
                                            <Switch
                                                id="auto-order"
                                                checked={autoOrder}
                                                onCheckedChange={toggleAutoOrder}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            예측분석이 완료되면 자동으로 장바구니에 추가됩니다.
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
                                            {storeStats.isLoading ? (
                                                <span className="w-16 h-5 bg-gray-200 animate-pulse rounded"></span>
                                            ) : (
                                                <span className="font-medium">{storeStats.avgOrderCycle}일</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">월 평균 발주액</span>
                                            {storeStats.isLoading ? (
                                                <span className="w-24 h-5 bg-gray-200 animate-pulse rounded"></span>
                                            ) : (
                                                <span className="font-medium">{storeStats.avgMonthlyOrderAmount.toLocaleString()}원</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">재고 회전율</span>
                                            {storeStats.isLoading ? (
                                                <span className="w-16 h-5 bg-gray-200 animate-pulse rounded"></span>
                                            ) : (
                                                <span className="font-medium">{storeStats.inventoryTurnover}회/월</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">상품 품절률</span>
                                            {storeStats.isLoading ? (
                                                <span className="w-16 h-5 bg-gray-200 animate-pulse rounded"></span>
                                            ) : (
                                                <span className={`font-medium ${storeStats.outOfStockRate > 5 ? 'text-red-600' : storeStats.outOfStockRate > 2 ? 'text-amber-600' : 'text-green-600'}`}>
                                                    {storeStats.outOfStockRate}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* 우측 메인 컨텐츠 - AI 추천만 남김 */}
                    <div className="col-span-12 md:col-span-9">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                <h2 className="font-medium">AI 추천</h2>
                            </div>
                      </div>

                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle>AI 발주 추천</CardTitle>
                                    {autoOrder && (
                                        <Badge variant="outline" className="flex items-center gap-1 border-green-500 text-green-600">
                                            <Zap className="h-3 w-3" />
                                            자동 장바구니 활성화
                                        </Badge>
                                    )}
                                </div>
                                <CardDescription>
                                    판매 패턴, 재고 수준, 시즌 요인을 분석하여 최적의 발주량을 추천합니다.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between mb-8">
                                    <Button
                                        variant="outline"
                                        className="gap-2 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 hover:from-purple-100 hover:via-blue-100 hover:to-indigo-100 transition-all duration-300 shadow-sm hover:shadow-md border-purple-200/50 hover:border-purple-300/50"
                                        onClick={generateAIPrediction}
                                        disabled={loading || selectedStore === null}
                                    >
                                        {loading ? (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        ) : (
                                            <div className="relative">
                                                <Brain className="h-4 w-4 text-primary" />
                                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                            </div>
                                        )}
                                        <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-medium">
                                            AI 분석시작
                                        </span>
                                    </Button>
                                    {!selectedStore && (
                                        <Badge variant="outline" className="flex items-center gap-1 border-red-500 text-red-600">
                                            <AlertCircle className="h-3 w-3" />
                                            스토어를 선택해주세요.
                                        </Badge>
                                    )}
                                </div>

                                {/* 채팅 답변 세션 */}
                                <div className="space-y-4">
                                    {/* ai websocket client component */}
                                    <AIPrediction 
                                        ref={aiPredictionRef}
                                        trigger={aiTrigger} 
                                        setLoading={setLoading}
                                        selectedStoreId={selectedStore?.id}
                                        onComplete={handleAIPredictionComplete}
                                        confidenceThreshold={threshold}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t pt-6">
                                <div className="text-sm text-muted-foreground">
                                    마지막 AI 분석: 오늘 13:45
                                </div>
                                {/* <Button
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
                                </Button> */}
                            </CardFooter>
                        </Card>

                        {/* 알림 카드 */}
                        <Card className="bg-blue-50 border-blue-200 mt-6">
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
                    </div>
                </div>
            </div>
        </div>
    )
}
