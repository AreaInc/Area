import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "../app-sidebar"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4 h-full overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}