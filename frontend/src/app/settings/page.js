import { Separator } from "@/components/ui/separator"
import { ProfileForm } from "./components/profile-form"

export default function SettingsProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">프로필</h3>
        <p className="text-sm text-muted-foreground">
          프로필 정보를 관리하고 업데이트하세요.
        </p>
      </div>
      <Separator />
      <ProfileForm />
    </div>
  )
} 