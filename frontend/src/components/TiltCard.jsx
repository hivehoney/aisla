'use client'

import { useState, useRef } from 'react'

export default function TiltCard({ children, className }) {
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)')
  const [transition, setTransition] = useState('')
  const cardRef = useRef(null)
  
  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    
    const card = cardRef.current
    const cardRect = card.getBoundingClientRect()
    
    // 카드 내 마우스 위치 계산 (-0.5 ~ 0.5 범위)
    const cardX = ((e.clientX - cardRect.left) / cardRect.width) - 0.5
    const cardY = ((e.clientY - cardRect.top) / cardRect.height) - 0.5
    
    // 회전 각도 계산 (최대 10도)
    const rotateY = cardX * 10
    const rotateX = -cardY * 10
    
    // 트랜스폼 적용
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`)
    setTransition('transform 0.1s ease')
  }
  
  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)')
    setTransition('transform 0.5s ease')
  }
  
  return (
    <div
      ref={cardRef}
      className={`relative bg-card rounded-xl p-6 shadow-sm border transition-all duration-300 ${className}`}
      style={{ transform, transition }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-primary/5 to-secondary/5 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  )
} 