'use client';

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
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
import { CreditCard, LineChart, ShoppingCart, DollarSign, ShoppingBag, Users, Percent, ArrowUpRight, ArrowDownRight, Trophy, Calendar, Package, AlertTriangle, AlertCircle, Database } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { useStore } from '@/contexts/store-context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RefreshCw } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter, useSearchParams } from 'next/navigation';

// Import ApexCharts with dynamic import and SSR disabled to prevent hydration errors
const Chart = dynamic(() => import('react-apexcharts'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>
  )
})

export function SalesCharts() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { selectedStore } = useStore()
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState(searchParams.get('timeRange') || 'week')
  const [dbConnected, setDbConnected] = useState(true)
  const [salesData, setSalesData] = useState({
    totalSales: 0,
    paymentMethods: [],
    products: [],
    hourlySales: [],
    dailySales: [],
    categories: [],
    topProducts: []
  })
  const [inventoryData, setInventoryData] = useState([])
  const [loadingInventory, setLoadingInventory] = useState(false)

  const checkDbStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/db-status');
      const data = await response.json();
      
      setDbConnected(data.status === 'connected');
      return data.status === 'connected';
    } catch (error) {
      console.error("Failed to check database status:", error);
      setDbConnected(false);
      return false;
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    if (!selectedStore) return;
    
    // Check database connection first
    const isConnected = await checkDbStatus();
    if (!isConnected) {
      toast({
        title: "데이터베이스 연결 오류",
        description: "데이터베이스 서버에 연결할 수 없습니다.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/sales?storeId=${selectedStore.id}&timeRange=${timeRange}`)
      const data = await response.json()
      
      setSalesData(data)
      router.push(`?timeRange=${timeRange}`)
      
      toast({
        title: "데이터가 업데이트되었습니다",
        description: `${getTimeRangeLabel(timeRange)} 기간의 데이터로 갱신되었습니다.`,
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
  }, [toast, selectedStore, timeRange, checkDbStatus]);

  // Fetch inventory data
  const fetchInventoryData = useCallback(async () => {
    if (!selectedStore) return;
    
    // Check database connection first
    const isConnected = await checkDbStatus();
    if (!isConnected) return;
    
    setLoadingInventory(true);
    try {
      const response = await fetch(`/api/inventory?storeId=${selectedStore.id}`)
      const data = await response.json()
      
      setInventoryData(data.products || [])
    } catch (error) {
      console.error('Error fetching inventory data:', error)
      toast({
        title: "재고 데이터 불러오기 실패",
        description: "재고 데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive"
      })
    } finally {
      setLoadingInventory(false)
    }
  }, [toast, selectedStore, checkDbStatus]);

  // Check database status on initial load
  useEffect(() => {
    checkDbStatus();
  }, [checkDbStatus]);

  // Fetch data when store or time range changes
  useEffect(() => {
    if (selectedStore) {
      handleRefresh();
      fetchInventoryData();
    }
  }, [selectedStore, timeRange, handleRefresh, fetchInventoryData]);

  // 시간 범위를 변경하는 핸들러 함수
  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange)
  }

  // 시간 범위 레이블을 반환하는 함수
  function getTimeRangeLabel(range) {
    switch(range) {
      case 'day': return '오늘';
      case 'week': return '이번 주';
      case 'month': return '이번 달';
      case 'quarter': return '이번 분기';
      case 'year': return '올해';
      default: return '이번 주';
    }
  }

  return (
    <div className="space-y-6">
      {/* Database connection alert */}
      {!dbConnected && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            <Database className="h-4 w-4" /> 데이터베이스 연결 오류
          </AlertTitle>
          <AlertDescription>
            <p>데이터베이스 서버에 연결할 수 없습니다. 아래 사항을 확인해주세요:</p>
            <ul className="list-disc pl-5 mt-2">
              <li>데이터베이스 서버가 실행 중인지 확인하세요.</li>
              <li>PostgreSQL 서비스가 포트 5432에서 실행 중인지 확인하세요.</li>
              <li>환경 변수 설정을 확인하세요.</li>
            </ul>
            <div className="mt-3">
              <Button 
                size="sm" 
                onClick={checkDbStatus}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                다시 연결 시도
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* 주요 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              총 매출
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                `${salesData?.totalSales?.toLocaleString() || '0'}원`
              )}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">0% 증가</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              총 판매량
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                `${salesData?.products?.reduce((sum, p) => sum + (p.quantity || 0), 0).toLocaleString() || '0'}개`
              )}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">0% 증가</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              고객 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                `${salesData?.paymentMethods?.reduce((sum, m) => sum + (m.count || 0), 0).toLocaleString() || '0'}명`
              )}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">0% 증가</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Percent className="h-4 w-4 text-primary" />
              반품률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                `${salesData?.returnRate || '0'}%`
              )}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowDownRight className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">0% 감소</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 시간 범위 제어 */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            기간 범위 선택
          </CardTitle>
          <CardDescription>
            데이터를 조회할 기간을 선택하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'day', label: '오늘' },
              { value: 'week', label: '이번 주' },
              { value: 'month', label: '이번 달' },
              { value: 'quarter', label: '이번 분기' },
              { value: 'year', label: '올해' }
            ].map((range) => (
              <Button
                key={range.value}
                variant={timeRange === range.value ? "default" : "outline"}
                onClick={() => handleTimeRangeChange(range.value)}
              >
                {range.label}
              </Button>
            ))}
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              새로고침
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 결제 수단별 매출 */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            결제 수단별 매출
          </CardTitle>
          <CardDescription>
            결제 수단별 매출 비율과 추이
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-[300px] bg-muted animate-pulse rounded" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Chart
                  options={{
                    chart: {
                      id: "payment-methods",
                      toolbar: {
                        show: false,
                      },
                    },
                    colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
                    plotOptions: {
                      pie: {
                        donut: {
                          size: '70%',
                        },
                        dataLabels: {
                          offset: 0,
                        },
                      }
                    },
                    labels: salesData.paymentMethods.map(method => method.method),
                    dataLabels: {
                      enabled: true,
                      formatter: function(val) {
                        return val.toFixed(1) + '%';
                      },
                      style: {
                        colors: ['#64748b'],
                        fontFamily: 'inherit',
                      }
                    },
                    legend: {
                      position: 'bottom',
                      fontFamily: 'inherit',
                    },
                    tooltip: {
                      theme: 'dark',
                      y: {
                        formatter: function(value) {
                          return value.toLocaleString() + '원';
                        }
                      }
                    }
                  }}
                  series={salesData.paymentMethods.map(method => method.amount)}
                  type="donut"
                  height={300}
                />
              </div>
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>결제 수단</TableHead>
                      <TableHead className="text-right">매출</TableHead>
                      <TableHead className="text-right">비율</TableHead>
                      <TableHead className="text-right">거래 건수</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData.paymentMethods.map((method) => (
                      <TableRow key={method.method}>
                        <TableCell className="font-medium">{method.method}</TableCell>
                        <TableCell className="text-right">
                          {method.amount.toLocaleString()}원
                        </TableCell>
                        <TableCell className="text-right">
                          {((method.amount / salesData.totalSales) * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">{method.count}건</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 매출 추이 */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-primary" />
            매출 추이
          </CardTitle>
          <CardDescription>
            시간대별, 요일별 매출 현황
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-[300px] bg-muted animate-pulse rounded" />
              <div className="h-[300px] bg-muted animate-pulse rounded" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Chart
                  options={{
                    chart: {
                      id: "sales-by-hour",
                      toolbar: {
                        show: false,
                      },
                    },
                    colors: ['#3b82f6'],
                    plotOptions: {
                      bar: {
                        borderRadius: 4,
                        columnWidth: '70%',
                      }
                    },
                    dataLabels: {
                      enabled: false,
                    },
                    xaxis: {
                      categories: salesData.hourlySales.map(sale => sale.hour),
                      labels: {
                        style: {
                          colors: '#64748b',
                          fontFamily: 'inherit',
                        },
                      },
                    },
                    yaxis: {
                      labels: {
                        style: {
                          colors: '#64748b',
                          fontFamily: 'inherit',
                        },
                        formatter: function(value) {
                          return value.toLocaleString() + '원';
                        }
                      },
                    },
                    tooltip: {
                      theme: 'dark',
                      y: {
                        formatter: function(value) {
                          return value.toLocaleString() + '원';
                        }
                      }
                    }
                  }}
                  series={[{
                    name: '매출',
                    data: salesData.hourlySales.map(sale => sale.amount)
                  }]}
                  type="bar"
                  height={300}
                />
              </div>
              <div>
                <Chart
                  options={{
                    chart: {
                      id: "sales-by-day",
                      toolbar: {
                        show: false,
                      },
                    },
                    colors: ['#10b981'],
                    plotOptions: {
                      bar: {
                        borderRadius: 4,
                        columnWidth: '70%',
                      }
                    },
                    dataLabels: {
                      enabled: false,
                    },
                    xaxis: {
                      categories: salesData.dailySales.map(sale => sale.day),
                      labels: {
                        style: {
                          colors: '#64748b',
                          fontFamily: 'inherit',
                        },
                      },
                    },
                    yaxis: {
                      labels: {
                        style: {
                          colors: '#64748b',
                          fontFamily: 'inherit',
                        },
                        formatter: function(value) {
                          return value.toLocaleString() + '원';
                        }
                      },
                    },
                    tooltip: {
                      theme: 'dark',
                      y: {
                        formatter: function(value) {
                          return value.toLocaleString() + '원';
                        }
                      }
                    }
                  }}
                  series={[{
                    name: '매출',
                    data: salesData.dailySales.map(sale => sale.amount)
                  }]}
                  type="bar"
                  height={300}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 카테고리별 매출 */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            카테고리별 매출
          </CardTitle>
          <CardDescription>
            카테고리별 매출 비율과 상위 판매품목
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-[300px] bg-muted animate-pulse rounded" />
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Chart
                  options={{
                    chart: {
                      id: "category-sales",
                      toolbar: {
                        show: false,
                      },
                    },
                    colors: ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'],
                    plotOptions: {
                      bar: {
                        horizontal: true,
                        dataLabels: {
                          position: 'top',
                        },
                        borderRadius: 4,
                      }
                    },
                    dataLabels: {
                      enabled: true,
                      offsetX: 22,
                      style: {
                        fontSize: '12px',
                        colors: ['#64748b']
                      }
                    },
                    xaxis: {
                      categories: salesData.categories?.map(c => c.name) || [],
                      labels: {
                        style: {
                          colors: '#64748b',
                          fontFamily: 'inherit',
                        },
                        formatter: function(value) {
                          return value.toLocaleString() + '원';
                        }
                      },
                    },
                    yaxis: {
                      labels: {
                        style: {
                          colors: '#64748b',
                          fontFamily: 'inherit',
                        },
                      },
                    },
                    tooltip: {
                      theme: 'dark',
                      y: {
                        formatter: function(value) {
                          return value.toLocaleString() + '원';
                        }
                      }
                    }
                  }}
                  series={[{
                    name: '매출',
                    data: salesData.categories?.map(c => c.totalAmount) || []
                  }]}
                  type="bar"
                  height={300}
                />
              </div>
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>카테고리</TableHead>
                      <TableHead className="text-right">매출</TableHead>
                      <TableHead className="text-right">비율</TableHead>
                      <TableHead className="text-right">판매량</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData.categories?.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-right">
                          {category.totalAmount.toLocaleString()}원
                        </TableCell>
                        <TableCell className="text-right">
                          {((category.totalAmount / salesData.totalSales) * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">{category.quantity}개</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 상위 10위 판매품목 */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            상위 10위 판매품목
          </CardTitle>
          <CardDescription>
            가장 많이 판매된 상품 순위
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>순위</TableHead>
                  <TableHead>상품명</TableHead>
                  <TableHead className="text-right">판매량</TableHead>
                  <TableHead className="text-right">매출</TableHead>
                  <TableHead className="text-right">점유율</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.topProducts?.slice(0, 10).map((product, index) => (
                  <TableRow key={product.productId}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">{product.productName}</TableCell>
                    <TableCell className="text-right">{product.quantity}개</TableCell>
                    <TableCell className="text-right">
                      {product.totalAmount.toLocaleString()}원
                    </TableCell>
                    <TableCell className="text-right">
                      {((product.totalAmount / salesData.totalSales) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 재고 현황 */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            재고 현황
          </CardTitle>
          <CardDescription>
            매장의 현재 상품별 재고 상태
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingInventory ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">재고 부족 상품</div>
                    <div className="text-xl font-bold">
                      {inventoryData.filter(item => item.quantity <= item.minStockLevel).length}개
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">재고 주의 상품</div>
                    <div className="text-xl font-bold">
                      {inventoryData.filter(item => 
                        item.quantity > item.minStockLevel && 
                        item.quantity <= item.minStockLevel * 1.5
                      ).length}개
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Package className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">정상 재고 상품</div>
                    <div className="text-xl font-bold">
                      {inventoryData.filter(item => item.quantity > item.minStockLevel * 1.5).length}개
                    </div>
                  </div>
                </div>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>상품명</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead className="text-right">현재 재고</TableHead>
                    <TableHead className="text-right">최소 재고</TableHead>
                    <TableHead className="text-right">상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryData
                    .sort((a, b) => {
                      // 우선 재고 부족 순으로 정렬
                      const aStatus = a.quantity <= a.minStockLevel ? 0 : a.quantity <= a.minStockLevel * 1.5 ? 1 : 2;
                      const bStatus = b.quantity <= b.minStockLevel ? 0 : b.quantity <= b.minStockLevel * 1.5 ? 1 : 2;
                      
                      if (aStatus !== bStatus) return aStatus - bStatus;
                      
                      // 같은 상태일 경우 재고 수량 순으로 정렬
                      return a.quantity - b.quantity;
                    })
                    .slice(0, 10) // 상위 10개만 표시
                    .map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell className="text-right">{product.quantity}개</TableCell>
                        <TableCell className="text-right">{product.minStockLevel}개</TableCell>
                        <TableCell className="text-right">
                          {product.quantity <= product.minStockLevel ? (
                            <Badge variant="destructive">재고 부족</Badge>
                          ) : product.quantity <= product.minStockLevel * 1.5 ? (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">재고 주의</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">정상</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <div className="text-center">
                <Button variant="outline" onClick={fetchInventoryData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  재고 데이터 새로고침
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 