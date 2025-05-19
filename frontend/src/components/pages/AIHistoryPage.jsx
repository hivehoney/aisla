'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/contexts/store-context'
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "@/components/ui/table"
import {
  History,
  Star,
  ArrowLeft,
  Clock,
  Calendar,
  Filter,
  Search,
  Store,
  ChevronDown,
  Check,
  Brain,
  Download,
  BarChart4,
  BookOpenText,
  Trash2,
  Heart,
  HeartOff,
  Bot,
  TerminalSquare,
  Info,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Car,
  Package,
  ShoppingCart,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import JsonTable from '@/components/JsonTable'
import markdownComponents from '@/components/markdownComponents'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

// 히스토리 내용 표시 컴포넌트
function HistoryContent({ history }) {
  if (!history) return null;

  const [enrichedRecommendations, setEnrichedRecommendations] = useState([]);
  const [enrichedInventoryRecommendations, setEnrichedInventoryRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 상품 상세 정보 가져오기
  const enrichProducts = async (products) => {
    if (!products || products.length === 0) return [];

    try {
      const productCodes = products.map(product => String(product.code).padStart(5, '0'));
      const response = await fetch('/api/products/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes: productCodes })
      });

      if (!response.ok) {
        throw new Error('상품 정보를 가져오는데 실패했습니다.');
      }

      const detailedProducts = await response.json();
      
      // 상세 정보와 원본 정보 병합
      return products.map(product => {
        const detailedProduct = detailedProducts.find(p => p.code === String(product.code).padStart(5, '0'));
        return {
          ...product,
          ...detailedProduct,
          matchFound: !!detailedProduct
        };
      });
    } catch (error) {
      console.error('상품 상세 정보 가져오기 실패:', error);
      return products;
    }
  };

  // 추천 상품 상세 정보 가져오기
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (history.recommendations && history.recommendations.length > 0) {
        setIsLoading(true);
        const enriched = await enrichProducts(history.recommendations);
        setEnrichedRecommendations(enriched);
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [history.recommendations]);

  // 재고 기반 추천 상품 상세 정보 가져오기
  useEffect(() => {
    const fetchInventoryRecommendations = async () => {
      if (history.inventoryRecommendations && history.inventoryRecommendations.length > 0) {
        setIsLoading(true);
        const enriched = await enrichProducts(history.inventoryRecommendations);
        setEnrichedInventoryRecommendations(enriched);
        setIsLoading(false);
      }
    };

    fetchInventoryRecommendations();
  }, [history.inventoryRecommendations]);

  // 메시지 타입에 따른 아이콘 가져오기
  const getMessageIcon = (type) => {
    switch (type) {
      case 'system':
        return <TerminalSquare className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 my-4">
      {/* 초기 안내 메시지 (메시지가 없는 경우) */}
      {(!history.systemMessages || history.systemMessages.length === 0) && !history.response && (
        <Alert className="bg-blue-50 border-blue-100 text-blue-800">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-sm font-medium">AI 발주 분석</AlertTitle>
          <AlertDescription className="text-xs text-blue-700 mt-1">
            날씨 데이터와 판매 추세를 분석하여 최적의 발주 상품을 추천해드립니다.
          </AlertDescription>
        </Alert>
      )}

      {/* 시스템 메시지 표시 */}
      {history.systemMessages && history.systemMessages.length > 0 && (
        <div className="relative">
          {/* 상단 그라데이션 효과 */}
          <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none rounded-t-lg" />
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 pb-2 rounded-lg custom-scrollbar">
            {history.systemMessages.map((msg, index) => (
              msg.type === 'table' ? (
                <div key={index} className="w-full">
                  <JsonTable data={JSON.parse(msg.content)} />
                </div>
              ) : (
                <Alert
                  key={index}
                  variant={msg.type === 'error' ? "destructive" : "default"}
                  className={`py-2 px-3 ${msg.type === 'system' ? 'bg-slate-50 border-slate-200 text-slate-800' :
                    msg.type === 'info' ? 'bg-blue-50/80 border-blue-100 text-blue-800' :
                    msg.type === 'loading' ? 'bg-amber-50/80 border-amber-100 text-amber-800' :
                    msg.type === 'success' ? 'bg-green-50/80 border-green-100 text-green-800' :
                    msg.type === 'error' ? 'bg-red-50/80 border-red-200 text-red-800' :
                    'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {getMessageIcon(msg.type)}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">
                      {msg.type === 'system' ? '시스템' :
                        msg.type === 'info' ? '정보' :
                        msg.type === 'loading' ? '로딩 중' :
                        msg.type === 'success' ? '성공' :
                        msg.type === 'error' ? '오류' : ''}
                    </span>
                  </div>
                  <AlertDescription className="text-xs font-normal mt-1">
                    {msg.content}
                  </AlertDescription>
                </Alert>
              )
            ))}
          </div>
        </div>
      )}

      {/* AI 응답 표시 */}
      {history.response && (
        <div className="p-0 bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 p-3 border-b bg-zinc-50/80 justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium text-zinc-900">AI 응답</h3>
            </div>
            <Badge className="bg-amber-100 text-amber-700 h-6 px-2 text-xs border-none gap-1">
              <History className="h-3.5 w-3.5" />
              히스토리에서 불러옴
            </Badge>
          </div>
          <div className="p-4 leading-relaxed text-zinc-700 text-sm prose max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {history.response.replace(/\n/g, "  \n")}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* 추천 상품 표시 */}
      {history.recommendations && history.recommendations.length > 0 && (
        <div className="mt-6">
          <Card className="border-indigo-100 bg-white overflow-hidden">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-4 w-1 bg-indigo-600 rounded-full"></div>
                <span className="font-medium text-indigo-900">
                  추천 발주 리스트
                </span>
                {isLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600 ml-2" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
                  <p className="text-indigo-600">상품 정보를 불러오는 중입니다...</p>
                </div>
              ) : (
                <Carousel
                  className="w-full py-2"
                  opts={{
                    align: "start",
                    loop: false,
                  }}
                >
                  <CarouselContent className="-ml-4">
                    {(enrichedRecommendations.length > 0 ? enrichedRecommendations : history.recommendations).map((item, index) => (
                      <CarouselItem key={index} className="pl-4 sm:basis-1/2 lg:basis-1/3">
                        <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-md border-indigo-100">
                          <CardHeader className="p-3 pb-2 border-b">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2 flex-1">
                                <CardTitle className="text-sm font-medium text-indigo-900 truncate">
                                  {item.name || `상품 ${index + 1}`}
                                </CardTitle>
                              </div>
                              <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none">
                                추천 {index + 1}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 space-y-3">
                            {item.imageUrl && (
                              <div className="relative h-40 w-full mb-3 bg-gray-50 rounded overflow-hidden">
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="object-contain w-full h-full"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/placeholder-product.png';
                                  }}
                                />
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div className="col-span-1">
                                <p className="text-xs text-slate-500">상품 코드</p>
                                <p className="font-medium text-slate-900">{item.code}</p>
                              </div>
                              <div className="col-span-1">
                                <p className="text-xs text-slate-500">가격</p>
                                <p className="font-medium text-slate-900">
                                  {item.price ? item.price.toLocaleString() + '원' : '가격 정보 없음'}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div className="col-span-1">
                                <p className="text-xs text-slate-500">추천 수량</p>
                                <p className="font-medium text-slate-900 flex items-center">
                                  <span className="text-indigo-600 font-bold mr-1">{item.req_amount || 1}</span> 개
                                </p>
                              </div>
                              <div className="col-span-1">
                                <p className="text-xs text-slate-500">현재 재고</p>
                                <p className={`font-medium flex items-center ${
                                  typeof item.stock === 'number' && item.stock < 5
                                    ? 'text-red-600'
                                    : typeof item.stock === 'number' && item.stock < 20
                                      ? 'text-amber-600'
                                      : 'text-green-600'
                                }`}>
                                  <span>{item.stock || 0}</span>
                                  {typeof item.stock === 'number' && <span className="text-xs ml-1 text-slate-500">개</span>}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 items-center mb-2">
                              {item.category && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                  {item.category}
                                </Badge>
                              )}

                              {typeof item.stock === 'number' && (
                                <Badge variant="outline" className={`text-xs ${
                                  item.stock > 20
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : item.stock > 5
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                  {item.stock > 20 ? '재고 충분' : item.stock > 5 ? '재고 주의' : item.stock > 0 ? '재고 부족' : '재고 없음'}
                                </Badge>
                              )}

                              {item.tags && item.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {item.tags.slice(0, 2).map((tag, idx) => (
                                    <Badge key={idx} variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            {item.reason && (
                              <div>
                                <p className="text-xs text-slate-500 mb-1">추천 이유</p>
                                <div className="text-sm text-indigo-700 bg-indigo-50 p-2 rounded-md border border-indigo-100">
                                  {item.reason}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div className="flex justify-center gap-2 mt-4">
                    <CarouselPrevious className="static translate-y-0 translate-x-0 mr-2 bg-white border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800" />
                    <CarouselNext className="static translate-y-0 translate-x-0 bg-white border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800" />
                  </div>
                </Carousel>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 재고 기반 추천 상품 표시 */}
      {history.inventoryRecommendations && history.inventoryRecommendations.length > 0 && (
        <div className="mt-6">
          <Card className="border-amber-100 bg-white overflow-hidden">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-4 w-1 bg-amber-600 rounded-full"></div>
                <span className="font-medium text-amber-900">
                  재고 기반 추천 상품
                </span>
                {isLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-amber-600 ml-2" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-600 mb-4" />
                  <p className="text-amber-600">상품 정보를 불러오는 중입니다...</p>
                </div>
              ) : (
                <Carousel
                  className="w-full py-2"
                  opts={{
                    align: "start",
                    loop: false,
                  }}
                >
                  <CarouselContent className="-ml-4">
                    {(enrichedInventoryRecommendations.length > 0 ? enrichedInventoryRecommendations : history.inventoryRecommendations).map((item, index) => (
                      <CarouselItem key={index} className="pl-4 sm:basis-1/2 lg:basis-1/3">
                        <Card className="overflow-hidden h-full transition-all duration-300 hover:shadow-md border-amber-100">
                          <CardHeader className="p-3 pb-2 border-b">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2 flex-1">
                                <CardTitle className="text-sm font-medium text-amber-900 truncate">
                                  {item.name || `상품 ${index + 1}`}
                                </CardTitle>
                              </div>
                              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none">
                                재고 {item.stock}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 space-y-3">
                            {item.imageUrl && (
                              <div className="relative h-40 w-full mb-3 bg-gray-50 rounded overflow-hidden">
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="object-contain w-full h-full"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/placeholder-product.png';
                                  }}
                                />
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div className="col-span-1">
                                <p className="text-xs text-slate-500">상품 코드</p>
                                <p className="font-medium text-slate-900">{item.code}</p>
                              </div>
                              <div className="col-span-1">
                                <p className="text-xs text-slate-500">가격</p>
                                <p className="font-medium text-slate-900">
                                  {item.price ? item.price.toLocaleString() + '원' : '가격 정보 없음'}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <div className="col-span-1">
                                <p className="text-xs text-slate-500">현재 재고</p>
                                <p className={`font-medium flex items-center ${
                                  item.stock < 5
                                    ? 'text-red-600'
                                    : item.stock < 20
                                      ? 'text-amber-600'
                                      : 'text-green-600'
                                }`}>
                                  <span>{item.stock || 0}</span>
                                  <span className="text-xs ml-1 text-slate-500">개</span>
                                </p>
                              </div>
                              <div className="col-span-1">
                                <p className="text-xs text-slate-500">유통기한</p>
                                <p className={`font-medium ${
                                  item.expirationDate ?
                                    new Date(item.expirationDate) < new Date() ? 'text-red-600' :
                                    new Date(item.expirationDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'text-amber-600' :
                                    'text-slate-900'
                                    : 'text-slate-400'
                                }`}>
                                  {item.expirationDate || '정보 없음'}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 items-center mb-2">
                              {item.category && (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                  {item.category}
                                </Badge>
                              )}

                              <Badge variant="outline" className={`text-xs ${
                                item.expirationDate ?
                                  new Date(item.expirationDate) < new Date() ? 'text-red-600' :
                                  new Date(item.expirationDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'text-amber-600' :
                                  'text-slate-900'
                                  : 'text-slate-400'
                              }`}>
                                {item.expirationDate ?
                                  new Date(item.expirationDate) < new Date() ? '지난 유통기한' :
                                  new Date(item.expirationDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? '7일 이내' :
                                  '정상'
                                  : '정보 없음'}
                              </Badge>

                              <Badge variant="outline" className={`text-xs ${
                                item.stock > 20
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : item.stock > 5
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {item.stock > 20 ? '재고 충분' : item.stock > 5 ? '재고 주의' : item.stock > 0 ? '재고 부족' : '재고 없음'}
                              </Badge>

                              {item.tags && item.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {item.tags.slice(0, 2).map((tag, idx) => (
                                    <Badge key={idx} variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            {item.reason && (
                              <div className="my-1">
                                <p className="text-xs text-slate-500 mb-1">추천 이유</p>
                                <div className="text-sm text-indigo-700 bg-indigo-50 p-2 rounded-md border border-indigo-100">
                                  {item.reason}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div className="flex justify-center gap-2 mt-4">
                    <CarouselPrevious className="static translate-y-0 translate-x-0 mr-2 bg-white border-amber-200 hover:bg-amber-50 hover:text-amber-800" />
                    <CarouselNext className="static translate-y-0 translate-x-0 bg-white border-amber-200 hover:bg-amber-50 hover:text-amber-800" />
                  </div>
                </Carousel>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function AIHistoryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { selectedStore, setSelectedStore, stores, hasStores } = useStore()
  
  const [isLoading, setIsLoading] = useState(true)
  const [histories, setHistories] = useState([])
  const [selectedHistory, setSelectedHistory] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('newest') // newest, oldest, favorite
  
  // 히스토리 목록 불러오기
  const fetchHistories = async () => {
    if (!selectedStore?.id) {
      setHistories([])
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    try {
      const favoriteFilter = activeTab === 'favorites' ? '&favorites=true' : ''
      const response = await fetch(`/api/ai-history/list?storeId=${selectedStore.id}${favoriteFilter}`)
      
      if (!response.ok) {
        throw new Error(`히스토리 로딩 오류: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && Array.isArray(data.data)) {
        // 정렬 적용
        let sortedData = [...data.data]
        if (sortOrder === 'newest') {
          sortedData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        } else if (sortOrder === 'oldest') {
          sortedData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        } else if (sortOrder === 'favorite') {
          sortedData.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0))
        }
        
        setHistories(sortedData)
      } else {
        setHistories([])
      }
    } catch (error) {
      console.error('히스토리 로딩 오류:', error)
      toast({
        title: "히스토리 로딩 오류",
        description: error.message,
        variant: "destructive"
      })
      setHistories([])
    } finally {
      setIsLoading(false)
    }
  }
  
  // 선택된 스토어나 탭이 변경되면 히스토리 다시 로드
  useEffect(() => {
    fetchHistories()
  }, [selectedStore?.id, activeTab])
  
  // URL 쿼리에서 히스토리 ID를 가져와 로드
  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const historyId = urlParams.get('id')
      
      if (historyId) {
        // 히스토리 상세 정보 로드
        loadHistoryDetail(historyId)
      }
    }
  }, []) // 컴포넌트 마운트 시 한 번만 실행
  
  // 히스토리 상세 정보 불러오기
  const loadHistoryDetail = async (historyId) => {
    if (!historyId) return
    
    try {
      setSelectedHistory({ loading: true })
      
      const response = await fetch(`/api/ai-history/${historyId}`)
      if (!response.ok) {
        throw new Error(`상세 정보 로딩 오류: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.data) {
        setSelectedHistory(data.data)
      } else {
        toast({
          title: "히스토리를 찾을 수 없습니다",
          variant: "destructive"
        })
        setSelectedHistory(null)
      }
    } catch (error) {
      console.error('히스토리 상세 로딩 오류:', error)
      toast({
        title: "상세 정보 로딩 오류",
        description: error.message,
        variant: "destructive"
      })
      setSelectedHistory(null)
    }
  }
  
  // 히스토리 삭제 처리
  const deleteHistory = async (historyId) => {
    if (!historyId) return
    
    try {
      const response = await fetch(`/api/ai-history/${historyId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error(`삭제 오류: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "히스토리가 삭제되었습니다",
        })
        
        if (selectedHistory?.id === historyId) {
          setSelectedHistory(null)
        }
        
        // 목록에서 제거
        setHistories(prev => prev.filter(h => h.id !== historyId))
      }
    } catch (error) {
      console.error('히스토리 삭제 오류:', error)
      toast({
        title: "삭제 오류",
        description: error.message,
        variant: "destructive"
      })
    }
  }
  
  // 즐겨찾기 상태 변경
  const toggleFavorite = async (historyId, currentState) => {
    if (!historyId) return
    
    try {
      const response = await fetch(`/api/ai-history/${historyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isFavorite: !currentState
        })
      })
      
      if (!response.ok) {
        throw new Error(`즐겨찾기 변경 오류: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        // 목록 업데이트
        setHistories(prev => prev.map(h => 
          h.id === historyId ? {...h, isFavorite: !currentState} : h
        ))
        
        // 상세 정보 업데이트
        if (selectedHistory?.id === historyId) {
          setSelectedHistory(prev => ({...prev, isFavorite: !currentState}))
        }
        
        toast({
          title: !currentState ? "즐겨찾기에 추가되었습니다" : "즐겨찾기에서 제거되었습니다",
        })
      }
    } catch (error) {
      console.error('즐겨찾기 변경 오류:', error)
      toast({
        title: "즐겨찾기 변경 오류",
        description: error.message,
        variant: "destructive"
      })
    }
  }
  
  // 히스토리 날짜 포맷팅
  const formatHistoryDate = (dateString) => {
    try {
      return format(new Date(dateString), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })
    } catch (e) {
      return dateString
    }
  }
  
  const filteredHistories = histories.filter(history => 
    !searchTerm || 
    history.title?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // AI로 다시 분석하기
  const reanalyzeWithAI = (historyId) => {
    router.push(`/order/ai?historyId=${historyId}`)
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 페이지 헤더 */}
      <div className="bg-white border-b">
        <div className="container mx-auto py-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => router.push('/order/ai')}
                >
                  <ArrowLeft className="h-4 w-4" />
                  뒤로
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">AI 분석 히스토리</h1>
                <Badge className="bg-blue-100 text-blue-800 border-none">
                  {histories.length}개
                </Badge>
              </div>
              <p className="text-muted-foreground mt-2">
                저장된 AI 분석 결과를 확인하고 관리할 수 있습니다.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Select defaultValue={selectedStore?.id} onValueChange={(value) => {
                const store = stores.find(s => s.id === value)
                setSelectedStore(store)
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="스토어 선택" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(stores) && stores.length > 0 ? (
                    stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="demo" disabled>스토어가 없습니다</SelectItem>
                  )}
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                className="gap-1"
                onClick={fetchHistories}
                disabled={isLoading}
              >
                <History className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                새로고침
              </Button>
              
              <Button
                variant="default" 
                className="gap-1"
                onClick={() => router.push('/order/ai')}
              >
                <Brain className="h-4 w-4" />
                새 분석 시작
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* 좌측 히스토리 목록 */}
          <div className="col-span-12 md:col-span-4">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>분석 기록</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select defaultValue={sortOrder} onValueChange={setSortOrder}>
                      <SelectTrigger className="h-8 w-[120px]">
                        <SelectValue placeholder="정렬" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">최신순</SelectItem>
                        <SelectItem value="oldest">오래된순</SelectItem>
                        <SelectItem value="favorite">즐겨찾기</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mt-2">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="all">전체</TabsTrigger>
                    <TabsTrigger value="favorites">즐겨찾기</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <div className="mt-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input 
                      placeholder="히스토리 검색" 
                      className="pl-9" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {!selectedStore ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Store className="h-10 w-10 text-slate-300 mb-2" />
                    <h3 className="text-sm font-medium text-slate-600 mb-1">스토어를 선택해주세요</h3>
                    <p className="text-xs text-slate-500">스토어를 선택하면 해당 스토어의 AI 분석 히스토리를 볼 수 있습니다.</p>
                  </div>
                ) : isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-md" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredHistories.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <History className="h-10 w-10 text-slate-300 mb-2" />
                    <h3 className="text-sm font-medium text-slate-600 mb-1">
                      {searchTerm ? "검색 결과가 없습니다" : "저장된 히스토리가 없습니다"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {searchTerm 
                        ? "다른 검색어로 다시 시도해보세요."
                        : "AI 분석을 실행하면 자동으로 결과가 저장됩니다."}
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[calc(100vh-300px)] pr-2">
                    <div className="space-y-2">
                      {filteredHistories.map((history) => (
                        <div 
                          key={history.id} 
                          className={`group flex items-start gap-2 p-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer
                            ${selectedHistory?.id === history.id ? 'bg-slate-100 hover:bg-slate-100' : ''}
                          `}
                          onClick={() => loadHistoryDetail(history.id)}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-9 h-9 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                              <History className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-sm font-medium text-slate-800 truncate">
                                  {history.title || '무제 분석'}
                                </h4>
                                {history.isFavorite && (
                                  <Star className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatHistoryDate(history.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* 우측 상세 보기 */}
          <div className="col-span-12 md:col-span-8">
            {selectedHistory ? (
              <div className="space-y-4">
                {/* 상세 정보 헤더 */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle>{selectedHistory.title || '무제 분석'}</CardTitle>
                          <Badge variant="outline" className="gap-1 border-blue-200 text-blue-700">
                            <Clock className="h-3.5 w-3.5" />
                            {formatHistoryDate(selectedHistory.createdAt)}
                          </Badge>
                        </div>
                        <CardDescription className="mt-1">
                          {selectedHistory.store?.name || '스토어 정보 없음'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 gap-1"
                          onClick={() => toggleFavorite(selectedHistory.id, selectedHistory.isFavorite)}
                        >
                          {selectedHistory.isFavorite ? (
                            <>
                              <HeartOff className="h-4 w-4 text-slate-500" />
                              즐겨찾기 해제
                            </>
                          ) : (
                            <>
                              <Heart className="h-4 w-4 text-rose-500" />
                              즐겨찾기
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 gap-1 border-indigo-200 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                          onClick={() => reanalyzeWithAI(selectedHistory.id)}
                        >
                          <Brain className="h-4 w-4" />
                          AI로 다시 분석
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 gap-1 border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            if (confirm('이 히스토리를 정말 삭제하시겠습니까?')) {
                              deleteHistory(selectedHistory.id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          삭제
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
                
                {/* 히스토리 내용 표시 */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpenText className="h-4 w-4 text-indigo-600" />
                      분석 내용
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <HistoryContent history={selectedHistory} />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="py-20 text-center">
                  <div className="flex flex-col items-center max-w-md mx-auto">
                    <History className="h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="text-xl font-medium text-slate-700 mb-2">AI 분석 히스토리</h3>
                    <p className="text-slate-500 mb-6">
                      {selectedStore 
                        ? '왼쪽에서 확인할 분석 내역을 선택해주세요.' 
                        : '스토어를 선택한 후 히스토리를 확인해주세요.'}
                    </p>
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => router.push('/order/ai')}
                    >
                      <Brain className="h-4 w-4" />
                      새 AI 분석 시작하기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 