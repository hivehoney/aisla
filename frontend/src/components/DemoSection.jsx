'use client'

import { Terminal, CheckCircle2, Loader2, Info } from "lucide-react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useEffect, useState, useRef } from "react";

export default function DemoSection() {
    // 더미 시스템 메시지 리스트 (type: 'success' | 'loading' | 'system' | 'info')
    const dummyMsgs = [
        { type: 'system', title: '시스템', content: 'AI 분석을 시작합니다...' },
        { type: 'success', title: '성공', content: '서버에 연결 중입니다...' },
        { type: 'success', title: '성공', content: '서버 응답 확인' },
        { type: 'info', title: '정보', content: '매장 정보 수신 대기 중...' },
        { type: 'success', title: '성공', content: '매장 정보 수신 완료' },
        { type: 'success', title: '성공', content: '매장 위치 확인 완료 (위도: 37.5477, 경도: 127.0938)' },
        { type: 'loading', title: '로딩', content: '날씨 데이터를 가져오는 중...' },
        { type: 'success', title: '성공', content: '날씨 데이터 수신 완료' },
        { type: 'loading', title: '로딩', content: '추천 분류 생성 중...' },
        { type: 'success', title: '성공', content: '뉴스 기사 수신 완료' },
        { type: 'info', title: '정보', content: '재고 데이터 처리 중...' },
        { type: 'success', title: '성공', content: '재고 알림 설정 완료' },
        { type: 'info', title: '정보', content: '재고와 변수 데이터를 토대로 분석을 진행' },
    ];

    // 각 메시지의 위치와 3D 스택 설정
    const positions = [
        { top: '8%', left: '12%', z: -20, rot: 10 },
        { top: '18%', left: '70%', z: -40, rot: 12 },
        { top: '30%', left: '25%', z: -60, rot: 8 },
        { top: '42%', left: '60%', z: -80, rot: 15 },
        { top: '55%', left: '15%', z: -100, rot: 10 },
        { top: '65%', left: '75%', z: -120, rot: 13 },
        { top: '10%', left: '50%', z: -140, rot: 5 },
        { top: '28%', left: '85%', z: -160, rot: 14 },
        { top: '48%', left: '40%', z: -180, rot: 10 },
        { top: '62%', left: '55%', z: -200, rot: 12 },
        { top: '80%', left: '20%', z: -220, rot: 11 },
        { top: '75%', left: '82%', z: -240, rot: 9 },
        { top: '5%', left: '95%', z: -260, rot: 10 },
    ];

    const getBgColor = (type) => {
        switch (type) {
            case 'success': return 'bg-green-50 border-green-100 text-green-800';
            case 'loading': return 'bg-amber-50 border-amber-100 text-amber-800';
            case 'system': return 'bg-slate-50 border-slate-200 text-slate-800';
            case 'info': return 'bg-blue-50 border-blue-100 text-blue-800';
            default: return '';
        }
    };

    const getBlurClass = (i) => {
        const levels = ['blur-none', 'blur-[0.3px]', 'blur-[0.8px]', 'blur-[0.4px]', 'blur-[1.8px]', 'blur-[0.5px]', 'blur-[2.8px]', 'blur-[3.8px]', 'blur-[0.3px]'];
        return levels[i] || 'blur-[2.1px]';
    };
    const getOpacityClass = (i) => {
        const values = [100, 90, 80, 70, 60, 50, 40, 30, 20, 15, 10, 5];
        return `opacity-${values[i] || 5}`;
    };
    const getPaddingClass = (i) => {
        return 'py-2';
    };

    // 마우스 움직임 트래킹을 위한 값들
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    
    // 회전 변환
    const rotateX = useTransform(mouseY, [-700, 700], [10, -10]);
    const rotateY = useTransform(mouseX, [-200, 200], [-10, 10]);
    
    // 부드러운 애니메이션을 위한 스프링 효과
    const springRotateX = useSpring(rotateX, { stiffness: 100, damping: 30 });
    const springRotateY = useSpring(rotateY, { stiffness: 100, damping: 30 });

    // 마우스 이벤트 핸들러
    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        mouseX.set(e.clientX - centerX);
        mouseY.set(e.clientY - centerY);
    };

    return (
        <section className="relative">
            {/* FOREGROUND CONTENT */}
            <div className="mx-auto w-full pt-16 pb-4 px-4 bg-zinc-950 text-white">
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 text-emerald-400 mb-4">
                        <Terminal className="w-5 h-5" />
                        <span className="font-mono text-sm">AI Analysis</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-4">맞춤형 추천 시스템</h2>
                    <p className="text-zinc-400 max-w-xl mx-auto mb-8">
                        다양한 데이터를 기반으로 트렌드 분석 및 스마트 추천 시스템을 제공합니다
                    </p>
                </div>
            </div>
            
            {/* 겹치는 효과를 위한 컨테이너 */}
            <div className="relative bg-zinc-950">
                {/* BACKGROUND: 분산된 3D 메시지 스택 - 먼저 배치 */}
                <div className="relative h-[600px] bg-zinc-950 text-white overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none perspective-800">
                        {dummyMsgs.map((msg, i) => {
                            const pos = positions[i % positions.length];
                            return (
                                <motion.div
                                    key={i}
                                    className={`absolute w-80 max-w-xs border rounded-lg px-3 ${getPaddingClass(i)} ${getBgColor(msg.type)} ${getOpacityClass(i)} ${getBlurClass(i)} transform-gpu`}
                                    style={{
                                        top: pos.top,
                                        left: pos.left,
                                        transform: `translate(-50%, -50%) rotateX(${pos.rot}deg) translateZ(${pos.z}px)`
                                    }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                                >
                                    <div className="flex items-center gap-2 text-xs">
                                        {msg.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                                        {msg.type === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {msg.type === 'system' && <Terminal className="w-4 h-4" />}
                                        {msg.type === 'info' && <Info className="w-4 h-4" />}
                                        <div className="flex flex-col">
                                            <span className="font-mono font-bold">{msg.title}</span>
                                            <span className="font-mono">{msg.content}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
                
                {/* LLM 응답 코드 출력창 - 겹치게 배치 */}
                <div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl px-12 py-12 z-10"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => {
                        mouseX.set(0);
                        mouseY.set(0);
                    }}
                >
                    <motion.div
                        className="w-full border border-zinc-700 rounded-lg bg-black/90 text-green-400 font-mono p-6 shadow-2xl backdrop-blur-md"
                        style={{ 
                            rotateX: springRotateX,
                            rotateY: springRotateY,
                            transformPerspective: 1200,
                            transformOrigin: 'center center',
                            boxShadow: "0 30px 100px rgba(0,0,0,0.7)"
                        }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                            delay: 1.2, 
                            duration: 0.8,
                            type: "spring",
                            stiffness: 100
                        }}
                    >
                        <div className="mb-2 text-white text-xs opacity-70">💡 AI Model 응답 코드:</div>
                        <TypingAnimation
                            text={[
                                "[1] 매장 정보 및 위치 데이터 확인 (위도: 37.5477, 경도: 127.0938)",
                                "[2] 기상 데이터 수신 중... 온도: 22°C, 습도: 68%, 날씨: 맑음",
                                "[3] 날씨 기반 추천 분류 생성: 음료수, 아이스크림, 선크림",
                                "[4] 최신 뉴스 기사 수신 완료 (8건): 트렌드 키워드 추출 중",
                                "[5] 뉴스 기반 추천 분류 생성: 건강식품, 보양식품, 음료",
                                "[6] 현재 재고 데이터 분석 중: 68개 제품 확인",
                                "[7] 판매량 예측 알고리즘 적용 중...",
                                "[8] 판매 데이터와 날씨 및 트렌드 연관성 분석 완료",
                                "[9] 최종 추천 결과 도출 완료 🎉",
                                " ",
                                "✅ 추천 품목: 비닐우산(00231), OO이온음료 (01231), 손세정제 (00231)"
                            ]}
                        />
                    </motion.div>
                </div>
            </div>
            
            {/* 아래 컨텐츠를 위한 여백 공간 */}
            <div className="w-full py-16 bg-zinc-950"></div>
        </section>
    );
}

function TypingAnimation({ text }) {
    const [displayedText, setDisplayedText] = useState([]);
    const [lineIndex, setLineIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);

    useEffect(() => {
        if (lineIndex < text.length) {
            if (charIndex < text[lineIndex].length) {
                const timeout = setTimeout(() => {
                    setDisplayedText(prev => {
                        const newLines = [...prev];
                        if (!newLines[lineIndex]) newLines[lineIndex] = "";
                        newLines[lineIndex] += text[lineIndex][charIndex];
                        return newLines;
                    });
                    setCharIndex(charIndex + 1);
                }, 10);
                return () => clearTimeout(timeout);
            } else {
                const timeout = setTimeout(() => {
                    setLineIndex(lineIndex + 1);
                    setCharIndex(0);
                }, 500);
                return () => clearTimeout(timeout);
            }
        }
    }, [charIndex, lineIndex]);

    return (
        <pre className="whitespace-pre-wrap leading-relaxed">
            {displayedText.map((line, idx) => (
                <div key={idx}>{line}</div>
            ))}
        </pre>
    );
}
