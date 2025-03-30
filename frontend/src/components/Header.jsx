import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function Header() {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-xl hover:opacity-80 transition-opacity">
            Aisle
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              대시보드
            </Link>
            <Link href="/pos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              포스
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              가격
            </Link>
            <Link href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              문의하기
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="cursor-pointer hover:bg-gray-100 transition-colors">
            로그인
          </Button>
          <Button size="sm" className="cursor-pointer hover:opacity-90 transition-opacity">
            무료로 시작하기
          </Button>
        </div>
      </div>
    </header>
  )
}
