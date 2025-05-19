"use client";

import { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function DatabaseStatusIndicator() {
  const [status, setStatus] = useState('checking');
  
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/db-status');
        const data = await response.json();
        setStatus(data.status);
      } catch (error) {
        console.error('Failed to check DB status:', error);
        setStatus('error');
      }
    };
    
    checkStatus();
    
    // Check status periodically
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);
  
  // Badge color based on status
  const getStatusConfig = () => {
    switch(status) {
      case 'connected':
        return { color: 'bg-green-100 hover:bg-green-200 text-green-800', text: '연결됨' };
      case 'checking':
        return { color: 'bg-blue-100 hover:bg-blue-200 text-blue-800', text: '확인 중' };
      default:
        return { color: 'bg-red-100 hover:bg-red-200 text-red-800', text: '연결 오류' };
    }
  };
  
  const { color, text } = getStatusConfig();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`flex items-center gap-1 ${color}`}>
            <Database className="h-3 w-3" />
            <span>{text}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>데이터베이스 상태: {text}</p>
          {status === 'error' && <p className="text-xs mt-1">서버가 실행 중인지 확인하세요</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 