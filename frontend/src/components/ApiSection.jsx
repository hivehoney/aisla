'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Terminal, Database, Webhook, ChevronRight, LineChart, ShoppingCart, User, Lock, Package, Search, CreditCard, Tag, Clock } from "lucide-react"

export default function ApiSection() {
  const [output, setOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 모의 API 응답 데이터
  const mockResponses = {
    '/api/v1/predict': {
      predictions: [
        { hour: '09:00', demand: 45 },
        { hour: '12:00', demand: 120 },
        { hour: '18:00', demand: 85 }
      ],
      confidence: 0.95
    },
    '/api/v1/inventory': {
      recommendations: {
        restock: ['SKU001', 'SKU003'],
        reduce: ['SKU002'],
      },
      next_order: { date: '2024-03-20', quantity: 150 }
    },
    '/api/v1/analytics': {
      metrics: {
        sales_growth: '+15%',
        inventory_turnover: 4.2,
        stockout_rate: '1.2%'
      }
    },
    '/api/v1/sales/forecast': {
      daily_forecast: [
        { date: '2024-03-18', amount: 580000, growth: '+12%' },
        { date: '2024-03-19', amount: 620000, growth: '+8%' },
        { date: '2024-03-20', amount: 540000, growth: '-5%' }
      ],
      total_forecast: 1740000,
      accuracy: '91%'
    },
    '/api/v1/products/recommend': {
      trending_products: [
        { id: 'SKU123', name: '삼각김밥', score: 0.95 },
        { id: 'SKU456', name: '아메리카노', score: 0.92 },
        { id: 'SKU789', name: '도시락', score: 0.88 }
      ],
      seasonal_products: [
        { id: 'SKU234', name: '아이스크림', score: 0.85 },
        { id: 'SKU567', name: '생수', score: 0.82 }
      ],
      updated_at: new Date().toISOString()
    },
    // 추가된 API 엔드포인트에 대한 모의 응답
    '/api/products': {
      products: [
        { id: '1', name: '삼각김밥 참치', price: 1500, stock: 45, category: '김밥/도시락' },
        { id: '2', name: '삼각김밥 김치', price: 1500, stock: 32, category: '김밥/도시락' },
        { id: '3', name: '아메리카노 ICE', price: 2000, stock: 100, category: '음료' },
        { id: '4', name: '아메리카노 HOT', price: 2000, stock: 100, category: '음료' },
        { id: '5', name: '도시락 제육', price: 5500, stock: 20, category: '김밥/도시락' }
      ],
      total: 5,
      page: 1,
      limit: 10
    },
    '/api/products/[id]': {
      id: '1',
      name: '삼각김밥 참치',
      price: 1500,
      description: '신선한 참치로 만든 삼각김밥입니다.',
      category: '김밥/도시락',
      stock: 45,
      barcode: '8801234567890',
      images: ['https://example.com/images/tuna-gimbap.jpg'],
      nutrition: {
        calories: 210,
        carbs: 38,
        protein: 5,
        fat: 4
      },
      created_at: '2023-11-10T08:00:00Z',
      updated_at: '2023-12-15T09:30:00Z'
    },
    '/api/products/barcode': {
      id: '1',
      name: '삼각김밥 참치',
      price: 1500,
      barcode: '8801234567890',
      stock: 45
    },
    '/api/cart': {
      items: [
        { id: '1', product_id: '1', name: '삼각김밥 참치', quantity: 2, price: 1500, total: 3000 },
        { id: '2', product_id: '3', name: '아메리카노 ICE', quantity: 1, price: 2000, total: 2000 }
      ],
      total_items: 3,
      total_price: 5000
    },
    '/api/orders': {
      orders: [
        { id: '1001', total: 5000, status: '배송완료', created_at: '2023-12-10T14:30:00Z' },
        { id: '1002', total: 8500, status: '배송중', created_at: '2023-12-15T10:15:00Z' }
      ],
      total: 2,
      page: 1,
      limit: 10
    },
    '/api/orders/[id]': {
      id: '1001',
      items: [
        { product_id: '1', name: '삼각김밥 참치', quantity: 2, price: 1500, total: 3000 },
        { product_id: '3', name: '아메리카노 ICE', quantity: 1, price: 2000, total: 2000 }
      ],
      total_items: 3,
      total_price: 5000,
      status: '배송완료',
      shipping_address: '서울시 강남구 역삼동 123-45',
      payment_method: '카드결제',
      created_at: '2023-12-10T14:30:00Z',
      updated_at: '2023-12-12T09:45:00Z'
    },
    '/api/auth/signin': {
      message: '로그인 API 경로입니다. NextAuth를 통해 처리됩니다.'
    },
    '/api/user/nickname': {
      nickname: '사용자1234',
      last_updated: '2023-11-05T08:30:00Z'
    }
  }

  const handleApiCall = async (endpoint) => {
    if (endpoint.path === '/hello') {
      try {
        setIsLoading(true)
        const response = await fetch('http://localhost:8080/hello')
        const data = await response.json()
        setOutput(JSON.stringify(data, null, 2))
      } catch (error) {
        setOutput(JSON.stringify({
          error: "API 연결 실패",
          message: error.message,
          hint: "스프링 부트 서버가 실행 중인지 확인해주세요 (localhost:8080)"
        }, null, 2))
      } finally {
        setIsLoading(false)
      }
      return
    }

    setIsLoading(true)
    
    // Mock API call delay
    setTimeout(() => {
      // 응답 데이터 설정
      if (endpoint.path in mockResponses) {
        setOutput(JSON.stringify(mockResponses[endpoint.path], null, 2))
      } else {
        // 경로 패턴 매칭 (예: [id]가 포함된 경로)
        if (endpoint.path.includes('[id]')) {
          setOutput(JSON.stringify(mockResponses['/api/products/[id]'], null, 2))
        } else {
          setOutput(JSON.stringify({ 
            message: '해당 엔드포인트에 대한 모의 응답이 정의되지 않았습니다.',
            endpoint: endpoint.path,
            method: endpoint.method
          }, null, 2))
        }
      }
      
      setIsLoading(false)
    }, 800) // 0.8초 지연으로 실제 API 호출처럼 느껴지게 함
  }

  return (
    <section className="py-24 bg-zinc-950 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-emerald-400 mb-4">
            <Terminal className="w-5 h-5" />
            <span className="font-mono text-sm">Developer Mode</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">
            API Playground
          </h2>
          <p className="text-zinc-400">
            3조 개발자용 테스트 환경입니다.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {apiEndpoints.map((endpoint, index) => (
            <div key={index} className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  {endpoint.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-xs px-2 py-1 rounded ${
                      endpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {endpoint.method}
                    </span>
                    <span className="text-zinc-500">/</span>
                  </div>
                  <p className="font-mono text-xs text-zinc-400">{endpoint.path}</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400 mb-4">
                {endpoint.description}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full font-mono text-xs bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700 hover:text-zinc-300 transition-all group"
                onClick={() => handleApiCall(endpoint)}
                disabled={isLoading}
              >
                <span className="truncate">
                  {isLoading 
                    ? '연결 중...' 
                    : `$ curl api.aisla.com${endpoint.path}`
                  }
                </span>
              </Button>
            </div>
          ))}
        </div>

        {/* Output Console */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800 bg-zinc-950">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs text-zinc-400">Output</span>
            </div>
            <pre className="p-4 text-sm font-mono overflow-x-auto">
              <code className="text-emerald-400">
                {output || '// API 응답이 여기에 표시됩니다'}
              </code>
            </pre>
          </div>
        </div>

        <div className="mt-12 text-center">
          <a 
            href="/docs" 
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            <span>전체 API 문서 보기</span>
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  )
}

const apiEndpoints = [
  {
    icon: <Terminal className="w-5 h-5 text-emerald-400" />,
    method: "GET",
    path: "/hello",
    description: "스프링 부트 서버와의 연결을 테스트합니다. (localhost:8080)"
  },
  {
    icon: <Clock className="w-5 h-5 text-emerald-400" />,
    method: "GET",
    path: "/api/v1/predict",
    description: "시간대별 수요 예측 데이터를 조회합니다. 상품 ID와 날짜 범위를 지정할 수 있습니다."
  },
  {
    icon: <Database className="w-5 h-5 text-emerald-400" />,
    method: "POST",
    path: "/api/v1/inventory",
    description: "현재 재고 데이터를 기반으로 최적의 발주량을 계산하여 반환합니다."
  },
  {
    icon: <LineChart className="w-5 h-5 text-emerald-400" />,
    method: "GET",
    path: "/api/v1/analytics",
    description: "판매 성장률, 재고 회전율, 재고 부족율 등의 지표를 조회합니다."
  },
  {
    icon: <LineChart className="w-5 h-5 text-emerald-400" />,
    method: "GET",
    path: "/api/v1/sales/forecast",
    description: "향후 3일간의 매출을 예측하고 전년 대비 성장률을 분석합니다."
  },
  {
    icon: <ShoppingCart className="w-5 h-5 text-emerald-400" />,
    method: "GET",
    path: "/api/v1/products/recommend",
    description: "트렌드와 계절성을 고려한 상품 추천 목록을 제공 및 최근 업데이트 시간을 반환합니다."
  },
  // 실제 API 엔드포인트 추가
  {
    icon: <Package className="w-5 h-5 text-emerald-400" />,
    method: "GET",
    path: "/api/products",
    description: "전체 상품 목록을 조회합니다. 카테고리 및 검색어로 필터링할 수 있습니다."
  },
  {
    icon: <Package className="w-5 h-5 text-emerald-400" />,
    method: "GET",
    path: "/api/products/[id]",
    description: "특정 ID의 상품 상세 정보를 조회합니다."
  },
  {
    icon: <Tag className="w-5 h-5 text-emerald-400" />,
    method: "GET",
    path: "/api/products/barcode",
    description: "바코드로 상품을 검색합니다."
  },
  {
    icon: <ShoppingCart className="w-5 h-5 text-emerald-400" />,
    method: "GET",
    path: "/api/cart",
    description: "현재 사용자의 장바구니 정보를 조회합니다."
  },
  {
    icon: <ShoppingCart className="w-5 h-5 text-emerald-400" />,
    method: "POST",
    path: "/api/cart",
    description: "장바구니에 상품을 추가합니다."
  },
  {
    icon: <ShoppingCart className="w-5 h-5 text-emerald-400" />,
    method: "DELETE",
    path: "/api/cart/items/[id]",
    description: "장바구니에서 특정 상품을 제거합니다."
  },
  {
    icon: <CreditCard className="w-5 h-5 text-emerald-400" />,
    method: "GET",
    path: "/api/orders",
    description: "사용자의 주문 내역을 조회합니다."
  },
  {
    icon: <CreditCard className="w-5 h-5 text-emerald-400" />,
    method: "POST",
    path: "/api/orders",
    description: "새로운 주문을 생성합니다."
  },
  {
    icon: <CreditCard className="w-5 h-5 text-emerald-400" />,
    method: "GET",
    path: "/api/orders/[id]",
    description: "특정 주문의 상세 정보를 조회합니다."
  },
  {
    icon: <Lock className="w-5 h-5 text-emerald-400" />,
    method: "GET",
    path: "/api/auth/signin",
    description: "사용자 로그인 API입니다."
  },
  {
    icon: <User className="w-5 h-5 text-emerald-400" />,
    method: "GET",
    path: "/api/user/nickname",
    description: "사용자 닉네임 정보를 조회합니다."
  }
] 