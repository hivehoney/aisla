"use client";

import { useState, useEffect } from 'react';
import { AlertCircle, Database } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function DatabaseStatusAlert() {
  const [dbStatus, setDbStatus] = useState('checking');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const checkDbStatus = async () => {
      try {
        const response = await fetch('/api/db-status');
        const data = await response.json();
        
        setDbStatus(data.status);
      } catch (error) {
        console.error("Failed to check database status:", error);
        setDbStatus('error');
      }
    };

    checkDbStatus();
  }, []);

  if (dbStatus === 'connected' || dbStatus === 'checking') {
    return null;
  }

  return (
    <Alert variant="destructive" className="fixed top-5 left-1/2 -translate-x-1/2 max-w-md z-50 shadow-lg">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        <Database className="h-4 w-4" /> 데이터베이스 연결 오류
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p>데이터베이스 서버에 연결할 수 없습니다.</p>
        {expanded && (
          <div className="mt-2 text-sm">
            <p className="mb-2">가능한 해결 방법:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>데이터베이스 서버가 실행 중인지 확인하세요.</li>
              <li>PostgreSQL 서비스가 정상 포트에서 실행 중인지 확인하세요.</li>
              <li>환경 변수 설정을 확인하세요.</li>
            </ul>
          </div>
        )}
        <div className="flex justify-between mt-3 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '간략히 보기' : '자세히 보기'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
          >
            새로고침
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
} 