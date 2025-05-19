'use client'

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Card, CardHeader, CardTitle, CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Barcode, CreditCard, Wallet, ShoppingCart, Receipt, Trash2, Plus, Minus, Search, CheckCircle2, AlertCircle,
  RotateCcw, Wifi, WifiOff, Store
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
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStore } from "@/contexts/store-context"
import { useRouter } from "next/navigation"

export default function POSPage() {
  const [barcode, setBarcode] = useState("")
  const [cart, setCart] = useState([])
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef(null)
  const searchInputRef = useRef(null)
  const [paymentMethod, setPaymentMethod] = useState("카드")
  const [paymentStep, setPaymentStep] = useState("select") // select, confirm, complete
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const [ws, setWs] = useState(null)
  const [wsStatus, setWsStatus] = useState('connecting') // 'connecting', 'connected', 'error', 'closed'
  const [scannerConnected, setScannerConnected] = useState(false) // 스캐너 연결 상태 추가

  // 스토어 컨텍스트 사용
  const { selectedStore, setSelectedStore, stores, fetchStores } = useStore()

  // 현재 세션의 고유 ID 생성 (페이지 로드 시 한 번만 생성)
  const [sessionId] = useState(() => `pos_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  // 컴포넌트 마운트 시 스토어 목록 새로고침
  useEffect(() => {
    fetchStores()
  }, [fetchStores])

  // 스토어가 변경되었을 때 웹소켓 재연결
  useEffect(() => {
    if (selectedStore) {
      // 스토어가 선택된 경우에만 연결 시작/재연결
      connectWebSocket();
    } else if (ws) {
      // 스토어 선택이 해제된 경우 기존 연결 종료
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
          setWs(null);
          setWsStatus('closed');
          setScannerConnected(false);
        }
      } catch (err) {
        console.log('WebSocket 닫기 오류:', err);
      }
    }
  }, [selectedStore]);

  // 검색어에 따른 API 호출 및 결과 필터링
  useEffect(() => {
    // 검색어가 비어있을 때 검색 결과 초기화
    if (!searchQuery || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        // 바코드나 상품명으로 검색 (쿼리에 숫자만 있으면 바코드로 간주)
        const isExactBarcode = /^\d{5}$/.test(searchQuery.trim())  // 정확히 5자리 숫자인 경우만 바코드로 간주

        // 스토어가 선택되지 않은 경우
        if (!selectedStore) {
          // 스토어 선택 없이 일반 검색 진행 (재고 정보 없음)
          const baseEndpoint = isExactBarcode
            ? `/api/products/barcode?code=${encodeURIComponent(searchQuery.trim())}`
            : `/api/products/search?q=${encodeURIComponent(searchQuery)}&limit=10&isPOS=true`

          const response = await fetch(baseEndpoint)
          if (!response.ok) throw new Error('상품 검색 중 오류가 발생했습니다')

          const data = await response.json()

          // 재고 정보 없이 기본 상품 정보만 표시
          if (isExactBarcode) {
            if (data.product) {
              setSearchResults([{
                ...data.product,
                inventoryQuantity: 0  // 스토어 없이는 재고 0으로 표시
              }])
            } else {
              setSearchResults([])
            }
          } else {
            setSearchResults(data.products ? data.products.map(product => ({
              ...product,
              inventoryQuantity: 0  // 스토어 없이는 재고 0으로 표시
            })) : [])
          }

          // 경고 토스트 표시
          toast.warning("스토어를 선택하지 않아 재고 정보가 표시되지 않습니다.", {
            duration: 2000,
          })

          return
        }

        // 스토어가 선택된 경우 정상 검색 진행
        const endpoint = isExactBarcode
          ? `/api/products/barcode?code=${encodeURIComponent(searchQuery.trim())}&storeId=${selectedStore.id}`
          : `/api/products/search?q=${encodeURIComponent(searchQuery)}&storeId=${selectedStore.id}&limit=10&isPOS=true`

        const response = await fetch(endpoint)
        if (!response.ok) throw new Error('상품 검색 중 오류가 발생했습니다')

        // 응답 구조가 다른 API 결과 통합 처리
        if (isExactBarcode) {
          const data = await response.json()
          if (data.product) {
            setSearchResults([{
              ...data.product,
              inventoryQuantity: data.inventory ? data.inventory.quantity : 0
            }])
          } else {
            setSearchResults([])
          }
        } else {
          const data = await response.json()
          setSearchResults(data.products || [])
        }
      } catch (error) {
        console.error('상품 검색 중 오류:', error)
        toast.error('상품 검색 중 오류가 발생했습니다')
      } finally {
        setIsLoading(false)
      }
    }

    // Debounce 검색 요청
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchProducts()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, selectedStore])

  // WebSocket 연결 함수
  const connectWebSocket = () => {
    // 스토어가 선택되지 않은 경우 연결하지 않음
    if (!selectedStore) {
      setWsStatus('closed');
      return;
    }

    setWsStatus('connecting');
    // 로컬 개발 환경에서 직접 URL 지정
    const wsUrl = process.env.NEXT_PUBLIC_SCANNER_WS_URL;
    const socket = new WebSocket(wsUrl);
    setWs(socket);

    socket.onopen = () => {
      console.log('✅ WebSocket 연결됨');
      setWsStatus('connected');

      // 클라이언트 타입 등록 메시지 전송
      const registerMessage = JSON.stringify({
        type: 'register',
        clientType: 'POS',
        id: sessionId, // 세션 고유 ID 사용
        storeId: selectedStore.id, // 스토어 ID는 별도 필드로 보관
        name: selectedStore.name || 'POS',
        storeInfo: selectedStore.address
      });
      socket.send(registerMessage);
      console.log('📤 클라이언트 등록 요청:', registerMessage);

      toast.success("통신 서버에 연결되었습니다.", {
        description: `스토어: ${selectedStore.name}`,
        duration: 3000,
      });

      // 연결 성공 후 스캐너 상태 요청
      requestScannerStatus(socket, selectedStore.id);
    };

    socket.onmessage = (e) => {
      console.log('📩 수신:', e.data);
      try {
        const data = JSON.parse(e.data);

        // 등록 확인 메시지 처리
        if (data.type === 'registration_confirmed') {
          console.log('✅ 클라이언트 등록 완료:', data);
          return;
        }

        // 스캐너 연결 상태 업데이트
        if (data.type === 'scanner_status') {
          console.log('🔄 스캐너 상태 업데이트:', data);

          // forced 플래그가 있거나 상태가 변경된 경우에만 토스트 표시
          const statusChanged = data.connected !== scannerConnected || data.forced;

          // 상태 업데이트
          setScannerConnected(data.connected);

          // 상태 변경 시 토스트 메시지 표시
          if (statusChanged) {
            if (data.connected) {
              toast.success("스캐너가 연결되었습니다.", {
                description: `스토어: ${selectedStore.name}`,
                duration: 2000,
              });
            } else {
              // 상태 변경 메시지가 있으면 표시
              const description = data.message
                ? data.message
                : "스캐너를 확인해주세요.";

              toast.error("스캐너 연결이 끊어졌습니다.", {
                description: description,
                duration: 2000,
              });
            }
          }
          return;
        }

        // 바코드 데이터 처리
        if (data.type === 'barcode_data') {
          const receivedBarcode = data.barcode;
          if (receivedBarcode) {
            // 바코드만 설정하고 useEffect가 스캔을 처리하도록 함
            setBarcode(receivedBarcode);
          }
          return;
        }

        // 기존 단순 바코드 형식 처리 (이전 버전 호환성 유지)
        if (!data.type) {
          const receivedBarcode = e.data.toString().trim();
          if (receivedBarcode) {
            // 바코드만 설정하고 useEffect가 스캔을 처리하도록 함
            setBarcode(receivedBarcode);
          }
        }
      } catch (error) {
        // JSON이 아닌 단순 문자열 처리 (이전 버전 호환성 유지)
        const receivedBarcode = e.data.toString().trim();
        if (receivedBarcode) {
          // 바코드만 설정하고 useEffect가 스캔을 처리하도록 함
          setBarcode(receivedBarcode);
        }
      }
    };

    socket.onerror = (e) => {
      console.log('❌ WebSocket 에러:', e);
      setWsStatus('error');
      setScannerConnected(false);
      toast.error("통신 서버 연결 오류", {
        description: "스캐너 기능이 제한됩니다.",
        duration: 3000,
      });
    };

    socket.onclose = () => {
      console.warn('⚠️ WebSocket 종료');
      setWsStatus('closed');
      setScannerConnected(false);
    };
  };

  // 스캐너 상태 요청 함수 추가
  const requestScannerStatus = (socket, storeId) => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !storeId) return;

    try {
      // 약간의 지연 후 스캐너 상태 요청 (서버 등록 처리 시간 고려)
      setTimeout(() => {
        console.log(`📤 스캐너 상태 요청: 스토어 ${storeId}`);
        socket.send(JSON.stringify({
          type: 'request_scanner_status',
          storeId: storeId
        }));
      }, 500);
    } catch (err) {
      console.error('스캐너 상태 요청 오류:', err);
    }
  };

  // 초기 WebSocket 연결 (스토어가 이미 선택된 경우만)
  useEffect(() => {
    // 스토어가 선택된 경우에만 초기 연결
    if (selectedStore) {
      connectWebSocket();
    } else {
      setWsStatus('closed');
    }

    return () => {
      try {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      } catch (err) {
        console.log('WebSocket 닫기 오류:', err);
      }
    };
  }, []);

  // 정기적인 스캐너 상태 점검 (30초마다)
  useEffect(() => {
    // 스토어가 선택되고 웹소켓이 연결되어 있을 때만 실행
    if (!selectedStore || !ws || wsStatus !== 'connected') return;

    console.log('🔄 정기적인 스캐너 상태 점검 시작');

    // 초기 상태 확인
    requestScannerStatus(ws, selectedStore.id);

    // 30초마다 스캐너 상태 요청
    const intervalId = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN && selectedStore) {
        requestScannerStatus(ws, selectedStore.id);
      }
    }, 30000);

    return () => {
      clearInterval(intervalId);
      console.log('🛑 정기적인 스캐너 상태 점검 중지');
    };
  }, [selectedStore, ws, wsStatus]);

  // 웹소켓 상태에 따른 색상 및 아이콘 반환
  const getWsStatusInfo = () => {
    // 스토어가 선택되지 않은 경우 특별한 상태 표시
    if (!selectedStore) {
      return { color: 'text-amber-500', icon: <Store className="h-4 w-4" /> };
    }

    switch (wsStatus) {
      case 'connected':
        return { color: 'text-green-500', icon: <Wifi className="h-4 w-4" /> };
      case 'connecting':
        return { color: 'text-amber-500', icon: <Wifi className="h-4 w-4 animate-pulse" /> };
      case 'error':
      case 'closed':
      default:
        return { color: 'text-red-500', icon: <WifiOff className="h-4 w-4" /> };
    }
  };

  // 스캐너 상태에 따른 색상 및 아이콘 반환
  const getScannerStatusInfo = () => {
    // 스토어가 선택되지 않은 경우 특별한 상태 표시
    if (!selectedStore) {
      return { color: 'text-amber-500', icon: <Barcode className="h-4 w-4" /> };
    }

    // 서버가 연결되지 않은 경우, 스캐너도 연결 불가능
    if (wsStatus !== 'connected') {
      return { color: 'text-red-500', icon: <Barcode className="h-4 w-4" /> };
    }

    return scannerConnected
      ? { color: 'text-green-500', icon: <Barcode className="h-4 w-4" /> }
      : { color: 'text-amber-500', icon: <Barcode className="h-4 w-4 animate-pulse" /> };
  };

  const wsStatusInfo = getWsStatusInfo();
  const scannerStatusInfo = getScannerStatusInfo();

  // 중복 스캔 방지를 위한 변수 추가
  const lastScannedBarcode = useRef(null);
  const lastScanTime = useRef(0);

  // useEffect에서 디바운스 처리 추가
  useEffect(() => {
    if (barcode.length === 5) {  // 5자리 코드로 수정
      const now = Date.now();
      handleScan();
    }
  }, [barcode]);

  const handleScan = async (manualBarcode) => {
    const barcodeToScan = manualBarcode || barcode;

    // 수정: null/undefined 체크 및 문자열 변환
    if (!barcodeToScan || (typeof barcodeToScan === 'string' && !barcodeToScan.trim())) return;

    // 바코드 형식 검증 (정확히 5자리 숫자인지 확인)
    if (!/^\d{5}$/.test(String(barcodeToScan).trim())) {
      toast.error("유효하지 않은 바코드 형식입니다.", {
        description: "바코드는 5자리 숫자여야 합니다.",
        duration: 2000,
      });
      setBarcode("");
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 10);
      return;
    }

    // 수동 스캔의 경우 디바운스 처리 없이 즉시 실행
    // 자동 스캔(웹소켓)의 경우만 useEffect의 디바운스 처리 적용
    if (!manualBarcode && barcode.length === 5) {
      const now = Date.now();
      if (lastScannedBarcode.current === barcode && now - lastScanTime.current < 1000) {
        console.log('🚫 중복 스캔 방지 (handleScan 내부): 1초 이내 동일 바코드', barcode);
        return;
      }
    }

    // 바코드가 문자열이 아닌 경우 문자열로 변환
    const barcodeString = String(barcodeToScan);

    // 추가: 중복 바코드 스캔 감지용 로그
    console.log(`🔍 바코드 스캔 시작: ${barcodeString} ${manualBarcode ? '(수동)' : '(자동)'} (${new Date().toISOString()})`);

    setIsLoading(true);
    try {
      // 스토어가 선택되지 않은 경우 처리
      if (!selectedStore) {
        // 스토어 선택 없이 바코드 검색 진행 (재고 정보 없음)
        const response = await fetch(`/api/products/barcode?code=${encodeURIComponent(barcodeString)}`);
        if (!response.ok) throw new Error('상품을 찾을 수 없습니다');

        const data = await response.json();
        if (data.product) {
          // 재고 정보 없이 상품 추가
          addToCart({
            ...data.product,
            inventoryQuantity: 0  // 재고 정보 없음
          });
        } else {
          toast.error("등록되지 않은 상품입니다.", {
            description: "바코드를 다시 확인해주세요.",
            duration: 2000,
          });
        }
        return;
      }

      // 스토어가 선택된 경우 정상 검색 진행
      // 바코드로 상품 조회 및 재고 정보도 함께 조회
      const response = await fetch(`/api/products/barcode?code=${encodeURIComponent(barcodeString)}&storeId=${selectedStore.id}`);
      if (!response.ok) throw new Error('상품을 찾을 수 없습니다');

      const data = await response.json();
      const product = data.product;
      const inventory = data.inventory;

      if (!product) {
        toast.error("등록되지 않은 상품입니다.", {
          description: "바코드를 다시 확인해주세요.",
          duration: 2000,
        });
      } else if (!inventory || inventory.quantity <= 0) {
        // 재고가 없는 경우
        toast.error("재고가 없는 상품입니다.", {
          description: `${product.name} (재고: 0)`,
          duration: 2000,
        });
      } else {
        // 장바구니에 이미 있는 수량과 재고 비교 확인
        const existingItem = cart.find(item => item.id === product.id);
        const cartQuantity = existingItem ? existingItem.quantity : 0;

        if (cartQuantity + 1 > inventory.quantity) {
          toast.error("재고가 부족합니다.", {
            description: `${product.name} (재고: ${inventory.quantity}개)`,
            duration: 2000,
          });
        } else {
          // 재고 정보 추가하여 장바구니에 담기
          addToCart({
            ...product,
            inventoryQuantity: inventory.quantity
          });
        }
      }
    } catch (error) {
      toast.error("등록되지 않은 상품입니다.", {
        description: "바코드를 다시 확인해주세요.",
        duration: 2000,
      });
    } finally {
      setBarcode("");
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  };

  const addToCart = (product) => {
    // 스토어가 선택되지 않은 경우 경고
    if (!selectedStore) {
      toast.warning("스토어가 선택되지 않아 재고 확인이 불가능합니다.", {
        description: "재고 관리를 위해 스토어를 선택해주세요.",
        duration: 3000,
      });
    }

    // 재고가 없으면 추가하지 않음 (스토어가 선택된 경우에만 체크)
    if (selectedStore && product.inventoryQuantity <= 0) {
      toast.error("재고가 없는 상품입니다.", {
        description: `${product.name} (재고: 0)`,
        duration: 2000,
      });
      return;
    }

    // 장바구니에 이미 있는 수량과 재고 비교 확인 (스토어가 선택된 경우에만)
    if (selectedStore) {
      const existingItem = cart.find(item => item.id === product.id);
      const cartQuantity = existingItem ? existingItem.quantity : 0;

      if (cartQuantity + 1 > product.inventoryQuantity) {
        toast.error("재고가 부족합니다.", {
          description: `${product.name} (재고: ${product.inventoryQuantity}개)`,
          duration: 2000,
        });
        return;
      }
    }

    setCart(prevCart => {
      const exists = prevCart.find(item => item.id === product.id)
      if (exists) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        return [...prevCart, { ...product, quantity: 1 }]
      }
    })

    toast.success("상품이 추가되었습니다.", {
      description: `${product.name} ${product.price.toLocaleString()}원`,
      duration: 1500,
    })

    setSearchQuery("")
    setSearchResults([])
    setSearchOpen(false)
    setTimeout(() => inputRef.current?.focus(), 10)
  }

  const handlePayment = (type) => {
    setPaymentMethod(type)
    setPaymentStep("confirm")
  }

  const processPayment = () => {
    // 스토어 선택 체크
    if (!selectedStore) {
      toast.error("스토어를 선택해주세요", {
        description: "결제를 위해서는 스토어 선택이 필요합니다.",
        duration: 3000,
      });
      setPaymentStep("select");
      setPaymentProcessing(false);
      return;
    }

    // API 연동: 실제 판매 데이터 저장
    setPaymentProcessing(true)

    const saveTransaction = async () => {
      try {
        // Transaction 데이터 준비
        const transactionData = {
          storeId: selectedStore.id,
          items: cart.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
            amount: item.price * item.quantity
          })),
          paymentMethod: paymentMethod,
          totalAmount: totalPrice,
          // 재고 수량 차감을 위한 플래그
          updateInventory: true
        }

        // Transaction API 호출
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transactionData),
        })

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || '거래 처리 중 오류가 발생했습니다')
        }

        const data = await response.json();

        // 결제 완료 처리
        setPaymentStep("complete")
        setTimeout(() => {
          toast.success("결제가 완료되었습니다.", {
            description: `${paymentMethod} 결제 ${totalPrice.toLocaleString()}원`,
            duration: 2000,
          })
          setCart([])
          setPaymentOpen(false)
          setPaymentStep("select")
          setTimeout(() => inputRef.current?.focus(), 10)
        }, 1500)
      } catch (error) {
        console.error('거래 처리 중 오류:', error)
        toast.error(error.message || '거래 처리 중 오류가 발생했습니다')
        setPaymentStep("select")
      } finally {
        setPaymentProcessing(false)
      }
    }

    saveTransaction()
  }

  const cancelPayment = () => {
    setPaymentStep("select")
  }

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const removeItem = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id))
  }

  const updateQuantity = (id, change) => {
    setCart(prevCart => {
      const cartItem = prevCart.find(item => item.id === id);
      if (!cartItem) return prevCart;

      const newQuantity = cartItem.quantity + change;

      // 수량 감소는 항상 허용
      if (change < 0 && newQuantity > 0) {
        return prevCart.map(item =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        );
      }

      // 수량 증가 시 재고 체크
      if (change > 0) {
        // 재고 정보가 있고, 재고보다 많이 주문할 수 없음
        if (cartItem.inventoryQuantity !== undefined &&
          newQuantity > cartItem.inventoryQuantity) {
          toast.error("재고가 부족합니다.", {
            description: `${cartItem.name} (재고: ${cartItem.inventoryQuantity}개)`,
            duration: 2000,
          });
          return prevCart;
        }

        return prevCart.map(item =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        );
      }

      // 변화가 없거나 수량이 0보다 작아지는 경우 기존 카트 유지
      return prevCart;
    });
  }

  // 장바구니 초기화 함수 추가
  const resetCart = () => {
    if (cart.length === 0) return;

    toast.info("장바구니가 초기화되었습니다.", {
      duration: 1500,
    });
    setCart([]);
  }

  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <Toaster position="bottom-right" />
      <div className="max-w-7xl mx-auto px-6 py-8 ">
        <div className="grid grid-cols-12 gap-6">
          {/* 왼쪽 섹션: 상품 스캔 및 검색 */}
          <div className="col-span-4 space-y-6">
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Barcode className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-medium">상품 조회</h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`${wsStatusInfo.color} flex items-center gap-1`}>
                    <span className="text-xs">통신서버</span>
                    {wsStatusInfo.icon}
                  </div>
                  <div className={`${scannerStatusInfo.color} flex items-center gap-1 ml-2`}>
                    <span className="text-xs">스캐너</span>
                    {scannerStatusInfo.icon}
                  </div>

                </div>
              </div>

              {/* 스토어 선택 드롭다운 추가 */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Store className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">스토어 선택</span>
                </div>
                <Select
                  value={selectedStore?.id || ""}
                  onValueChange={async (value) => {
                    if (!value) {
                      // 스토어 선택 해제 시 기존 등록 해제
                      if (selectedStore && ws && ws.readyState === WebSocket.OPEN) {
                        try {
                          // 등록 해제 메시지 전송
                          const unregisterMessage = JSON.stringify({
                            type: 'unregister',
                            clientType: 'POS',
                            id: sessionId,
                            storeId: selectedStore.id
                          });
                          ws.send(unregisterMessage);
                          console.log('📤 POS 등록 해제 요청:', unregisterMessage);
                        } catch (err) {
                          console.error('POS 등록 해제 오류:', err);
                        }
                      }

                      setSelectedStore(null);
                      setScannerConnected(false);
                      return;
                    }

                    try {
                      // 스토어 ID로 DB에서 실제 정보 조회
                      const response = await fetch(`/api/stores/${value}`);
                      if (!response.ok) throw new Error('스토어 정보를 가져올 수 없습니다');

                      const storeData = await response.json();
                      setSelectedStore(storeData);
                      setScannerConnected(false);

                      // 웹소켓이 이미 연결되어 있으면 새 스토어 등록
                      if (ws && ws.readyState === WebSocket.OPEN) {
                        try {
                          const registerMessage = JSON.stringify({
                            type: 'register',
                            clientType: 'POS',
                            id: sessionId, // 세션 고유 ID 사용
                            storeId: storeData.id, // 스토어 ID는 별도 필드로 보관
                            name: storeData.name || 'POS',
                            storeInfo: storeData.address
                          });
                          ws.send(registerMessage);
                          console.log('📤 스토어 변경 등록 요청:', registerMessage);
                        } catch (err) {
                          console.error('스토어 변경 등록 오류:', err);
                          // 연결 실패 시 재연결 시도
                          connectWebSocket();
                        }
                      } else {
                        // 웹소켓 연결이 없으면 새로 연결
                        connectWebSocket();
                      }
                    } catch (error) {
                      console.error('스토어 정보 조회 오류:', error);
                      // 기존 방식으로 폴백
                      const store = stores.find(s => s.id === value);
                      setSelectedStore(store || null);
                      setScannerConnected(false);

                      // 웹소켓 다시 연결
                      connectWebSocket();

                      toast.error("스토어 상세 정보를 불러오는데 실패했습니다.", {
                        description: "기본 정보만 표시됩니다.",
                        duration: 2000,
                      });
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="스토어를 선택해주세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                    {stores.length === 0 && (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        등록된 스토어가 없습니다
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {!selectedStore && (
                  <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    스토어를 선택해야 스캐너 연결이 가능합니다
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="바코드 입력 (5자리)"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                    inputMode="numeric"
                    maxLength={5}
                    className="text-lg h-12"
                    disabled={isLoading}
                  />
                  <Button
                    size="lg"
                    className="h-12"
                    onClick={handleScan}
                    disabled={isLoading}
                  >
                    <Barcode className="w-5 h-5 mr-2" />
                    스캔
                  </Button>
                </div>


                <Button
                  variant="ghost"
                  onClick={() => router.push('/pos/transactions')}
                  className="w-full"
                >
                  <Receipt className="h-4 w-4 mr-1" />
                  거래 내역
                </Button>


                {/* 상품 검색 영역 */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">상품 검색</span>
                  </div>

                  <Command className="rounded-lg border shadow-sm overflow-visible">
                    <CommandInput
                      ref={searchInputRef}
                      placeholder="상품명으로 검색..."
                      value={searchQuery}
                      onValueChange={(value) => {
                        setSearchQuery(value);
                        if (!value.trim()) {
                          setSearchResults([]);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setSearchQuery('');
                          setSearchResults([]);
                        }
                      }}
                      className="h-10"
                    />
                    {(searchQuery.trim() !== '' || searchResults.length > 0) && (
                      <CommandList className=" absolute top-full left-0 right-0 bg-white z-10 mt-1 rounded-md border shadow-md max-h-80">
                        <CommandEmpty>
                          {isLoading ? "검색 중..." : "검색 결과가 없습니다"}
                        </CommandEmpty>
                        <CommandGroup>
                          {searchResults.map((product) => {
                            const hasStock = product.inventoryQuantity > 0;
                            const cartItem = cart.find(item => item.id === product.id);
                            const cartQuantity = cartItem ? cartItem.quantity : 0;
                            const remainingStock = product.inventoryQuantity - cartQuantity;

                            return (
                              <CommandItem
                                key={product.id}
                                value={product.name}
                                onSelect={() => {
                                  if (hasStock && remainingStock > 0) {
                                    addToCart(product);
                                    // 명시적으로 검색어와 결과 모두 초기화
                                    setSearchQuery("");
                                    setSearchResults([]);
                                    setTimeout(() => inputRef.current?.focus(), 10);
                                  } else {
                                    toast.error("재고가 부족합니다.", {
                                      description: `${product.name} (재고: ${product.inventoryQuantity}개)`,
                                      duration: 2000,
                                    });
                                  }
                                }}
                                className={`flex justify-between items-center ${!hasStock || remainingStock <= 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                disabled={!hasStock || remainingStock <= 0}
                              >
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {product.code} | {product.category?.name || "기타"}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end">
                                  <div className="font-medium text-primary">
                                    {product.price.toLocaleString()}원
                                  </div>
                                  <div className={`text-xs ${hasStock ? 'text-green-600' : 'text-red-600'}`}>
                                    재고: {product.inventoryQuantity || 0}개
                                    {cartQuantity > 0 && ` (장바구니: ${cartQuantity}개)`}
                                  </div>
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    )}
                  </Command>
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽 섹션: 장바구니 */}
          <div className="col-span-8">
            <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-medium">장바구니</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-lg px-4 py-1">
                    {cart.length}개 상품
                  </Badge>
                  {cart.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetCart}
                      aria-label="장바구니 초기화"
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      초기화
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <ShoppingCart className="w-12 h-12 mb-4" />
                    <p>상품이 추가되지 않았습니다.</p>
                  </div>
                ) : (
                  <ScrollArea className="h-full pr-4">
                    <ul className="space-y-4">
                      {cart.map((item) => (
                        <li key={item.id} className="flex items-center justify-between p-4 bg-white/80 rounded-lg hover:bg-white transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => updateQuantity(item.id, -1)}
                                className="hover:bg-primary/10"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => updateQuantity(item.id, 1)}
                                className="hover:bg-primary/10"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-medium">{(item.price * item.quantity).toLocaleString()}원</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                )}
              </div>

              {/* 결제 버튼 */}
              <div className="mt-6">
                <div className="flex items-center gap-6">
                  <div className="w-1/3">
                    <div className="text-sm text-muted-foreground">총 결제금액</div>
                    <div className="text-2xl font-bold">{totalPrice.toLocaleString()}원</div>
                  </div>
                  <div className="w-2/3 flex gap-2">
                    <Button
                      variant="outline"
                      className="w-1/4 h-14"
                      disabled={cart.length === 0}
                      onClick={resetCart}
                    >
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                    <Button
                      className="w-3/4 h-14 text-lg"
                      disabled={cart.length === 0}
                      onClick={() => setPaymentOpen(true)}
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      결제하기
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 고정 총결제금액 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <ShoppingCart className="w-6 h-6 text-primary" />
              <span className="text-lg font-medium">총 결제금액</span>

              {/* 연결 상태 표시 및 스토어 정보 추가 */}
              <div className="flex items-center gap-3 ml-2">
                <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-full">
                  <span className={`${wsStatusInfo.color} w-2 h-2 rounded-full`}></span>
                  <span className="text-xs text-muted-foreground">
                    {!selectedStore
                      ? '스토어를 선택해주세요'
                      : wsStatus === 'connected'
                        ? '통신서버 연결됨'
                        : '통신서버 연결 안됨'}
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-full">
                  <span className={`${scannerStatusInfo.color} w-2 h-2 rounded-full`}></span>
                  <span className="text-xs text-muted-foreground">
                    {!selectedStore
                      ? '스토어를 선택해주세요'
                      : scannerConnected
                        ? '스캐너 연결됨'
                        : '스캐너 연결 안됨'}
                  </span>
                </div>

                {scannerConnected && (
                  <div className="flex items-center gap-2 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                    <Barcode className="w-3 h-3 text-green-700" />
                    <span className="text-xs text-green-700">스캐너 활성화됨</span>
                  </div>
                )}

                {selectedStore && (
                  <div className="flex items-center gap-2 bg-primary/10 px-2 py-1 rounded-full">
                    <Store className="w-3 h-3 text-primary" />
                    <span className="text-xs text-primary">{selectedStore.name}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-2xl font-bold text-primary">
                {totalPrice.toLocaleString()}원
              </span>
              <Badge variant="secondary" className="text-lg px-4 py-1">
                {cart.length}개 상품
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* 결제 다이얼로그 */}
      <Dialog
        open={paymentOpen}
        onOpenChange={(open) => {
          setPaymentOpen(open)
          if (!open) setPaymentStep("select") // 닫힐 때 초기 상태로 리셋
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          {paymentStep === "select" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">결제 방법 선택</DialogTitle>
                <DialogDescription>
                  총 {cart.length}개 상품, {totalPrice.toLocaleString()}원을 결제합니다.
                </DialogDescription>
                {selectedStore && (
                  <div className="flex items-center gap-2 mt-1 text-primary">
                    <Store className="h-3.5 w-3.5" />
                    <span>{selectedStore.name}</span>
                  </div>
                )}
              </DialogHeader>

              <div className="py-6">
                <div className="mb-4 max-h-[200px] overflow-auto border rounded-md p-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>상품명</TableHead>
                        <TableHead className="text-right">수량</TableHead>
                        <TableHead className="text-right">가격</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-right">{item.quantity}개</TableCell>
                          <TableCell className="text-right">{(item.price * item.quantity).toLocaleString()}원</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    size="lg"
                    variant="default"
                    className="h-24 flex flex-col gap-2"
                    onClick={() => handlePayment("카드")}
                  >
                    <CreditCard className="w-8 h-8" />
                    <span className="text-base font-medium">카드 결제</span>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="h-24 flex flex-col gap-2"
                    onClick={() => handlePayment("현금")}
                  >
                    <Wallet className="w-8 h-8" />
                    <span className="text-base font-medium">현금 결제</span>
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <div className="w-full flex justify-between items-center">
                  <span className="text-muted-foreground">결제 방법을 선택해주세요</span>
                  <Button variant="outline" onClick={() => setPaymentOpen(false)}>취소</Button>
                </div>
              </DialogFooter>
            </>
          )}

          {paymentStep === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">결제 확인</DialogTitle>
                <DialogDescription>
                  {paymentMethod} 결제를 진행합니다.
                </DialogDescription>
                {selectedStore && (
                  <div className="flex items-center gap-2 mt-1 text-primary">
                    <Store className="h-3.5 w-3.5" />
                    <span>{selectedStore.name}</span>
                  </div>
                )}
              </DialogHeader>

              <div className="py-6">
                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">상품 수량</span>
                    <span className="font-medium">{cart.length}개</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">결제 방법</span>
                    <span className="font-medium">{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">스토어</span>
                    <span className="font-medium">{selectedStore?.name || "미선택"}</span>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-between">
                    <span className="font-medium">총 결제금액</span>
                    <span className="font-bold text-xl text-primary">{totalPrice.toLocaleString()}원</span>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                    <span>
                      {paymentMethod === "카드"
                        ? "카드 단말기에 카드를 삽입하거나 터치해주세요."
                        : "현금을 받고 거스름돈을 확인해주세요."}
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <div className="flex justify-between w-full">
                  <Button variant="outline" onClick={cancelPayment} disabled={paymentProcessing}>
                    이전으로
                  </Button>
                  <Button onClick={processPayment} disabled={paymentProcessing}>
                    {paymentProcessing ? "처리 중..." : "결제 진행"}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}

          {paymentStep === "complete" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl text-center">결제 완료</DialogTitle>
                {selectedStore && (
                  <div className="flex items-center justify-center gap-2 mt-2 text-primary">
                    <Store className="h-3.5 w-3.5" />
                    <span>{selectedStore.name}</span>
                  </div>
                )}
              </DialogHeader>

              <div className="py-6 flex flex-col items-center justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <p className="text-xl font-semibold mb-2">결제가 성공적으로 완료되었습니다</p>
                <p className="text-muted-foreground text-center mb-4">
                  {paymentMethod} 결제 {totalPrice.toLocaleString()}원
                </p>

                <div className="w-full bg-muted/30 rounded-lg p-4 my-4">
                  <p className="text-sm text-center">
                    영수증이 자동으로 출력됩니다.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button className="w-full" onClick={() => setPaymentOpen(false)}>
                  확인
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
