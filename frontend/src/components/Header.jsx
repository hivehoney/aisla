'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { useSession, signOut } from 'next-auth/react'
import {
  User,
  Loader2,
  ChevronDown,
  LogOut,
  Settings,
  Package,
  ShoppingCart,
  Search,
  ListOrdered,
  PackagePlus,
  LayoutDashboard,
  Terminal,
  Bot,
  Layers,
  Store,
  Sparkles,
  Badge as LucideBadge,
  CreditCard,
  Barcode,
  Receipt,
  LucideMessageCircleDashed
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { usePathname } from 'next/navigation'
import { Badge } from "@/components/ui/badge"
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { useToast } from "@/hooks/use-toast"
import DatabaseStatusIndicator from './DatabaseStatusIndicator'

export default function Header() {
  const pathname = usePathname()
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isDevMode, setIsDevMode] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // Load initial dev mode from session when available
  useEffect(() => {
    if (session?.user?.isDevMode !== undefined) {
      setIsDevMode(session.user.isDevMode)
    }
  }, [session])

  const updateDevMode = useCallback(async (newMode) => {
    if (isUpdating) return

    setIsUpdating(true)
    try {
      const response = await fetch('/api/settings/dev-mode', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isDevMode: newMode }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '설정 업데이트 중 오류가 발생했습니다.')
      }

      // Show success toast
      toast({
        title: newMode ? "개발자 모드 활성화" : "프로덕션 모드 활성화",
        description: data.message,
      })

      // Update local state
      setIsDevMode(newMode)
    } catch (error) {
      // Show error toast
      toast({
        title: "설정 변경 실패",
        description: error.message,
        variant: "destructive"
      })

      // Revert the state change
      setIsDevMode(!newMode)
    } finally {
      setIsUpdating(false)
    }
  }, [toast, isUpdating])

  // Handle dev mode toggle
  const handleSwitchClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const newMode = !isDevMode
    setIsDevMode(newMode) // Optimistic update
    updateDevMode(newMode)
  }

  const handleDevModeChange = (checked) => {
    setIsDevMode(checked) // Optimistic update
    updateDevMode(checked)
  }

  const handleLogout = async () => {
    await signOut({ redirect: true })
  }

  // 스크롤 이벤트 핸들러
  const controlHeader = () => {
    if (typeof window !== 'undefined') {
      // 현재 스크롤 위치
      const currentScrollY = window.scrollY

      // 스크롤 방향 확인
      if (currentScrollY > lastScrollY) { // 아래로 스크롤
        setIsVisible(false)
      } else { // 위로 스크롤
        setIsVisible(true)
      }

      // 현재 스크롤 위치 저장
      setLastScrollY(currentScrollY)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlHeader)

      // cleanup function
      return () => {
        window.removeEventListener('scroll', controlHeader)
      }
    }
  }, [lastScrollY])

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 bg-white/80 backdrop-blur-sm border-b transition-transform duration-300
          ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* 로고 */}
            <Link href="/" className="font-bold text-xl hover:opacity-80 transition-opacity">
              Aisla
            </Link>

            {/* 메인 네비게이션 */}
            <nav className="hidden md:flex items-center gap-4">
              {/* 대시보드 */}
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                대시보드
              </Link>

              {/* 발주 관리 드롭다운 */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    발주 관리
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>발주</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/order/search" className="flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      상품 검색
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/order/cart" className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      장바구니
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/order/ai" className="flex items-center gap-2 relative">
                      <Sparkles className="h-4 w-4" />
                      AI발주
                      <Badge className="ml-2 text-white text-[10px] px-1.5 py-0 absolute right-[-8px] top-[0px] bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 border-none shadow-sm animate-pulse">
                        NEW
                      </Badge>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="flex items-center gap-2">
                      <ListOrdered className="h-4 w-4" />
                      발주 내역
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>



              {/* 결제 드롭다운 */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    결제
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>결제</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/pos" className="flex items-center gap-2">
                      <Terminal className="h-4 w-4" />
                      POS
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/pos/scanner" className="flex items-center gap-2">
                      <Barcode className="h-4 w-4" />
                      스캐너
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/pos/transactions" className="flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      결제내역
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 로봇 */}
              <Link
                href="/robot"
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Bot className="h-4 w-4" />
                로봇
              </Link>

              {status === "unauthenticated" && (
                <Link
                  href="/plans"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Layers className="h-4 w-4" />
                  서비스 플랜
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* 데이터베이스 상태 */}
            <div className="hidden md:flex">
              <DatabaseStatusIndicator />
            </div>

            {/* 사용자 메뉴 */}
            <div className="flex items-center gap-2">
              {status === "unauthenticated" && (
                <Link href="/auth">
                  <Button variant="default" size="sm">
                    로그인
                  </Button>
                </Link>
              )}
              {status === "loading" && (
                <Button variant="ghost" size="sm" disabled>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </Button>
              )}
              {status === "authenticated" && (

                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      {session?.user?.nickname || "Guest"}님
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>계정</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        설정
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/stores" className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        스토어 관리
                      </Link>
                    </DropdownMenuItem>
                    {session?.user?.role === "admin" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>관리자</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/inquiries" className="flex items-center gap-2">
                            <LucideMessageCircleDashed className="h-4 w-4" />
                            문의 관리
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                        >
                          <div className="flex items-center space-x-2 cursor-default" onClick={handleSwitchClick}>
                            <Switch
                              id="hardware-link"
                              checked={isDevMode}
                              onCheckedChange={handleDevModeChange}
                              disabled={isUpdating}
                            />
                            <Label htmlFor="hardware-link" className="cursor-pointer min-w-[85px] inline-block">
                              Dev Mode
                              {isUpdating && <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></span>}
                            </Label>
                          </div>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                          className="flex items-center gap-2 text-red-600 focus:text-red-600"
                        >
                          <LogOut className="h-4 w-4" />
                          로그아웃
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>
      <div className="h-16"></div>
    </>
  )
}
