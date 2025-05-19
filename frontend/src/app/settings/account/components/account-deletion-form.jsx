"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function AccountDeletionForm() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [confirmation, setConfirmation] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (confirmation !== session?.user?.email) {
      toast.error("이메일 주소가 일치하지 않습니다.")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message)
      }

      toast.success("계정이 삭제되었습니다.")
      await signOut()
    } catch (error) {
      toast.error(error.message || "계정 삭제에 실패했습니다.")
    } finally {
      setIsLoading(false)
      setIsOpen(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">계정 삭제</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>계정 삭제</AlertDialogTitle>
          <div className="space-y-4 text-sm text-muted-foreground">
            계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
            계속하시려면 아래에 이메일 주소를 입력해주세요.
          </div>
          <div className="space-y-2 mt-4">
            <Label htmlFor="confirmation">
              이메일 주소: {session?.user?.email}
            </Label>
            <Input
              id="confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="이메일 주소를 입력하세요"
              disabled={isLoading}
            />
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading || confirmation !== session?.user?.email}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? "삭제 중..." : "계정 삭제"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 