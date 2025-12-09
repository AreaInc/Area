import { useEffect } from 'react'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useAppDispatch } from '../store/hooks'
import { loginSuccess, logout } from '../store/slices/authSlice'
import { setWorkflows } from '../store/slices/workflowsSlice'
import { MOCK_WORKFLOWS } from '../mocks/workflows'
import { useSession } from '../lib/auth-client'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const dispatch = useAppDispatch()
  const { data: session } = useSession()

  useEffect(() => {
    // sync session with redux
    if (session?.user) {
      dispatch(loginSuccess({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        avatarUrl: session.user.image || undefined,
      }))
      dispatch(setWorkflows(MOCK_WORKFLOWS))
    } else {
      dispatch(logout())
    }
  }, [dispatch, session])

  return (
    <>
      <Outlet />
    </>
  )
}
