'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Activity, Battery, Wifi, AlertCircle, Plus
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function RobotsPage() {
  const router = useRouter()
  const [robots] = useState([
    {
      id: "robot-1",
      name: "입고 로봇 #1",
      status: "active",
      battery: 85,
      connection: true,
      currentTask: "입고 작업 중",
      location: "A구역"
    },
    {
      id: "robot-2",
      name: "입고 로봇 #2",
      status: "charging",
      battery: 45,
      connection: true,
      currentTask: "배터리 충전 중",
      location: "B구역"
    },
    {
      id: "robot-3",
      name: "입고 로봇 #3",
      status: "inactive",
      battery: 100,
      connection: false,
      currentTask: "대기 중",
      location: "C구역"
    },
    {
      id: "robot-4",
      name: "입고 로봇 #4",
      status: "active",
      battery: 92,
      connection: true,
      currentTask: "재고 확인 중",
      location: "D구역"
    }
  ])

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "charging":
        return "bg-yellow-500"
      case "inactive":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return "작동 중"
      case "charging":
        return "충전 중"
      case "inactive":
        return "정지"
      default:
        return "알 수 없음"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="max-w-7xl mx-auto px-6 py-8 ">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">로봇 관리</h1>
            <p className="text-muted-foreground mt-2">전체 {robots.length}대의 로봇이 운영 중입니다.</p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            새 로봇 추가
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {robots.map((robot) => (
            <div
              key={robot.id}
              className="bg-white/50 backdrop-blur-sm rounded-lg p-6 cursor-pointer hover:bg-white/70 transition-colors"
              onClick={() => router.push(`/robot/${robot.id}`)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(robot.status)}`} />
                  <h2 className="text-lg font-medium">{robot.name}</h2>
                </div>
                <Badge variant={robot.connection ? "success" : "destructive"}>
                  {robot.connection ? "연결됨" : "연결 끊김"}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">상태</span>
                  <Badge variant={robot.status === "active" ? "success" : robot.status === "charging" ? "warning" : "destructive"}>
                    {getStatusText(robot.status)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">배터리</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${robot.battery}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{robot.battery}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">위치</span>
                  <span className="text-sm font-medium">{robot.location}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">현재 작업</span>
                  <span className="text-sm font-medium text-primary">{robot.currentTask}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}