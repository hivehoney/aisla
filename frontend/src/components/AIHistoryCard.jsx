'use client'

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  History, 
  Clock, 
  Search, 
  Calendar, 
  Store, 
  Star, 
  ChevronRight, 
  FileBarChart, 
  Trash2,
  RefreshCw
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSession } from "next-auth/react";

export default function AIHistoryCard({ onLoadHistory, selectedStoreId }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [histories, setHistories] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();


  // 히스토리 불러오기
  const fetchHistories = useCallback(async () => {
    if (!selectedStoreId) {
      setHistories([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/ai-history/list?storeId=${selectedStoreId}`);
      if (!response.ok) {
        throw new Error(`Error fetching histories: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setHistories(data.data);
      } else {
        console.error("Invalid history data format:", data);    
        setHistories([]);
      }
    } catch (error) {
      console.error("Failed to fetch histories:", error);
      toast.error("Failed to load history data");
      setHistories([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStoreId]);

  // 선택된 스토어가 변경되면 히스토리 다시 불러오기
  useEffect(() => {
    fetchHistories();
  }, [selectedStoreId]);


  // 히스토리 삭제
  const handleDeleteHistory = async (id) => {
    try {
      const response = await fetch(`/api/ai-history/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete history: ${response.status}`);
      }
      
      // 삭제 후 목록 갱신
      setHistories(histories.filter(h => h.id !== id));
      setIsDeleteDialogOpen(false);
      toast.success('히스토리가 삭제되었습니다.');
    } catch (error) {
      console.error('히스토리 삭제 에러:', error);
      toast.error('히스토리 삭제에 실패했습니다.');
    }
  };

  // 히스토리 불러오기 클릭 처리
  const handleLoadHistoryClick = useCallback(async (historyId) => {
    // 히스토리 페이지로 이동
    router.push(`/order/ai/history?id=${historyId}`);
  }, [router]);

  // 히스토리 날짜 포맷팅
  const formatHistoryDate = (dateString) => {
    try {
      return format(new Date(dateString), 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="w-full">
      <div className="">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={fetchHistories}
            disabled={isLoading || !selectedStoreId}
          >
            <RefreshCw className={cn("", isLoading && "animate-spin")}/>
            새로고침
          </Button>
        </div>
      </div>
      <div className="py-2 overflow-y-auto">
        {!selectedStoreId ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Store className="h-10 w-10 text-slate-300 mb-2" />
            <h3 className="text-sm font-medium text-slate-600 mb-1">스토어를 선택해주세요</h3>
            <p className="text-xs text-slate-500">스토어를 선택하면 해당 스토어의 AI 분석 히스토리를 볼 수 있습니다.</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : histories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FileBarChart className="h-10 w-10 text-slate-300 mb-2" />
            <h3 className="text-sm font-medium text-slate-600 mb-1">저장된 히스토리가 없습니다</h3>
            <p className="text-xs text-slate-500">AI 분석을 실행하면 자동으로 결과가 저장됩니다.</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={fetchHistories}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              다시 시도
            </Button>
          </div>
        ) : (
          <ScrollArea className="max-h-[300px] pr-2">
            <div className="space-y-2">
              {histories.map((history) => (
                <div key={history.id} className="group flex items-start gap-2 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-9 h-9 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                      <History className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-slate-800 truncate">{history.title || '무제 분석'}</h4>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleLoadHistoryClick(history.id)}>
                            <Search className="mr-2 h-4 w-4" />
                            <span>상세 보기</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedHistory(history);
                            setIsDeleteDialogOpen(true);
                          }}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>삭제</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatHistoryDate(history.createdAt)}</span>
                      </div>
                      <div className="w-px h-3 bg-slate-300"></div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>히스토리 삭제</DialogTitle>
            <DialogDescription>
              이 AI 분석 히스토리를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-slate-50 rounded-md border border-slate-200 mb-4">
            <h4 className="text-sm font-medium">{selectedHistory?.title || '무제 분석'}</h4>
            <p className="text-xs text-slate-500 mt-1">
              {selectedHistory && formatHistoryDate(selectedHistory.createdAt)}
            </p>
          </div>
          <DialogFooter className="sm:justify-between">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                취소
              </Button>
            </DialogClose>
            <Button 
              type="button" 
              variant="destructive"
              onClick={() => selectedHistory && handleDeleteHistory(selectedHistory.id)}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 