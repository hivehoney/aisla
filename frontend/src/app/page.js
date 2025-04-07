import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LineChart, PackageSearch, BarChart3, TrendingUp, Store, Users, Terminal, Database, Webhook } from "lucide-react";
import ApiSection from '@/components/ApiSection'
import FloatingIcons from '@/components/FloatingIcons'

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-4 overflow-hidden">
        <FloatingIcons />
        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <Badge variant="outline" className="text-sm px-4 py-1 rounded-full border-muted-foreground/30">
              Smart Retail AI
            </Badge>

            <h1 className="text-5xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              수요를 예측하고<br />재고를 최적화하세요
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              실시간 데이터 분석으로 재고를 최적화하고,<br />
              매출을 극대화하는 스마트 리테일 솔루션
            </p>

            <div className="flex gap-4 justify-center">
              <Button size="lg" className="text-base px-8">
                무료로 시작하기
              </Button>
              <Button variant="outline" size="lg" className="text-base px-8">
                데모 신청
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* API Section */}
      <ApiSection />

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="text-sm px-4 py-1 rounded-full border-muted-foreground/30 mb-4">
              Features
            </Badge>
            <h2 className="text-3xl font-bold mb-4">
              더 스마트한 편의점 운영의 시작
            </h2>
            <p className="text-muted-foreground">
              aisle이 제공하는 핵심 기능을 확인하세요
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="space-y-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <Badge variant="outline" className="text-sm px-4 py-1 rounded-full border-muted-foreground/30 mb-4">
              Performance
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="outline" className="text-sm px-4 py-1 rounded-full border-muted-foreground/30 mb-4">
                Dashboard
              </Badge>
              <h2 className="text-3xl font-bold mb-4">
                한눈에 보는 매장 현황
              </h2>
              <p className="text-muted-foreground">
                실시간으로 업데이트되는 대시보드로 매장 운영 현황을 파악하세요
              </p>
            </div>
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden shadow-2xl border border-muted">
              <Image
                src="/aisle-dashboard.webp"
                alt="Aisle Dashboard Preview"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="text-sm px-4 py-1 rounded-full border-muted-foreground/30 mb-4">
              Benefits
            </Badge>
            <h2 className="text-3xl font-bold mb-4">
              비즈니스 성과를 높이는 방법
            </h2>
            <p className="text-muted-foreground">
              aisle과 함께라면 이런 것들이 가능합니다
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-12">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex gap-6 items-start">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                  {benefit.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      

      {/* Contact Form Section */}
      <section className="py-24 bg-muted/30" id="contact">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-16">
              <Badge variant="outline" className="text-sm px-4 py-1 rounded-full border-muted-foreground/30 mb-4">
                Contact
              </Badge>
              <h2 className="text-3xl font-bold mb-4">
                문의하기
              </h2>
              <p className="text-muted-foreground">
                더 자세한 정보가 필요하신가요? 언제든 문의해주세요.
              </p>
            </div>
            <form className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    이름
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-2 rounded-lg border bg-background"
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    이메일
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-2 rounded-lg border bg-background"
                    placeholder="example@company.com"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    문의내용
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border bg-background resize-none"
                    placeholder="문의하실 내용을 입력해주세요"
                  />
                </div>
              </div>
              <Button className="w-full" size="lg">
                문의하기
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

const stats = [
  { value: "98%", label: "예측 정확도" },
  { value: "30%", label: "재고 손실 감소" },
  { value: "25%", label: "매출 증가" },
  { value: "500+", label: "활성 사용자" },
];

const features = [
  {
    icon: <LineChart className="w-5 h-5 text-primary" />,
    title: "수요 예측",
    description: "AI 기반 알고리즘으로 시간대별, 요일별 수요를 정확하게 예측하여 최적의 재고 수준을 제안합니다."
  },
  {
    icon: <PackageSearch className="w-5 h-5 text-primary" />,
    title: "재고 최적화",
    description: "실시간 재고 현황을 분석하여 최적의 발주량을 추천하고, 재고 부족과 과잉을 방지합니다."
  },
  {
    icon: <BarChart3 className="w-5 h-5 text-primary" />,
    title: "데이터 인사이트",
    description: "판매 데이터 분석을 통해 매출 증대를 위한 실행 가능한 인사이트를 제공합니다."
  }
];

const benefits = [
  {
    icon: <TrendingUp className="w-5 h-5 text-primary" />,
    title: "매출 증대",
    description: "정확한 수요 예측으로 기회 손실을 줄이고, 매출을 최대 25% 향상시킬 수 있습니다."
  },
  {
    icon: <Store className="w-5 h-5 text-primary" />,
    title: "운영 효율화",
    description: "자동화된 발주 제안으로 재고 관리 시간을 줄이고, 핵심 업무에 집중할 수 있습니다."
  },
  {
    icon: <Users className="w-5 h-5 text-primary" />,
    title: "고객 만족도 향상",
    description: "원하는 상품을 항상 구매할 수 있도록 하여 고객 만족도와 재방문율을 높입니다."
  }
];
