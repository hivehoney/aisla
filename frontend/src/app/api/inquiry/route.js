import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // Create inquiry in the database
    const inquiry = await prisma.inquiry.create({
      data: {
        subject: `${name}님의 문의`,
        message: `보낸사람: ${name} (${email})\n\n${message}`,
        status: 'pending',
      },
    });

    return NextResponse.json(
      { success: true, inquiry: inquiry },
      { status: 201 }
    );
  } catch (error) {
    console.error('Inquiry submission error:', error);
    return NextResponse.json(
      { error: '문의 제출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 