'use client'

import { useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ScrollFadeSection from './ScrollFadeSection'

export default function InteractiveContactForm() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    message: ''
  })
  const [isFocused, setIsFocused] = useState({
    name: false,
    email: false,
    message: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState(null)
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormState(prev => ({ ...prev, [name]: value }))
  }
  
  const handleFocus = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: true }))
  }
  
  const handleBlur = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: false }))
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formState),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '문의 제출에 실패했습니다.');
      }
      
      setIsSubmitted(true)
      
      // 3초 후 폼 초기화
      setTimeout(() => {
        setIsSubmitted(false)
        setFormState({ name: '', email: '', message: '' })
      }, 3000)
    } catch (err) {
      console.error('문의 제출 오류:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <section className="py-24 bg-muted/30" id="contact">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto">
          <ScrollFadeSection className="text-center mb-16">
            <Badge variant="outline" className="text-sm px-4 py-1 rounded-full border-muted-foreground/30 mb-4">
              Contact
            </Badge>
            <h2 className="text-3xl font-bold mb-4">
              문의하기
            </h2>
            <p className="text-muted-foreground">
              더 자세한 정보가 필요하신가요? 언제든 문의해주세요.
            </p>
          </ScrollFadeSection>
          
          {isSubmitted ? (
            <ScrollFadeSection className="bg-card rounded-lg p-8 text-center">
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">문의가 접수되었습니다</h3>
              <p className="text-muted-foreground">빠른 시일 내에 답변 드리겠습니다.</p>
            </ScrollFadeSection>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                  {error}
                </div>
              )}
              
              <ScrollFadeSection className="space-y-4" delay={100} direction="left">
                <div>
                  <label 
                    htmlFor="name" 
                    className={`block text-sm font-medium mb-2 transition-colors ${isFocused.name ? 'text-primary' : ''}`}
                  >
                    이름
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className={`w-full px-4 py-2 rounded-lg border bg-background transition-all duration-300 ${isFocused.name ? 'border-primary shadow-sm' : ''}`}
                    placeholder="홍길동"
                    value={formState.name}
                    onChange={handleChange}
                    onFocus={() => handleFocus('name')}
                    onBlur={() => handleBlur('name')}
                    required
                  />
                </div>
                <div>
                  <label 
                    htmlFor="email" 
                    className={`block text-sm font-medium mb-2 transition-colors ${isFocused.email ? 'text-primary' : ''}`}
                  >
                    이메일
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`w-full px-4 py-2 rounded-lg border bg-background transition-all duration-300 ${isFocused.email ? 'border-primary shadow-sm' : ''}`}
                    placeholder="example@company.com"
                    value={formState.email}
                    onChange={handleChange}
                    onFocus={() => handleFocus('email')}
                    onBlur={() => handleBlur('email')}
                    required
                  />
                </div>
              </ScrollFadeSection>
              
              <ScrollFadeSection delay={300} direction="right">
                <div>
                  <label 
                    htmlFor="message" 
                    className={`block text-sm font-medium mb-2 transition-colors ${isFocused.message ? 'text-primary' : ''}`}
                  >
                    문의내용
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className={`w-full px-4 py-2 rounded-lg border bg-background resize-none transition-all duration-300 ${isFocused.message ? 'border-primary shadow-sm' : ''}`}
                    placeholder="문의하실 내용을 입력해주세요"
                    value={formState.message}
                    onChange={handleChange}
                    onFocus={() => handleFocus('message')}
                    onBlur={() => handleBlur('message')}
                    required
                  />
                </div>
              </ScrollFadeSection>
              
              <ScrollFadeSection delay={500}>
                <Button 
                  className="w-full relative overflow-hidden group" 
                  size="lg" 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      전송 중...
                    </span>
                  ) : (
                    <span>문의하기</span>
                  )}
                  <span className="absolute inset-0 w-full h-full bg-primary/10 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                </Button>
              </ScrollFadeSection>
            </form>
          )}
        </div>
      </div>
    </section>
  )
} 