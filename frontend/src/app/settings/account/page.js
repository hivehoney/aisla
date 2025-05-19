import { Separator } from "@/components/ui/separator"
import { AccountDeletionForm } from "./components/account-deletion-form"
import { auth } from "@/auth"

export default async function SettingsAccountPage() {
  const session = await auth()
  if (!session) {
    redirect("/auth")
  }
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">계정</h3>
        <p className="text-sm text-muted-foreground">
          계정 관련 설정을 관리하세요.
        </p>
      </div>
      <Separator />
      
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-destructive">위험 구역</h4>
          <p className="text-sm text-muted-foreground">
            계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
          </p>
        </div>
        <AccountDeletionForm />
      </div>
    </div>
  )
} 