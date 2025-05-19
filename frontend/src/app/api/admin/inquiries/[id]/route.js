import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request, { params }) {
  try {
    const id = (await params).id;
    
    // Check admin authentication
    const session = await auth();
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }
    
    // Get inquiry by ID
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
    });
    
    if (!inquiry) {
      return NextResponse.json(
        { error: '문의를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { inquiry },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching inquiry:', error);
    return NextResponse.json(
      { error: '문의를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const id = (await params).id;
    
    // Check admin authentication
    const session = await auth();
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { status, response } = body;
    
    // At least one field must be provided
    if (!status && !response) {
      return NextResponse.json(
        { error: '업데이트할 정보가 제공되지 않았습니다.' },
        { status: 400 }
      );
    }
    
    // Prepare update data
    const updateData = {};
    if (status) updateData.status = status;
    if (response) updateData.response = response;
    
    // Update inquiry
    const updatedInquiry = await prisma.inquiry.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json(
      { success: true, inquiry: updatedInquiry },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating inquiry:', error);
    
    // Handle not found error
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: '문의를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: '문의 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 