import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const stores = await prisma.store.findMany({
      where: {
        ownerId: session.user.id
      },
      select: {
        id: true,
        name: true,
        address: true
      }
    })

    return NextResponse.json(stores)
  } catch (error) {
    console.error('스토어 목록 조회 중 오류:', error)
    return NextResponse.json(
      { error: '스토어 목록을 가져오는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const { name, address, phone, latitude, longitude } = await req.json()

    if (!name || !address) {
      return NextResponse.json({ error: '스토어 이름과 주소는 필수입니다' }, { status: 400 })
    }

    const store = await prisma.store.create({
      data: {
        name: name.trim(),
        address: address.trim(),
        phone: phone?.trim(),
        latitude: latitude,
        longitude: longitude,
        ownerId: session.user.id
      }
    })

    return NextResponse.json(store)
  } catch (error) {
    console.error('스토어 등록 중 오류:', error)
    return NextResponse.json(
      { error: '스토어 등록 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
} 