import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
export default async function AuthError({ searchParams }) {
  const errorType = (await searchParams)?.error || 'default'
  
  const errorMessages = {
    configuration: {
      title: "설정 오류",
      description: "서버 설정에 문제가 있습니다. 관리자에게 문의해주세요."
    },
    "access-denied": {
      title: "접근 거부",
      description: "해당 리소스에 대한 접근 권한이 없습니다."
    },
    verification: {
      title: "인증 오류",
      description: "인증 토큰이 만료되었거나 이미 사용되었습니다."
    },
    "OAuthAccountNotLinked": {
      title: "인증 오류",
      description: "해당 이메일로 가입한 계정이 없습니다."
    },
    default: {
      title: "인증 오류",
      description: "로그인 중 문제가 발생했습니다. 다시 시도해주세요."
    }
  }

  const error = errorMessages[errorType] || errorMessages.default

  return (
    <div className="container max-w-lg py-12 mx-auto">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{error.title}</AlertTitle>
        <AlertDescription>{error.description}</AlertDescription>
      </Alert>
      
      <div className="mt-4 text-center">
        <Link
          href="/" 
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
} 