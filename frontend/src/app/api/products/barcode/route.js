import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req) {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const storeId = searchParams.get('storeId')

    try {
        if (!code) {
            return NextResponse.json(
                { error: '바코드가 필요합니다.' },
                { status: 400 }
            )
        }

        const product = await prisma.product.findUnique({
            where: { code },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        })

        if (!product) {
            return NextResponse.json(
                { error: '상품을 찾을 수 없습니다.' },
                { status: 404 }
            )
        }

        if (storeId) {
            const inventory = await prisma.inventory.findFirst({
                where: {
                    storeId,
                    productId: product.id
                }
            })

            return NextResponse.json({
                product,
                inventory: inventory || { quantity: 0 }
            })
        } else {
            return NextResponse.json({
                product,
                inventory: { quantity: 0 }
            })
        }
    } catch (error) {
        console.error('바코드 조회 중 오류:', error)
        return NextResponse.json(
            { error: '상품 조회 중 오류가 발생했습니다.' },
            { status: 500 }
        )
    }
} 