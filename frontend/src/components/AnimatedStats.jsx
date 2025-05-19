'use client'

import AnimatedCounter from './AnimatedCounter'

export default function AnimatedStats({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {stats.map((stat, index) => (
        <AnimatedCounter 
          key={index} 
          value={stat.value} 
          label={stat.label} 
        />
      ))}
    </div>
  )
} 