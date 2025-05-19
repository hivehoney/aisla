import { PrismaClient } from '@prisma/client'

// PrismaClient를 global 객체에 추가하여 핫 리로드시 연결이 재생성되는 것을 방지
const globalForPrisma = global

// globalForPrisma에 prisma가 없으면 새로운 PrismaClient 인스턴스 생성
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient()
}

export const prisma = globalForPrisma.prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 