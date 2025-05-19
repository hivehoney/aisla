'use client'

import TiltCard from './TiltCard'

export default function FeatureCards({ features }) {
  return (
    <div className="grid md:grid-cols-3 gap-8">
      {features.map((feature, index) => (
        <TiltCard key={index} className="space-y-4 h-full">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            {feature.icon}
          </div>
          <h3 className="font-semibold text-lg">{feature.title}</h3>
          <p className="text-muted-foreground text-sm">{feature.description}</p>
        </TiltCard>
      ))}
    </div>
  )
} 