import { NextResponse } from "next/server"
import {prisma} from "@/lib/prisma"
import { auth } from "@/auth";

export async function POST(req) {
  try {
    // 세션 사용자 확인
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "미인증된 요청입니다." }, { status: 401 })
    }

    // 요청 데이터 파싱
    const data = await req.json()
    const { storeId, items, paymentMethod, totalAmount, updateInventory = true } = data

    // 기본 유효성 검사
    if (!storeId) {
      return NextResponse.json({ message: "스토어 ID가 필요합니다." }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: "상품 목록이 필요합니다." }, { status: 400 })
    }

    if (!paymentMethod) {
      return NextResponse.json({ message: "결제 방법이 필요합니다." }, { status: 400 })
    }

    // 스토어 접근 권한 확인 (점주 또는 관리자)
    if (session.user.role !== 'admin') {
      const store = await prisma.store.findFirst({
        where: {
          id: storeId,
          ownerId: session.user.id
        }
      })

      if (!store) {
        return NextResponse.json({ message: "해당 스토어에 대한 접근 권한이 없습니다." }, { status: 403 })
      }
    }

    // 트랜잭션 생성
    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Transaction 생성
      const newTransaction = await tx.transaction.create({
        data: {
          storeId,
          userId: session.user.id,
          totalAmount,
          paymentMethod,
          paymentStatus: "completed",
          transactionTime: new Date(),
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              amount: item.amount || (item.quantity * item.price)
            }))
          }
        },
        include: {
          items: true
        }
      })

      // 2. 재고 업데이트 (updateInventory가 true인 경우)
      if (updateInventory) {
        for (const item of items) {
          // 현재 재고 확인
          const inventory = await tx.inventory.findFirst({
            where: {
              storeId,
              productId: item.productId
            }
          })

          if (inventory) {
            // 재고가 있는 경우 수량 업데이트
            await tx.inventory.update({
              where: {
                id: inventory.id
              },
              data: {
                quantity: {
                  decrement: item.quantity
                }
              }
            })
          } else {
            // 재고가 없는 경우 경고만 로그로 남김 (트랜잭션 실패하지 않음)
            console.warn(`재고 없음: 스토어 ${storeId}, 상품 ${item.productId}`)
          }
        }
      }

      // 3. Sale 데이터 생성 (기존 Sale 모델 호환성 유지)
      for (const item of items) {
        await tx.sale.create({
          data: {
            productId: item.productId,
            storeId,
            quantity: item.quantity,
            price: item.price,
            totalAmount: item.amount || (item.quantity * item.price),
            paymentMethod
          }
        })
      }

      return newTransaction
    })

    return NextResponse.json({
      message: "거래가 성공적으로 완료되었습니다.",
      transaction
    })
  } catch (error) {
    console.error("거래 처리 중 오류:", error)
    return NextResponse.json({ message: `거래 처리 중 오류: ${error.message}` }, { status: 500 })
  }
} 