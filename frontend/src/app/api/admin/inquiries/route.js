import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function GET() {
  try {
    // Check admin authentication
    const session = await auth();
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }
    
    // Get all inquiries ordered by creation date (newest first)
    const inquiries = await prisma.inquiry.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json(
      { inquiries },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return NextResponse.json(
      { error: '문의 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 