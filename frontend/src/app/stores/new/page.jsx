'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Store, ArrowLeft, MapPin } from 'lucide-react'
import MapModal from "@/components/map-modal"

export default function NewStorePage() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    latitude: null,
    longitude: null
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

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
        phone: location.telephone || '',
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
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '스토어 생성에 실패했습니다')
      }
      
      toast({
        title: "스토어 생성 완료",
        description: "스토어가 성공적으로 생성되었습니다"
      })
      
      router.push('/stores')
    } catch (error) {
      console.error('스토어 생성 중 오류:', error)
      toast({
        title: "오류 발생",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
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
            <CardTitle>새 스토어 추가</CardTitle>
          </div>
          <CardDescription>
            매장 정보를 입력하여 새 스토어를 등록하세요
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
                <span className="animate-spin mr-2">⌛</span>
                처리 중...
              </>
            ) : '스토어 추가'}
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