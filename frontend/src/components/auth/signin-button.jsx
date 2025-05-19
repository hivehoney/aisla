import { signIn } from "@/auth"
import { Button } from "@/components/ui/button"
import { FcGoogle } from 'react-icons/fc'
export function SignIn() {
  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="px-2 text-muted-foreground">소셜 계정으로 시작하기</span>
        </div>
      </div>

      <form 
        action={async () => {
          "use server"
          await signIn("google", { redirectTo: "/" })
        }}
      >
        <Button 
          type="submit" 
          variant="outline" 
          className="w-full h-11 bg-background hover:bg-muted flex items-center justify-center gap-2"
        >
          <FcGoogle className="w-5 h-5" />

          <span>Google 계정으로 계속하기</span>
        </Button>
      </form>
    </div>
  )
}