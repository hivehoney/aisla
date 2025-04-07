'use client'

import { useEffect, useState } from 'react'
import { 
  LineChart, PackageSearch, BarChart3, 
  TrendingUp, Store, Users, ShoppingCart,
  Receipt, PieChart, Activity
} from 'lucide-react'

const icons = [
  LineChart, PackageSearch, BarChart3, 
  TrendingUp, Store, Users, ShoppingCart,
  Receipt, PieChart, Activity
]

export default function FloatingIcons() {
  const [floatingIcons, setFloatingIcons] = useState([])

  useEffect(() => {
    // 15개의 랜덤 아이콘 생성
    const newIcons = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      Icon: icons[Math.floor(Math.random() * icons.length)],
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * (32 - 20) + 20, // 20px to 32px로 크기 증가
      duration: Math.random() * (20 - 15) + 15,
      delay: Math.random() * -20,
      opacity: Math.random() * (0.2 - 0.15) + 0.15, // 0.15 to 0.2로 투명도 증가
    }))
    setFloatingIcons(newIcons)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {floatingIcons.map(({ id, Icon, left, top, size, duration, delay, opacity }) => (
        <div
          key={id}
          className="absolute animate-float"
          style={{
            left,
            top,
            '--float-duration': `${duration}s`,
            '--float-delay': `${delay}s`,
            animation: `float ${duration}s linear infinite`,
            animationDelay: `${delay}s`,
          }}
        >
          <Icon 
            style={{
              width: size,
              height: size,
              opacity: opacity,
            }}
            className="text-primary/90 rotate-12" // 색상 투명도도 증가
          />
        </div>
      ))}
    </div>
  )
} 