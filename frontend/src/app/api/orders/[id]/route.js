import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'


// GET: 특정 발주 상세 조회
export async function GET(request, { params }) {
    try {
        // 세션 확인
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json(
                { error: '로그인이 필요합니다.' },
                { status: 401 }
            )
        }

        const orderId = (await params).id

        // 발주 조회
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                orderItems: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                code: true,
                                price: true,
                                imageUrl: true,
                                categoryId: true,
                                category: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                },
                store: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        phone: true,
                        ownerId: true
                    }
                },
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                robotTasks: {
                    include: {
                        robot: {
                            select: {
                                id: true,
                                name: true,
                                status: true
                            }
                        }
                    }
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

        // 발주 데이터 가공
        const totalAmount = order.orderItems.reduce((sum, item) => {
            return sum + (item.quantity * item.product.price)
        }, 0)

        const orderWithTotalAmount = {
            ...order,
            totalAmount
        }

        return NextResponse.json(orderWithTotalAmount)
    } catch (error) {
        console.error('Order Detail API Error:', error)
        return NextResponse.json(
            { error: '발주 상세 정보를 불러오는 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
} 