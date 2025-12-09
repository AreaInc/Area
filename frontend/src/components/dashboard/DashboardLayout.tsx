import { Sidebar } from '../Sidebar'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen bg-background text-foreground overflow-hidden relative selection:bg-primary/20">
      <Sidebar />
      <div className="h-full w-full overflow-auto">
        {children}
      </div>
    </div>
  )
}
