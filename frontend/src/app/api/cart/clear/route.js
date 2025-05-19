import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server'

export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 })
    }

    const { storeId } = await request.json()
    if (!storeId) {
      return NextResponse.json({ error: '스토어 ID가 필요합니다.' }, { status: 400 })
    }

    // 사용자의 장바구니 찾기
    const cart = await prisma.cart.findFirst({
      where: {
        userId: session.user.id,
        storeId: storeId
      },
      include: {
        items: true
      }
    })

    if (!cart) {
      return NextResponse.json({ error: '장바구니를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 장바구니 아이템 삭제
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id
      }
    })

    return NextResponse.json({ 
      message: '장바구니가 성공적으로 초기화되었습니다.',
      cartId: cart.id
    })
  } catch (error) {
    console.error('장바구니 초기화 중 오류:', error)
    return NextResponse.json({ 
      error: '장바구니 초기화 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
} 