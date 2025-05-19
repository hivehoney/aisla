'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Card, CardHeader, CardTitle, CardContent, CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
    CreditCard, Receipt, Search, ArrowLeft, Clock, Calendar, Store, FileDown, ChevronDown, ChevronUp,
    Filter, MoreHorizontal, Printer, Loader2, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight
} from "lucide-react"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStore } from "@/contexts/store-context"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DateRangePicker } from "@/components/date-range-picker"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import React from "react"

export default function TransactionsPage() {
    const router = useRouter()
    const { selectedStore, setSelectedStore, stores, fetchStores } = useStore()

    const [transactions, setTransactions] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().setHours(0, 0, 0, 0)),
        to: new Date(new Date().setHours(23, 59, 59, 999))
    })
    const [paymentFilter, setPaymentFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [sort, setSort] = useState("newest")
    const [expandedTransaction, setExpandedTransaction] = useState([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedTransaction, setSelectedTransaction] = useState(null)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    })

    // 컴포넌트 마운트 시 스토어 목록 불러오기
    useEffect(() => {
        fetchStores()
    }, [fetchStores])

    // 스토어 선택 또는 필터 변경 시 거래 내역 불러오기
    useEffect(() => {
        if (selectedStore) {
            fetchTransactions()
        } else {
            setTransactions([])
        }
    }, [selectedStore, dateRange, paymentFilter, statusFilter, sort])

    // 거래 내역 불러오기 함수
    const fetchTransactions = async (page = pagination.page) => {
        if (!selectedStore) return

        setIsLoading(true)
        try {
            // 날짜 범위 형식화
            const fromDate = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''
            const toDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''

            // API 호출을 위한 쿼리 파라미터 구성
            const params = new URLSearchParams({
                storeId: selectedStore.id,
                page: page,
                limit: pagination.limit,
                ...(fromDate && { fromDate }),
                ...(toDate && { toDate }),
                ...(paymentFilter !== 'all' && { paymentMethod: paymentFilter }),
                ...(statusFilter !== 'all' && { status: statusFilter }),
                sort: sort
            })

            const response = await fetch(`/api/transactions/list?${params.toString()}`)
            if (!response.ok) throw new Error('거래 내역을 불러오는데 실패했습니다')

            const data = await response.json()
            
            if (data.transactions) {
                setTransactions(data.transactions)
                setPagination({
                    ...pagination,
                    page: page,
                    total: data.total || 0,
                    totalPages: Math.ceil((data.total || 0) / pagination.limit)
                })
            } else {
                // 기존 API가 페이지네이션을 지원하지 않는 경우 
                setTransactions(data)
                setPagination({
                    ...pagination,
                    page: 1,
                    total: data.length,
                    totalPages: 1
                })
            }
        } catch (error) {
            console.error('거래 내역 불러오기 오류:', error)
            toast.error('거래 내역을 불러오는데 실패했습니다')
        } finally {
            setIsLoading(false)
        }
    }

    // 거래 상세 정보 불러오기
    const fetchTransactionDetails = async (transactionId) => {
        try {
            const response = await fetch(`/api/transactions/${transactionId}`)
            if (!response.ok) throw new Error('거래 상세 정보를 불러오는데 실패했습니다')

            const data = await response.json()
            setSelectedTransaction(data)
            setIsModalOpen(true)
        } catch (error) {
            console.error('거래 상세 정보 불러오기 오류:', error)
            toast.error('거래 상세 정보를 불러오는데 실패했습니다')
        }
    }

    // 거래 취소 함수
    const cancelTransaction = async (transactionId) => {
        try {
            const response = await fetch(`/api/transactions/${transactionId}/cancel`, {
                method: 'POST'
            })

            if (!response.ok) throw new Error('거래 취소에 실패했습니다')

            toast.success('거래가 취소되었습니다')
            fetchTransactions() // 목록 새로고침
            setIsModalOpen(false)
        } catch (error) {
            console.error('거래 취소 오류:', error)
            toast.error('거래 취소에 실패했습니다')
        }
    }

    // 페이지 변경 핸들러
    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > pagination.totalPages) return
        fetchTransactions(newPage)
    }

    // 검색 결과 필터링
    const filteredTransactions = transactions.filter(transaction => {
        if (!searchQuery.trim()) return true

        // 거래 ID, 영수증 번호 또는 결제 방법으로 검색
        return (
            transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (transaction.receiptNumber && transaction.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
            transaction.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })

    // 결제 상태에 따른 배지 스타일
    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-500">완료</Badge>
            case 'cancelled':
                return <Badge variant="destructive">취소됨</Badge>
            case 'refunded':
                return <Badge variant="outline" className="text-amber-500 border-amber-500">환불됨</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    // 결제 방법에 따른 아이콘
    const getPaymentIcon = (method) => {
        switch (method) {
            case '카드':
                return <CreditCard className="h-4 w-4 mr-1" />
            default:
                return null
        }
    }

    const toggleTransaction = (transactionId) => {
        setExpandedTransaction(prev => 
            prev.includes(transactionId)
                ? prev.filter(id => id !== transactionId)
                : [...prev, transactionId]
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
            <Toaster position="bottom-right" />
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* 상단 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push('/pos')}
                            className="mr-2"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-2xl font-bold">거래 내역</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <Select
                            value={selectedStore?.id || ""}
                            onValueChange={async (value) => {
                                if (!value) {
                                    setSelectedStore(null)
                                    return
                                }

                                try {
                                    const response = await fetch(`/api/stores/${value}`)
                                    if (!response.ok) throw new Error('스토어 정보를 가져올 수 없습니다')

                                    const storeData = await response.json()
                                    setSelectedStore(storeData)
                                } catch (error) {
                                    console.error('스토어 정보 조회 오류:', error)
                                    const selectedStoreFromList = Array.isArray(stores) ? stores.find(s => s.id === value) : null
                                    setSelectedStore(selectedStoreFromList || null)
                                }
                            }}
                            disabled={!Array.isArray(stores) || stores.length === 0}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder={!Array.isArray(stores) || stores.length === 0 ? "스토어 없음" : "스토어 선택"} />
                            </SelectTrigger>
                            <SelectContent>
                                {!Array.isArray(stores) || stores.length === 0 ? (
                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                        등록된 스토어가 없습니다
                                    </div>
                                ) : (
                                    stores.map((store) => (
                                        <SelectItem key={store.id} value={store.id}>
                                            {store.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>

                        <Button 
                            onClick={fetchTransactions}
                            disabled={!selectedStore || !Array.isArray(stores) || stores.length === 0}
                        >
                            새로고침
                        </Button>
                    </div>
                </div>

                {/* 필터링 영역 */}
                <div className="mb-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex flex-wrap gap-4 justify-between items-center">
                        <div className="flex flex-1 gap-4 flex-wrap">
                            {/* 날짜 선택 */}
                            <DateRangePicker
                                value={dateRange}
                                onChange={setDateRange}
                            />
                           

                            {/* 상태 필터 */}
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="상태" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">전체</SelectItem>
                                    <SelectItem value="completed">완료</SelectItem>
                                    <SelectItem value="cancelled">취소됨</SelectItem>
                                    <SelectItem value="refunded">환불됨</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* 정렬 옵션 */}
                            <Select value={sort} onValueChange={setSort}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="정렬" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">최신순</SelectItem>
                                    <SelectItem value="oldest">오래된순</SelectItem>
                                    <SelectItem value="amount-desc">금액 높은순</SelectItem>
                                    <SelectItem value="amount-asc">금액 낮은순</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 검색창 */}
                        <div className="relative w-full md:w-auto md:min-w-[260px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="거래 ID, 영수증 번호 검색..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* 거래 내역 목록 */}
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                            <CardTitle>거래 내역</CardTitle>
                            {selectedStore && (
                                <CardDescription>
                                    <span className="font-medium text-primary">{selectedStore.name}</span> 스토어의 거래 내역입니다
                                </CardDescription>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        {!Array.isArray(stores) || stores.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <Store className="h-10 w-10 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">등록된 스토어가 없습니다</h3>
                                <p className="text-muted-foreground">거래 내역을 보려면 먼저 스토어를 등록해주세요.</p>
                                <Button 
                                    className="mt-4"
                                    onClick={() => router.push('/stores/new')}
                                >
                                    스토어 등록하기
                                </Button>
                            </div>
                        ) : !selectedStore ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <Store className="h-10 w-10 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">스토어를 선택해주세요</h3>
                                <p className="text-muted-foreground">거래 내역을 보려면 먼저 스토어를 선택하세요.</p>
                            </div>
                        ) : isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                                <span className="text-lg">거래 내역 불러오는 중...</span>
                            </div>
                        ) : filteredTransactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <Receipt className="h-10 w-10 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">거래 내역이 없습니다</h3>
                                <p className="text-muted-foreground">선택한 기간에 거래 내역이 없거나 필터 조건에 맞는 거래가 없습니다.</p>
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>거래 ID</TableHead>
                                            <TableHead>일시</TableHead>
                                            <TableHead>결제 수단</TableHead>
                                            <TableHead>금액</TableHead>
                                            <TableHead>상태</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredTransactions.map((transaction) => (
                                            <React.Fragment key={transaction.id}>
                                                <TableRow
                                                    className="cursor-pointer hover:bg-muted/50"
                                                    onClick={() => toggleTransaction(transaction.id)}
                                                >
                                                    <TableCell>
                                                        <div className="font-medium">{transaction.id.substring(0, 8)}...</div>
                                                        {transaction.receiptNumber && (
                                                            <div className="text-xs text-muted-foreground">
                                                                영수증: {transaction.receiptNumber}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center">
                                                            <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                                                            <span>{format(new Date(transaction.transactionTime), 'yyyy-MM-dd')}</span>
                                                        </div>
                                                        <div className="flex items-center text-xs text-muted-foreground">
                                                            <Clock className="h-3 w-3 mr-1" />
                                                            <span>{format(new Date(transaction.transactionTime), 'HH:mm:ss')}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center">
                                                            {getPaymentIcon(transaction.paymentMethod)}
                                                            {transaction.paymentMethod}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {transaction.totalAmount.toLocaleString()}원
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusBadge(transaction.paymentStatus)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex justify-end">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    fetchTransactionDetails(transaction.id);
                                                                }}
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleTransaction(transaction.id);
                                                                }}
                                                            >
                                                                {expandedTransaction.includes(transaction.id) ? (
                                                                    <ChevronUp className="h-4 w-4" />
                                                                ) : (
                                                                    <ChevronDown className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>

                                                {/* 확장된 상세 정보 */}
                                                {expandedTransaction.includes(transaction.id) && (
                                                    <TableRow className="bg-muted/30">
                                                        <TableCell colSpan={6} className="p-0">
                                                            <div className="p-4">
                                                                <div className="font-medium mb-2">거래 상세 정보</div>
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                    <div>
                                                                        <div className="text-xs text-muted-foreground">거래 ID</div>
                                                                        <div className="font-medium">{transaction.id.slice(0,6)}...</div>
                                                                    </div>
                                                                    {transaction.receiptNumber && (
                                                                        <div>
                                                                            <div className="text-xs text-muted-foreground">영수증 번호</div>
                                                                            <div className="font-medium">{transaction.receiptNumber}</div>
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <div className="text-xs text-muted-foreground">스토어</div>
                                                                        <div className="font-medium">{selectedStore.name}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-xs text-muted-foreground">총 상품 수</div>
                                                                        <div className="font-medium">{transaction.items?.length || 0}개</div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex justify-end gap-2 mt-4">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => fetchTransactionDetails(transaction.id)}
                                                                    >
                                                                        <Receipt className="h-4 w-4 mr-2" />
                                                                        상세보기
                                                                    </Button>

                                                                    {transaction.paymentStatus === 'completed' && (
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="text-destructive hover:text-destructive"
                                                                            onClick={() => {
                                                                                if (window.confirm('이 거래를 취소하시겠습니까?')) {
                                                                                    cancelTransaction(transaction.id);
                                                                                }
                                                                            }}
                                                                        >
                                                                            거래 취소
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* 페이지네이션 UI 추가 */}
                                <div className="flex flex-col items-center gap-4 mt-6 mb-6">
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
                                        총 {pagination.total}개 거래 중 {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}-
                                        {Math.min(pagination.page * pagination.limit, pagination.total)}개 표시
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* 거래 상세 정보 모달 */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>거래 상세 정보</DialogTitle>
                        <DialogDescription>
                            거래 ID: {selectedTransaction?.id}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTransaction ? (
                        <div className="space-y-6">
                            {/* 거래 기본 정보 */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                                <div>
                                    <div className="text-xs text-muted-foreground">거래 일시</div>
                                    <div className="font-medium">
                                        {format(new Date(selectedTransaction.transactionTime), 'yyyy-MM-dd HH:mm:ss')}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">결제 수단</div>
                                    <div className="font-medium">{selectedTransaction.paymentMethod}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">총 금액</div>
                                    <div className="font-medium">{selectedTransaction.totalAmount.toLocaleString()}원</div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground">상태</div>
                                    <div>{getStatusBadge(selectedTransaction.paymentStatus)}</div>
                                </div>
                            </div>

                            {/* 거래 상품 목록 */}
                            <div>
                                <h3 className="font-medium mb-2">구매 상품 목록</h3>
                                <div className="border rounded-md overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>상품명</TableHead>
                                                <TableHead>단가</TableHead>
                                                <TableHead>수량</TableHead>
                                                <TableHead className="text-right">금액</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedTransaction.items.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <div className="font-medium">{item.product.name}</div>
                                                        <div className="text-xs text-muted-foreground">{item.product.code}</div>
                                                    </TableCell>
                                                    <TableCell>{item.price.toLocaleString()}원</TableCell>
                                                    <TableCell>{item.quantity}개</TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {item.amount.toLocaleString()}원
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <Separator />

                            {/* 총합 */}
                            <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                                <div className="font-medium">총 결제 금액</div>
                                <div className="text-xl font-bold text-primary">
                                    {selectedTransaction.totalAmount.toLocaleString()}원
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                            <span>거래 정보 불러오는 중...</span>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        {selectedTransaction?.paymentStatus === 'completed' && (
                            <Button
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                    if (window.confirm('이 거래를 취소하시겠습니까?')) {
                                        cancelTransaction(selectedTransaction.id);
                                    }
                                }}
                            >
                                거래 취소
                            </Button>
                        )}

                        <Button
                            variant="outline"
                            onClick={() => {
                                // 영수증 출력 기능 (추후 구현)
                                toast.info("영수증 출력 기능은 준비 중입니다.");
                            }}
                        >
                            <Printer className="h-4 w-4 mr-2" />
                            영수증 출력
                        </Button>

                        <Button onClick={() => setIsModalOpen(false)}>
                            닫기
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
} 