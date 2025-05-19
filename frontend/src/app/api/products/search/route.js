import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

// Helper function to handle BigInt serialization
function handleBigIntSerialization(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => handleBigIntSerialization(item));
  }
  
  const result = { ...obj };
  for (const key in result) {
    if (typeof result[key] === 'bigint') {
      result[key] = Number(result[key]);
    } else if (typeof result[key] === 'object') {
      result[key] = handleBigIntSerialization(result[key]);
    }
  }
  return result;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const searchQuery = searchParams.get('q')
  const barcode = searchParams.get('barcode')  // 바코드 검색 파라미터 추가
  const categoryId = searchParams.get('categoryId')
  const storeId = searchParams.get('storeId')
  const hasInventory = searchParams.get('inventoryFilter') === 'true'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const isPOS = searchParams.get('isPOS') === 'true'  // POS 시스템에서의 검색 여부
  
  // 새로운 필터 파라미터
  const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')) : undefined
  const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')) : undefined
  const hasDiscount = searchParams.get('hasDiscount') === 'true'
  const expirationFilter = searchParams.get('expirationFilter')

  try {
    // 기본 검색 조건
    const baseConditions = []
    
    // 바코드 검색 조건 (정확히 일치)
    if (barcode) {
      baseConditions.push({ code: barcode })
    }
    // 일반 검색어 조건
    else if (searchQuery) {
      baseConditions.push({
        OR: [
          { name: { contains: searchQuery } }
        ]
      })
    }
    
    // 카테고리 조건
    if (categoryId && categoryId !== 'all') {
      baseConditions.push({ categoryId })
    }
    
    // 재고 필터 조건 - 재고가 있는 상품만 필터링
    if (hasInventory && storeId) {
      baseConditions.push({
        inventories: {
          some: {
            storeId: storeId,
            quantity: { gt: 0 }
          }
        }
      })
    }
    
    // 가격 범위 필터
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceCondition = {}
      if (minPrice !== undefined) priceCondition.gte = minPrice
      if (maxPrice !== undefined) priceCondition.lte = maxPrice
      baseConditions.push({ price: priceCondition })
    }
    
    // 할인 상품 필터
    if (hasDiscount) {
      baseConditions.push({ 
        priceOriginal: { not: null },
        AND: [
          { priceOriginal: { gt: 0 } },
          { price: { lt: prisma.raw('`priceOriginal`') } }
        ]
      })
    }
    
    // 유통기한 필터 (임박한 상품)
    if (expirationFilter === 'soon' && storeId) {
      const today = new Date()
      const nearFuture = new Date()
      nearFuture.setDate(nearFuture.getDate() + 7) // 7일 이내 유통기한
      
      baseConditions.push({
        inventories: {
          some: {
            storeId: storeId,
            expirationDate: {
              gte: today,
              lte: nearFuture
            }
          }
        }
      })
    }
    
    const where = {
      AND: baseConditions.length > 0 ? baseConditions : undefined
    }

    // POS 시스템에서의 간단한 검색인 경우
    if (isPOS || barcode || (searchQuery && limit <= 20)) {
      // 간소화된 쿼리 실행 (필요한 정보만 포함)
      const products = await prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        },
        take: limit
      });

      if (products.length === 0) {
        return NextResponse.json({ products: [] });
      }

      // 스토어 ID가 제공된 경우에만 재고 정보 조회
      if (storeId) {
        // 해당 스토어의 재고 정보 조회
        const productIds = products.map(product => product.id);
        let inventories = await prisma.inventory.findMany({
          where: {
            storeId,
            productId: { in: productIds }
          }
        });

        // 재고 정보를 상품 객체에 추가
        const productsWithInventory = products.map(product => {
          const inventory = inventories.find(inv => inv.productId === product.id);
          return {
            ...product,
            inventoryQuantity: inventory ? inventory.quantity : 0
          };
        });

        return NextResponse.json({ products: productsWithInventory });
      } else {
        // 스토어 ID가 없는 경우 재고 정보 없이 상품만 반환
        const productsWithoutInventory = products.map(product => ({
          ...product,
          inventoryQuantity: 0  // 재고 정보 없음
        }));

        return NextResponse.json({ products: productsWithoutInventory });
      }
    }

    // 페이지네이션 계산
    const skip = (page - 1) * limit;
    const validPage = Math.max(1, page);
    const take = limit;

    // 총 상품 수 계산
    const total = await prisma.product.count({ where });
    const totalPages = Math.ceil(total / limit);
    
    // 정렬 기준 설정
    let orderBy = {};
    
    // 정렬 방식에 따른 DB 쿼리 설정
    switch (sortBy) {
      case 'inventory-desc':
        // 재고 많은 순 정렬은 inventoryFilter=true인 경우만 허용
        if (storeId && hasInventory) {
          return await getProductsWithInventoryOrder(where, skip, take, storeId, 'desc', total, validPage, limit, totalPages);
        } else {
          // 필터가 없는 경우 기본 정렬로 대체
          return await getProductsWithQuantityOrder(where, skip, take, storeId, 'desc', total, validPage, limit, totalPages);
        }
        break;
      case 'inventory-asc':
        // 재고 적은 순 정렬은 inventoryFilter=true인 경우만 허용
        if (storeId && hasInventory) {
          return await getProductsWithInventoryOrder(where, skip, take, storeId, 'asc', total, validPage, limit, totalPages);
        } else {
          // 필터가 없는 경우 기본 정렬로 대체
          return await getProductsWithQuantityOrder(where, skip, take, storeId, 'asc', total, validPage, limit, totalPages);
        }
        break;
      case 'price-desc':
        orderBy = { price: 'desc' };
        break;
      case 'price-asc':
        orderBy = { price: 'asc' };
        break;
      case 'discount':
        // 할인율 계산을 위한 서브쿼리
        if (storeId && hasInventory) {
          return await getProductsWithDiscountOrder(where, skip, take, storeId, total, validPage, limit, totalPages);
        } else {
          return await getProductsWithDiscountOrder(where, skip, take, null, total, validPage, limit, totalPages);
        }
        break;
      case 'createdAt':
      case 'code-desc':
        orderBy = { code: 'desc' };
        break;
      default:
        orderBy = { code: 'desc' };
        break;
    }
    
    // 기본 쿼리 실행 (재고 및 유통기한 정렬이 아닌 경우)
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        code: true,
        name: true,
        price: true,
        priceOriginal: true,
        imageUrl: true,
        eventType: true,
        categoryId: true,
        imageTag: true,
        tags: true,
        quantity: true,
        location: true,
        createdAt: true, 
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true
          }
        },
        inventories: storeId ? {
          where: { storeId: storeId },
          select: {
            id: true,
            storeId: true,
            quantity: true,
            location: true,
            receivedDate: true,
            expirationDate: true
          }
        } : false
      },
      orderBy,
      skip,
      take
    });

    // 재고 정보 처리
    const productsWithInventory = products.map(product => {
      if (!storeId) {
        return {
          ...product,
          totalQuantity: 0,
          hasExpiringSoon: false,
          inventories: []
        };
      }

      const productInventories = product.inventories || [];
      const totalQuantity = productInventories.reduce((sum, inv) => sum + inv.quantity, 0);
      const hasExpiringSoon = productInventories.some(inv => {
        if (!inv.expirationDate) return false;
        const daysUntilExpiration = Math.ceil((new Date(inv.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiration <= 7 && daysUntilExpiration > 0;
      });

      return {
        ...product,
        totalQuantity,
        hasExpiringSoon,
        inventories: productInventories
      };
    });

    return NextResponse.json({
      products: productsWithInventory,
      pagination: {
        total,
        page: validPage,
        limit,
        totalPages
      }
    });

  } catch (error) {
    console.error('상품 검색 중 오류:', error)
    return NextResponse.json(
      { error: '상품 검색 중 오류가 발생했습니다.' }, 
      { status: 500 }
    )
  }
}

async function getProductsWithQuantityOrder(where, skip, take, storeId, order, total, validPage, limit, totalPages) {
  try {
    const rawQuery = Prisma.sql`
      WITH inventory_sums AS (
        SELECT 
          i."productId", 
          SUM(i.quantity) as total_quantity
        FROM "Inventory" i
        WHERE i."storeId" = ${storeId}
        GROUP BY i."productId"
      )
      SELECT 
        p.*,
        c.id as "categoryId",
        c.name as "categoryName",
        COALESCE(i.total_quantity, 0) as total_quantity
      FROM "Product" p
      LEFT JOIN inventory_sums i ON p.id = i."productId"
      LEFT JOIN "Category" c ON p."categoryId" = c.id
      WHERE ${where.AND ? Prisma.sql`1=1` : Prisma.sql`1=1`}
      ${where.AND ? Prisma.sql`AND ${Prisma.join(where.AND.map(condition => 
        getWhereCondition(condition)
      ), ' AND ')}` : Prisma.sql``}
      ORDER BY p.quantity ${order === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`}
      LIMIT ${take} OFFSET ${skip}
    `;
    
    // 한 번의 쿼리로 모든 데이터 가져오기
    const products = await prisma.$queryRaw(rawQuery);
    
    // BigInt 처리
    const processedProducts = handleBigIntSerialization(products);
    
    // 결과 데이터 구조화
    const productsWithDetails = processedProducts.map(p => {
      // 할인율 계산
      let discountRate = 0;
      if (p.priceOriginal && p.priceOriginal > p.price) {
        discountRate = Math.round((1 - p.price / p.priceOriginal) * 100);
      }
      
      // 카테고리 정보 구조화
      const category = p.categoryId ? {
        id: p.categoryId,
        name: p.categoryName
      } : null;
      
      // 기본 구조 반환
      return {
        ...p,
        category,
        categoryName: undefined, // 중복 필드 제거
        totalQuantity: Number(p.total_quantity) || 0,
        discountRate
      };
    });

    // 재고 정보 추가 (필요한 경우)
    if (storeId) {
      // 모든 제품 ID 추출
      const productIds = productsWithDetails.map(p => p.id);
      
      // 한 번의 쿼리로 모든 제품의 재고 정보 가져오기
      const inventories = await prisma.inventory.findMany({
        where: {
          productId: { in: productIds },
          storeId: storeId
        },
        select: {
          id: true,
          productId: true,
          storeId: true,
          quantity: true,
          location: true,
          receivedDate: true,
          expirationDate: true
        }
      });
      
      // 제품별 재고 정보 매핑
      const inventoryMap = {};
      inventories.forEach(inv => {
        if (!inventoryMap[inv.productId]) {
          inventoryMap[inv.productId] = [];
        }
        inventoryMap[inv.productId].push(inv);
      });
      
      // 재고 만료 정보 계산
      const finalProducts = productsWithDetails.map(product => {
        const productInventories = inventoryMap[product.id] || [];
        
        // 만료 임박 여부 확인
        const hasExpiringSoon = productInventories.some(inv => {
          if (!inv.expirationDate) return false;
          const daysUntilExpiration = Math.ceil((new Date(inv.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiration <= 7 && daysUntilExpiration > 0;
        });
        
        return {
          ...product,
          inventories: productInventories,
          hasExpiringSoon
        };
      });
      
      return NextResponse.json({
        products: finalProducts,
        pagination: {
          page: validPage,
          limit: limit,
          total: total,
          totalPages: totalPages
        }
      });
    }
    
    // 재고 정보가 필요 없는 경우
    return NextResponse.json({
      products: productsWithDetails.map(p => ({
        ...p,
        hasExpiringSoon: false,
        inventories: []
      })),
      pagination: {
        page: validPage,
        limit: limit,
        total: total,
        totalPages: totalPages
      }
    });
    
  } catch (error) {
    console.error('제품 수량 정렬 쿼리 오류:', error);
    
    // 오류 발생 시 기본 정렬 방식으로 대체
    try {
      // 기본 정렬 (code 기준)
      const products = await prisma.product.findMany({
        where,
        select: {
          id: true,
          code: true,
          name: true,
          price: true,
          priceOriginal: true,
          imageUrl: true,
          eventType: true,
          categoryId: true,
          imageTag: true,
          tags: true,
          quantity: true,
          location: true,
          createdAt: true, 
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true
            }
          },
          inventories: storeId ? {
            where: { storeId: storeId },
            select: {
              id: true,
              storeId: true,
              quantity: true,
              location: true,
              receivedDate: true,
              expirationDate: true
            }
          } : false
        },
        orderBy: { quantity: order },
        skip,
        take
      });
      
      // 제품 데이터 처리
      const productsWithInventory = products.map(product => {
        if (!storeId) {
          return {
            ...product,
            totalQuantity: 0,
            hasExpiringSoon: false,
            inventories: []
          };
        }

        const productInventories = product.inventories || [];
        const totalQuantity = productInventories.reduce((sum, inv) => sum + inv.quantity, 0);
        const hasExpiringSoon = productInventories.some(inv => {
          if (!inv.expirationDate) return false;
          const daysUntilExpiration = Math.ceil((new Date(inv.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiration <= 7 && daysUntilExpiration > 0;
        });

        // 할인율 계산
        let discountRate = 0;
        if (product.priceOriginal && product.priceOriginal > product.price) {
          discountRate = Math.round((1 - product.price / product.priceOriginal) * 100);
        }

        return {
          ...product,
          totalQuantity,
          hasExpiringSoon,
          discountRate
        };
      });
      
      return NextResponse.json({
        products: productsWithInventory,
        pagination: {
          page: validPage,
          limit: limit,
          total: total,
          totalPages: totalPages
        }
      });
    } catch (fallbackError) {
      console.error('대체 쿼리 오류:', fallbackError);
      return NextResponse.json(
        { error: '상품 검색 중 오류가 발생했습니다.' }, 
        { status: 500 }
      );
    }
  }
}

// storeid가 선택된 채로 inventory 내의 quantity 기준 정렬을 위한 함수
async function getProductsWithInventoryOrder(where, skip, take, storeId, order, total, validPage, limit, totalPages) {
  try {
    // 인벤토리 합계 및 만료 정보를 포함한 SQL 쿼리
    // 재고가 있는 상품만 표시하도록 HAVING 절 추가
    const rawQuery = Prisma.sql`
      WITH inventory_sums AS (
        SELECT 
          i."productId", 
          SUM(i.quantity) as total_quantity,
          MIN(i."expirationDate") as nearest_expiration,
          CASE 
            WHEN MIN(i."expirationDate") <= (CURRENT_DATE + INTERVAL '7 days') 
              AND MIN(i."expirationDate") >= CURRENT_DATE 
            THEN true 
            ELSE false 
          END as has_expiring_soon
        FROM "Inventory" i
        WHERE i."storeId" = ${storeId}
        GROUP BY i."productId"
        HAVING SUM(i.quantity) > 0
      )
      SELECT 
        p.*,
        c.id as "categoryId",
        c.name as "categoryName",
        i.total_quantity,
        i.has_expiring_soon
      FROM "Product" p
      JOIN inventory_sums i ON p.id = i."productId"
      LEFT JOIN "Category" c ON p."categoryId" = c.id
      WHERE ${where.AND ? Prisma.sql`1=1` : Prisma.sql`1=1`}
      ${where.AND ? Prisma.sql`AND ${Prisma.join(where.AND.map(condition => 
        getWhereCondition(condition)
      ), ' AND ')}` : Prisma.sql``}
      ORDER BY i.total_quantity ${order === 'desc' ? Prisma.sql`DESC` : Prisma.sql`ASC`}
      LIMIT ${take} OFFSET ${skip}
    `;
    
    // 쿼리 실행 및 결과 처리
    const products = await prisma.$queryRaw(rawQuery);
    const processedProducts = handleBigIntSerialization(products);
    
    // 결과 데이터 구조화
    const productsWithDetails = processedProducts.map(p => {
      // 할인율 계산
      let discountRate = 0;
      if (p.priceOriginal && p.priceOriginal > p.price) {
        discountRate = Math.round((1 - p.price / p.priceOriginal) * 100);
      }
      
      // 카테고리 정보 구조화
      const category = p.categoryId ? {
        id: p.categoryId,
        name: p.categoryName
      } : null;
      
      return {
        ...p,
        category,
        categoryName: undefined,
        totalQuantity: Number(p.total_quantity) || 0,
        hasExpiringSoon: p.has_expiring_soon || false,
        discountRate
      };
    });

    // 재고 상세 정보 가져오기
    const productIds = productsWithDetails.map(p => p.id);
    const inventories = await prisma.inventory.findMany({
      where: {
        productId: { in: productIds },
        storeId: storeId
      },
      select: {
        id: true,
        productId: true,
        storeId: true,
        quantity: true,
        location: true,
        receivedDate: true,
        expirationDate: true
      }
    });
    
    // 제품별 재고 정보 매핑
    const inventoryMap = {};
    inventories.forEach(inv => {
      if (!inventoryMap[inv.productId]) {
        inventoryMap[inv.productId] = [];
      }
      inventoryMap[inv.productId].push(inv);
    });
    
    // 최종 제품 데이터 형태로 구성
    const finalProducts = productsWithDetails.map(product => ({
      ...product,
      inventories: inventoryMap[product.id] || []
    }));
    
    return NextResponse.json({
      products: finalProducts,
      pagination: {
        page: validPage,
        limit: limit,
        total: total,
        totalPages: totalPages
      }
    });
    
  } catch (error) {
    console.error('재고 정렬 쿼리 오류:', error);
    
    // 오류 발생 시 기본 쿼리 사용
    try {
      // 재고가 있는 제품만 필터링하는 조건 추가
      const whereWithInventory = {
        ...where,
        inventories: {
          some: {
            storeId: storeId,
            quantity: { gt: 0 }
          }
        }
      };
      
      // 제품 정보 가져오기
      const products = await prisma.product.findMany({
        where: whereWithInventory,
        select: {
          id: true,
          code: true,
          name: true,
          price: true,
          priceOriginal: true,
          imageUrl: true,
          eventType: true,
          categoryId: true,
          imageTag: true,
          tags: true,
          quantity: true,
          location: true,
          createdAt: true, 
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true
            }
          },
          inventories: {
            where: { storeId: storeId },
            select: {
              id: true,
              storeId: true,
              quantity: true,
              location: true,
              receivedDate: true,
              expirationDate: true
            }
          }
        },
        skip,
        take
      });
      
      // 제품 데이터 처리
      const productsWithInventory = products.map(product => {
        const totalQuantity = product.inventories.reduce((sum, inv) => sum + inv.quantity, 0);
        
        // 만료 임박 상품 확인
        const hasExpiringSoon = product.inventories.some(inv => {
          if (!inv.expirationDate) return false;
          const daysUntilExpiration = Math.ceil((new Date(inv.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
          return daysUntilExpiration <= 7 && daysUntilExpiration > 0;
        });
        
        // 할인율 계산
        let discountRate = 0;
        if (product.priceOriginal && product.priceOriginal > product.price) {
          discountRate = Math.round((1 - product.price / product.priceOriginal) * 100);
        }

        return {
          ...product,
          totalQuantity,
          hasExpiringSoon,
          discountRate
        };
      });
      
      // 정렬 적용
      productsWithInventory.sort((a, b) => {
        if (order === 'desc') {
          return b.totalQuantity - a.totalQuantity;
        } else {
          return a.totalQuantity - b.totalQuantity;
        }
      });
      
      // 전체 개수 다시 계산
      const totalInventoryProducts = await prisma.product.count({
        where: whereWithInventory
      });
      
      return NextResponse.json({
        products: productsWithInventory,
        pagination: {
          page: validPage,
          limit: limit,
          total: totalInventoryProducts,
          totalPages: Math.ceil(totalInventoryProducts / limit)
        }
      });
    } catch (fallbackError) {
      console.error('대체 쿼리 오류:', fallbackError);
      return NextResponse.json(
        { error: '상품 검색 중 오류가 발생했습니다.' }, 
        { status: 500 }
      );
    }
  }
}

// SQL 조건절 생성 헬퍼 함수
function getWhereCondition(condition) {
  // 간단한 구현 - 실제 구현에서는 복잡한 조건도 처리 필요
  if (condition.categoryId) {
    return Prisma.sql`p."categoryId" = ${condition.categoryId}`;
  }
  // 다른 조건들도 필요에 따라 구현
  return Prisma.sql`1=1`; 
}

// 할인율 기준 정렬을 위한 함수
async function getProductsWithDiscountOrder(where, skip, take, storeId, total, validPage, limit, totalPages) {
  try {
    // SQL 쿼리를 통해 바로 할인율을 계산하여 정렬
    const rawQuery = Prisma.sql`
      WITH discount_calc AS (
        SELECT 
          p.*,
          c.id as "categoryId",
          c.name as "categoryName",
          CASE 
            WHEN p."priceOriginal" IS NOT NULL AND p."priceOriginal" > 0 AND p.price < p."priceOriginal" 
            THEN ROUND((1 - p.price / p."priceOriginal"::float) * 100) 
            ELSE 0 
          END as discount_rate
        FROM "Product" p
        LEFT JOIN "Category" c ON p."categoryId" = c.id
        WHERE p."priceOriginal" IS NOT NULL 
          AND p."priceOriginal" > 0 
          AND p.price < p."priceOriginal"
          ${where.AND ? Prisma.sql`AND ${Prisma.join(where.AND.map(condition => 
            getWhereCondition(condition)
          ), ' AND ')}` : Prisma.sql``}
          ${storeId ? Prisma.sql`AND EXISTS (
            SELECT 1 FROM "Inventory" i
            WHERE i."productId" = p.id AND i."storeId" = ${storeId} AND i.quantity > 0
          )` : Prisma.sql``}
      )
      SELECT * FROM discount_calc
      ORDER BY discount_rate DESC
      LIMIT ${take} OFFSET ${skip}
    `;
    
    // SQL을 통해 할인 상품 수 계산
    const countQuery = Prisma.sql`
      SELECT COUNT(*) as total_count
      FROM "Product" p
      WHERE p."priceOriginal" IS NOT NULL 
        AND p."priceOriginal" > 0 
        AND p.price < p."priceOriginal"
        ${where.AND ? Prisma.sql`AND ${Prisma.join(where.AND.map(condition => 
          getWhereCondition(condition)
        ), ' AND ')}` : Prisma.sql``}
        ${storeId ? Prisma.sql`AND EXISTS (
          SELECT 1 FROM "Inventory" i
          WHERE i."productId" = p.id AND i."storeId" = ${storeId} AND i.quantity > 0
        )` : Prisma.sql``}
    `;
    
    // 병렬로 두 쿼리 실행
    const [products, countResult] = await Promise.all([
      prisma.$queryRaw(rawQuery),
      prisma.$queryRaw(countQuery)
    ]);
    
    // 할인 상품 총 개수 추출
    const discountProductsCount = Number(countResult[0].total_count);
    
    // BigInt 처리
    const processedProducts = handleBigIntSerialization(products);
    
    // 기본 제품 데이터 구조화
    const processedWithCategory = processedProducts.map(p => {
      const category = p.categoryId ? {
        id: p.categoryId,
        name: p.categoryName
      } : null;
      
      return {
        ...p,
        category,
        categoryName: undefined,
        discountRate: Number(p.discount_rate),
        discount_rate: undefined
      };
    });
    
    // 재고 정보가 필요한 경우
    if (storeId) {
      // 모든 제품 ID 추출
      const productIds = processedWithCategory.map(p => p.id);
      
      if (productIds.length === 0) {
        return NextResponse.json({
          products: [],
          pagination: {
            page: validPage,
            limit: limit,
            total: discountProductsCount,
            totalPages: Math.ceil(discountProductsCount / limit) || 1
          }
        });
      }
      
      // 한 번의 쿼리로 모든 제품의 재고 정보 가져오기
      const inventories = await prisma.inventory.findMany({
        where: {
          productId: { in: productIds },
          storeId: storeId
        },
        select: {
          id: true,
          productId: true,
          storeId: true,
          quantity: true,
          location: true,
          receivedDate: true,
          expirationDate: true
        }
      });
      
      // 제품별 재고 정보 및 만료 정보 계산
      const inventoryMap = {};
      const expirationMap = {};
      const quantityMap = {};
      
      inventories.forEach(inv => {
        // 재고 정보 매핑
        if (!inventoryMap[inv.productId]) {
          inventoryMap[inv.productId] = [];
          quantityMap[inv.productId] = 0;
          expirationMap[inv.productId] = false;
        }
        
        inventoryMap[inv.productId].push(inv);
        quantityMap[inv.productId] += inv.quantity;
        
        // 만료 임박 체크
        if (!expirationMap[inv.productId] && inv.expirationDate) {
          const today = new Date();
          const expirationDate = new Date(inv.expirationDate);
          const daysUntilExpiration = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiration <= 7 && daysUntilExpiration > 0) {
            expirationMap[inv.productId] = true;
          }
        }
      });
      
      // 최종 제품 데이터 구성
      const productsWithInventory = processedWithCategory.map(product => ({
        ...product,
        inventories: inventoryMap[product.id] || [],
        totalQuantity: quantityMap[product.id] || 0,
        hasExpiringSoon: expirationMap[product.id] || false
      }));
      
      return NextResponse.json({
        products: productsWithInventory,
        pagination: {
          page: validPage,
          limit: limit,
          total: discountProductsCount,
          totalPages: Math.ceil(discountProductsCount / limit) || 1
        }
      });
    }
    
    // 재고 정보가 필요없는 경우
    return NextResponse.json({
      products: processedWithCategory.map(p => ({
        ...p,
        totalQuantity: 0,
        hasExpiringSoon: false,
        inventories: []
      })),
      pagination: {
        page: validPage,
        limit: limit,
        total: discountProductsCount,
        totalPages: Math.ceil(discountProductsCount / limit) || 1
      }
    });
    
  } catch (error) {
    console.error('할인율 정렬 쿼리 오류:', error);
    
    // 오류 발생 시 대체 방식으로 조회
    try {
      // 할인 필터를 적용한 상품 조회
      const discountWhere = {
        AND: [
          ...where.AND || [],
          {
            priceOriginal: { not: null },
            AND: [
              { priceOriginal: { gt: 0 } },
              { price: { lt: prisma.raw('`priceOriginal`') } }
            ]
          }
        ]
      };
      
      // 스토어 ID가 있는 경우 해당 스토어의 재고가 있는 상품만 필터링
      if (storeId) {
        discountWhere.AND.push({
          inventories: {
            some: {
              storeId: storeId,
              quantity: { gt: 0 }
            }
          }
        });
      }
      
      const products = await prisma.product.findMany({
        where: discountWhere,
        select: {
          id: true,
          code: true,
          name: true,
          price: true,
          priceOriginal: true,
          imageUrl: true,
          eventType: true,
          categoryId: true,
          imageTag: true,
          tags: true,
          quantity: true,
          location: true,
          createdAt: true, 
          updatedAt: true,
          category: {
            select: {
              id: true,
              name: true
            }
          },
          inventories: storeId ? {
            where: { storeId: storeId },
            select: {
              id: true,
              storeId: true,
              quantity: true,
              location: true,
              receivedDate: true,
              expirationDate: true
            }
          } : false
        }
      });
      
      // 할인율 계산 및 정렬
      const productsWithDiscount = products
        .map(product => {
          // 재고 및 만료 정보 계산
          let totalQuantity = 0;
          let hasExpiringSoon = false;
          
          if (product.inventories && product.inventories.length > 0) {
            totalQuantity = product.inventories.reduce((sum, inv) => sum + inv.quantity, 0);
            
            const today = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            
            hasExpiringSoon = product.inventories.some(inv => {
              if (!inv.expirationDate) return false;
              const expDate = new Date(inv.expirationDate);
              return expDate >= today && expDate <= nextWeek;
            });
          }
          
          // 할인율 계산
          const discountRate = Math.round((1 - product.price / product.priceOriginal) * 100);
          
          return {
            ...product,
            totalQuantity,
            hasExpiringSoon,
            discountRate
          };
        })
        .sort((a, b) => b.discountRate - a.discountRate);
      
      // 총 상품 수
      const discountProductsCount = productsWithDiscount.length;
      
      // 페이지네이션 적용
      const paginatedProducts = productsWithDiscount.slice(skip, skip + take);
      
      return NextResponse.json({
        products: paginatedProducts,
        pagination: {
          page: validPage,
          limit: limit,
          total: discountProductsCount,
          totalPages: Math.ceil(discountProductsCount / limit) || 1
        }
      });
    } catch (fallbackError) {
      console.error('대체 쿼리 오류:', fallbackError);
      return NextResponse.json(
        { error: '할인 상품 검색 중 오류가 발생했습니다.' }, 
        { status: 500 }
      );
    }
  }
}   