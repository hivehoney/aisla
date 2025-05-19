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
    const timeRange = searchParams.get('timeRange') || 'week' // day, week, month, quarter, year
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 })
    }

    // Calculate date range based on timeRange
    let dateFilter = {}
    const now = new Date()
    
    if (startDate && endDate) {
      dateFilter = {
        transactionTime: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    } else {
      // Create a new date object for each case to avoid mutation issues
      switch (timeRange) {
        case 'day': {
          const startDate = new Date()
          startDate.setHours(0, 0, 0, 0)
          dateFilter = {
            transactionTime: {
              gte: startDate
            }
          }
          break
        }
        case 'week': {
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - 7)
          dateFilter = {
            transactionTime: {
              gte: startDate
            }
          }
          break
        }
        case 'month': {
          const startDate = new Date()
          startDate.setMonth(startDate.getMonth() - 1)
          dateFilter = {
            transactionTime: {
              gte: startDate
            }
          }
          break
        }
        case 'quarter': {
          const startDate = new Date()
          startDate.setMonth(startDate.getMonth() - 3)
          dateFilter = {
            transactionTime: {
              gte: startDate
            }
          }
          break
        }
        case 'year': {
          const startDate = new Date()
          startDate.setFullYear(startDate.getFullYear() - 1)
          dateFilter = {
            transactionTime: {
              gte: startDate
            }
          }
          break
        }
        default: {
          const startDate = new Date()
          startDate.setDate(startDate.getDate() - 7)
          dateFilter = {
            transactionTime: {
              gte: startDate
            }
          }
        }
      }
    }

    // Get total sales
    const totalSales = await prisma.transaction.aggregate({
      where: {
        storeId,
        ...dateFilter,
        paymentStatus: 'completed'
      },
      _sum: {
        totalAmount: true
      }
    })

    // Get sales by payment method
    const salesByPaymentMethod = await prisma.transaction.groupBy({
      by: ['paymentMethod'],
      where: {
        storeId,
        ...dateFilter,
        paymentStatus: 'completed'
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        _all: true
      }
    })

    // Get sales by product
    const salesByProduct = await prisma.transactionItem.groupBy({
      by: ['productId'],
      where: {
        transaction: {
          storeId,
          ...dateFilter,
          paymentStatus: 'completed'
        }
      },
      _sum: {
        quantity: true,
        amount: true
      },
      _count: {
        _all: true
      }
    })

    // Get product details with category information
    const productDetails = await prisma.product.findMany({
      where: {
        id: {
          in: salesByProduct.map(item => item.productId)
        }
      },
      select: {
        id: true,
        name: true,
        price: true,
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Combine product details with sales data
    const productSales = salesByProduct.map(item => {
      const product = productDetails.find(p => p.id === item.productId)
      return {
        productId: item.productId,
        productName: product?.name || 'Unknown',
        categoryId: product?.category?.id || 'uncategorized',
        categoryName: product?.category?.name || '기타',
        price: product?.price || 0,
        quantity: item._sum.quantity || 0,
        totalAmount: item._sum.amount || 0,
        transactionCount: item._count._all || 0
      }
    })

    // Calculate category sales
    const categorySalesMap = {}
    productSales.forEach(product => {
      const categoryId = product.categoryId
      const categoryName = product.categoryName
      
      if (!categorySalesMap[categoryId]) {
        categorySalesMap[categoryId] = {
          id: categoryId,
          name: categoryName,
          totalAmount: 0,
          quantity: 0
        }
      }
      
      categorySalesMap[categoryId].totalAmount += product.totalAmount
      categorySalesMap[categoryId].quantity += product.quantity
    })
    
    const categorySales = Object.values(categorySalesMap)
      .sort((a, b) => b.totalAmount - a.totalAmount)

    // Get top 10 products by sales amount
    const topProducts = [...productSales]
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10)

    // Get hourly sales data
    const hourlySales = await prisma.transaction.groupBy({
      by: ['transactionTime'],
      where: {
        storeId,
        ...dateFilter,
        paymentStatus: 'completed'
      },
      _sum: {
        totalAmount: true
      }
    })

    // Format hourly sales data
    const formattedHourlySales = Array(24).fill(0).map((_, hour) => {
      const hourSales = hourlySales.filter(sale => {
        const saleHour = new Date(sale.transactionTime).getHours()
        return saleHour === hour
      })
      return {
        hour: `${hour.toString().padStart(2, '0')}:00`,
        amount: hourSales.reduce((sum, sale) => sum + (sale._sum.totalAmount || 0), 0)
      }
    })

    // Get daily sales data
    const dailySales = await prisma.transaction.groupBy({
      by: ['transactionTime'],
      where: {
        storeId,
        ...dateFilter,
        paymentStatus: 'completed'
      },
      _sum: {
        totalAmount: true
      }
    })

    // Format daily sales data
    const formattedDailySales = ['월', '화', '수', '목', '금', '토', '일'].map((day, index) => {
      const daySales = dailySales.filter(sale => {
        const saleDay = new Date(sale.transactionTime).getDay()
        return saleDay === index
      })
      return {
        day,
        amount: daySales.reduce((sum, sale) => sum + (sale._sum.totalAmount || 0), 0)
      }
    })

    // Calculate total transactions and cancelled transactions
    const totalTransactionsCount = await prisma.transaction.count({
      where: {
        storeId,
        ...dateFilter
      }
    })

    const cancelledTransactionsCount = await prisma.transaction.count({
      where: {
        storeId,
        ...dateFilter,
        paymentStatus: 'cancelled'
      }
    })

    // Calculate return rate
    const returnRate = totalTransactionsCount > 0 
      ? (cancelledTransactionsCount / totalTransactionsCount) * 100 
      : 0

    return NextResponse.json({
      totalSales: totalSales._sum.totalAmount || 0,
      paymentMethods: salesByPaymentMethod.map(method => ({
        method: method.paymentMethod,
        amount: method._sum.totalAmount || 0,
        count: method._count._all || 0
      })),
      products: productSales,
      categories: categorySales,
      topProducts: topProducts,
      hourlySales: formattedHourlySales,
      dailySales: formattedDailySales,
      returnRate: parseFloat(returnRate.toFixed(1))
    })

  } catch (error) {
    console.error('Error fetching sales data:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 