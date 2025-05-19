import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req, { params }) {
  try {
    // 세션 확인
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "거래 ID가 필요합니다." }, { status: 400 });
    }

    // 거래 정보 조회
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
                price: true,
                category: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!transaction) {
      return NextResponse.json({ error: "거래 정보를 찾을 수 없습니다." }, { status: 404 });
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

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("거래 상세 조회 오류:", error);
    return NextResponse.json({ error: "거래 상세 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
} 