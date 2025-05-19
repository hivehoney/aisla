import { Separator } from "@/components/ui/separator"
import { SidebarNav } from "./components/sidebar-nav"
import AccessBlock from "@/components/AccessBlock"

const sidebarNavItems = [
  {
    title: "프로필",
    href: "/settings",
  },
  {
    title: "계정",
    href: "/settings/account",
  },
  {
    title: "로그아웃",
    href: "/auth",
  }
]

export default function SettingsLayout({ children }) {
  return (
    <AccessBlock>
      <div className="container space-y-6 p-10 pb-16 mx-auto">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">설정</h2>
        <p className="text-muted-foreground">
          프로필, 계정 설정 및 기타 환경설정을 관리하세요.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col lg:flex-row lg:gap-12">
        <aside className="w-full lg:w-44 flex-shrink-0 mb-6 lg:mb-0">
          <div className="sticky top-20">
            <SidebarNav items={sidebarNavItems} />
          </div>
        </aside>
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-md p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
    </AccessBlock>
  )
} 