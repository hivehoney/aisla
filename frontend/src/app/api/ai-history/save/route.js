import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request) {
  try {
    // 인증 체크
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const data = await request.json();
    const { 
      storeId, 
      response, 
      systemMessages, 
      recommendations,
      inventoryRecommendations,
      title
    } = data;

    // 필수 필드 검증
    if (!storeId) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    // AI 분석 히스토리 저장
    const aiHistory = await prisma.aIAnalysisHistory.create({
      data: {
        storeId,
        userId: session.user.id,
        response: response || '',
        systemMessages: systemMessages || [],
        recommendations: recommendations || [],
        inventoryRecommendations: inventoryRecommendations || [],
        title: title || `AI 분석 ${new Date().toLocaleDateString('ko-KR')}`,
      },
    });

    return NextResponse.json({ success: true, data: aiHistory });
  } catch (error) {
    console.error('AI 히스토리 저장 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 