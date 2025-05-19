import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request) {
  try {
    // 인증 체크
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    const onlyFavorites = searchParams.get('favorites') === 'true';

    // 필수 파라미터 체크
    if (!storeId) {
      return NextResponse.json({ error: '스토어 ID가 필요합니다.' }, { status: 400 });
    }
    
    // 쿼리 조건 설정
    const where = {
      storeId,
      ...(onlyFavorites ? { isFavorite: true } : {})
    };

    // 총 아이템 수 조회
    const total = await prisma.aIAnalysisHistory.count({ where });

    // 히스토리 목록 조회
    const histories = await prisma.aIAnalysisHistory.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip,
      select: {
        id: true,
        title: true,
        createdAt: true,
        isFavorite: true,
        // 무거운 데이터는 제외하고 기본 정보만 전송
      },
    });

    return NextResponse.json({
      success: true,
      data: histories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('AI 히스토리 목록 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 