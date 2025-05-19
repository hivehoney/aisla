import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'


// GET: 상품 목록 조회
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
    const query = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // 스토어 ID 선택적 검사
    let storeQuery = {}
    if (storeId) {
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
    }

    // 쿼리 필터 구성
    const where = {}
    
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { code: { contains: query, mode: 'insensitive' } }
      ]
    }

    // 페이지네이션 설정
    const skip = (page - 1) * limit

    // 상품 데이터 조회
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          code: true,
          name: true,
          price: true,
          priceOriginal: true,
          imageUrl: true,
          eventType: true,
          imageTag: true,
          tags: true,
          categoryId: true,
          category: {
            select: {
              name: true
            }
          },
          // 재고 정보도 함께 조회 (해당 스토어의 재고만)
          inventories: storeId ? {
            where: { storeId },
            select: {
              id: true,
              quantity: true,
              location: true,
              expirationDate: true
            }
          } : false
        },
        skip,
        take: limit,
        orderBy: {
          name: 'asc'
        }
      }),
      prisma.product.count({ where })
    ])

    // 상품 데이터 가공 (스토어의 재고 정보 추가)
    const processedProducts = products.map(product => {
      let stockQuantity = 0
      
      if (product.inventories && product.inventories.length > 0) {
        stockQuantity = product.inventories.reduce((sum, inventory) => sum + inventory.quantity, 0)
      }
      
      return {
        ...product,
        stockQuantity
      }
    })

    return NextResponse.json({
      products: processedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Products API Error:', error)
    return NextResponse.json(
      { error: '상품 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 