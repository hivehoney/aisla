import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// POST: 여러 상품 코드를 받아 상세 정보 반환
export async function POST(request) {
    try {
        // 세션 확인
        console.log('products/details API 호출됨');
        const session = await auth()
        if (!session || !session.user) {
            console.log('API 인증 실패: 세션 없음');
            return NextResponse.json(
                { error: '로그인이 필요합니다.' },
                { status: 401 }
            )
        }

        // 요청 본문에서 상품 코드 배열 가져오기
        const requestData = await request.json();
        console.log('API 요청 데이터:', requestData);
        const { codes } = requestData;
        
        if (!codes || !Array.isArray(codes) || codes.length === 0) {
            console.log('API 요청 오류: 유효하지 않은 상품 코드 배열');
            return NextResponse.json(
                { error: '유효한 상품 코드 배열이 필요합니다.' },
                { status: 400 }
            )
        }

        // 코드 값을 문자열로 변환하고 5자리로 맞춤 (Prisma 스키마에 맞게)
        const stringCodes = codes.map(code => {
            const codeStr = code.toString();
            return codeStr.padStart(5, '0');
        });
        console.log('변환된 문자열 코드:', stringCodes);
        
        // 상품 데이터 조회
        console.log('Prisma 쿼리 실행...');
        const products = await prisma.product.findMany({
            where: {
                code: {
                    in: stringCodes
                }
            },
            select: {
                id: true,
                code: true,
                name: true,
                price: true,
                imageUrl: true,
                tags: true,
                categoryId: true,
                category: {
                    select: {
                        name: true
                    }
                },
                // 재고 정보도 함께 조회
                inventories: {
                    select: {
                        id: true,
                        quantity: true,
                        expirationDate: true,
                        storeId: true
                    }
                }
            }
        })

        // 상품 데이터 가공 (재고 정보 집계)
        const processedProducts = products.map(product => {
            // 모든 매장의 재고 총합 계산
            const totalStock = product.inventories.reduce((sum, inventory) => sum + inventory.quantity, 0)
            const expirationDate = product.inventories
                .map(inventory => inventory.expirationDate ? 
                    new Date(inventory.expirationDate).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit', 
                        day: '2-digit'
                    })
                    : '')
                .filter(date => date)
                .join(', ')
            return {
                id: product.id,
                code: product.code,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl || '',
                category: product.category?.name || '기타',
                stock: totalStock,
                expirationDate: expirationDate,
                tags: product.tags || []
            }
        })

        // CORS 헤더 설정
        const response = NextResponse.json(processedProducts);
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
        
        return response;
    } catch (error) {
        console.error('Product Details API Error:', error)
        console.error('오류 상세:', error.stack);
        return NextResponse.json(
            { error: '상품 정보를 불러오는 중 오류가 발생했습니다.', details: error.message },
            { status: 500 }
        )
    }
} 