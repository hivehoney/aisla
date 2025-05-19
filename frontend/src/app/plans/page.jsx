'use client';

import { useState } from 'react';
import { ArrowRight, CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

export default function PricingPage() {
    const [isYearly, setIsYearly] = useState(false);

    const plans = [
        {
            id: 'free',
            name: '무료 플랜',
            description: '소규모 편의점을 위한 기본 솔루션',
            monthlyPrice: '무료',
            yearlyPrice: '무료',
            features: [
                { text: '기본 수요예측 기능' },
                { text: '일 20개 상품 AI 발주 제안' },
                { text: '7일간 데이터 기록' },
                { text: '기본 재고 관리 도구' },
            ],
            button: { text: '시작하기', url: '/auth' },
        },
        {
            id: 'pro',
            name: '프로 플랜',
            description: '성장하는 편의점을 위한 고급 솔루션',
            monthlyPrice: '₩29,000',
            yearlyPrice: '₩299,000',
            features: [
                { text: '고급 AI 수요예측 엔진' },
                { text: '무제한 상품 AI 발주 제안' },
                { text: '실시간 재고 부족 알림' },
                { text: '날씨 및 이벤트 기반 예측' },
                { text: '6개월 데이터 분석 및 인사이트' },
                { text: 'POS 시스템 통합' },
            ],
            button: { text: '시작하기', url: '/auth' },
        },
    ];

    return (
        <section className="py-32 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="mx-auto max-w-5xl flex flex-col items-center gap-6 text-center">
                    <h2 className="text-4xl font-extrabold lg:text-5xl">Pricing</h2>
                    <p className="text-gray-600 lg:text-xl">필요에 맞는 플랜을 선택하세요</p>
                    <div className="flex items-center gap-3 text-lg">
                        <span>월간</span>
                        <Switch
                            checked={isYearly}
                            onCheckedChange={() => setIsYearly(!isYearly)}
                        />
                        <span>연간 (20% 할인)</span>
                    </div>

                    <div className="flex w-full flex-col gap-6 md:flex-row md:justify-center">
                        {plans.map((plan) => (
                            <Card
                                key={plan.id}
                                className="flex w-80 flex-col justify-between text-left"
                            >
                                <CardHeader className="space-y-2">
                                    <CardTitle>{plan.name}</CardTitle>
                                    <p className="text-sm text-gray-500">{plan.description}</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold">
                                            {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                                        </span>
                                        {isYearly && (
                                            <span className="text-gray-500 text-sm">/년</span>
                                        )}
                                        {!isYearly && (
                                            <span className="text-gray-500 text-sm">/월</span>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    <Separator className="my-6" />
                                    <ul className="space-y-4">
                                        {plan.features.map((feature, idx) => (
                                            <li
                                                key={idx}
                                                className="flex items-center gap-2 text-gray-700"
                                            >
                                                <CircleCheck className="h-4 w-4 text-green-600" />
                                                <span>{feature.text}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>

                                <CardFooter>
                                    <Button asChild className="w-full">
                                        <a href={plan.button.url} className="flex items-center justify-center gap-2">
                                            {plan.button.text}
                                            <ArrowRight className="h-4 w-4" />
                                        </a>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
