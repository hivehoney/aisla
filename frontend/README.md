# 🏪 무인 편의점 운영 시스템 (MVP)

## 📌 프로젝트 개요

Next.js (App Router), PostgreSQL, Auth.js, robot.js를 기반으로 한 **무인 편의점 운영 시스템**입니다.  
이 시스템은 점주 인증부터 로봇을 활용한 자동 진열/폐기, 판매/재고/발주 통합 관리, 무인 고객 결제까지 지원합니다.

---

## 📂 디렉토리 구조 (App Router, JavaScript 기준)

```
/app
├─ auth                     # 로그인, 회원가입, 프로필
│   ├─ login
│   ├─ signup
│   └─ profile
├─ dashboard                # 관리자 메인 대시보드
│   └─ page.js
├─ sales                   # 판매 기록 분석
├─ discard                 # 폐기 내역 및 등록
├─ display                 # 매대 진열 관리
├─ inventory               # 재고 현황 확인
├─ order                   # 상품 발주
│   ├─ search              # 상품 검색
│   ├─ cart                # 발주 장바구니
│   └─ [id]                # 상세 상품 정보
├─ order-history           # 과거 발주 내역
├─ robot-control           # 로봇 제어
├─ products                # 상품 목록 및 상세
│   └─ [id]
├─ pos                # 고객용 무인 결제 페이지
│   └─ [id]
├─ api                     # RESTful API 라우트
│   ├─ auth
│   ├─ robot
│   ├─ sales
│   ├─ discard
│   ├─ display
│   ├─ inventory
│   ├─ order
│   ├─ products
│   └─ user
├─ middleware.js
├─ layout.js               # 공통 레이아웃 및 SessionProvider
└─ page.js
```

---

## ✅ 오늘 구현 목표

### 1. 🚀 프로젝트 세팅
- [ ] Next.js (App Router) 프로젝트 생성
- [ ] JavaScript 기반 (TypeScript 사용 안함)
- [ ] Tailwind CSS 설정
- [ ] Prisma + PostgreSQL 연동
- [ ] `.env` 구성
- [ ] 초기 데이터 seed (User, Store, Category, Product)

---

### 2. 🔐 인증 시스템
- [ ] Auth.js 기반 세션 인증
- [ ] 점주 회원가입/로그인
- [ ] 관리자 전용 라우팅 보호 (`middleware.js`)
- [ ] 프로필 페이지에서 정보 확인 및 편집

---

## 🗃 PostgreSQL 모델 (Prisma 기반)

주요 테이블 구성은 다음과 같습니다:

- `User`, `Account`, `Session`, `VerificationToken`
- `Store`, `Product`, `Category`, `Inventory`, `Sale`
- `InventoryPrediction`, `Robot`, `RobotTask`, `AIAnalysisTask`

```prisma
model Product {
  id             String   @id @default(cuid())
  code           String   @unique
  name           String
  price          Float
  priceOriginal  Float?
  eventType      String?
  imageUrl       String?
  statusCode     String
  statusName     String
  categoryId     String?
  category       Category? @relation(fields: [categoryId], references: [id])
  inventories    Inventory[]
  sales          Sale[]
  predictions    InventoryPrediction[]
  robotTasks     RobotTask[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  description String?
  products    Product[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

---

## 🧩 페이지별 기능 정리

### 📊 `/dashboard`
- 총매출, 부족 재고, 폐기 예정 요약
- 최근 판매·발주·폐기 요약

### 📈 `/sales`
- 일/주/월 판매 분석 그래프
- 인기 상품 순위, 시간대별 구매 트렌드

### ❌ `/discard`
- 폐기 등록 (상품, 수량, 사유)
- 폐기 내역 표시 및 재고 차감 처리

### 🧊 `/display`
- 매대 진열 상태 보기/편집
- 드래그앤드롭 또는 진열 슬롯 선택

### 📦 `/order`
- 상품 목록 및 필터 검색
- 상세 페이지에서 수량 입력
- 장바구니 및 발주 확정 기능

### 📜 `/order-history`
- 발주 이력 리스트
- 상태별 필터 (요청됨, 승인됨, 거절됨)

### 🤖 `/robot-control`
- 로봇 상태 실시간 보기 (WebSocket)
- 제어 명령 (진열, 이동, 폐기)
- `/api/robot/...` 연동

### 🧾 `/inventory`
- 현재 재고 수량
- 경고 레벨 도달 시 표시
- 재고 변경 이력 보기 (optional)

### 🛍 `/customer`
- 고객이 직접 상품 선택 → 장바구니 → 결제
- 결제는 목업 처리 (QR/카드)

---

## 🔧 공통 기능
- `SessionProvider`를 통한 인증 세션 유지
- 에러 처리 & API 응답 통일 (status/data/error)
- `.env.example` 제공

## LLM AI 발주 시스템 
- Workflow
 1. Inventory 데이터 조회
 2. 재고 결제 이력 확인
 3. 발주 이력 확인
 4. [선택시] Google Trend API 조회
 5. [선택시] 날씨 API 조회
 6. 발주 추천 상품 / 수량 / 사유 생성
 
---

## 🏁 구현 완료 목표

- ✅ 사용자 인증 및 관리자 라우팅
- ✅ 상품/카테고리 구조 설정 및 연동
- ✅ 실시간 로봇 상태 제어 (WebSocket 연동)
- ✅ 발주/판매/폐기 통합 처리
- ✅ 고객용 무인 결제 페이지 구현 (선택)

---

## 📦 초기 Seed 구성

- 점주(User), 기본 점포(Store)
- 카테고리(Category)
- 상품(Product) + 연결된 카테고리

---

> ☕ 깔끔한 무인 편의점 운영의 모든 흐름을 한 눈에 파악할 수 있도록 설계되었습니다.
