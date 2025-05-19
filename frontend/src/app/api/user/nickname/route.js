import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    if (!body || !body.nickname) {
      return NextResponse.json({ error: '닉네임이 필요합니다' }, { status: 400 })
    }

    const { nickname } = body

    // 닉네임 중복 체크
    const existingUser = await prisma.user.findUnique({
      where: { nickname },
    })

    if (existingUser) {
      return NextResponse.json({ error: '이미 사용 중인 닉네임입니다' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { nickname }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Nickname update error:', error)
    return NextResponse.json(
      { error: '닉네임 설정 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

export async function PUT(req) {
  return POST(req);
} 