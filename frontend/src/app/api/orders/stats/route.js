import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/auth'

const prisma = new PrismaClient()

// GET: 스토어별 발주 상태 통계 조회
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

    // 각 상태별 발주 수 계산
    const [pending, processing, completed, cancelled, total, recentOrders, totalRobotTasks] = await Promise.all([
      // 대기 중인 발주
      prisma.order.count({
        where: {
          storeId,
          status: 'pending'
        }
      }),
      
      // 처리 중인 발주
      prisma.order.count({
        where: {
          storeId,
          status: 'processing'
        }
      }),
      
      // 완료된 발주
      prisma.order.count({
        where: {
          storeId,
          status: 'completed'
        }
      }),
      
      // 취소된 발주
      prisma.order.count({
        where: {
          storeId,
          status: 'cancelled'
        }
      }),
      
      // 전체 발주
      prisma.order.count({
        where: { storeId }
      }),
      
      // 최근 발주 금액 총합 (최근 30일)
      prisma.order.findMany({
        where: {
          storeId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 최근 30일
          }
        },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  price: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10 // 최근 10개만
      }),
      
      // 전체 로봇 작업 수
      prisma.robotTask.count({
        where: {
          order: {
            storeId
          }
        }
      })
    ])

    // 최근 발주 금액 총합 계산
    const recentOrdersAmount = recentOrders.reduce((sum, order) => {
      const orderAmount = order.orderItems.reduce((itemSum, item) => {
        return itemSum + (item.quantity * item.product.price)
      }, 0)
      return sum + orderAmount
    }, 0)

    // 로봇 작업 상태별 통계
    const robotTaskStats = await prisma.$queryRaw`
      SELECT 
        status, 
        COUNT(*) as count 
      FROM 
        "RobotTask" 
      WHERE 
        "orderId" IN (SELECT id FROM "Order" WHERE "storeId" = ${storeId})
      GROUP BY 
        status
    `

    return NextResponse.json({
      storeId,
      pending,
      processing,
      completed,
      cancelled,
      total,
      recentOrdersAmount,
      totalRobotTasks,
      robotTaskStats: robotTaskStats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.count)
        return acc
      }, {})
    })
  } catch (error) {
    console.error('Order Stats API Error:', error)
    return NextResponse.json(
      { error: '발주 통계를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 