import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LockKeyhole, ArrowRight, Shield } from "lucide-react";
import Link from "next/link";
import CharacterWithEyes from "./CharacterWithEyes";
import { redirect } from "next/navigation";

export default async function AccessBlock({ children, role }) {
  const session = await auth()

  if (role && session?.user?.role !== role) {
    return (
      redirect("/")
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full shadow-sm border-0 bg-white">
          <CardHeader className="space-y-1 text-center pb-2">
            <div className="flex justify-center mb-2">
              <CharacterWithEyes />
            </div>
            <CardTitle className="text-xl font-medium">로그인이 필요합니다</CardTitle>
            <CardDescription className="text-muted-foreground">
              이 서비스를 이용하기 위해서는 로그인이 필요합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="py-3">
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg mb-3">
              <Shield className="h-8 w-8 text-primary/70" />
              <div>
                <p className="font-medium">안전한 서비스 이용</p>
                <p className="text-sm text-muted-foreground">로그인 후 모든 서비스와 기능을 이용하실 수 있습니다</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/auth">
                <span>로그인 페이지로 이동</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return children;
} 