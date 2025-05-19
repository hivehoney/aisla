'use client'

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function SignOut() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <Button 
      onClick={handleSignOut}
      variant="ghost" 
      className="w-full h-9 text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center gap-2"
    >
      <LogOut className="w-4 h-4" />
      <span className="text-sm">로그아웃</span>
    </Button>
  )
}