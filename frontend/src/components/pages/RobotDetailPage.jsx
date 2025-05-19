'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Activity, Battery, Wifi, AlertCircle, History, Settings, Power, ArrowLeft
} from "lucide-react"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { useRouter } from "next/navigation"

export default function RobotDetailPage() {
  const router = useRouter()
  const [robotStatus, setRobotStatus] = useState({
    isActive: true,
    battery: 85,
    connection: true,
    currentTask: "입고 작업 중",
    lastUpdate: new Date().toISOString(),
  })

  const [history] = useState([
    {
      id: 1,
      task: "입고 작업",
      status: "완료",
      timestamp: "2024-03-20 14:30:00",
      details: "A-123 상품 50개 입고 완료"
    },
    {
      id: 2,
      task: "배터리 충전",
      status: "완료",
      timestamp: "2024-03-20 13:15:00",
      details: "배터리 85% 충전 완료"
    },
    {
      id: 3,
      task: "재고 확인",
      status: "완료",
      timestamp: "2024-03-20 12:00:00",
      details: "전체 재고 스캔 완료"
    }
  ])

  const handlePowerToggle = () => {
    setRobotStatus(prev => ({
      ...prev,
      isActive: !prev.isActive,
      lastUpdate: new Date().toISOString()
    }))
    toast.success(robotStatus.isActive ? "로봇이 종료되었습니다." : "로봇이 시작되었습니다.")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <Toaster position="bottom-right" />
      <div className="max-w-7xl mx-auto px-6 py-8 ">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/robot')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            로봇 목록
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">입고 로봇</h1>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* 왼쪽 섹션: 로봇 상태 */}
          <div className="col-span-4 space-y-6">
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-medium">로봇 상태</h2>
                </div>
                <Button
                  variant={robotStatus.isActive ? "destructive" : "default"}
                  size="sm"
                  onClick={handlePowerToggle}
                  className="flex items-center gap-2"
                >
                  <Power className="w-4 h-4" />
                  {robotStatus.isActive ? "종료" : "시작"}
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/80 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${robotStatus.isActive ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="font-medium">작동 상태</span>
                  </div>
                  <Badge variant={robotStatus.isActive ? "success" : "destructive"}>
                    {robotStatus.isActive ? "작동 중" : "정지"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/80 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Battery className="w-5 h-5 text-primary" />
                    <span className="font-medium">배터리</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${robotStatus.battery}%` }}
                      />
                    </div>
                    <span className="font-medium">{robotStatus.battery}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/80 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-primary" />
                    <span className="font-medium">연결 상태</span>
                  </div>
                  <Badge variant={robotStatus.connection ? "success" : "destructive"}>
                    {robotStatus.connection ? "연결됨" : "연결 끊김"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/80 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    <span className="font-medium">현재 작업</span>
                  </div>
                  <span className="font-medium text-primary">{robotStatus.currentTask}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-medium">빠른 제어</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12">
                  긴급 정지
                </Button>
                <Button variant="outline" className="h-12">
                  배터리 충전
                </Button>
                <Button variant="outline" className="h-12">
                  작업 일시정지
                </Button>
                <Button variant="outline" className="h-12">
                  재고 확인
                </Button>
              </div>
            </div>

            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-medium">재고 관리</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12">
                  입고 작업 시작
                </Button>
                <Button variant="outline" className="h-12">
                  출고 작업 시작
                </Button>
                <Button variant="outline" className="h-12">
                  재고 이동
                </Button>
                <Button variant="outline" className="h-12">
                  재고 정리
                </Button>
                <Button variant="outline" className="h-12">
                  재고 검수
                </Button>
                <Button variant="outline" className="h-12">
                  재고 보고서
                </Button>
              </div>
            </div>
          </div>

          {/* 오른쪽 섹션: 작업 이력 */}
          <div className="col-span-8">
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 h-full">
              <div className="flex items-center gap-2 mb-6">
                <History className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-medium">작업 이력</h2>
              </div>
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-white/80 rounded-lg hover:bg-white transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.task}</span>
                        <Badge variant={item.status === "완료" ? "success" : "secondary"}>
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.details}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{item.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 