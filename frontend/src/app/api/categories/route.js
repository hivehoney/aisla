import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('카테고리 조회 중 오류 발생:', error)
    return NextResponse.json(
      { error: '카테고리 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
} 