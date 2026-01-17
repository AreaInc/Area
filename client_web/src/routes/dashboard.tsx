import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { DashboardLayout } from '../components/dashboard/DashboardLayout'
import { authClient } from '../lib/auth-client'

export const Route = createFileRoute('/dashboard')({
  validateSearch: (search: Record<string, unknown>): { workflow?: string } => {
    return {
      workflow: (search.workflow as string) || undefined,
    }
  },
  beforeLoad: async () => {
    const session = await authClient.getSession()
    if (!session.data) {
      throw redirect({ to: '/login' })
    }
  },
  component: DashboardLayoutRoute,
})

function DashboardLayoutRoute() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}
