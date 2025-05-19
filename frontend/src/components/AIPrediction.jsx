'use client'

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious
} from "@/components/ui/carousel"
import { Brain, Info, AlertCircle, CheckCircle2, Loader2, TerminalSquare, Bot, Save, History, Star, Edit2 } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from "remark-gfm"
import markdownComponents from "./markdownComponents"
import { useToast } from "@/hooks/use-toast"
import JsonTable from "./JsonTable"
import { useSession } from "next-auth/react"

const AIPrediction = forwardRef(({ trigger = 0, setLoading, question = "수요 예측", selectedStoreId = null, loadedHistoryData = null, readOnly = false, onComplete = null, confidenceThreshold = 70 }, ref) => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isJsonLoading, setIsJsonLoading] = useState(false);
    const [productRecommendations, setProductRecommendations] = useState([]);
    const [carouselApi, setCarouselApi] = useState(null);
    const [aiResponse, setAiResponse] = useState("");

    const [enrichedProducts, setEnrichedProducts] = useState([]);
    const [isProductDataLoading, setIsProductDataLoading] = useState(false);
    const [inventoryRecommendations, setInventoryRecommendations] = useState([])
    const [isInventoryLoading, setIsInventoryLoading] = useState(false)

    const [selectedProducts, setSelectedProducts] = useState([]);
    const [isAllSelected, setIsAllSelected] = useState(false);
    const abortControllerRef = useRef(null);
    const previousTriggerRef = useRef(trigger);
    const messagesEndRef = useRef(null);
    const jsonBufferRef = useRef("");
    const autoSaveCompletedRef = useRef(false);

    const [selectedInventoryProducts, setSelectedInventoryProducts] = useState([]);
    const [isAllInventorySelected, setIsAllInventorySelected] = useState(false);
    const [enrichedInventoryProducts, setEnrichedInventoryProducts] = useState([]);
    const [isInventoryDetailLoading, setIsInventoryDetailLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { data: session } = useSession();
    const { toast } = useToast()

    // 외부에서 호출 가능한 메서드 노출
    useImperativeHandle(ref, () => ({
        resetState: () => {
            setMessages([]);
            setAiResponse("");
            setProductRecommendations([]);
            setEnrichedProducts([]);
            setInventoryRecommendations([]);
            setEnrichedInventoryProducts([]);
        },
        loadHistoryData: (historyData) => {
            if (historyData) {
                
                // API 응답 형식 처리: data.success가 있으면 data.data를 사용
                const data = historyData.success ? historyData.data : historyData;
                
                setAiResponse(data.response || "");
                setMessages(data.systemMessages || []);
                setProductRecommendations(data.recommendations || []);
                setInventoryRecommendations(data.inventoryRecommendations || []);
                
                // 상품 상세 정보 가져오기
                if (data.recommendations && data.recommendations.length > 0) {
                    enrichProductsWithDetails(data.recommendations);
                }
                
                // 재고 상품 상세 정보 가져오기
                if (data.inventoryRecommendations && data.inventoryRecommendations.length > 0) {
                    enrichInventoryProducts(data.inventoryRecommendations);
                }
            }
        }
    }));

    // trigger 값이 변경되면 질문을 시작
    useEffect(() => {
        if (!readOnly && trigger !== 0 && trigger !== previousTriggerRef.current && selectedStoreId) {
            previousTriggerRef.current = trigger;
            askQuestion(question);
            fetchInventoryRecommendations()
        }
    }, [trigger, question, readOnly]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // 자동 저장 함수
    const autoSaveAnalysis = async (data) => {
        // 이미 저장이 완료되었거나 저장 중이면 중복 저장 방지
        if (!selectedStoreId || !session?.user?.id || isSaving || autoSaveCompletedRef.current) return;
        
        // 데이터가 객체인지 문자열인지 확인
        let responseText = typeof data === 'string' ? data : 
                           data.response ? data.response : 
                           '';
                           
        // 응답이 비어있으면 저장하지 않음
        if (!responseText.trim()) return;
        
        setIsSaving(true);
        try {
            // 데이터 준비
            const saveData = {
                storeId: selectedStoreId,
                response: responseText,
                systemMessages: Array.isArray(data.systemMessages) ? data.systemMessages : messages || [],
                recommendations: Array.isArray(data.recommendations) ? data.recommendations : enrichedProducts || [],
                inventoryRecommendations: Array.isArray(data.inventoryRecommendations) ? data.inventoryRecommendations : enrichedInventoryProducts || [],
                title: `AI 분석 ${new Date().toLocaleDateString('ko-KR')}`
            };

            // 데이터 유효성 검사
            if (!saveData.storeId || !saveData.response) {
                throw new Error('필수 데이터가 누락되었습니다.');
            }

            const result = await fetch('/api/ai-history/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(saveData)
            });

            if (!result.ok) {
                throw new Error('자동 저장에 실패했습니다.');
            }

            const responseData = await result.json();
            console.log('저장 응답:', responseData); // 디버깅용 로그
            
            setMessages(prev => [...prev, {
                type: "success",
                content: `분석 결과가 히스토리에 자동 저장되었습니다.`
            }]);
            
            toast({
                title: "자동 저장 완료",
                description: "AI 분석 결과가 히스토리에 저장되었습니다.",
                duration: 3000
            });

            onComplete(enrichedProducts);
            onComplete(enrichedInventoryProducts);
            
            // 저장 완료 표시
            autoSaveCompletedRef.current = true;
        } catch (error) {
            // 저장 실패 시, 다시 저장 시도 가능하도록 표시
            autoSaveCompletedRef.current = false;
            
            console.error('히스토리 저장 오류:', error);
            setMessages(prev => [...prev, {
                type: "error",
                content: `히스토리 저장 실패: ${error.message}`
            }]);
            
            toast({
                title: "저장 실패",
                description: error.message,
                variant: "destructive",
                duration: 3000
            });
        } finally {
            setIsSaving(false);
        }
    };

    const askQuestion = async (questionText) => {
        // 자동 저장 상태 초기화
        autoSaveCompletedRef.current = false;
        
        // 이미 요청 중이면 이전 요청 취소
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // 새 요청 준비
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsLoading(true);
        setIsJsonLoading(true); // JSON 처리 로딩 상태 즉시 활성화
        // 초기 로딩 메시지 추가
        setMessages([
            { type: "system", content: "AI 분석을 시작합니다..." },
            { type: "loading", content: "서버에 연결 중입니다..." }
        ]);
        setAiResponse("");
        jsonBufferRef.current = "";
        setProductRecommendations([]); // 이전 추천 목록 초기화
        setEnrichedProducts([]); // 이전 확장 데이터 초기화

        try {
            console.log(`${process.env.NEXT_PUBLIC_AI_API_URL}/stream에 요청 보내는 중...`);
            const response = await fetch(`${process.env.NEXT_PUBLIC_AI_API_URL}/stream`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    question: questionText, 
                    store_id: selectedStoreId,
                    threshold: confidenceThreshold
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`서버 오류: ${response.status}`);
            }
            
            setMessages(prev => [...prev, {
                type: "success",
                content: "서버 응답 확인"
            }]);
            console.log("서버 응답 받음, 스트림 처리 시작");
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            let buffer = "";

            // AI 응답 누적을 위한 변수
            let collectedAIResponse = "";

            let isInsideJsonBlock = false;
            let jsonAccumulator = "";

            // 응답 스트림 처리
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    // 마지막 청크 처리 완료
                    console.log("✅ 스트림 읽기 완료");
                    setIsLoading(false);
                    setIsJsonLoading(false);
                    setLoading(false); // 부모 컴포넌트 로딩 상태도 종료
                    finalizeLoadingMessages(); // 로딩 메시지를 성공 메시지로 변경
                    
                    // 분석이 완료되면 AI 응답 저장
                    setAiResponse(collectedAIResponse);
                    // 자동 저장은 productRecommendations useEffect에서 처리됨
                    
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                // 한 줄 단위로 분할 처리
                const lines = buffer.split("\n");
                buffer = lines.pop(); // 마지막 줄은 미완성일 수 있음


                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;


                    if (trimmed.startsWith("```json")) {
                        isInsideJsonBlock = true;
                        jsonAccumulator = "";
                        continue;
                    }
                    if (trimmed.startsWith("```") && isInsideJsonBlock) {
                        try {
                            const parsedJson = JSON.parse(jsonAccumulator);
                            console.log("✅ JSON 파싱 성공:", parsedJson);
                            setProductRecommendations(parsedJson);

                            // 상품 코드를 기반으로 추가 정보 가져오기
                            enrichProductsWithDetails(parsedJson);
                        } catch (err) {
                            console.error("❌ JSON 파싱 오류:", err);
                        } finally {
                            isInsideJsonBlock = false;
                            jsonAccumulator = "";
                            setIsJsonLoading(false); // JSON 렌더링 끝

                            // 모든 처리가 완료되면 로딩 상태 종료
                            if (!isLoading) {
                                setLoading(false);
                            }
                        }
                        continue;
                    }

                    if (isInsideJsonBlock) {
                        jsonAccumulator += trimmed;
                        continue;
                    }

                    // 시스템 메시지 처리
                    if (trimmed.startsWith(":SYSTEM:") ||
                        trimmed.startsWith(":INFO:") ||
                        trimmed.startsWith(":LOADING:") ||
                        trimmed.startsWith(":SUCCESS:") ||
                        trimmed.startsWith(":MARKDOWN:") ||
                        trimmed.startsWith(":TABLE:") ||
                        trimmed.startsWith(":ERROR:")) {
                        processMessage(trimmed);
                        continue;
                    }

                    // 일반 텍스트 → AI 응답 누적
                    collectedAIResponse += trimmed + "\n";
                    setAiResponse(collectedAIResponse);
                }
            }

        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error("Fetch error:", error);
                setMessages(prev => [...prev, {
                    type: "error",
                    content: `오류가 발생했습니다: ${error.message}`
                }]);
                setIsLoading(false);
            }
        }
    };

    const processMessage = (text) => {
        // 접두사 기반 메시지 처리
        if (text.startsWith(":SYSTEM:")) {
            setMessages(prev => [...prev, {
                type: "system",
                content: text.replace(":SYSTEM:", "").trim()
            }]);
        } else if (text.startsWith(":INFO:")) {
            setMessages(prev => [...prev, {
                type: "info",
                content: text.replace(":INFO:", "").trim()
            }]);
        } else if (text.startsWith(":LOADING:")) {
            setMessages(prev => [...prev, {
                type: "loading",
                content: text.replace(":LOADING:", "").trim()
            }]);
        } else if (text.startsWith(":SUCCESS:")) {
            setMessages(prev => {
                // 기존 loading 메시지를 success로 변경
                const updatedMessages = prev.map(msg => {
                    if (msg.type === 'loading') {
                        return {
                            type: 'success',
                            content: msg.content
                        };
                    }
                    return msg;
                });

                // 새로운 success 메시지 추가
                return [...updatedMessages, {
                    type: "success", 
                    content: text.replace(":SUCCESS:", "").trim()
                }];
            });
        } else if (text.startsWith(":MARKDOWN:")) {
            setMessages(prev => [...prev, {
                type: "markdown",
                content: text.replace(":MARKDOWN:", "").trim()
            }]);
        } else if (text.startsWith(":TABLE:")) {
            setMessages(prev => [...prev, {
                type: "table",
                content: text.replace(":TABLE:", "").trim()
            }]);
        } else if (text.startsWith(":ERROR:")) {
            setMessages(prev => [...prev, {
                type: "error",
                content: text.replace(":ERROR:", "").trim()
            }]);
        } else {
            // 일반 텍스트인 경우
            setAiResponse(prev => prev + text);
        }
    };

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

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
        }
    }, [messages]);

    // 상품 선택 상태 관리 함수
    const toggleProductSelection = (product) => {
        setSelectedProducts(prev => {
            const isSelected = prev.some(p => p.code === product.code);
            if (isSelected) {
                return prev.filter(p => p.code !== product.code);
            } else {
                return [...prev, product];
            }
        });
    };

    // 모든 상품 선택/해제 함수
    const toggleSelectAll = () => {
        const productsToDisplay = enrichedProducts.length > 0 ? enrichedProducts : productRecommendations;
        if (isAllSelected) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts([...productsToDisplay]);
        }
        setIsAllSelected(!isAllSelected);
    };

    // 선택된 상품을 장바구니에 추가하는 함수
    const addSelectedProductsToCart = async () => {
        if (selectedProducts.length === 0 || readOnly) return;

        // 실제 장바구니 API 연동 구현
        try {
            setIsSaving(true);
            setMessages(prev => [...prev, {
                type: "loading",
                content: `${selectedProducts.length}개 상품을 장바구니에 추가하는 중...`
            }]);

            // 모든 상품 추가 요청을 병렬로 처리
            const addPromises = selectedProducts.map(async (product) => {
                const response = await fetch('/api/cart', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        storeId: selectedStoreId,
                        productId: product.id,  // 데이터베이스 상의 상품 ID 사용
                        quantity: product.req_amount || 1  // AI 추천 수량 사용
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `상품 추가 실패: ${product.name}`);
                }

                return await response.json();
            });

            // 모든 요청이 완료될 때까지 대기
            await Promise.all(addPromises);

            // 성공 메시지 추가
            setMessages(prev => {
                // 로딩 메시지를 성공 메시지로 변경
                const updatedMessages = prev.map(msg => {
                    if (msg.type === 'loading' && msg.content.includes('장바구니에 추가하는 중')) {
                        return {
                            type: 'success',
                            content: `${selectedProducts.length}개 상품이 장바구니에 추가되었습니다.`
                        };
                    }
                    return msg;
                });

                return updatedMessages;
            });

            // 선택 상태 초기화
            setSelectedProducts([]);
            setIsAllSelected(false);

            // 성공 토스트 메시지 표시
            toast({
                title: "장바구니 추가 완료",
                description: `${selectedProducts.length}개 상품이 장바구니에 추가되었습니다.`,
                duration: 3000
            });

        } catch (error) {
            console.error("장바구니 추가 오류:", error);
            
            // 오류 메시지 추가
            setMessages(prev => {
                // 로딩 메시지를 오류 메시지로 변경
                const updatedMessages = prev.map(msg => {
                    if (msg.type === 'loading' && msg.content.includes('장바구니에 추가하는 중')) {
                        return {
                            type: 'error',
                            content: `장바구니 추가 실패: ${error.message}`
                        };
                    }
                    return msg;
                });

                return updatedMessages;
            });

            // 오류 토스트 메시지 표시
            toast({
                title: "장바구니 추가 실패",
                description: error.message,
                variant: "destructive",
                duration: 3000
            });
        } finally {
            setIsSaving(false);
        }
    };

    // 상품 코드를 기반으로 DB에서 추가 정보를 가져와 확장하는 함수
    const enrichProductsWithDetails = async (products) => {
        if (!products || products.length === 0) {
            return [];
        }

        // 상품 상세 정보를 가져오는 함수
        const getProducts = async () => {
            // 상품 코드 배열 추출 (문자열 형태가 아닌 경우 문자열로 변환)
            const productCodes = products.map(product => {
                // 만약 AI에서 받은 코드가 숫자라면 문자열로 변환하고 5자리로 맞춤
                const codeStr = String(product.code);
                // 5자리 숫자로 맞추기 (앞에 0 추가)
                return codeStr.padStart(5, '0');
            });

            // API 호출하여 상세 정보 가져오기
            const response = await fetch(`/api/products/details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codes: productCodes })
            });

            if (!response.ok) {
                throw new Error('상품 정보를 가져오는데 실패했습니다.');
            }

            return await response.json();
        };

        // 상세 정보와 병합된 상품 목록
        const enrichedProducts = [];

        if (products && products.length > 0) {
            try {
                const detailedProducts = await getProducts();

                // 코드 매칭 확인
                const foundCodes = [];
                const missingCodes = [];

                // 각 AI 추천 상품에 대해 DB 정보 매칭
                for (const product of products) {
                    const productCode = String(product.code).padStart(5, '0');
                    const dbProduct = detailedProducts.find(item => item.code === productCode);

                    if (dbProduct) {
                        foundCodes.push(productCode);
                        // 기존 AI 추천 정보에 DB 정보를 통합
                        enrichedProducts.push({
                            ...product,
                            ...dbProduct,
                            confidence: product.confidence,
                            matchFound: true
                        });
                    } else {
                        missingCodes.push(productCode);
                        // DB에서 찾지 못한 경우 원래 정보만 유지
                        enrichedProducts.push({
                            ...product,
                            matchFound: false
                        });
                    }
                }

                setEnrichedProducts(enrichedProducts);
                setIsProductDataLoading(false);
                return enrichedProducts;
            } catch (error) {
                console.error('상품 정보 확장 중 오류 발생:', error);
                setIsProductDataLoading(false);
                return products.map(product => ({
                    ...product,
                    matchFound: false
                }));
            } finally {
                setIsProductDataLoading(false);
            }
        }

        return [];
    };

    // 재고 기반 추천 상품 가져오기
    const fetchInventoryRecommendations = async () => {
        if (!selectedStoreId) return

        setIsInventoryLoading(true)
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_AI_API_URL}/inventory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ store_id: selectedStoreId })
            })

            if (!response.ok) {
                throw new Error('재고 정보를 가져오는데 실패했습니다.')
            }

            const data = await response.json()
            const inventoryRecommendations = data?.message

            setInventoryRecommendations(inventoryRecommendations)
            
            // 상세 정보 가져오기
            await enrichInventoryProducts(inventoryRecommendations)
        } catch (error) {
            console.error('재고 정보 가져오기 실패:', error)
            toast({
                title: "재고 정보 가져오기 실패",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setIsInventoryLoading(false)
        }
    }

    // 재고 상품의 상세 정보 가져오기
    const enrichInventoryProducts = async (products) => {
        if (!products || products.length === 0) return

        setIsInventoryDetailLoading(true)
        try {
            const productCodes = products.map(product => String(product.code).padStart(5, '0'))
            
            const response = await fetch('/api/products/details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codes: productCodes })
            })

            if (!response.ok) {
                throw new Error('상품 상세 정보를 가져오는데 실패했습니다.')
            }

            const detailedProducts = await response.json()
            
            // 재고 정보와 상세 정보 병합
            const enrichedProducts = products.map(product => {
                const detailedProduct = detailedProducts.find(p => p.code === String(product.code).padStart(5, '0'))
                return {
                    ...product,
                    ...detailedProduct,
                    matchFound: !!detailedProduct
                }
            })

            setEnrichedInventoryProducts(enrichedProducts)
        } catch (error) {
            console.error('상품 상세 정보 가져오기 실패:', error)
        } finally {
            setIsInventoryDetailLoading(false)
        }
    }

    // 재고 상품 선택 토글
    const toggleInventoryProductSelection = (product) => {
        setSelectedInventoryProducts(prev => {
            const isSelected = prev.some(p => p.code === product.code)
            if (isSelected) {
                return prev.filter(p => p.code !== product.code)
            } else {
                return [...prev, product]
            }
        })
    }

    // 모든 재고 상품 선택/해제
    const toggleSelectAllInventory = () => {
        const productsToDisplay = enrichedInventoryProducts.length > 0 ? enrichedInventoryProducts : inventoryRecommendations
        if (isAllInventorySelected) {
            setSelectedInventoryProducts([])
        } else {
            setSelectedInventoryProducts([...productsToDisplay])
        }
        setIsAllInventorySelected(!isAllInventorySelected)
    }

    // 선택된 재고 상품을 장바구니에 추가
    const addSelectedInventoryProductsToCart = async () => {
        if (selectedInventoryProducts.length === 0 || readOnly) return
        
        // 실제 장바구니 API 연동 구현
        try {
            setIsSaving(true);
            setMessages(prev => [...prev, {
                type: "loading",
                content: `${selectedInventoryProducts.length}개 상품을 장바구니에 추가하는 중...`
            }]);

            // 모든 상품 추가 요청을 병렬로 처리
            const addPromises = selectedInventoryProducts.map(async (product) => {
                const response = await fetch('/api/cart', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        storeId: selectedStoreId,
                        productId: product.id,  // 데이터베이스 상의 상품 ID 사용
                        quantity: 1  // 기본 수량 1로 설정
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `상품 추가 실패: ${product.name}`);
                }

                return await response.json();
            });

            // 모든 요청이 완료될 때까지 대기
            await Promise.all(addPromises);

            // 성공 메시지 추가
            setMessages(prev => {
                // 로딩 메시지를 성공 메시지로 변경
                const updatedMessages = prev.map(msg => {
                    if (msg.type === 'loading' && msg.content.includes('장바구니에 추가하는 중')) {
                        return {
                            type: 'success',
                            content: `${selectedInventoryProducts.length}개 상품이 장바구니에 추가되었습니다.`
                        };
                    }
                    return msg;
                });

                return updatedMessages;
            });
            
            // 선택 상태 초기화
            setSelectedInventoryProducts([])
            setIsAllInventorySelected(false)
            
            // 성공 토스트 메시지 표시
            toast({
                title: "장바구니 추가 완료",
                description: `${selectedInventoryProducts.length}개 상품이 장바구니에 추가되었습니다.`,
                duration: 3000
            });
            
        } catch (error) {
            console.error("장바구니 추가 오류:", error);
            
            // 오류 메시지 추가
            setMessages(prev => {
                // 로딩 메시지를 오류 메시지로 변경
                const updatedMessages = prev.map(msg => {
                    if (msg.type === 'loading' && msg.content.includes('장바구니에 추가하는 중')) {
                        return {
                            type: 'error',
                            content: `장바구니 추가 실패: ${error.message}`
                        };
                    }
                    return msg;
                });

                return updatedMessages;
            });
            
            // 오류 토스트 메시지 표시
            toast({
                title: "장바구니 추가 실패",
                description: error.message,
                variant: "destructive",
                duration: 3000
            });
        } finally {
            setIsSaving(false);
        }
    }

    // 로딩 중인 메시지를 성공 메시지로 변경하는 함수
    const finalizeLoadingMessages = () => {
        setMessages(prev => prev.map(msg => {
            if (msg.type === 'loading') {
                return {
                    type: 'success',
                    content: msg.content.replace('중입니다', '완료되었습니다')
                };
            }
            return msg;
        }));
    };

    // 오류 발생 시 로딩 메시지를 오류로 변경
    const setErrorMessages = (errorMsg) => {
        setMessages(prev => {
            // 기존 로딩 메시지를 찾아 오류로 변경
            const updatedMessages = prev.map(msg => {
                if (msg.type === 'loading') {
                    return {
                        type: 'error',
                        content: '요청 처리 중 오류가 발생했습니다'
                    };
                }
                return msg;
            });

            // 오류 메시지 추가
            return [...updatedMessages, {
                type: 'error',
                content: errorMsg
            }];
        });
    };

    // 자동 저장을 위한 useEffect
    useEffect(() => {
        // 상품 추천 데이터가 있고, AI 응답이 완료되었으며, 로딩 중이 아닐 때만 실행
        if (
            productRecommendations.length > 0 && 
            aiResponse.trim() && 
            !isLoading && 
            !isJsonLoading && 
            !isSaving &&
            session?.user &&
            !autoSaveCompletedRef.current // 이미 저장되지 않았을 때만
        ) {
            console.log("데이터 변경 감지, 자동 저장 실행:", {
                recommendations: productRecommendations.length,
                inventoryRecs: inventoryRecommendations.length,
                aiResponseLength: aiResponse.length,
                isLoading, isJsonLoading
            });
            
            // 자동 저장 실행
            autoSaveAnalysis({
                response: aiResponse,
                systemMessages: messages,
                recommendations: enrichedProducts,
                inventoryRecommendations: enrichedInventoryProducts
            });
        }
    }, [productRecommendations, isLoading, isJsonLoading, isSaving]);

    return (
        <div className="space-y-4 my-4">
            {/* 초기 안내 메시지 (메시지가 없는 경우) */}
            {messages.length === 0 && !aiResponse && !readOnly && (
                <Alert className="bg-blue-50 border-blue-100 text-blue-800">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-sm font-medium">AI 발주 분석</AlertTitle>
                    <AlertDescription className="text-xs text-blue-700 mt-1">
                        날씨 데이터와 판매 추세를 분석하여 최적의 발주 상품을 추천해드립니다.
                        상단의 [AI 분석시작] 버튼을 클릭하면 분석이 시작됩니다.
                        분석이 완료되면 결과는 자동으로 저장됩니다.
                    </AlertDescription>
                </Alert>
            )}

            {/* 시스템 메시지 리스트 - 오직 여기만 자동 스크롤 */}
            {messages.length > 0 && (
                <div className="relative">
                    {/* 상단 그라데이션 효과 */}
                    <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none rounded-t-lg" />
                    <div
                        className="space-y-2 max-h-[380px] overflow-y-auto pr-1 pb-2 rounded-lg custom-scrollbar"
                        ref={messagesEndRef}
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#CBD5E1 #F1F5F9'
                        }}
                    >
                        {messages.map((msg, index) => (
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

            {/* AI 상태 표시 */}
            {isLoading && !readOnly && (
                <div className="flex items-center gap-3 py-2 px-3 bg-indigo-50/60 border border-indigo-100 rounded-lg">
                    <div className="relative flex-shrink-0">
                        <Avatar className="h-9 w-9 border-2 border-indigo-200 shadow-sm">
                            <AvatarImage src="/aisla-logo.png" />
                            <AvatarFallback className="bg-indigo-700 text-white text-xs">AI</AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 animate-pulse ring-1 ring-white"></div>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-indigo-900">AIsla</p>
                            <Badge className="bg-indigo-200 text-indigo-800 h-5 px-1.5 text-xs border-none">
                                분석 중
                            </Badge>
                        </div>
                        <p className="text-xs text-indigo-700">
                            AI가 데이터를 분석하고 있습니다...
                        </p>
                    </div>
                </div>
            )}

            {/* AI 응답 - 별도 영역으로 분리 (Alert 아님) */}
            {aiResponse && (
                <div className="p-0 bg-white border border-zinc-200 rounded-lg overflow-hidden">
                    <div className="flex items-center gap-2 p-3 border-b bg-zinc-50/80 justify-between">
                        <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-medium text-zinc-900">AI 응답</h3>
                        </div>
                        
                        {/* 히스토리 저장 버튼 */}
                        {loadedHistoryData && (
                            <Badge className="bg-amber-100 text-amber-700 h-6 px-2 text-xs border-none gap-1">
                                <History className="h-3.5 w-3.5" />
                                히스토리에서 불러옴
                            </Badge>
                        )}
                    </div>
                    <div className="p-4 leading-relaxed text-zinc-700 text-sm prose max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                        >
                            {aiResponse.replace(/\n/g, "  \n")}
                        </ReactMarkdown>
                    </div>
                </div>
            )}

            {/* 추천 상품 리스트 */}
            {(productRecommendations.length > 0 || isJsonLoading) && (
                <div className="mt-6">
                    <Card className="border-indigo-100 bg-white overflow-hidden">
                        <CardHeader className="pb-2 border-b">
                            <CardTitle className="text-base flex items-center gap-2">
                                <div className="h-4 w-1 bg-indigo-600 rounded-full"></div>
                                <span className="font-medium text-indigo-900">
                                    추천 발주 리스트
                                </span>
                                {(isJsonLoading || isProductDataLoading) && (
                                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600 ml-2" />
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            {isJsonLoading && productRecommendations.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
                                    <p className="text-indigo-600">추천 상품 목록을 불러오는 중입니다...</p>
                                </div>
                            ) : isProductDataLoading && enrichedProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
                                    <p className="text-indigo-600">상품 상세 정보를 불러오는 중입니다...</p>
                                </div>
                            ) : (
                                <>
                                    {/* 선택 컨트롤 */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                    checked={isAllSelected}
                                                    onChange={toggleSelectAll}
                                                />
                                                <span className="text-sm text-gray-700">모두 선택</span>
                                            </label>
                                            <span className="text-xs text-gray-500">
                                                ({selectedProducts.length}/{(enrichedProducts.length > 0 ? enrichedProducts : productRecommendations).length}개 선택됨)
                                            </span>
                                            {selectedProducts.length > 0 && (
                                                <button
                                                    onClick={() => setSelectedProducts([])}
                                                    className="text-xs text-gray-500 hover:text-gray-700 ml-2"
                                                >
                                                    선택 초기화
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            onClick={addSelectedProductsToCart}
                                            disabled={selectedProducts.length === 0 || readOnly}
                                            className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-1 ${selectedProducts.length > 0 && !readOnly
                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                }`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                                <path d="M16 10a4 4 0 0 1-8 0"></path>
                                            </svg>
                                            장바구니 추가
                                        </button>
                                    </div>

                                    <Carousel
                                        setApi={setCarouselApi}
                                        className="w-full py-2"
                                        opts={{
                                            align: "start",
                                            loop: false,
                                        }}
                                    >
                                        <CarouselContent className="-ml-4">
                                            {(enrichedProducts.length > 0 ? enrichedProducts : productRecommendations).map((item, index) => (
                                                <CarouselItem key={index} className="pl-4 sm:basis-1/2 lg:basis-1/3">
                                                    <Card className={`overflow-hidden h-full transition-all duration-300 hover:shadow-md ${selectedProducts.some(p => p.code === item.code)
                                                        ? 'border-indigo-400 shadow-md ring-1 ring-indigo-300'
                                                        : 'border-indigo-100'
                                                        }`}>
                                                        <CardHeader className="p-3 pb-2 border-b">
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex items-center gap-2 flex-1">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                        checked={selectedProducts.some(p => p.code === item.code)}
                                                                        onChange={() => toggleProductSelection(item)}
                                                                    />
                                                                    <CardTitle className="text-sm font-medium text-indigo-900 truncate">{item.name || `상품 ${index + 1}`}</CardTitle>
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
                                                                    {item.tags && Array.isArray(item.tags) && item.tags.length > 0 && (
                                                                        <div className="absolute top-1 left-1">
                                                                            {item.tags.slice(0, 1).map((tag, idx) => (
                                                                                <Badge key={idx} className="bg-rose-500 text-white border-none text-xs">
                                                                                    {tag}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    )}
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
                                                                    <p className={`font-medium flex items-center ${typeof item.stock === 'number' && item.stock < 5
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
                                                                    <Badge variant="outline" className={`text-xs ${item.stock > 20
                                                                        ? 'bg-green-50 text-green-700 border-green-200'
                                                                        : item.stock > 5
                                                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                                            : 'bg-red-50 text-red-700 border-red-200'
                                                                        }`}>
                                                                        {item.stock > 20 ? '재고 충분' : item.stock > 5 ? '재고 주의' : item.stock > 0 ? '재고 부족' : '재고 없음'}
                                                                    </Badge>
                                                                )}
                                                              
                                                                

                                                                {item.tags && Array.isArray(item.tags) && item.tags.length > 1 && (
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {item.tags.slice(1, 3).map((tag, idx) => (
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

                                                            <div className="pt-2 flex justify-end">
                                                                <button
                                                                    className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded ${selectedProducts.some(p => p.code === item.code)
                                                                        ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                                                                        : 'text-indigo-600 hover:text-indigo-800 hover:bg-gray-50'
                                                                        }`}
                                                                    onClick={() => toggleProductSelection(item)}
                                                                >
                                                                    {selectedProducts.some(p => p.code === item.code) ? (
                                                                        <>
                                                                            선택됨
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                                            </svg>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            선택하기
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <path d="M5 12h14"></path>
                                                                                <path d="M12 5v14"></path>
                                                                            </svg>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
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
                                </>
                            )}
                        </CardContent>
                    </Card>
                    
                </div>
            )}
            {/* 재고 기반 추천 상품 리스트 */}
            {(inventoryRecommendations.length > 0 || isInventoryLoading) && (
                <div className="mt-6">
                    <Card className="border-amber-100 bg-white overflow-hidden">
                        <CardHeader className="pb-2 border-b">
                            <CardTitle className="text-base flex items-center gap-2">
                                <div className="h-4 w-1 bg-amber-600 rounded-full"></div>
                                <span className="font-medium text-amber-900">
                                    재고 기반 추천 상품
                                </span>
                                {(isInventoryLoading || isInventoryDetailLoading) && (
                                    <Loader2 className="h-4 w-4 animate-spin text-amber-600 ml-2" />
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            {isInventoryLoading ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-amber-600 mb-4" />
                                    <p className="text-amber-600">재고 기반 추천 상품을 불러오는 중입니다...</p>
                                </div>
                            ) : (
                                <>
                                    {/* 선택 컨트롤 */}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center gap-1.5 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                                    checked={isAllInventorySelected}
                                                    onChange={toggleSelectAllInventory}
                                                />
                                                <span className="text-sm text-gray-700">모두 선택</span>
                                            </label>
                                            <span className="text-xs text-gray-500">
                                                ({selectedInventoryProducts.length}/{(enrichedInventoryProducts.length > 0 ? enrichedInventoryProducts : inventoryRecommendations).length}개 선택됨)
                                            </span>
                                            {selectedInventoryProducts.length > 0 && (
                                                <button 
                                                    onClick={() => setSelectedInventoryProducts([])}
                                                    className="text-xs text-gray-500 hover:text-gray-700 ml-2"
                                                >
                                                    선택 초기화
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            onClick={addSelectedInventoryProductsToCart}
                                            disabled={selectedInventoryProducts.length === 0 || readOnly}
                                            className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-1 ${
                                                selectedInventoryProducts.length > 0 && !readOnly
                                                ? 'bg-amber-600 text-white hover:bg-amber-700' 
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                                <path d="M16 10a4 4 0 0 1-8 0"></path>
                                            </svg>
                                            발주 목록에 추가
                                        </button>
                                    </div>

                                    <Carousel
                                        className="w-full py-2"
                                        opts={{
                                            align: "start",
                                            loop: false,
                                        }}
                                    >
                                        <CarouselContent className="-ml-4">
                                            {(enrichedInventoryProducts.length > 0 ? enrichedInventoryProducts : inventoryRecommendations).map((item, index) => (
                                                <CarouselItem key={index} className="pl-4 sm:basis-1/2 lg:basis-1/3">
                                                    <Card className={`overflow-hidden h-full transition-all duration-300 hover:shadow-md ${
                                                        selectedInventoryProducts.some(p => p.code === item.code) 
                                                        ? 'border-amber-400 shadow-md ring-1 ring-amber-300'
                                                        : 'border-amber-100'
                                                    }`}>
                                                        <CardHeader className="p-3 pb-2 border-b">
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex items-center gap-2 flex-1">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                                                        checked={selectedInventoryProducts.some(p => p.code === item.code)}
                                                                        onChange={() => toggleInventoryProductSelection(item)}
                                                                    />
                                                                    <CardTitle className="text-sm font-medium text-amber-900 truncate">{item.name || `상품 ${index + 1}`}</CardTitle>
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
                                                                            new Date(item.expirationDate) < new Date() ? 'text-red-600' : // 지난 유통기한
                                                                            new Date(item.expirationDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'text-amber-600' : // 7일 이내
                                                                            'text-slate-900' // 정상
                                                                        : 'text-slate-400' // 정보 없음
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
                                                                        new Date(item.expirationDate) < new Date() ? 'text-red-600' : // 지난 유통기한
                                                                        new Date(item.expirationDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'text-amber-600' : // 7일 이내
                                                                        'text-slate-900' // 정상
                                                                    : 'text-slate-400' // 정보 없음
                                                                }`}>
                                                                    {item.expirationDate ? 
                                                                        new Date(item.expirationDate) < new Date() ? '지난 유통기한' : // 지난 유통기한
                                                                        new Date(item.expirationDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? '7일 이내' : // 7일 이내
                                                                        '정상' // 정상
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
                                                            </div>
                                                            {item.reason && (
                                                                <div className="my-1">
                                                                    <p className="text-xs text-slate-500 mb-1">추천 이유</p>
                                                                    <div className="text-sm text-indigo-700 bg-indigo-50 p-2 rounded-md border border-indigo-100">
                                                                        {item.reason}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <div className="pt-2 flex justify-end">
                                                                <button 
                                                                    className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded ${
                                                                        selectedInventoryProducts.some(p => p.code === item.code)
                                                                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                                                        : 'text-amber-600 hover:text-amber-800 hover:bg-gray-50'
                                                                    }`}
                                                                    onClick={() => toggleInventoryProductSelection(item)}
                                                                >
                                                                    {selectedInventoryProducts.some(p => p.code === item.code) ? (
                                                                        <>
                                                                            선택됨
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <polyline points="20 6 9 17 4 12"></polyline>
                                                                            </svg>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            선택하기
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <path d="M5 12h14"></path>
                                                                                <path d="M12 5v14"></path>
                                                                            </svg>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
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
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
});

AIPrediction.displayName = "AIPrediction";

export default AIPrediction;

