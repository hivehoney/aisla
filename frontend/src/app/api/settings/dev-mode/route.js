import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma';
export async function PUT(request) {
    try {
        // Check authentication
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json(
                { error: '인증이 필요합니다.' },
                { status: 401 }
            )
        }

        // Get request body
        const { isDevMode } = await request.json()

        // Update user's dev mode setting
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { isDevMode: isDevMode }
        })

        return NextResponse.json({
            success: true,
            message: isDevMode ? "하드웨어 연동 해제" : "하드웨어 연동 활성화",
            isDevMode: updatedUser.isDevMode
        })
    } catch (error) {
        console.error('Dev mode update error:', error)
        return NextResponse.json(
            { error: '설정 업데이트 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
} 