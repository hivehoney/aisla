import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="font-bold text-lg">aisle</h3>
            <p className="text-sm text-muted-foreground">
              AI 기반 편의점 수요 예측 서비스로<br />
              더 스마트한 리테일의 미래를 만듭니다.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">서비스</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#features">주요 기능</Link></li>
              <li><Link href="#pricing">요금제</Link></li>
              <li><Link href="#demo">데모 신청</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">회사</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about">회사 소개</Link></li>
              <li><Link href="/contact">문의하기</Link></li>
              <li><Link href="/blog">블로그</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">법적 고지</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy">개인정보처리방침</Link></li>
              <li><Link href="/terms">이용약관</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} aisle. All rights reserved.
        </div>
      </div>
    </footer>
  )
} 