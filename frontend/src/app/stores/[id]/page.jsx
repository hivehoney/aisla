'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Store, ArrowLeft, Loader2, MapPin } from 'lucide-react'
import React from 'react'
import MapModal from "@/components/map-modal"

export default function EditStorePage({ params }) {
  // React.use()를 사용하여 params 언래핑
  const unwrappedParams = React.use(params)
  const storeId = unwrappedParams.id
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    latitude: null,
    longitude: null
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // 스토어 데이터 로드
  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/stores/${storeId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            toast({
              title: "스토어를 찾을 수 없습니다",
              description: "요청하신 스토어가 존재하지 않습니다",
              variant: "destructive"
            })
            router.push('/stores')
            return
          }
          
          throw new Error('스토어 정보를 가져오는데 실패했습니다')
        }
        
        const data = await response.json()
        setFormData({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          latitude: data.latitude || null,
          longitude: data.longitude || null
        })
      } catch (error) {
        console.error('스토어 정보 로딩 중 오류:', error)
        toast({
          title: "오류 발생",
          description: error.message,
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchStoreData()
  }, [storeId, router, toast])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = '스토어 이름을 입력해주세요'
    }
    
    if (!formData.address.trim()) {
      newErrors.address = '주소를 입력해주세요'
    }
    
    if (formData.phone && !/^\d{2,3}-\d{3,4}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = '전화번호 형식이 올바르지 않습니다 (예: 02-1234-5678)'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // 입력 시 해당 필드 에러 초기화
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }
  
  const handleLocationSelect = (location) => {
    if (location) {
      setFormData(prev => ({
        ...prev,
        name: location.title,
        address: location.address,
        phone: location.telephone || prev.phone,
        latitude: location.latitude,
        longitude: location.longitude
      }))
    }
    setIsMapModalOpen(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/stores/${storeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '스토어 수정에 실패했습니다')
      }
      
      toast({
        title: "스토어 수정 완료",
        description: "스토어 정보가 성공적으로 수정되었습니다"
      })
      
      router.push('/stores')
    } catch (error) {
      console.error('스토어 수정 중 오류:', error)
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-20 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">스토어 정보를 불러오는 중...</p>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-10">
      <Button 
        variant="ghost" 
        className="mb-6"
        onClick={() => router.push('/stores')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        스토어 목록으로 돌아가기
      </Button>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            <CardTitle>스토어 정보 수정</CardTitle>
          </div>
          <CardDescription>
            변경할 정보를 입력하여 스토어 정보를 수정하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} id="store-form">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  스토어 이름 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="스토어 이름을 입력하세요"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">
                  주소 <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="address"
                    name="address"
                    placeholder="지도에서 위치를 선택해주세요"
                    value={formData.address}
                    onChange={handleChange}
                    className={errors.address ? "border-red-500" : ""}
                    disabled
                  />
                  <Button 
                    type="button" 
                    variant="default" 
                    onClick={() => setIsMapModalOpen(true)}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    주소 검색
                  </Button>
                </div>
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
                <p className="text-muted-foreground text-sm">주소는 지도에서 위치를 선택해주세요</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">전화번호</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="예: 02-1234-5678"
                  value={formData.phone}
                  onChange={handleChange}
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
                <p className="text-muted-foreground text-sm">선택 사항입니다</p>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button 
            variant="outline" 
            onClick={() => router.push('/stores')}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button 
            type="submit" 
            form="store-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                처리 중...
              </>
            ) : '저장하기'}
          </Button>
        </CardFooter>
      </Card>
      
      <MapModal
        isOpen={isMapModalOpen}
        onClose={handleLocationSelect}
      />
    </div>
  )
} 