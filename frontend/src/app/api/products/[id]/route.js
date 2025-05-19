import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    // 쿼리 파라미터에서 storeId 추출
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    
    // 상품 조회
    const product = await prisma.product.findUnique({
      where: { id: (await params).id },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        inventories: storeId ? {
          where: { storeId },
          select: {
            id: true,
            quantity: true,
            location: true,
            receivedDate: true,
            expirationDate: true
          }
        } : false,
        // Get transaction items to show sales history instead of using non-existent sales relation
        transactionItems: {
          take: 5,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            quantity: true,
            price: true,
            amount: true,
            createdAt: true,
            transaction: {
              select: {
                transactionTime: true
              }
            }
          }
        }
      }
    });

    // 결과가 없는 경우 404 응답
    if (!product) {
      return NextResponse.json(
        { error: '상품을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Format the transaction data to match the expected sales format
    const formattedProduct = {
      ...product,
      sales: product.transactionItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        totalAmount: item.amount,
        saleTime: item.transaction?.transactionTime || item.createdAt
      })),
      // Remove transactionItems from the response to avoid duplication
      transactionItems: undefined
    };

    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error('Product API Error:', error);
    return NextResponse.json(
      { error: '상품 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 