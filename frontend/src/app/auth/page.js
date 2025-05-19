import { auth } from "@/auth";
import { SignIn } from "@/components/auth/signin-button";
import { SignOut } from "@/components/auth/signout-button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { ArrowLeft, User } from "lucide-react";
import Link from "next/link";

export default async function SignInPage() {
    const session = await auth()
    if (session && session.user) {
        return (
          <div className="min-h-screen bg-muted flex flex-col">
            <main className="flex-1 flex items-center justify-center p-4">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Link 
                      href="/" 
                      className="text-sm text-muted-foreground hover:text-black flex items-center gap-1"
                    >
                      <ArrowLeft size={16} />
                      돌아가기
                    </Link>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <User className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h1 className="text-xl font-semibold text-muted-foreground">
                      {session.user?.name || '사용자'}님 환영합니다
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {session.user?.email}
                    </p>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <SignOut />
                </CardContent>
                
                <CardFooter className="flex flex-col gap-4 border-t pt-6">
                  <p className="text-xs text-center">
                    로그아웃 후 다시 로그인하실 수 있습니다
                  </p>
                </CardFooter>
              </Card>
            </main>
          </div>
        )
    }

    return (
      <div className="min-h-screen bg-muted flex flex-col">
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Link 
                  href="/" 
                  className="text-sm text-muted-foreground hover:text-black flex items-center gap-1"
                >
                  <ArrowLeft size={16} />
                  돌아가기
                </Link>
              </div>
              <h1 className="text-2xl font-bold text-muted-foreground">Aisla 시작하기</h1>
              <p className="text-sm text-muted-foreground">
                재고를 체계적으로 관리하고 판매하세요
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <SignIn />
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4 border-t pt-6">
              <p className="text-xs text-muted-foreground text-center">
                계속 진행하면 Aisla의 <Link href="/terms" className="text-muted-foreground hover:underline">서비스 약관</Link>과{" "}
                <Link href="/privacy" className="text-muted-foreground hover:underline">개인정보 보호정책</Link>에 동의하는 것으로 간주됩니다.
              </p>
            </CardFooter>
          </Card>
        </main>

      </div>
    );
}
