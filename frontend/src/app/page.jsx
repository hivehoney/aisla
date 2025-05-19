import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LineChart, PackageSearch, BarChart3, TrendingUp, Store, Users, Terminal, Database, Webhook } from "lucide-react";
import ApiSection from '@/components/ApiSection'
import FloatingIcons from '@/components/FloatingIcons'
import AnimatedHeading from '@/components/AnimatedHeading';
import AnimatedStats from '@/components/AnimatedStats';
import InteractiveHero from '@/components/InteractiveHero';
import FeatureCards from '@/components/FeatureCards';
import BenefitsSection from '@/components/BenefitsSection';
import InteractiveContactForm from '@/components/InteractiveContactForm';
import DatabaseStatusAlert from '@/components/DatabaseStatusAlert';
import DemoSection from "@/components/DemoSection";
import { auth } from "@/auth";
import DashboardPreviewSection from "@/components/DashboardPreviewSection";

export default async function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Database Status Alert */}
      <DatabaseStatusAlert />
      
      {/* Hero Section */}
      <InteractiveHero />

      {/* API Section */}
      {/* <ApiSection /> */}

      {/* Demo Section */}
      <DemoSection />

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
              aisla이 제공하는 핵심 기능을 확인하세요
            </p>
          </div>

          <FeatureCards features={features} />
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
          <AnimatedStats stats={stats} />
        </div>
      </section>

      {/* Dashboard Preview */}
      {/* <DashboardPreviewSection /> */}
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
                src="/aisla-dashboard.webp"
                alt="aisla Dashboard Preview"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <BenefitsSection benefits={benefits} />

      {/* Contact Form Section */}
      <InteractiveContactForm />
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
    description: "AI 기반 알고리즘으로 트렌드, 날씨, 이벤트 등을 고려하여 최적의 재고 수준을 제안합니다."
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
