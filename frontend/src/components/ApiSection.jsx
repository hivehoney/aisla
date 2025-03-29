'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Terminal, Database, Webhook, ChevronRight, LineChart, ShoppingCart } from "lucide-react"

export default function ApiSection() {
  const [output, setOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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

    // 나머지 엔드포인트는 기존 더미 데이터 사용
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
      }
    }

    setOutput(JSON.stringify(mockResponses[endpoint.path], null, 2))
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
                  {isLoading && endpoint.path === '/hello' 
                    ? '연결 중...' 
                    : `$ curl api.aisle.com${endpoint.path}`
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
    icon: <Terminal className="w-5 h-5 text-emerald-400" />,
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
    icon: <Terminal className="w-5 h-5 text-emerald-400" />,
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
  }
] 