'use client'

import { useState, useEffect } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import AnimatedHeading from './AnimatedHeading'
import FloatingIcons from './FloatingIcons'
import { useRouter } from 'next/navigation'

export default function InteractiveHero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const router = useRouter()

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e
      const x = (clientX / window.innerWidth) - 0.5
      const y = (clientY / window.innerHeight) - 0.5
      setMousePosition({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <section className="relative pt-18 pb-16 px-4 overflow-hidden">
      <FloatingIcons />

      {/* 인터랙티브 배경 요소들 */}
      <div
        className="absolute top-1/4 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"
        style={{
          transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)`,
          transition: 'transform 0.2s ease-out'
        }}
      />
      <div
        className="absolute bottom-1/4 -right-24 w-80 h-80 bg-primary/5 rounded-full blur-3xl"
        style={{
          transform: `translate(${mousePosition.x * -30}px, ${mousePosition.y * -30}px)`,
          transition: 'transform 0.3s ease-out'
        }}
      />
      <div
        className="absolute top-1/2 left-1/3 w-40 h-40 bg-secondary/5 rounded-full blur-3xl"
        style={{
          transform: `translate(${mousePosition.x * 15}px, ${mousePosition.y * 15}px)`,
          transition: 'transform 0.1s ease-out'
        }}
      />

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <Badge
            variant="outline"
            className="text-sm px-4 py-1 rounded-full border-muted-foreground/30"
            style={{
              transform: `translate(${mousePosition.x * 10}px, ${mousePosition.y * 10}px)`,
              transition: 'transform 0.2s ease-out'
            }}
          >
            Smart Retail AI
          </Badge>

          <AnimatedHeading />

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            실시간 데이터 분석으로 재고를 최적화하고,<br />
            매출을 극대화하는 스마트 리테일 솔루션
          </p>

          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              className="text-base px-8 transition-transform hover:scale-105"
              onClick={() => router.push('/dashboard')}
            >
              무료로 시작하기
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-base px-8 transition-transform hover:scale-105"
              onClick={() => router.push('/plans')}
            >
              서비스 플랜
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
} 