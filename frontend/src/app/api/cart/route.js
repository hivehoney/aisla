import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// 장바구니 조회
export async function GET(request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    if (!storeId) {
      return NextResponse.json({ error: '스토어 ID가 필요합니다.' }, { status: 400 })
    }

    const cart = await prisma.cart.findFirst({
      where: {
        userId: session.user.id,
        storeId: storeId
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
                price: true,
                imageUrl: true,
                imageTag: true,
                tags: true
              }
            }
          }
        }
      }
    })

    if (!cart) {
      return NextResponse.json({ items: [], total: 0 })
    }

    // 장바구니 총 가격 계산
    const total = cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity)
    }, 0)

    // 총 가격을 포함한 응답 반환
    return NextResponse.json({
      ...cart,
      total
    })
  } catch (error) {
    console.error('장바구니 조회 중 오류:', error)
    return NextResponse.json({ 
      error: '장바구니 조회 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}

// 장바구니에 상품 추가
export async function POST(request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 })
    }

    const { storeId, productId, quantity = 1 } = await request.json()
    if (!storeId || !productId) {
      return NextResponse.json({ error: '스토어 ID와 상품 ID가 필요합니다.' }, { status: 400 })
    }

    // 기존 장바구니 확인
    let cart = await prisma.cart.findFirst({
      where: {
        userId: session.user.id,
        storeId: storeId
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
                price: true,
                imageUrl: true,
                imageTag: true,
                tags: true
              }
            }
          }
        }
      }
    })

    // 장바구니가 없으면 새로 생성
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session.user.id,
          storeId: storeId,
          items: {
            create: {
              productId: productId,
              quantity: quantity
            }
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  price: true,
                  imageUrl: true,
                  imageTag: true,
                  tags: true
                }
              }
            }
          }
        }
      })
    } else {
      // 이미 장바구니에 있는 상품인지 확인
      const existingItem = cart.items.find(item => item.productId === productId)
      
      if (existingItem) {
        // 기존 상품 수량 업데이트
        cart = await prisma.cart.update({
          where: { id: cart.id },
          data: {
            items: {
              update: {
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + quantity }
              }
            }
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    price: true,
                    imageUrl: true,
                    imageTag: true,
                    tags: true
                  }
                }
              }
            }
          }
        })
      } else {
        // 새 상품 추가
        cart = await prisma.cart.update({
          where: { id: cart.id },
          data: {
            items: {
              create: {
                productId: productId,
                quantity: quantity
              }
            }
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    price: true,
                    imageUrl: true,
                    imageTag: true,
                    tags: true
                  }
                }
              }
            }
          }
        })
      }
    }

    // 장바구니 총 가격 계산
    const total = cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity)
    }, 0)

    // 총 가격을 포함한 응답 반환
    return NextResponse.json({
      ...cart,
      total
    })
  } catch (error) {
    console.error('장바구니 추가 중 오류:', error)
    return NextResponse.json({ 
      error: '장바구니 추가 중 오류가 발생했습니다.' 
    }, { status: 500 })
  }
} 