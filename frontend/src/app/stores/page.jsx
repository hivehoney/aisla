'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Edit, Plus, Store, MapPin, Phone } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { useStore } from '@/contexts/store-context'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Link from 'next/link'

export default function StoresPage() {
  const [loading, setLoading] = useState(true)
  const [storeToDelete, setStoreToDelete] = useState(null)
  const router = useRouter()
  const { toast } = useToast()
  const { stores, fetchStores, deleteStore } = useStore()

  // 스토어 목록 가져오기
  const fetchStoresData = async () => {
    try {
      setLoading(true)
      await fetchStores()
    } catch (error) {
      console.error('스토어 목록 로딩 중 오류:', error)
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // 스토어 삭제 핸들러
  const handleDeleteStore = async () => {
    if (!storeToDelete) return
    
    try {
      await deleteStore(storeToDelete.id)
      
      toast({
        title: "삭제 완료",
        description: "스토어가 성공적으로 삭제되었습니다"
      })
    } catch (error) {
      console.error('스토어 삭제 중 오류:', error)
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setStoreToDelete(null)
    }
  }

  useEffect(() => {
    fetchStoresData()
  }, [])
  
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">스토어 관리</h1>
        <Button onClick={() => router.push('/stores/new')}>
          <Plus className="mr-2 h-4 w-4" />
          스토어 추가
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : stores.length === 0 ? (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <Store className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-center mb-2">등록된 스토어가 없습니다</h3>
            <p className="text-muted-foreground text-center mb-6">
              첫 번째 스토어를 추가하고 매장 관리를 시작하세요
            </p>
            <Button onClick={() => router.push('/stores/new')}>
              <Plus className="mr-2 h-4 w-4" />
              스토어 추가
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <Card 
              key={store.id} 
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/stores/${store.id}`)}
            >
              <CardHeader className="bg-muted/30">
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  {store.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <span className="text-sm">{store.address}</span>
                  </div>
                  {store.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{store.phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation(); // 이벤트 버블링 방지
                    router.push(`/stores/${store.id}`);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  수정
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation(); // 이벤트 버블링 방지
                        setStoreToDelete(store);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      삭제
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>스토어 삭제</AlertDialogTitle>
                      <AlertDialogDescription>
                        <p>
                          <strong>{storeToDelete?.name}</strong> 스토어를 삭제하시겠습니까?
                        </p>
                        <p className="mt-2 text-red-500">
                          삭제 시 스토어에 연결된 모든 데이터가 함께 삭제될 수 있으며, 이 작업은 취소할 수 없습니다.
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteStore} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">삭제</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* 네비게이션 */}
      <div className="mt-8">
        <Button variant="outline" onClick={() => router.back()}>
          돌아가기
        </Button>
      </div>
    </div>
  )
} 