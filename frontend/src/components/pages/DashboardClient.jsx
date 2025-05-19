'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
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
  PackageSearch,
  Store,
  Barcode,
  ListOrdered,
  LayoutDashboard,
  Pencil,
  Trash2,
  Plus,
  TrendingUp,
  BarChart3,
  AlertCircle,
  Bell,
  Clock,
  Settings,
  Filter,
  ChevronDown,
  Check,
  Search,
  ArrowRight,
  Layers,
  Package,
  Zap,
  Brain,
  LineChart,
  ShoppingCart,
  StoreIcon,
  BarChart4,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Users,
  ShoppingBag,
  Percent,
  Activity,
  Calendar,
  RefreshCw,
  Star,
  Zap as ZapIcon,
  CreditCard,
  History
} from 'lucide-react'
import { useStore } from '@/contexts/store-context'
import dynamic from 'next/dynamic'
import { SalesCharts } from '@/components/sales-charts'
import AIHistoryCard from '@/components/AIHistoryCard'
import RecentOrders from '@/components/RecentOrder'
import { useRouter, useSearchParams } from 'next/navigation'

// Import ApexCharts with dynamic import and SSR disabled to prevent hydration errors
const Chart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>
  )
});

export default function DashboardClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const { toast } = useToast()
  const [storeData, setStoreData] = useState([])
  const [products, setProducts] = useState([])
  const [alerts, setAlerts] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState('week')
  const { setSelectedStore, selectedStore, stores } = useStore()
  
  // Store sales data for pie chart
  const [storeSalesData, setStoreSalesData] = useState([])

  // Chart states for various charts
  const [salesChartPeriod, setSalesChartPeriod] = useState('month')
  const [salesData, setSalesData] = useState({
    totalSales: 0,
    paymentMethods: [],
    products: [],
    hourlySales: [],
    dailySales: []
  })

  const handleRefresh = useCallback(async () => {
    if (!selectedStore) return

    setLoading(true)
    try {
      const response = await fetch(`/api/sales?storeId=${selectedStore.id}&timeRange=${timeRange}`)
      const data = await response.json()
      setSalesData(data)
      toast({
        title: "데이터가 업데이트되었습니다",
        description: "모든 통계가 최신 상태로 갱신되었습니다.",
      })
    } catch (error) {
      console.error('Error fetching sales data:', error)
      toast({
        title: "데이터 업데이트 실패",
        description: "데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast, selectedStore, timeRange])

  // Fetch data when store or time range changes
  useEffect(() => {
    handleRefresh()
    fetchStoreSalesData()
  }, [selectedStore, timeRange, handleRefresh])

  useEffect(() => {
    setTimeRange(searchParams.get('timeRange') || 'week')
  }, [searchParams])

  // Fetch store sales data for pie chart
  const fetchStoreSalesData = useCallback(async () => {
    if (!stores || stores.length === 0) return
    
    try {
      // Fetch sales data for all stores
      const storeDataPromises = stores.map(store => 
        fetch(`/api/sales?storeId=${store.id}&timeRange=${timeRange}`)
          .then(res => res.json())
          .then(data => ({
            store: store.name,
            storeId: store.id,
            sales: data.totalSales || 0
          }))
      )
      
      const results = await Promise.all(storeDataPromises)
      setStoreSalesData(results)
    } catch (error) {
      console.error('Error fetching store sales data:', error)
    }
  }, [stores, timeRange])

  const handleStoreChange = (storeId) => {
    if (!storeId) return;

    const store = stores.find(s => String(s.id) === String(storeId));
    if (!store) {
      return;
    }

    setSelectedStore(store);
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 페이지 헤더 */}
      <div className="bg-white border-b">
        <div className="container mx-auto py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">스마트 매장 대시보드</h1>
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  AI 기반 운영 관리
                </Badge>
              </div>
              <p className="text-muted-foreground mt-2">
                실시간 매장 운영 현황과 AI 분석 결과를 한눈에 확인하세요.
              </p>
            </div>
            <div className="flex items-center gap-3">
            
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleRefresh}
                disabled={loading}
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                새로고침
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
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <StoreIcon className="h-4 w-4 text-primary" />
                    스토어 선택
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedStore?.id || ''}
                    onValueChange={handleStoreChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="스토어를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores?.map(store => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* 스토어 매출 비율 */}
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    스토어 매출 비율
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stores && stores.length > 0 && storeSalesData.length > 0 ? (
                    <div className="h-[200px]">
                      {typeof window !== 'undefined' && (
                        <Chart
                          options={{
                            chart: {
                              type: 'pie',
                            },
                            labels: storeSalesData.map(data => data.store),
                            legend: {
                              position: 'bottom',
                              fontSize: '12px',
                            },
                            dataLabels: {
                              enabled: true,
                              formatter: function(val) {
                                return val.toFixed(1) + '%';
                              },
                            },
                            tooltip: {
                              y: {
                                formatter: function(value, { series, seriesIndex, dataPointIndex, w }) {
                                  return storeSalesData[seriesIndex].sales.toLocaleString() + '원';
                                }
                              }
                            },
                            colors: [
                              '#0ea5e9', '#f59e0b', '#10b981', '#6366f1',
                              '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6'
                            ],
                            responsive: [{
                              breakpoint: 480,
                              options: {
                                chart: {
                                  height: 200
                                },
                                legend: {
                                  position: 'bottom'
                                }
                              }
                            }]
                          }}
                          series={storeSalesData.map(data => data.sales)}
                          type="pie"
                          height="100%"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                      {loading ? (
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                      ) : (
                        "데이터가 없습니다"
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI 분석 히스토리 */}
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
                      onClick={() => router.push('/order/ai')}
                    >
                      히스토리 페이지
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <AIHistoryCard
                    selectedStoreId={selectedStore?.id}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 우측 메인 컨텐츠 */}
          <div className="col-span-12 md:col-span-9">
            <div className="space-y-6">
              {/* 매출 차트 */}
              <SalesCharts />

              {/* 로봇 운영 현황 */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ZapIcon className="h-5 w-5 text-primary" />
                    로봇 운영 현황
                  </CardTitle>
                  <CardDescription>
                    각 매장의 로봇 운영 상태와 배터리 현황
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 rounded-lg bg-muted/50">
                          <div className="h-6 w-32 bg-muted animate-pulse rounded mb-4" />
                          <div className="space-y-2">
                            {[1, 2].map((j) => (
                              <div key={j} className="h-12 bg-muted animate-pulse rounded" />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {storeData.map((store) => (
                        store.robots?.length > 0 && (
                          <div key={store.id} className="p-4 rounded-lg bg-muted/50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{store.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {store.robots.length}대 운영중
                              </span>
                            </div>
                            <div className="space-y-2">
                              {store.robots.map((robot) => (
                                <div key={robot.id} className="flex items-center justify-between p-2 rounded bg-white">
                                  <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${robot.status === 'active' ? 'bg-green-500' :
                                      robot.status === 'idle' ? 'bg-blue-500' :
                                        'bg-red-500'
                                      }`} />
                                    <span className="text-sm">{robot.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                      {robot.battery}%
                                    </span>
                                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${robot.battery > 80 ? 'bg-green-500' :
                                          robot.battery > 50 ? 'bg-blue-500' :
                                            robot.battery > 20 ? 'bg-amber-500' :
                                              'bg-red-500'
                                          }`}
                                        style={{ width: `${robot.battery}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 최근 주문 내역 */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    최근 주문 내역
                  </CardTitle>
                  <CardDescription>
                    최근 주문 내역을 확인하세요.
                  </CardDescription>
                </CardHeader>
                <CardContent> 
                  <RecentOrders />
                </CardContent>
              </Card>
              
              
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
