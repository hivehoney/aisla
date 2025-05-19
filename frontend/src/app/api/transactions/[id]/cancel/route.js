import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(req, { params }) {
  try {
    // 세션 확인
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const id = (await params).id;
    if (!id) {
      return NextResponse.json({ error: "거래 ID가 필요합니다." }, { status: 400 });
    }

    // 거래 정보 조회
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!transaction) {
      return NextResponse.json({ error: "거래 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    // 이미 취소된 거래인지 확인
    if (transaction.paymentStatus !== 'completed') {
      return NextResponse.json({ error: "이미 취소되었거나 취소할 수 없는 거래입니다." }, { status: 400 });
    }

    // 권한 확인 (점주나 관리자만 접근 가능)
    if (session.user.role !== 'admin') {
      const store = await prisma.store.findFirst({
        where: {
          id: transaction.storeId,
          ownerId: session.user.id
        }
      });

      if (!store) {
        return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
      }
    }

    // 트랜잭션을 사용해 거래 취소 처리
    const result = await prisma.$transaction(async (tx) => {
      // 1. 거래 상태 변경
      const updatedTransaction = await tx.transaction.update({
        where: { id },
        data: {
          paymentStatus: 'cancelled'
        }
      });

      // 2. 재고 복구
      for (const item of transaction.items) {
        // 해당 상품의 재고 확인
        const inventory = await tx.inventory.findFirst({
          where: {
            storeId: transaction.storeId,
            productId: item.productId
          }
        });

        if (inventory) {
          // 재고 수량 복구
          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              quantity: {
                increment: item.quantity
              }
            }
          });
        } else {
          // 재고가 없는 경우 새로 생성
          await tx.inventory.create({
            data: {
              storeId: transaction.storeId,
              productId: item.productId,
              quantity: item.quantity
            }
          });
        }
      }

      return updatedTransaction;
    });

    return NextResponse.json({ 
      message: "거래가 성공적으로 취소되었습니다.", 
      transaction: result 
    });
  } catch (error) {
    console.error("거래 취소 오류:", error);
    return NextResponse.json({ error: "거래 취소 중 오류가 발생했습니다." }, { status: 500 });
  }
} 