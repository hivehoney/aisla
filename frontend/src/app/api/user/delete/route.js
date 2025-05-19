import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { auth } from "@/auth"

export async function DELETE(req) {
  try {
    const session = await auth()
    
    if (!session && !session?.user.id) { 
      return NextResponse.json(
        { error: "인증되지 않은 요청입니다." },
        { status: 401 }
      )
    }

    // 사용자 계정만 삭제하면 관련 데이터는 자동으로 삭제됨
    await prisma.user.delete({
      where: { id: session.user.id },
    })

    return NextResponse.json(
      { message: "계정이 성공적으로 삭제되었습니다." },
      { status: 200 }
    )
    
  } catch (error) {
    console.error("계정 삭제 중 오류 발생:", error)
    return NextResponse.json(
      { error: "계정 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    )
  }
} 