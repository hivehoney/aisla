'use client'

import { Badge } from "@/components/ui/badge"
import ScrollFadeSection from './ScrollFadeSection'

export default function BenefitsSection({ benefits }) {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <ScrollFadeSection className="text-center mb-16">
          <Badge variant="outline" className="text-sm px-4 py-1 rounded-full border-muted-foreground/30 mb-4">
            Benefits
          </Badge>
          <h2 className="text-3xl font-bold mb-4">
            비즈니스 성과를 높이는 방법
          </h2>
          <p className="text-muted-foreground">
            aisla과 함께라면 이런 것들이 가능합니다
          </p>
        </ScrollFadeSection>

        <div className="max-w-3xl mx-auto space-y-12">
          {benefits.map((benefit, index) => (
            <ScrollFadeSection 
              key={index} 
              className="flex gap-6 items-start"
              delay={index * 200} // 각 항목마다 약간의 딜레이
              direction={index % 2 === 0 ? 'left' : 'right'} // 번갈아가며 다른 방향에서 등장
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                {benefit.icon}
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            </ScrollFadeSection>
          ))}
        </div>
      </div>
    </section>
  )
} 