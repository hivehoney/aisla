import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET: 발주 목록 조회
export async function GET(request) {
  try {
    // 세션 확인
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // URL 쿼리 파라미터 가져오기
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')

    // 스토어 ID 필수
    if (!storeId) {
      return NextResponse.json(
        { error: '스토어 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 스토어 접근 권한 확인
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { ownerId: true }
    })
    
    if (!store) {
      return NextResponse.json(
        { error: '스토어를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }
    
    if (store.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 쿼리 필터 구성
    const where = { storeId }
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } }
      ]
    }

    // 정렬 기준 설정
    const validSortFields = ['createdAt', 'updatedAt', 'status']
    const orderBy = {}
    
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc'
    } else {
      orderBy.createdAt = 'desc'
    }

    // 페이지네이션 설정
    const skip = (page - 1) * limit

    // 발주 데이터 조회
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          orderItems: {
            select: {
              id: true,
              quantity: true,
              status: true,
              productId: true,
              product: {
                select: {
                  name: true,
                  price: true,
                  imageUrl: true
                }
              }
            }
          },
          store: {
            select: {
              name: true,
              address: true
            }
          },
          creator: {
            select: {
              name: true,
              email: true
            }
          },
          robotTasks: {
            select: {
              id: true,
              status: true,
              robotId: true,
              quantity: true,
              startTime: true,
              endTime: true,
              robot: {
                select: {
                  name: true,
                  status: true
                }
              }
            }
          }
        }
      }),
      prisma.order.count({ where })
    ])

    // 발주 데이터 가공
    const processedOrders = orders.map(order => {
      // 발주 항목의 총액 계산
      const totalAmount = order.orderItems.reduce((sum, item) => {
        return sum + (item.quantity * item.product.price)
      }, 0)

      return {
        ...order,
        totalAmount
      }
    })

    return NextResponse.json({
      orders: processedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Orders API Error:', error)
    return NextResponse.json(
      { error: '발주 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// POST: 발주 생성
export async function POST(request) {
  try {
    // 세션 확인
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 요청 데이터 파싱
    const body = await request.json()
    const { storeId, items, type = 'manual' } = body
    
    // 유효성 검사
    if (!storeId) {
      return NextResponse.json(
        { error: '스토어 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: '발주 항목이 필요합니다.' },
        { status: 400 }
      )
    }

    // 스토어 접근 권한 확인
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { ownerId: true }
    })
    
    if (!store) {
      return NextResponse.json(
        { error: '스토어를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }
    
    if (store.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 발주 생성
    const order = await prisma.order.create({
      data: {
        storeId,
        creatorId: session.user.id,
        type,
        status: 'pending',
        orderItems: {
          create: await Promise.all(items.map(async item => {
            // 상품 정보 조회하여 가격 정보 가져오기
            const product = await prisma.product.findUnique({
              where: { id: item.productId },
              select: { price: true }
            });
            
            if (!product) {
              throw new Error(`상품을 찾을 수 없습니다: ${item.productId}`);
            }
            
            return {
              productId: item.productId,
              quantity: item.quantity,
              price: product.price, // 상품의 현재 가격 정보 추가
              status: 'pending'
            };
          }))
        }
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                price: true
              }
            }
          }
        }
      }
    })

    // 장바구니 비우기
    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId: session.user.id,
          storeId
        }
      }
    })

    // 발주 총액 계산
    const totalAmount = order.orderItems.reduce((sum, item) => {
      return sum + (item.quantity * item.product.price)
    }, 0)

    return NextResponse.json({
      id: order.id,
      status: order.status,
      type: order.type,
      createdAt: order.createdAt,
      totalAmount,
      orderItems: order.orderItems.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        status: item.status,
        productName: item.product.name,
        productPrice: item.product.price
      })),
      message: '발주가 성공적으로 생성되었습니다.'
    })
  } catch (error) {
    console.error('발주 생성 API 오류:', error)
    return NextResponse.json(
      { error: '발주 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 