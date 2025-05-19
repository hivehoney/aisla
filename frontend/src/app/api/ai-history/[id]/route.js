import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET(request, { params }) {
  try {
    // 인증 체크
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const id = (await params).id;

    // ID 검증
    if (!id) {
      return NextResponse.json({ error: '히스토리 ID가 필요합니다.' }, { status: 400 });
    }

    // 특정 히스토리 아이템 조회
    const history = await prisma.aIAnalysisHistory.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!history) {
      return NextResponse.json({ error: '히스토리를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 접근 권한 체크 (해당 사용자의 히스토리인지 확인)
    if (history.userId !== session.user.id) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    console.error('AI 히스토리 조회 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 즐겨찾기 상태 업데이트
export async function PATCH(request, { params }) {
  try {
    // 인증 체크
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const id = (await params).id;
    const data = await request.json();
    const { isFavorite, title } = data;

    // ID 검증
    if (!id) {
      return NextResponse.json({ error: '히스토리 ID가 필요합니다.' }, { status: 400 });
    }

    // 해당 히스토리 조회
    const history = await prisma.aIAnalysisHistory.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!history) {
      return NextResponse.json({ error: '히스토리를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 접근 권한 체크
    if (history.userId !== session.user.id) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    // 히스토리 업데이트
    const updatedHistory = await prisma.aIAnalysisHistory.update({
      where: { id },
      data: {
        ...(typeof isFavorite === 'boolean' ? { isFavorite } : {}),
        ...(title ? { title } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updatedHistory });
  } catch (error) {
    console.error('AI 히스토리 업데이트 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 히스토리 삭제
export async function DELETE(request, { params }) {
  try {
    // 인증 체크
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const id = (await params).id;

    // ID 검증
    if (!id) {
      return NextResponse.json({ error: '히스토리 ID가 필요합니다.' }, { status: 400 });
    }

    // 히스토리 조회
    const history = await prisma.aIAnalysisHistory.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!history) {
      return NextResponse.json({ error: '히스토리를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 접근 권한 체크
    if (history.userId !== session.user.id) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    // 히스토리 삭제
    await prisma.aIAnalysisHistory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('AI 히스토리 삭제 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 