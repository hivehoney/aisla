import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req) {
  try {
    // 세션 확인
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const paymentMethod = searchParams.get("paymentMethod");
    const status = searchParams.get("status");
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!storeId) {
      return NextResponse.json({ error: "스토어 ID가 필요합니다." }, { status: 400 });
    }

    // 스토어 접근 권한 확인 (점주나 관리자인 경우)
    if (session.user.role !== 'admin') {
      const store = await prisma.store.findFirst({
        where: {
          id: storeId,
          ownerId: session.user.id
        }
      });

      if (!store) {
        return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
      }
    }

    // 기본 조건
    const whereConditions = {
      storeId: storeId
    };

    // 날짜 범위 조건
    if (fromDate || toDate) {
      whereConditions.transactionTime = {};
      
      if (fromDate) {
        whereConditions.transactionTime.gte = new Date(fromDate);
      }
      
      if (toDate) {
        // 종료일은 해당 일의 23:59:59까지 포함
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        whereConditions.transactionTime.lte = endDate;
      }
    }

    // 결제 방법 조건
    if (paymentMethod) {
      whereConditions.paymentMethod = paymentMethod;
    }

    // 상태 조건
    if (status) {
      whereConditions.paymentStatus = status;
    }

    // 정렬 조건
    let orderBy = {};
    switch (sort) {
      case "newest":
        orderBy = { transactionTime: "desc" };
        break;
      case "oldest":
        orderBy = { transactionTime: "asc" };
        break;
      case "amount-desc":
        orderBy = { totalAmount: "desc" };
        break;
      case "amount-asc":
        orderBy = { totalAmount: "asc" };
        break;
      default:
        orderBy = { transactionTime: "desc" };
    }

    // 전체 거래 수 조회
    const totalCount = await prisma.transaction.count({
      where: whereConditions
    });

    // 페이지네이션 계산
    const skip = (page - 1) * limit;

    // 거래 내역 조회
    const transactions = await prisma.transaction.findMany({
      where: whereConditions,
      orderBy,
      skip,
      take: limit,
      include: {
        items: {
          select: {
            id: true,
            quantity: true,
          }
        }
      }
    });

    // 페이지네이션 정보와 함께 응답
    return NextResponse.json({
      transactions,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error("거래 내역 조회 오류:", error);
    return NextResponse.json({ error: "거래 내역 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
} 