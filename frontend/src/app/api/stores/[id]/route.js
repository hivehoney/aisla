import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { NextResponse } from 'next/server'

// 스토어 상세 조회
export async function GET(request, { params }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const storeId = (await params).id
    
    const store = await prisma.store.findUnique({
      where: {
        id: storeId,
        ownerId: session.user.id
      }
    })

    if (!store) {
      return NextResponse.json({ error: '스토어를 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json(store)
  } catch (error) {
    console.error('스토어 조회 중 오류:', error)
    return NextResponse.json(
      { error: '스토어 정보를 가져오는 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 스토어 수정
export async function PATCH(request, { params }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const storeId = (await params).id
    const body = await request.json()
    const { name, address, phone, latitude, longitude } = body

    // 유효성 검사
    if (!name || !address) {
      return NextResponse.json({ error: '스토어 이름과 주소는 필수입니다' }, { status: 400 })
    }

    // 권한 확인
    const existingStore = await prisma.store.findUnique({
      where: {
        id: storeId
      }
    })

    if (!existingStore) {
      return NextResponse.json({ error: '스토어를 찾을 수 없습니다' }, { status: 404 })
    }

    if (existingStore.ownerId !== session.user.id) {
      return NextResponse.json({ error: '스토어를 수정할 권한이 없습니다' }, { status: 403 })
    }

    // 스토어 업데이트
    const updatedStore = await prisma.store.update({
      where: {
        id: storeId
      },
      data: {
        name: name.trim(),
        address: address.trim(),
        phone: phone?.trim(),
        latitude: latitude,
        longitude: longitude
      }
    })

    return NextResponse.json(updatedStore)
  } catch (error) {
    console.error('스토어 수정 중 오류:', error)
    return NextResponse.json(
      { error: '스토어 수정 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

// 스토어 삭제
export async function DELETE(request, { params }) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const storeId = (await params).id

    // 권한 확인
    const existingStore = await prisma.store.findUnique({
      where: {
        id: storeId
      }
    })

    if (!existingStore) {
      return NextResponse.json({ error: '스토어를 찾을 수 없습니다' }, { status: 404 })
    }

    if (existingStore.ownerId !== session.user.id) {
      return NextResponse.json({ error: '스토어를 삭제할 권한이 없습니다' }, { status: 403 })
    }

    // 스토어 삭제
    await prisma.store.delete({
      where: {
        id: storeId
      }
    })

    return NextResponse.json({ message: '스토어가 성공적으로 삭제되었습니다' })
  } catch (error) {
    console.error('스토어 삭제 중 오류:', error)
    
    // 외래 키 제약 조건 위반 오류 처리
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: '해당 스토어에 연결된 데이터가 있어 삭제할 수 없습니다. 먼저 관련 데이터를 삭제해주세요.' 
      }, { status: 400 })
    }
    
    return NextResponse.json(
      { error: '스토어 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
} 