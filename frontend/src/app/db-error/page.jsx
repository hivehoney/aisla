"use client";

import { useState, useEffect } from 'react';
import { AlertTriangle, Database, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DatabaseErrorPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  
  const checkDbConnection = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/db-status');
      const data = await response.json();
      
      if (data.status === 'connected') {
        // If the database is now connected, redirect to homepage
        router.push('/');
      }
      
      // If still not connected, stay on this page
      setIsChecking(false);
    } catch (error) {
      console.error('Error checking database status:', error);
      setIsChecking(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-6 border border-red-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-red-100 p-3 rounded-full">
            <Database className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-red-600">데이터베이스 연결 오류</h1>
            <p className="text-gray-600">데이터베이스 서버에 연결할 수 없습니다</p>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h2 className="font-semibold mb-2">오류 정보</h2>
              <p className="text-sm text-gray-700 mb-2">
                PostgreSQL 데이터베이스 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.
              </p>
              <p className="text-sm text-gray-700">
                오류 메시지: <code className="bg-red-100 px-1 py-0.5 rounded text-red-800 font-mono text-xs">
                  Can't reach database server at `localhost:5432`
                </code>
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-5 mb-5">
          <h2 className="font-semibold mb-3">해결 방법</h2>
          <ul className="space-y-2 text-gray-700 list-disc pl-5">
            <li>PostgreSQL 서비스가 시스템에서 실행 중인지 확인하세요.</li>
            <li>데이터베이스 서버가 포트 5432에서 실행 중인지 확인하세요.</li>
            <li>응용 프로그램의 환경 변수(.env 파일)에 올바른 데이터베이스 연결 정보가 설정되어 있는지 확인하세요.</li>
            <li>방화벽 설정이 데이터베이스 포트를 차단하고 있지 않은지 확인하세요.</li>
          </ul>
        </div>
        
        <div className="flex flex-wrap justify-between gap-4">
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              홈으로 돌아가기
            </Button>
          </Link>
          
          <Button 
            onClick={checkDbConnection}
            disabled={isChecking}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isChecking ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                확인 중...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                연결 다시 확인
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 