import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request) {
  try {
    // 인증 체크
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    // 필수 파라미터 체크
    if (!storeId) {
      return NextResponse.json({ error: '스토어 ID가 필요합니다.' }, { status: 400 });
    }

    // 스토어 존재 여부 및 권한 확인
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, ownerId: true }
    });

    if (!store) {
      return NextResponse.json({ error: '스토어를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (store.ownerId !== session.user.id) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 });
    }

    // 현재 날짜와 한 달 전 날짜 계산
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // 1. 평균 발주 주기 계산
    const orders = await prisma.order.findMany({
      where: {
        storeId,
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth() - 6, 1) // 최근 6개월 데이터
        },
        status: 'completed'
      },
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    let avgOrderCycle = 0;
    if (orders.length > 1) {
      let totalDays = 0;
      for (let i = 1; i < orders.length; i++) {
        const dayDiff = Math.floor((orders[i].createdAt - orders[i-1].createdAt) / (1000 * 60 * 60 * 24));
        totalDays += dayDiff;
      }
      avgOrderCycle = parseFloat((totalDays / (orders.length - 1)).toFixed(1));
    }

    // 2. 월 평균 발주액 계산
    const monthlyOrders = await prisma.order.findMany({
      where: {
        storeId,
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth() - 6, 1) // 최근 6개월 데이터
        },
        status: 'completed'
      },
      include: {
        orderItems: {
          select: {
            quantity: true,
            price: true
          }
        }
      }
    });

    let totalOrderAmount = 0;
    monthlyOrders.forEach(order => {
      order.orderItems.forEach(item => {
        totalOrderAmount += item.quantity * item.price;
      });
    });

    // 6개월간의 월 평균 계산
    const avgMonthlyOrderAmount = monthlyOrders.length > 0 
      ? parseInt(totalOrderAmount / 6)
      : 0;

    // 3. 재고 회전율 계산 (월 평균 판매량 / 평균 재고)
    // 판매 데이터(Transactions)
    const transactions = await prisma.transaction.findMany({
      where: {
        storeId,
        transactionTime: {
          gte: oneMonthAgo
        }
      },
      include: {
        items: true
      }
    });

    // 현재 재고 데이터
    const inventory = await prisma.inventory.findMany({
      where: {
        storeId
      },
      select: {
        productId: true,
        quantity: true
      }
    });

    // 제품별 판매 수량 집계
    const productSales = {};
    transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = 0;
        }
        productSales[item.productId] += item.quantity;
      });
    });

    // 총 판매량과 현재 재고 합계
    const totalSales = Object.values(productSales).reduce((sum, qty) => sum + qty, 0);
    const totalInventory = inventory.reduce((sum, item) => sum + item.quantity, 0);

    // 재고 회전율 계산 (월별)
    const inventoryTurnover = totalInventory > 0 
      ? parseFloat((totalSales / totalInventory).toFixed(1))
      : 0;

    // 4. 품절률 계산 (품절 상품 수 / 전체 상품 수)
    const allProducts = await prisma.product.count({
      where: {
        inventories: {
          some: {
            storeId
          }
        }
      }
    });

    const outOfStockProducts = await prisma.inventory.count({
      where: {
        storeId,
        quantity: 0
      }
    });

    const outOfStockRate = allProducts > 0 
      ? parseFloat(((outOfStockProducts / allProducts) * 100).toFixed(1))
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        avgOrderCycle,          // 평균 발주 주기 (일)
        avgMonthlyOrderAmount,  // 월 평균 발주액 (원)
        inventoryTurnover,      // 재고 회전율 (회/월)
        outOfStockRate          // 품절률 (%)
      }
    });

  } catch (error) {
    console.error('스토어 통계 정보 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 