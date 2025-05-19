import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 })
    }

    const { quantity } = await request.json()
    const cartItemId = (await params).id

    // 장바구니 아이템 조회 및 소유권 확인
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: {
          include: {
            store: true
          }
        }
      }
    })

    if (!cartItem) {
      return NextResponse.json({ error: '장바구니 아이템을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (cartItem.cart.store.ownerId !== session.user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 수량이 1일 때는 감소를 막음
    if (cartItem.quantity === 1 && quantity < 1) {
      return NextResponse.json({ error: '수량은 1보다 작을 수 없습니다.' }, { status: 400 })
    }

    // 수량 업데이트
    const updatedCartItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity: Math.max(1, quantity) },
      include: {
        product: true,
        cart: {
          include: {
            store: true
          }
        }
      }
    })

    return NextResponse.json(updatedCartItem)
  } catch (error) {
    console.error('장바구니 아이템 수정 중 오류:', error)
    return NextResponse.json({ error: '장바구니 아이템 수정 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 })
    }

    const cartItemId = (await params).id

    // 장바구니 아이템 조회 및 소유권 확인
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: {
          include: {
            store: true
          }
        }
      }
    })

    if (!cartItem) {
      return NextResponse.json({ error: '장바구니 아이템을 찾을 수 없습니다.' }, { status: 404 })
    }

    if (cartItem.cart.store.ownerId !== session.user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 장바구니 아이템 삭제
    await prisma.cartItem.delete({
      where: { id: cartItemId }
    })

    return NextResponse.json({ message: '장바구니 아이템이 삭제되었습니다.' })
  } catch (error) {
    console.error('장바구니 아이템 삭제 중 오류:', error)
    return NextResponse.json({ error: '장바구니 아이템 삭제 중 오류가 발생했습니다.' }, { status: 500 })
  }
} 