'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  Scan, 
  Camera, 
  ToggleLeft, 
  ToggleRight, 
  Maximize, 
  ArrowLeft, 
  Zap,
  RefreshCw,
  Wifi,
  WifiOff,
  Store
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function ScannerPage() {
  const videoRef = useRef(null);
  const inputRef = useRef(null);
  const codeReaderRef = useRef(null);
  const containerRef = useRef(null);
  const audioRef = useRef(null);
  const [ws, setWs] = useState(null);
  const [wsStatus, setWsStatus] = useState('connecting'); // 'connecting', 'connected', 'error', 'closed'
  const [scanActive, setScanActive] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(0);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [autoScan, setAutoScan] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const router = useRouter();
  const isPaused = useRef(false);
  
  // POS 선택 모달 관련 상태 추가
  const [posSelectOpen, setPosSelectOpen] = useState(true);
  const [connectedPOSClients, setConnectedPOSClients] = useState([]);
  const [selectedPOSClient, setSelectedPOSClient] = useState(null);
  const [isLoadingPOS, setIsLoadingPOS] = useState(false);

  // 오디오 요소 생성 (사용자 상호작용 관련 권한 문제 해결)
  useEffect(() => {
    // 컴포넌트 마운트 시 한 번만 오디오 객체 생성
    audioRef.current = new Audio('/sounds/beep.mp3');
    audioRef.current.preload = 'auto';
    
    // 사용자 상호작용 처리
    const handleUserInteraction = () => {
      if (audioRef.current) {
        // 무음으로 짧게 재생하여 오디오 활성화
        const originalVolume = audioRef.current.volume;
        audioRef.current.volume = 0.001;
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // 성공적으로 재생 시작됨
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
              audioRef.current.volume = originalVolume;
              console.log('오디오 시스템 활성화됨');
            })
            .catch(err => {
              // 자동 재생 정책으로 인한 오류는 무시
              console.log('오디오 활성화 시도 중 오류 (정상):', err);
            });
        }
      }
    };
    
    // 모든 사용자 상호작용에서 오디오 활성화 시도
    const events = ['click', 'touchstart', 'keydown', 'pointerdown'];
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true });
    });
    
    return () => {
      // 이벤트 리스너 정리
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
      
      // 언마운트 시 오디오 정리
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // 전체 화면 처리
  useEffect(() => {
    // 스크롤 방지 (iOS Safari 포함)
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    // 페이지 나갈 때 복원
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  // 전체 화면 토글
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.log('전체 화면 전환 오류:', err);
    }
  };

  // 전체 화면 변경 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // WebSocket 연결
  useEffect(() => {
    setWsStatus('connecting');
    // 로컬 개발 환경에서 직접 URL 지정
    const wsUrl = process.env.NEXT_PUBLIC_SCANNER_WS_URL || 'wss://aisla.o-r.kr/ws/';
    const socket = new WebSocket(wsUrl);
    setWs(socket);

    socket.onopen = () => {
      console.log('✅ WebSocket 연결됨');
      setWsStatus('connected');
      
      // 클라이언트 타입 등록 메시지 전송 (초기에는 targetPOS 없이)
      const registerMessage = JSON.stringify({
        type: 'register',
        clientType: 'SCANNER',
        id: 'scanner-' + Date.now()
      });
      socket.send(registerMessage);
      console.log('📤 클라이언트 등록 요청:', registerMessage);
      
      // 연결 직후 POS 목록 요청
      setTimeout(() => {
        if (socket.readyState === WebSocket.OPEN) {
          fetchPOSClients();
        }
      }, 1000);
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
        
        // POS 등록 해제 메시지 처리
        if (data.type === 'pos_unregistered') {
          const unregisteredPosId = data.posId;
          console.log(`⚠️ POS 등록 해제됨: ${unregisteredPosId}`, data.message || '');
          
          // 현재 선택된 POS가 등록 해제된 경우
          if (selectedPOSClient && selectedPOSClient.id === unregisteredPosId) {
            setSelectedPOSClient(null);
            
            // 메시지가 있는 경우 (스토어 변경) 다른 메시지 표시
            if (data.message && data.message.includes('changed store')) {
              toast.warning("연결된 POS가 다른 스토어로 변경되었습니다", {
                description: "새로운 POS 단말기를 선택해주세요",
                duration: 5000,
              });
            } else {
              toast.warning("선택된 POS 단말기가 등록 해제되었습니다", {
                description: "다른 POS 단말기를 선택해주세요",
                duration: 5000,
              });
            }
            
            // 즉시 POS 목록 새로고침
            fetchPOSClients();
            
            // 다시 선택 모달 열기
            setPosSelectOpen(true);
          }
          
          return;
        }
        
        // 연결된 POS 클라이언트 목록 정보 처리
        if (data.type === 'pos_clients_list') {
          console.log('📋 POS 목록 수신:', data.clients);
          setConnectedPOSClients(data.clients || []);
          setIsLoadingPOS(false);
          
          // 선택된 POS가 목록에서 사라졌는지 확인
          if (selectedPOSClient) {
            const stillExists = (data.clients || []).some(
              client => client.id === selectedPOSClient.id
            );
            
            // 선택된 POS가 더 이상 존재하지 않으면
            if (!stillExists) {
              setSelectedPOSClient(null);
              toast.warning("선택된 POS 단말기 연결이 끊겼습니다", {
                description: "다른 POS 단말기를 선택해주세요",
                duration: 5000,
              });
              // 다시 선택 모달 열기
              setPosSelectOpen(true);
            }
          }
          
          // 모달이 열려있고 POS가 없는 경우에만 토스트 표시
          if (posSelectOpen && (data.clients || []).length === 0) {
            toast.info("연결된 POS 단말기가 없습니다", {
              description: "POS 앱을 실행하고 연결을 확인해주세요",
              duration: 3000,
            });
          }
          
          // 모달이 열려있고 POS가 있는데 선택되지 않은 경우, 자동으로 첫 번째 POS 선택 고려
          if (posSelectOpen && !selectedPOSClient && (data.clients || []).length === 1) {
            // 단 하나의 POS만 있으면 자동 선택
            setSelectedPOSClient(data.clients[0]);
            toast.success(`${data.clients[0].name || data.clients[0].id} 자동 선택됨`, {
              duration: 2000,
            });
          }
          
          return;
        }
        
        // 바코드 데이터 전송 실패 시 처리
        if (data.type === 'error' && data.message.includes('POS not found')) {
          toast.error("선택한 POS 단말기를 찾을 수 없습니다", {
            description: "연결이 끊겼거나 다시 시작되었을 수 있습니다",
            duration: 5000,
          });
          // POS 선택 모달 다시 열기
          setPosSelectOpen(true);
          return;
        }
      } catch (error) {
        // 단순 텍스트 메시지 처리 (이전 버전 호환성)
        console.log('단순 텍스트 메시지로 해석:', e.data);
      }
    };
    
    socket.onerror = (e) => {
      console.log('❌ WebSocket 에러:', e);
      setWsStatus('error');
      setIsLoadingPOS(false);
    };
    
    socket.onclose = () => {
      console.warn('⚠️ WebSocket 종료');
      setWsStatus('closed');
      setConnectedPOSClients([]);
      setSelectedPOSClient(null);
      setIsLoadingPOS(false);
    };

    return () => {
      try {
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      } catch (err) {
        console.log('WebSocket 닫기 오류:', err);
      }
    };
  }, []);
  
  // POS 클라이언트 목록 조회 함수
  const fetchPOSClients = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      setIsLoadingPOS(true);
      const message = JSON.stringify({
        type: 'get_pos_clients'
      });
      ws.send(message);
      console.log('📤 POS 클라이언트 목록 요청 전송');
      
      // 3초 후에도 응답이 없으면 로딩 표시 해제
      setTimeout(() => {
        setIsLoadingPOS(prev => {
          if (prev) {
            // 응답이 없어서 여전히 로딩 중이면 해제
            console.log('⏱️ POS 목록 로딩 타임아웃');
            return false;
          }
          return prev;
        });
      }, 3000);
    } else {
      toast.error("서버 연결이 원활하지 않습니다", {
        description: "잠시 후 다시 시도해주세요",
        duration: 3000,
      });
      setIsLoadingPOS(false);
    }
  };

  // 기존 비디오 스트림 정리 함수
  const cleanupVideoStream = () => {
    console.log('이전 비디오 스트림 정리 중...');
    
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const mediaStream = videoRef.current.srcObject;
        const tracks = mediaStream.getTracks();
        
        tracks.forEach(track => {
          track.stop();
          console.log(`트랙 ${track.kind} 중지됨`);
        });
        
        videoRef.current.srcObject = null;
      } catch (err) {
        console.log('스트림 정리 오류:', err);
      }
    }
    
    // ZXing 인스턴스 초기화
    codeReaderRef.current = null;
  };

  // 안전한 비디오 제약 조건 획득
  const getSafeVideoConstraints = () => {
    // 기본 제약 조건 - 단순하게 유지
    const basicConstraints = { video: true };
    
    // 가능하면 후면 카메라 사용 시도
    const preferredConstraints = { 
      video: { 
        facingMode: 'environment', 
        width: { ideal: 1280 },
        height: { ideal: 720 } 
      }
    };
    
    return { basicConstraints, preferredConstraints };
  };

  // 카메라 스트림 초기화 함수
  const initializeCamera = async () => {
    if (!videoRef.current) return;
    
    setCameraReady(false);
    setScanActive(true);
    
    // 이전 스트림 정리
    cleanupVideoStream();
    
    // 안전한 제약 조건 가져오기
    const { basicConstraints, preferredConstraints } = getSafeVideoConstraints();
    
    try {
      console.log('카메라 초기화 시작');
      // ZXing 초기화
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;
      
      if (autoScan) {
        console.log('자동 스캔 모드로 초기화 중...');
        try {
          // 우선 선호하는 설정으로 시도
          await codeReader.decodeFromVideoDevice(
            null, // null을 사용하여 ZXing이 기본 카메라를 선택하게 함
            videoRef.current, 
            (result, err) => {
              if (result && !isPaused.current) {
                processBarcode(result.getText());
              }
            }
          );
          console.log('자동 바코드 스캐너 시작됨');
          setCameraReady(true);
          setCameraPermissionDenied(false);
        } catch (err) {
          console.error('자동 스캔 모드 초기화 오류:', err);
          if (err.name === 'NotAllowedError') {
            setCameraPermissionDenied(true);
            toast.error('카메라 접근이 거부되었습니다. 브라우저 설정에서 허용해주세요.');
          } else {
            // 제약 조건 오류일 가능성 - 기본 설정으로 폴백
            try {
              const stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // 비디오 스트림으로 ZXing 디코더 시작
                codeReader.decodeFromStream(
                  stream,
                  videoRef.current,
                  (result, err) => {
                    if (result) {
                      processBarcode(result.getText());
                    }
                  }
                );
                setCameraReady(true);
                setCameraPermissionDenied(false);
              }
            } catch (fallbackErr) {
              console.error('카메라 폴백 설정 실패:', fallbackErr);
              setCameraPermissionDenied(true);
              toast.error('카메라를 시작할 수 없습니다. 다시 시도해주세요.');
            }
          }
        }
      } else {
        // 수동 스캔 모드
        console.log('수동 스캔 모드로 초기화 중...');
        try {
          // 선호 설정으로 시도
          const stream = await navigator.mediaDevices.getUserMedia(preferredConstraints);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setCameraReady(true);
            setCameraPermissionDenied(false);
          }
        } catch (err) {
          console.error('선호 카메라 설정 오류:', err);
          // 기본 설정으로 폴백
          try {
            const stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              setCameraReady(true);
              setCameraPermissionDenied(false);
            }
          } catch (fallbackErr) {
            console.error('카메라 액세스 오류:', fallbackErr);
            setCameraPermissionDenied(true);
            toast.error('카메라 접근이 거부되었습니다. 브라우저 설정에서 허용해주세요.');
          }
        }
      }
    } catch (err) {
      console.error('카메라 초기화 중 예상치 못한 오류:', err);
      setCameraPermissionDenied(true);
      toast.error('카메라를 초기화할 수 없습니다. 페이지를 새로고침해 보세요.');
    }
  };

  // 카메라 초기화
  useEffect(() => {
    initializeCamera();
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      console.log('컴포넌트 언마운트, 정리 시작...');
      setScanActive(false);
      cleanupVideoStream();
    };
  }, [ws, autoScan]);
  
  // 소리 재생 함수
  const playBeepSound = () => {
    try {
      if (!audioRef.current) return;
      
      // 볼륨 설정 및 재생 중인 오디오 리셋
      audioRef.current.volume = 1.0;
      audioRef.current.currentTime = 0;
      
      // 새 인스턴스 생성하여 재생
      const sound = new Audio('/sounds/beep.mp3');
      sound.volume = 1.0;
      sound.play().catch(err => {
        console.log('오디오 재생 실패, 원래 오디오 요소로 다시 시도:', err);
        // 원래 오디오로 다시 시도
        audioRef.current.play().catch(e => console.log('두 번째 오디오 재생 시도도 실패:', e));
      });
      
      console.log('비프음 재생 요청됨');
    } catch (err) {
      console.error('소리 재생 오류:', err);
    }
  };
  
  // 바코드 처리 함수
  const processBarcode = (code) => {
    // 이미 일시 정지 중이면 처리하지 않음
    if (isPaused.current) {
      console.log('일시 정지 상태: 바코드 인식 무시');
      return;
    }
    
    // 최근 스캔 시간 확인 (2초 내 중복 방지)
    const now = Date.now();
    if (lastScannedCode === code && now - scanSuccess < 2000) {
      console.log('중복 스캔 방지: 같은 바코드를 2초 이내에 다시 스캔했습니다');
      return;
    }
    
    console.log('📦 바코드 인식:', code);
    
    // 스캔 처리 중 상태로 설정
    setIsScanning(true);
    
    // 바코드 스캔 성공 애니메이션 표시
    setLastScannedCode(code);
    setScanSuccess(now); // 타임스탬프 저장
    
    // 진동 피드백 (지원되는 기기)
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    
    // 소리 피드백 재생
    playBeepSound();
    
    // 입력 필드에 바코드 설정 및 전송
    if (inputRef.current) {
      inputRef.current.value = code;
      handleSend(code);
    }
    
    // 스캔 모드에 따라 다른 처리
    if (autoScan && codeReaderRef.current) {
      // 자동 모드: 바코드 인식을 일시 중지 (2초)
      console.log('자동 모드: 스캔 일시 정지 (2초)');
      
      // 일시 중지 상태로 설정
      isPaused.current = true;
      
      // 2초 후에 다시 활성화
      setTimeout(() => {
        // 오버레이 제거 및 스캔 활성화
        setScanSuccess(0);
        setIsScanning(false);
        isPaused.current = false; // 일시 중지 해제
        console.log('자동 모드: 스캔 재개');
      }, 2000);
    } else {
      // 수동 모드: 오버레이는 표시하되 즉시 다음 스캔 준비
      console.log('수동 모드: 즉시 준비');
      
      // 스캔 상태만 초기화 (오버레이는 유지)
      setIsScanning(false);
      
      // 오버레이는 1초만 표시 후 자동 제거
      setTimeout(() => {
        setScanSuccess(0);
      }, 1000);
    }
  };
  
  // 카메라 수동 재시작 함수
  const restartCamera = () => {
    console.log('카메라 재시작 요청됨');
    // 기존 콜백 제거 및 모든 리소스 정리
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
      } catch (err) {
        console.log('리셋 중 오류 무시:', err);
      }
    }
    
    // 약간 지연 후 초기화 - 리소스가 제대로 정리되도록
    setTimeout(() => {
      initializeCamera();
      toast.info('카메라를 재시작합니다...');
    }, 300);
  };
  
  // 수동 스캔 처리 - 클릭 방식으로 변경
  const triggerManualScan = async () => {
    // 사용자 상호작용으로 오디오 시스템 활성화 시도
    if (audioRef.current) {
      audioRef.current.volume = 0.1;
      try {
        await audioRef.current.play();
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (err) {
        console.log('스캔 중 오디오 활성화 실패 (무시됨):', err);
      }
    }
    
    if (!codeReaderRef.current || !videoRef.current || !cameraReady) {
      toast.error('카메라가 준비되지 않았습니다');
      return;
    }
    
    if (isScanning) {
      toast.info('잠시 기다려주세요...');
      return; // 이미 스캔 중이면 중복 방지
    }
    
    setIsScanning(true);
    
    try {
      console.log('수동 스캔 시작');
      
      const result = await codeReaderRef.current.decodeOnceFromVideoElement(videoRef.current);
      if (result) {
        processBarcode(result.getText());
        // processBarcode에서 isScanning 상태를 관리하므로 여기서는 상태를 변경하지 않음
      } else {
        // 바코드를 찾지 못했을 때만 스캔 상태 초기화
        setIsScanning(false);
        toast.error('바코드를 찾을 수 없습니다. 다시 시도하세요.');
      }
    } catch (error) {
      // 바코드를 찾지 못하면 오류가 발생하므로 사용자에게 알림
      console.log('바코드를 찾지 못했습니다', error);
      toast.error('바코드를 찾을 수 없습니다. 다시 시도하세요.');
      // 오류 시 스캔 상태 초기화
      setIsScanning(false);
    }
  };
  
  // 선택된 POS로 바코드 전송 함수
  const handleSend = (value) => {
    const trimmed = value?.trim();
    if (!trimmed) {
      toast.warning("바코드를 입력해주세요");
      return;
    }
    
    if (!selectedPOSClient) {
      toast.error("POS 단말기를 선택해주세요", {
        description: "우측 상단의 POS 아이콘을 눌러 선택하세요",
        duration: 3000,
      });
      return;
    }
    
    // 입력 필드 초기화
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    
    console.log(`📤 바코드 전송: ${trimmed} → ${selectedPOSClient.displayName || selectedPOSClient.name || selectedPOSClient.id}`);
    
    // 바코드 데이터 전송 - 구조화된 JSON 형식
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        const message = JSON.stringify({
          type: 'barcode_data',
          barcode: trimmed,
          targetPOS: selectedPOSClient.id
        });
        ws.send(message);
        toast.success("바코드 전송 완료", {
          description: trimmed,
          duration: 1000,
        });
        return;
      } catch (e) {
        console.error('구조화된 JSON 전송 실패:', e);
      }
    }
    
    toast.error("서버 연결 오류", {
      description: "바코드를 전송할 수 없습니다",
      duration: 2000,
    });
  };
  
  // POS 선택이 변경될 때 토스트 메시지 표시
  const handlePOSSelect = (value) => {
    const client = connectedPOSClients.find(c => c.id === value);
    setSelectedPOSClient(client || null);
    
    if (client) {
      toast.success(`${client.displayName || client.name || client.id} 선택됨`, {
        duration: 2000,
      });
    }
  };
  
  // POS 선택 후 모달 닫기
  const confirmPOSSelection = () => {
    if (!selectedPOSClient) {
      toast.warning("POS 단말기를 선택해주세요", {
        duration: 3000,
      });
      return;
    }
    
    // 선택한 POS를 targetPOS로 등록하는 메시지 전송
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        const registerMessage = JSON.stringify({
          type: 'register',
          clientType: 'SCANNER',
          id: 'scanner-' + Date.now(),
          targetPOS: selectedPOSClient.id
        });
        
        ws.send(registerMessage);
        console.log(`📤 스캐너 등록 업데이트: ${selectedPOSClient.displayName || selectedPOSClient.name}(${selectedPOSClient.id})로 타겟 설정`);
        
        toast.success(`${selectedPOSClient.displayName || selectedPOSClient.name || selectedPOSClient.id}에 연결되었습니다`, {
          duration: 2000,
        });
      } catch (err) {
        console.error('POS 선택 정보 전송 오류:', err);
      }
    }
    
    setPosSelectOpen(false);
  };
  
  // 스캔 모드 전환 처리
  const toggleScanMode = () => {
    // 오디오 시스템 활성화 시도
    if (audioRef.current) {
      audioRef.current.volume = 0.1;
      audioRef.current.play().then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }).catch(err => {
        console.log('모드 전환 중 오디오 활성화 실패 (무시됨):', err);
      });
    }
    
    setAutoScan(prev => !prev);
  };
  
  // POS 페이지로 돌아가기
  const navigateBack = () => {
    router.push('/pos');
  };
  
  // 웹소켓 상태에 따른 색상 및 아이콘 반환
  const getWsStatusInfo = () => {
    switch(wsStatus) {
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
  
  const wsStatusInfo = getWsStatusInfo();

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-background flex flex-col overflow-hidden touch-none"
    >
      {/* 상단 헤더 */}
      <div className="bg-primary/10 p-2 flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={navigateBack}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2 z-10">
          <h2 className="text-base font-medium">바코드 스캐너</h2>
          <div className={`flex items-center ${wsStatusInfo.color}`}>
            {wsStatusInfo.icon}
          </div>
          
          {/* 선택된 POS 표시 */}
          {selectedPOSClient && (
            <Badge variant="outline" className="ml-2 bg-primary/10 text-xs max-w-[120px] truncate">
              <Store className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">
                {(selectedPOSClient.name && selectedPOSClient.name.length > 5) 
                  ? `${selectedPOSClient.name.substring(0, 5)}...` 
                  : selectedPOSClient.name || selectedPOSClient.id.substring(0, 5) + '...'}
              </span>
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* POS 선택 버튼 */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setPosSelectOpen(true)}
            className="h-9 w-9"
            title="POS 선택"
          >
            <Store className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleFullscreen}
            className="h-9 w-9"
          >
            <Maximize className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* 메인 콘텐츠 - 레이아웃 조정하여 모든 것이 보이도록 수정 */}
      <div className="flex-1 flex flex-col items-center p-4 overflow-hidden">
        {/* 스캔 모드 전환 */}
        <div className="w-full max-w-md flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Switch 
              id="scan-mode" 
              checked={autoScan} 
              onCheckedChange={toggleScanMode}
            />
            <Label htmlFor="scan-mode" className="flex items-center gap-2 text-sm">
              {autoScan ? (
                <><ToggleRight className="h-4 w-4" /> 자동 스캔 모드</>
              ) : (
                <><ToggleLeft className="h-4 w-4" /> 수동 스캔 모드</>
              )}
            </Label>
          </div>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={restartCamera}
            title="카메라 재시작"
            className="h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        
        {/* 카메라 화면 - 1:1 비율로 중앙 부분만 보이도록 수정 */}
        <div className="relative w-full max-w-md aspect-square mb-3 overflow-hidden rounded-lg border">
          <div className="absolute inset-0 flex items-center justify-center">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="absolute min-w-full min-h-full object-cover" 
            />
          </div>
          
          {/* 카메라 초기화 오버레이 */}
          {(!scanActive || !cameraReady) && !cameraPermissionDenied && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin">
                  <RefreshCw className="w-8 h-8 text-white" />
                </div>
                <p className="text-white">카메라 초기화 중...</p>
              </div>
            </div>
          )}
          
          {/* 카메라 권한 거부 오버레이 */}
          {cameraPermissionDenied && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 z-10">
              <div className="text-center p-4">
                <Camera className="w-12 h-12 text-red-500 mx-auto mb-2" />
                <p className="text-white font-medium mb-2">카메라 접근이 거부되었습니다</p>
                <p className="text-white/70 text-sm mb-4">브라우저 설정에서 카메라 접근을 허용해주세요</p>
                <Button onClick={restartCamera} size="sm">
                  다시 시도
                </Button>
              </div>
            </div>
          )}
          
          {/* 바코드 인식 성공 애니메이션 */}
          {scanSuccess > 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10 animate-in fade-in zoom-in duration-300">
              <div className="bg-white/90 rounded-xl p-4 flex flex-col items-center gap-2 shadow-lg animate-pulse">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
                <p className="font-medium text-white font-bold">바코드 인식됨</p>
                <p className="text-sm text-muted-foreground text-white">{lastScannedCode}</p>
                {autoScan && (
                  <p className="text-xs text-muted-foreground mt-1">잠시 후 자동으로 계속됩니다...</p>
                )}
              </div>
            </div>
          )}
          
          {/* 화면 테두리에 스캔 라인 애니메이션 */}
          <div className={`absolute inset-0 overflow-hidden pointer-events-none z-10 ${scanActive && cameraReady ? 'border-1 border-primary' : ''}`}>
            <div className={`absolute left-0 right-0 h-0.5 bg-primary/80 shadow-sm ${scanActive && cameraReady && (autoScan || isScanning) ? 'animate-scanner-line' : ''}`}></div>
          </div>

          {/* 스캔 영역 가이드 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-[70%] h-[70%] border-2 border-primary/50 rounded-md"></div>
          </div>
        </div>
        
        {/* 입력 및 버튼 영역 */}
        <div className="w-full max-w-md space-y-2 mt-1">
          <div className="text-xs text-muted-foreground mb-1 flex items-center">
            <span className={wsStatusInfo.color + " mr-1"}>●</span>
            {wsStatus === 'connected' ? '서버 연결됨' : '서버 연결 안됨'}
          </div>
          
          <Input
            ref={inputRef}
            placeholder="바코드 수동 입력 또는 스캔"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend(e.target.value);
            }}
            className="h-11 text-base"
          />
          
          {autoScan ? (
            <Button 
              className="w-full h-12 text-base" 
              onClick={() => handleSend(inputRef.current?.value || '')}
            >
              전송
            </Button>
          ) : (
            <Button 
              className="w-full h-12 text-base flex items-center gap-2 bg-primary"
              onClick={triggerManualScan}
              disabled={isScanning || !cameraReady}
            >
              <Zap className="h-5 w-5" />
              {isScanning ? '스캔 중...' : '바코드 스캔하기'}
            </Button>
          )}
          
          <div className="text-xs text-muted-foreground mt-2 text-center">
            {wsStatus === 'connected' 
              ? '인식된 바코드는 자동으로 POS 시스템으로 전송됩니다' 
              : '서버 연결이 필요합니다. 재연결을 위해 페이지를 새로고침하세요'}
          </div>
        </div>
      </div>

      {/* POS 선택 모달 */}
      <Dialog open={posSelectOpen} onOpenChange={setPosSelectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>POS 단말기 선택</DialogTitle>
            <DialogDescription>
              바코드 스캔 데이터를 전송할 POS 단말기를 선택해주세요
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4">
            {/* 연결 상태 표시 */}
            <div className="flex items-center justify-center gap-2 p-2 bg-muted/50 rounded-md">
              <span className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-sm">
                {wsStatus === 'connected' ? '서버 연결됨' : '서버 연결 안됨'}
              </span>
            </div>
            
            {/* POS 선택 목록 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  <span className="font-medium">POS 단말기 선택</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchPOSClients} 
                  disabled={wsStatus !== 'connected' || isLoadingPOS}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingPOS ? 'animate-spin' : ''}`} />
                  새로고침
                </Button>
              </div>
              
              <Select
                value={selectedPOSClient?.id || ""}
                onValueChange={handlePOSSelect}
                disabled={wsStatus !== 'connected' || connectedPOSClients.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="POS 단말기를 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {connectedPOSClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name 
                        ? (client.name.length > 5 ? `${client.name.substring(0, 5)}...` : client.name)
                        : `POS-${client.id.substring(0, 5)}...`}
                      {client.storeInfo && 
                        <span className="ml-2 text-xs text-muted-foreground truncate">
                          ({client.storeInfo.length > 5 ? client.storeInfo.substring(0, 5) + '...' : client.storeInfo})
                        </span>
                      }
                    </SelectItem>
                  ))}
                  {connectedPOSClients.length === 0 && (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      연결된 POS 단말기가 없습니다
                    </div>
                  )}
                </SelectContent>
              </Select>
              
              {selectedPOSClient && (
                <div className="flex items-center justify-center p-2">
                  <Badge className="px-3 py-1 text-sm max-w-full truncate">
                    <span className="truncate">
                      {selectedPOSClient.name 
                        ? (selectedPOSClient.name.length > 5 ? `${selectedPOSClient.name.substring(0, 5)}...` : selectedPOSClient.name)
                        : `POS-${selectedPOSClient.id.substring(0, 5)}...`} 선택됨
                      {selectedPOSClient.storeInfo && 
                        ` (${selectedPOSClient.storeInfo.length > 5 ? selectedPOSClient.storeInfo.substring(0, 5) + '...' : selectedPOSClient.storeInfo})`
                      }
                    </span>
                  </Badge>
                </div>
              )}
            </div>
            
            {wsStatus === 'connected' && connectedPOSClients.length === 0 && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-3 text-sm text-amber-800">
                <p className="font-medium">연결된 POS 단말기가 없습니다</p>
                <p className="text-xs mt-1">
                  1. POS 앱이 실행 중인지 확인하세요<br />
                  2. POS 앱에서 스토어가 선택되었는지 확인하세요<br />
                  3. 새로고침 버튼을 눌러 다시 시도하세요
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              onClick={confirmPOSSelection}
              disabled={!selectedPOSClient}
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 스캔 라인 애니메이션을 위한 글로벌 스타일 */}
      <style jsx global>{`
        @keyframes scanner-line {
          0% {
            top: 0%;
          }
          50% {
            top: 100%;
          }
          50.1% {
            top: 0%;
          }
          100% {
            top: 100%;
          }
        }
        
        .animate-scanner-line {
          animation: scanner-line 3s linear infinite;
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        /* iOS Safari에서 더블탭 확대 방지 */
        html, body {
          touch-action: manipulation;
        }
        
        /* 버튼 선택 시 핸드폰 드래그 방지 */
        button {
          touch-action: manipulation;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        
        /* 카메라 표시 최적화 */
        video {
          object-fit: cover;
          background-color: #000;
        }
        
        /* 정사각형으로 카메라 영역 제한 */
        .aspect-square {
          aspect-ratio: 1 / 1;
        }
      `}</style>
    </div>
  );
}