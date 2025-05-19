'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, ChevronLeft, ChevronRight, LayoutGrid, ShoppingCart, ChevronsLeft, ChevronsRight, Minus, Package, Filter, ArrowUpDown } from 'lucide-react'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Building2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from '@/contexts/store-context'
import { CartBar } from '@/components/cart-bar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function OrderSearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categoryId') || 'all')
  const [inventoryFilter, setInventoryFilter] = useState(searchParams.get('inventoryFilter') || 'false')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt')
  const [cartItemCount, setCartItemCount] = useState(0)
  const [cartTotal, setCartTotal] = useState(0)
  const [pagination, setPagination] = useState({
    page: parseInt(searchParams.get('page') || '1'),
    limit: 8,
    total: 0,
    totalPages: 0
  })
  const { selectedStore, setSelectedStore, stores, hasStores } = useStore()
  const [quantities, setQuantities] = useState({})
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [hasDiscount, setHasDiscount] = useState(searchParams.get('hasDiscount') === 'true')
  const [expirationFilter, setExpirationFilter] = useState(searchParams.get('expirationFilter') || '')
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('minPrice') || '',
    max: searchParams.get('maxPrice') || ''
  })
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const fetchCartInfo = async () => {
    try {
      if (!selectedStore?.id) {
        setCartItemCount(0)
        setCartTotal(0)
        return
      }
      
      const response = await fetch(`/api/cart?storeId=${selectedStore.id}`)
      const data = await response.json()
      setCartItemCount(data.items?.length || 0)
      setCartTotal(data.total || 0)
    } catch (error) {
      console.error('장바구니 정보 로딩 중 오류:', error)
    }
  }

  useEffect(() => {
    fetchCartInfo()
  }, [selectedStore])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()
        setCategories(data)
      } catch (error) {
        console.error('카테고리 로딩 중 오류:', error)
      }
    }

    fetchCategories()
  }, [])

  const fetchProducts = async (query, categoryId, page = 1, storeId = null, hasInventory = false) => {
    setIsLoading(true)
    try {
      const url = new URL('/api/products/search', window.location.origin)
      url.searchParams.set('page', page)
      url.searchParams.set('limit', pagination.limit)
      if (query) url.searchParams.set('q', query)
      if (categoryId && categoryId !== 'all') url.searchParams.set('categoryId', categoryId)
      
      // Only apply inventory filter when a store is selected
      if (storeId) {
        url.searchParams.set('storeId', storeId)
        
        // Only apply inventory and expiration filters when a store is selected
        if (hasInventory) url.searchParams.set('inventoryFilter', 'true')
        if (expirationFilter) url.searchParams.set('expirationFilter', expirationFilter)
      }
      
      // 최신순은 code의 내림차순으로 정렬 (높은 코드가 최신)
      if (sortBy) {
        url.searchParams.set('sortBy', sortBy)
      }
      
      // Add a unique parameter to prevent duplicate results
      url.searchParams.set('_', Date.now().toString())
      
      // Apply price and discount filters regardless of store selection
      if (hasDiscount) url.searchParams.set('hasDiscount', 'true')
      if (priceRange.min) url.searchParams.set('minPrice', priceRange.min)
      if (priceRange.max) url.searchParams.set('maxPrice', priceRange.max)
      
      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '검색 중 오류가 발생했습니다')
      }

      // Filter out duplicate products by ID
      const uniqueProducts = [];
      const productIds = new Set();
      
      data.products.forEach(product => {
        if (!productIds.has(product.id)) {
          productIds.add(product.id);
          uniqueProducts.push(product);
        }
      });
      
      // Update products with only unique items
      setProducts(uniqueProducts);
      
      // If total was affected by duplicates, adjust it
      if (uniqueProducts.length !== data.products.length) {
        data.pagination.total = data.pagination.total - (data.products.length - uniqueProducts.length);
      }
      
      setPagination(data.pagination)
    } catch (error) {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const query = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    const categoryId = searchParams.get('categoryId') || 'all'
    const hasInventory = searchParams.get('inventoryFilter') === 'true'
    
    setSearchQuery(query || '')
    setSelectedCategory(categoryId)
    setInventoryFilter(searchParams.get('inventoryFilter') || 'false')
    setSortBy(searchParams.get('sortBy') || 'createdAt')
    
    // Fetch products even when no store is selected
    // Only apply inventory filter if a store is selected
    const storeId = selectedStore?.id
    const shouldApplyInventoryFilter = storeId && hasInventory
    
    fetchProducts(
      query, 
      categoryId, 
      page, 
      storeId, 
      shouldApplyInventoryFilter
    )
  }, [searchParams, selectedStore])

  // Initial data load - fetch products even without store selection
  useEffect(() => {
    const query = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    const categoryId = searchParams.get('categoryId') || 'all'
    
    // Initial load - fetch products without store filters
    fetchProducts(query, categoryId, page, null, false)
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (selectedCategory !== 'all') params.set('categoryId', selectedCategory)
    
    // Only apply inventory filter if a store is selected
    if (selectedStore?.id && inventoryFilter !== 'false') {
      params.set('inventoryFilter', inventoryFilter)
    }
    
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy)
    
    // 추가 필터 파라미터
    if (hasDiscount) params.set('hasDiscount', 'true')
    
    // Only apply expiration filter if a store is selected
    if (selectedStore?.id && expirationFilter) {
      params.set('expirationFilter', expirationFilter)
    }
    
    if (priceRange.min) params.set('minPrice', priceRange.min)
    if (priceRange.max) params.set('maxPrice', priceRange.max)
    
    router.push(`/order/search?${params.toString()}`)
  }

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
    const params = new URLSearchParams(searchParams)
    if (searchQuery) params.set('q', searchQuery)
    params.set('categoryId', categoryId)
    
    // Preserve all other filter parameters
    if (inventoryFilter !== 'false' && selectedStore?.id) params.set('inventoryFilter', inventoryFilter)
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy)
    if (hasDiscount) params.set('hasDiscount', 'true')
    if (expirationFilter && selectedStore?.id) params.set('expirationFilter', expirationFilter)
    if (priceRange.min) params.set('minPrice', priceRange.min)
    if (priceRange.max) params.set('maxPrice', priceRange.max)
    
    router.push(`/order/search?${params.toString()}`)
  }

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams)
    if (searchQuery) params.set('q', searchQuery)
    if (selectedCategory !== 'all') params.set('categoryId', selectedCategory)
    
    // Preserve all filter parameters
    if (inventoryFilter !== 'false' && selectedStore?.id) params.set('inventoryFilter', inventoryFilter)
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy)
    if (hasDiscount) params.set('hasDiscount', 'true')
    if (expirationFilter && selectedStore?.id) params.set('expirationFilter', expirationFilter)
    if (priceRange.min) params.set('minPrice', priceRange.min)
    if (priceRange.max) params.set('maxPrice', priceRange.max)
    
    params.set('page', newPage)
    router.push(`/order/search?${params.toString()}`)
  }

  const handleInventoryFilterChange = (value) => {
    if (!selectedStore?.id) {
      toast({
        title: "스토어 선택 필요",
        description: "재고 필터를 사용하려면 먼저 스토어를 선택해주세요.",
        variant: "destructive"
      })
      return
    }

    setInventoryFilter(value)
    const params = new URLSearchParams(searchParams)
    if (searchQuery) params.set('q', searchQuery)
    if (selectedCategory !== 'all') params.set('categoryId', selectedCategory)
    params.set('inventoryFilter', value)
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy)
    
    // Preserve all other filter parameters
    if (hasDiscount) params.set('hasDiscount', 'true')
    if (expirationFilter) params.set('expirationFilter', expirationFilter)
    if (priceRange.min) params.set('minPrice', priceRange.min)
    if (priceRange.max) params.set('maxPrice', priceRange.max)
    
    router.push(`/order/search?${params.toString()}`)
  }

  const handleSortChange = (value) => {
    // 유통기한 임박순 정렬을 위한 스토어 선택 검증
    if (value === 'expiration' && !selectedStore?.id) {
      toast({
        title: "스토어 선택 필요",
        description: "유통기한 임박순 정렬을 사용하려면 먼저 스토어를 선택해주세요.",
        variant: "destructive"
      })
      return
    }
    
    setSortBy(value)
    const params = new URLSearchParams(searchParams)
    if (searchQuery) params.set('q', searchQuery)
    if (selectedCategory !== 'all') params.set('categoryId', selectedCategory)
    if (inventoryFilter !== 'false' && selectedStore?.id) params.set('inventoryFilter', inventoryFilter)
    params.set('sortBy', value)
    
    // Preserve all other filter parameters
    if (hasDiscount) params.set('hasDiscount', 'true')
    if (expirationFilter && selectedStore?.id) params.set('expirationFilter', expirationFilter)
    if (priceRange.min) params.set('minPrice', priceRange.min)
    if (priceRange.max) params.set('maxPrice', priceRange.max)
    
    // Reset to page 1 when changing sort order
    params.delete('page')
    
    router.push(`/order/search?${params.toString()}`)
  }

  const handleQuantityChange = (productId, change) => {
    setQuantities(prev => {
      const currentQuantity = prev[productId] || 1
      const newQuantity = Math.max(1, currentQuantity + change)
      return { ...prev, [productId]: newQuantity }
    })
  }

  const handleQuantityInputChange = (productId, e) => {
    const value = parseInt(e.target.value)
    setQuantities(prev => ({
      ...prev,
      [productId]: isNaN(value) || value < 1 ? 1 : (value > 999 ? 999 : value)
    }))
  }

  const getProductQuantity = (productId) => {
    return quantities[productId] || 1
  }

  const handleAddToCart = async (product, storeId) => {
    try {
      const quantity = getProductQuantity(product.id)
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: quantity,
          storeId: storeId
        })
      })

      if (!response.ok) {
        throw new Error('장바구니 추가 중 오류가 발생했습니다')
      }

      // 장바구니 정보 업데이트
      fetchCartInfo()
      
      toast({
        title: "장바구니 추가",
        description: `${product.name} ${quantity}개가 장바구니에 추가되었습니다`,
        action: (
          <Button   
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/order/cart')}
            className="bg-white hover:bg-gray-100"
          >
            장바구니 가기
          </Button>
        ),
      })
      
      // 수량 초기화
      setQuantities(prev => ({...prev, [product.id]: 1}))
    } catch (error) {
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleStoreChange = (storeId) => {
    if (!storeId) return;
    
    const store = stores.find(s => String(s.id) === String(storeId));
    if (!store) {
      return;
    }
    
    setSelectedStore(store);
    
    const query = searchParams.get('q') || '';
    const categoryId = searchParams.get('categoryId') || 'all';
    const hasInventory = searchParams.get('inventoryFilter') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    
    fetchProducts(query, categoryId, page, store.id, hasInventory);
  }

  const handleDiscountFilterChange = (value) => {
    setHasDiscount(value)
    
    const params = new URLSearchParams(searchParams)
    if (searchQuery) params.set('q', searchQuery)
    if (selectedCategory !== 'all') params.set('categoryId', selectedCategory)
    if (inventoryFilter !== 'false' && selectedStore?.id) params.set('inventoryFilter', inventoryFilter)
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy)
    
    if (value) {
      params.set('hasDiscount', 'true')
    } else {
      params.delete('hasDiscount')
    }
    
    // Preserve all other filter parameters
    if (expirationFilter && selectedStore?.id) params.set('expirationFilter', expirationFilter)
    if (priceRange.min) params.set('minPrice', priceRange.min)
    if (priceRange.max) params.set('maxPrice', priceRange.max)
    
    // Maintain current page if possible
    const currentPage = searchParams.get('page')
    if (currentPage && currentPage !== '1') params.set('page', currentPage)
    
    router.push(`/order/search?${params.toString()}`)
  }
  
  const handleExpirationFilterChange = (value) => {
    if (!selectedStore?.id && value) {
      toast({
        title: "스토어 선택 필요",
        description: "유통기한 필터를 사용하려면 먼저 스토어를 선택해주세요.",
        variant: "destructive"
      })
      return
    }
    
    setExpirationFilter(value)
    
    const params = new URLSearchParams(searchParams)
    if (searchQuery) params.set('q', searchQuery)
    if (selectedCategory !== 'all') params.set('categoryId', selectedCategory)
    if (inventoryFilter !== 'false' && selectedStore?.id) params.set('inventoryFilter', inventoryFilter)
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy)
    if (hasDiscount) params.set('hasDiscount', 'true')
    
    if (value) {
      params.set('expirationFilter', value)
    } else {
      params.delete('expirationFilter')
    }
    
    // Preserve price range parameters
    if (priceRange.min) params.set('minPrice', priceRange.min)
    if (priceRange.max) params.set('maxPrice', priceRange.max)
    
    // Maintain current page if possible
    const currentPage = searchParams.get('page')
    if (currentPage && currentPage !== '1') params.set('page', currentPage)
    
    router.push(`/order/search?${params.toString()}`)
  }
  
  const handlePriceRangeChange = (type, value) => {
    setPriceRange(prev => ({
      ...prev,
      [type]: value
    }))
  }
  
  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams)
    if (searchQuery) params.set('q', searchQuery)
    if (selectedCategory !== 'all') params.set('categoryId', selectedCategory)
    if (inventoryFilter !== 'false' && selectedStore?.id) params.set('inventoryFilter', inventoryFilter)
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy)
    if (hasDiscount) params.set('hasDiscount', 'true')
    if (expirationFilter && selectedStore?.id) params.set('expirationFilter', expirationFilter)
    
    if (priceRange.min) params.set('minPrice', priceRange.min)
    else params.delete('minPrice')
    
    if (priceRange.max) params.set('maxPrice', priceRange.max)
    else params.delete('maxPrice')
    
    // Maintain current page if possible
    const currentPage = searchParams.get('page')
    if (currentPage && currentPage !== '1') params.set('page', currentPage)
    
    router.push(`/order/search?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 페이지 헤더 */}
      <div className="bg-white border-b">
        <div className="container mx-auto py-8">
          <h1 className="text-2xl font-semibold mb-2">발주 관리</h1>
          <p className="text-muted-foreground">
            상품을 검색하고 장바구니에 담아 발주를 진행할 수 있습니다.
            {pagination && (
              <>
                <span className="mx-2">•</span>
                현재 <span className="font-medium text-foreground">{pagination.total.toLocaleString()}</span>개의 상품이 등록되어 있습니다.
              </>
            )}
          </p>
        </div>
      </div>

      {/* 상단 고정 검색바 */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="container mx-auto py-4">
          <div className="flex items-center gap-4">
            {hasStores ? (
              <Select
                value={selectedStore?.id || ''}
                onValueChange={handleStoreChange}
                modal={false}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="스토어 선택" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Button
                variant="outline"
                onClick={() => router.push('/stores/new')}
                className="w-[200px]"
              >
                <Building2 className="mr-2 h-4 w-4" />
                스토어 등록하기
              </Button>
            )}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="상품명 또는 바코드로 검색"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select
              value={inventoryFilter}
              onValueChange={handleInventoryFilterChange}
              disabled={!selectedStore}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="재고 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">전체 상품</SelectItem>
                <SelectItem value="true">{selectedStore?.name} - 재고 있는 상품</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-[150px]">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">최신순</SelectItem>
                <SelectItem value="inventory-desc">재고 많은순</SelectItem>
                <SelectItem value="inventory-asc">재고 적은순</SelectItem>
                <SelectItem value="price-asc">가격 낮은순</SelectItem>
                <SelectItem value="price-desc">가격 높은순</SelectItem>
                <SelectItem value="discount">할인율 높은순</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={isLoading} className="min-w-[100px]">
              {isLoading ? '검색 중...' : '검색'}
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={showAdvancedFilters ? "bg-primary/10" : ""}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          {showAdvancedFilters && (
            <div className="mt-3 p-4 bg-muted/30 rounded-md border">
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <div className="text-sm mb-1">가격 범위</div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="최소"
                      className="w-24"
                      value={priceRange.min}
                      onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                    />
                    <span>~</span>
                    <Input
                      type="number"
                      placeholder="최대"
                      className="w-24"
                      value={priceRange.max}
                      onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                    />
                    <Button size="sm" onClick={applyPriceFilter}>적용</Button>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm mb-1">할인 상품</div>
                  <Select
                    value={hasDiscount ? 'true' : 'false'}
                    onValueChange={(value) => handleDiscountFilterChange(value === 'true')}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="할인 여부" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">모든 상품</SelectItem>
                      <SelectItem value="true">할인 상품만</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <div className="text-sm mb-1">유통기한</div>
                  <Select
                    value={expirationFilter}
                    onValueChange={handleExpirationFilterChange}
                    disabled={!selectedStore}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="유통기한 필터" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">모든 상품</SelectItem>
                      <SelectItem value="soon">7일 이내 임박</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      // Reset only the advanced filter states
                      setPriceRange({ min: '', max: '' })
                      setHasDiscount(false)
                      setExpirationFilter('')
                      
                      // Create new URL with only the basic parameters
                      const params = new URLSearchParams()
                      if (searchQuery) params.set('q', searchQuery)
                      if (selectedCategory !== 'all') params.set('categoryId', selectedCategory)
                      if (inventoryFilter !== 'false' && selectedStore?.id) params.set('inventoryFilter', inventoryFilter)
                      if (sortBy !== 'createdAt') params.set('sortBy', sortBy)
                      
                      // Maintain current page if possible
                      const currentPage = searchParams.get('page')
                      if (currentPage && currentPage !== '1') params.set('page', currentPage)
                      
                      router.push(`/order/search?${params.toString()}`)
                    }}
                  >
                    필터 초기화
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto py-6">
        <div className="flex gap-6">
          {/* 좌측 카테고리 사이드바 */}
          <div className="w-48 shrink-0">
            <div className="sticky top-40 bg-white rounded-lg border p-4 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 px-2">
                <LayoutGrid className="h-5 w-5" />
                카테고리
              </h2>
              <ScrollArea className="h-[calc(100vh-12rem)]">
                <div className="space-y-1">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'ghost'}
                    className="w-full justify-start font-medium"
                    onClick={() => handleCategoryChange('all')}
                  >
                    전체
                  </Button>
                  {categories
                    .filter(category => category.name !== '기타')
                    .map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? 'default' : 'ghost'}
                        className="w-full justify-start font-medium"
                        onClick={() => handleCategoryChange(category.id)}
                      >
                        {category.name}
                      </Button>
                    ))}
                  {categories
                    .filter(category => category.name === '기타')
                    .map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? 'default' : 'ghost'}
                        className="w-full justify-start font-medium"
                        onClick={() => handleCategoryChange(category.id)}
                      >
                        {category.name}
                      </Button>
                    ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* 우측 컨텐츠 영역 */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-6">
              {isLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  검색 중...
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {products.length === 0 ? (
                      <div className="col-span-full text-center text-muted-foreground py-8">
                        검색어를 입력하여 상품을 찾아보세요
                      </div>
                    ) : (
                      products.map((product) => (
                        <Card key={product.id} className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col">
                          <CardContent className="p-0 flex flex-col h-full">
                            <div 
                              className="relative h-[200px] w-full mx-auto cursor-pointer flex items-center justify-center bg-white"
                              onClick={() => router.push(`/products/${product.id}`)}
                            >
                              {product.imageUrl ? (
                                <div className="w-full h-full overflow-hidden flex items-center justify-center">
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="object-contain max-h-full max-w-full p-2 group-hover:scale-105 transition-transform duration-300"
                                  />
                                  {product.imageTag && (
                                    <div className="absolute top-0 left-0 m-2">
                                      <Badge 
                                        variant={
                                          product.imageTag.toLowerCase() === 'best' ? 'destructive' : 
                                          product.imageTag.toLowerCase() === 'new' ? 'default' : 
                                          'secondary'
                                        }
                                        className="px-2 py-1 text-xs font-bold uppercase"
                                      >
                                        {product.imageTag}
                                      </Badge>
                                    </div>
                                  )}
                                  {product.eventType && (
                                    <div className="absolute top-0 right-0 m-2">
                                      <Badge variant="secondary" className="px-2 py-1 text-xs">
                                        {product.eventType}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <span className="text-muted-foreground">이미지 없음</span>
                                  {product.imageTag && (
                                    <div className="absolute top-0 left-0 m-2">
                                      <Badge 
                                        variant={
                                          product.imageTag.toLowerCase() === 'best' ? 'destructive' : 
                                          product.imageTag.toLowerCase() === 'new' ? 'default' : 
                                          'secondary'
                                        }
                                        className="px-2 py-1 text-xs font-bold uppercase"
                                      >
                                        {product.imageTag}
                                      </Badge>
                                    </div>
                                  )}
                                  {product.eventType && (
                                    <div className="absolute top-0 right-0 m-2">
                                      <Badge variant="secondary" className="px-2 py-1 text-xs">
                                        {product.eventType}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              )}
                              <Badge variant="default" className="absolute top-2 right-2">
                                {product.code}
                              </Badge>
                            </div>
                            <div className="p-4 flex flex-col flex-1">
                              <h3 
                                className="font-semibold text-base mb-2 truncate cursor-pointer hover:text-primary h-6" 
                                title={product.name}
                                onClick={() => router.push(`/products/${product.id}`)}
                              >
                                {product.name}
                              </h3>
                              <div className="space-y-3 mb-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">판매가</span>
                                  <div className="text-right">
                                    {product.priceOriginal && product.priceOriginal > product.price ? (
                                      <>
                                        <span className="line-through text-sm text-muted-foreground mr-2">
                                          {product.priceOriginal.toLocaleString()}원
                                        </span>
                                        <span className="font-semibold text-destructive">
                                          {product.discountRate}% 할인
                                        </span>
                                      </>
                                    ) : null}
                                    <div className="font-semibold text-base">
                                      {product.price.toLocaleString()}원
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">발주가능재고</span>
                                  <Badge variant="outline">
                                    {product.quantity || '제한없음'}개
                                  </Badge>
                                </div>
                                
                                {selectedStore ? (
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">나의 스토어 재고</span>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          className="h-6 px-2"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedProduct(product);
                                          }}
                                        >
                                          <Badge 
                                            variant={product.totalQuantity > 0 ? 'default' : 'destructive'}
                                          >
                                            {product.totalQuantity || 0}개
                                            {product.hasExpiringSoon && 
                                              <span className="ml-1 text-amber-500">!</span>
                                            }
                                          </Badge>
                                          <Package className="ml-1 h-3 w-3" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                          <DialogTitle>재고 상세 정보</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div className="flex justify-between items-center">
                                            <span className="font-medium">{product.name}</span>
                                            <Badge variant="outline">{product.code}</Badge>
                                          </div>
                                          <div className="space-y-2">
                                            <div className="text-sm font-medium">재고 현황 - {selectedStore?.name}</div>
                                            <ScrollArea className="h-[200px] rounded-md border p-4">
                                              {product.inventories && product.inventories.length > 0 ? (
                                                <div className="space-y-2">
                                                  {product.inventories.map((inventory) => (
                                                    <div 
                                                      key={inventory.id} 
                                                      className="flex justify-between items-center text-sm"
                                                    >
                                                      <div className="space-y-1">
                                                        <div>
                                                          {inventory.location ? (
                                                            <span className="font-medium">위치: {inventory.location}</span>
                                                          ) : (
                                                            <span className="text-muted-foreground">위치 미지정</span>
                                                          )}
                                                        </div>
                                                        {inventory.receivedDate ? (
                                                          <div className="text-xs text-muted-foreground">
                                                            입고일: {new Date(inventory.receivedDate).toLocaleDateString()}
                                                          </div>
                                                        ) : (
                                                          <div className="text-xs text-muted-foreground">
                                                            입고일: 정보 없음
                                                          </div>
                                                        )}
                                                        {inventory.expirationDate ? (
                                                          <div className="text-xs text-muted-foreground">
                                                            유통기한: {new Date(inventory.expirationDate).toLocaleDateString()}
                                                          </div>
                                                        ) : (
                                                          <div className="text-xs text-muted-foreground">
                                                            유통기한: 정보 없음
                                                          </div>
                                                        )}
                                                      </div>
                                                      <Badge variant="outline" className="ml-2">
                                                        {inventory.quantity || 0}개
                                                      </Badge>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <div className="text-sm text-muted-foreground text-center py-4">
                                                  등록된 재고가 없습니다
                                                </div>
                                              )}
                                            </ScrollArea>
                                          </div>
                                          <div className="text-sm font-medium">
                                            총 재고: {product.totalQuantity || 0}개
                                          </div>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                ) : (
                                  <div className="h-6 flex items-center justify-center">
                                    <span className="text-sm text-muted-foreground">스토어를 선택하여 재고를 확인하세요</span>
                                  </div>
                                )}
                              </div>
                              {product.tags && product.tags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1 mt-2 mb-4">
                                  {product.tags.map((tag, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      #{tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <div className="space-y-2 mt-auto">
                                <Button 
                                  variant="outline" 
                                  className="w-full"
                                  onClick={() => router.push(`/products/${product.id}`)}
                                >
                                  상세보기
                                </Button>
                                
                                <div className="flex items-center justify-between mb-2">
                                  <Button 
                                    variant="outline" 
                                    size="icon"
                                    disabled={getProductQuantity(product.id) <= 1}
                                    onClick={() => handleQuantityChange(product.id, -1)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  
                                  <Input
                                    type="number"
                                    min="1"
                                    max="999"
                                    value={getProductQuantity(product.id)}
                                    onChange={(e) => handleQuantityInputChange(product.id, e)}
                                    className="w-16 text-center mx-1"
                                  />
                                  
                                  <Button 
                                    variant="outline" 
                                    size="icon"
                                    onClick={() => handleQuantityChange(product.id, 1)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                <Button 
                                  className="w-full"
                                  disabled={!selectedStore}
                                  onClick={() => handleAddToCart(product, selectedStore.id)}
                                >
                                  <ShoppingCart className="mr-2 h-4 w-4" />
                                  {selectedStore ? '장바구니 담기' : '스토어 선택 필요'}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>

                  {products.length > 0 && pagination && (
                    <div className="flex flex-col items-center gap-4 mt-8">
                      <div className="flex flex-wrap justify-center items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePageChange(1)}
                          disabled={pagination.page === 1}
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.page >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = pagination.page - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={pagination.page === pageNum ? "default" : "outline"}
                              onClick={() => handlePageChange(pageNum)}
                              className="min-w-[40px]"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePageChange(pagination.totalPages)}
                          disabled={pagination.page === pagination.totalPages}
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        총 {pagination.total}개 상품 중 {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)}개 표시
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 고정 장바구니 바 */}
      <CartBar itemCount={cartItemCount} total={cartTotal} />
    </div>
  )
} 