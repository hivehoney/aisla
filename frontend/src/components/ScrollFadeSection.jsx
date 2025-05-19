'use client'

import { useRef, useEffect, useState } from 'react'

export default function ScrollFadeSection({ 
  children, 
  className, 
  delay = 0, 
  threshold = 0.1,
  direction = 'up' // up, down, left, right
}) {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef(null)
  
  // 방향에 따른 초기 트랜스폼 값 설정
  const getInitialTransform = () => {
    switch (direction) {
      case 'up': return 'translateY(30px)'
      case 'down': return 'translateY(-30px)'
      case 'left': return 'translateX(30px)'
      case 'right': return 'translateX(-30px)'
      default: return 'translateY(30px)'
    }
  }
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // 요소가 화면에 충분히 들어왔는지 체크
        if (entry.isIntersecting) {
          // 딜레이 적용
          setTimeout(() => {
            setIsVisible(true)
          }, delay)
          
          // 한번 보여진 후에는 옵저버 해제
          observer.unobserve(entry.target)
        }
      },
      {
        root: null, // viewport 기준
        rootMargin: '0px',
        threshold // 요소의 얼마만큼이 보여야 콜백을 실행할지
      }
    )
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
    }
  }, [delay, threshold, direction])
  
  return (
    <div
      ref={sectionRef}
      className={`transition-all duration-700 ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate(0, 0)' : getInitialTransform(),
      }}
    >
      {children}
    </div>
  )
} 