import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'


// PUT: 발주 상태 업데이트
export async function PUT(request, { params }) {
  try {
    // 세션 확인
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const orderId = (await params).id
    const { status } = await request.json()

    // 상태값 유효성 검사
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태값입니다.' },
        { status: 400 }
      )
    }

    // 발주 조회
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        store: {
          select: { ownerId: true }
        }
      }
    })

    // 발주가 존재하지 않는 경우
    if (!order) {
      return NextResponse.json(
        { error: '발주를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 접근 권한 확인 (발주 스토어 소유자만 접근 가능)
    if (order.store.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: '접근 권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 발주 상태 업데이트
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status,
        updatedAt: new Date()
      },
      include: {
        orderItems: {
          select: {
            id: true,
            quantity: true,
            productId: true
          }
        }
      }
    })

    // 발주 항목 상태 일괄 업데이트
    if (status === 'completed' || status === 'cancelled') {
      await prisma.orderItem.updateMany({
        where: { orderId },
        data: { status }
      })
    } else if (status === 'processing') {
      await prisma.orderItem.updateMany({
        where: { 
          orderId,
          status: 'pending'
        },
        data: { status: 'processing' }
      })
    }

    // 완료 상태로 변경할 경우 로봇 태스크 처리 및 인벤토리 업데이트
    if (status === 'completed') {
      // 로봇 태스크 완료 처리
      await prisma.robotTask.updateMany({
        where: { 
          orderId,
          status: { in: ['pending', 'processing'] }
        },
        data: { 
          status: 'completed',
          endTime: new Date()
        }
      })

      // 인벤토리에 재고 추가
      for (const item of updatedOrder.orderItems) {
        // 기존 인벤토리 확인
        const inventory = await prisma.inventory.findFirst({
          where: {
            storeId: order.storeId,
            productId: item.productId
          }
        })

        if (inventory) {
          // 기존 인벤토리 업데이트
          await prisma.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: inventory.quantity + item.quantity,
              updatedAt: new Date()
            }
          })
        } else {
          // 새 인벤토리 생성
          await prisma.inventory.create({
            data: {
              storeId: order.storeId,
              productId: item.productId,
              quantity: item.quantity,
              location: 'Default',
              receivedDate: new Date()
            }
          })
        }
      }
    }

    return NextResponse.json({
      id: updatedOrder.id,
      status: updatedOrder.status,
      message: `발주 상태가 ${status}로 변경되었습니다.`
    })
  } catch (error) {
    console.error('Order Status Update API Error:', error)
    return NextResponse.json(
      { error: '발주 상태 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 