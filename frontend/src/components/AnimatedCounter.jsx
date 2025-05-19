'use client'

import { useState, useEffect, useRef } from 'react'
import { useInView } from 'react-intersection-observer'

export default function AnimatedCounter({ value, label, duration = 2000 }) {
  const [count, setCount] = useState(0)
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })
  
  const countRef = useRef(null)
  const isPercentage = value.includes('%')
  const targetValue = parseInt(value.replace(/\D/g, ''))
  
  useEffect(() => {
    let start = 0
    let animationFrameId
    
    // 요소가 화면에 보이면 애니메이션 시작
    if (inView) {
      const step = timestamp => {
        if (!countRef.current) return
        
        // 애니메이션 시작 시간이 없으면 현재 시간을 시작 시간으로 설정
        if (!start) start = timestamp
        
        // 경과 시간 계산
        const progress = timestamp - start
        
        // 진행률에 따라 현재 값 계산 (0에서 targetValue로)
        const currentCount = Math.min(
          Math.floor((progress / duration) * targetValue),
          targetValue
        )
        
        setCount(currentCount)
        
        // 목표값에 도달하지 않았으면 애니메이션 계속
        if (progress < duration) {
          animationFrameId = window.requestAnimationFrame(step)
        } else {
          setCount(targetValue)
        }
      }
      
      animationFrameId = window.requestAnimationFrame(step)
    }
    
    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [inView, targetValue, duration])
  
  return (
    <div ref={ref} className="text-center">
      <div ref={countRef} className="text-3xl font-bold text-primary mb-2">
        {isPercentage ? `${count}%` : count.toLocaleString()}
        {!isPercentage && value.includes('+') ? '+' : ''}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  )
} 