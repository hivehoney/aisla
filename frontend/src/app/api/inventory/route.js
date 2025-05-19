import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 })
    }

    // Get store's inventory data with product details
    const inventoryItems = await prisma.inventory.findMany({
      where: {
        storeId: storeId
      },
      include: {
        product: {
          include: {
            category: true
          }
        }
      }
    })

    // Transform to expected format
    const formattedProducts = inventoryItems.map(item => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      category: item.product.category?.name || '기타',
      location: item.location || '-',
      receivedDate: item.receivedDate,
      expirationDate: item.expirationDate,
      // 최소 재고 수준은 현재 재고의 30%로 설정 (최소 5)
      minStockLevel: Math.max(Math.floor(item.quantity * 0.3), 5)
    }))

    // If no inventory items found, use mock data
    if (formattedProducts.length === 0) {
      return NextResponse.json({
        products: generateMockInventoryData(storeId)
      });
    }

    return NextResponse.json({
      products: formattedProducts
    })

  } catch (error) {
    console.error('Error fetching inventory data:', error)
    
    // Return mock data on error
    return NextResponse.json({
      products: generateMockInventoryData()
    });
  }
}

// Helper function to generate mock inventory data
function generateMockInventoryData(storeId) {
  const categories = ['식품', '음료', '생활용품', '전자제품', '의류'];
  const products = [
    '신선한 사과', '우유', '바나나', '커피', '주스', '라면', '과자', '물티슈', 
    '세제', '화장지', '샴푸', '칫솔', '치약', '휴대폰 충전기', '마우스', '키보드',
    '이어폰', '티셔츠', '양말', '후드티', '바지', '모자'
  ];
  const locations = ['A-1', 'A-2', 'B-1', 'B-2', 'C-1', 'C-2', 'D-1', 'D-2'];

  return Array.from({ length: 20 }, (_, index) => {
    const quantity = Math.floor(Math.random() * 30);
    const minStockLevel = Math.floor(Math.random() * 5) + 5;
    const category = categories[Math.floor(Math.random() * categories.length)];
    const name = products[index % products.length];
    const today = new Date();
    const receivedDate = new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // 1-30일 전
    const expirationDate = new Date(today.getTime() + (Math.random() * 90 + 10) * 24 * 60 * 60 * 1000); // 10-100일 후
    
    return {
      id: `product-${index + 1}`,
      name: `${name} ${index + 1}`,
      price: Math.floor(Math.random() * 50000) + 1000,
      quantity: quantity,
      category: category,
      minStockLevel: minStockLevel,
      location: locations[Math.floor(Math.random() * locations.length)],
      receivedDate: receivedDate.toISOString(),
      expirationDate: expirationDate.toISOString()
    };
  });
} 