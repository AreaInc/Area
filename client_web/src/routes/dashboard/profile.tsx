import { createFileRoute } from '@tanstack/react-router'
import { useSession } from '../../lib/auth-client'
import { ProfileSettings } from '../../components/profile/ProfileSettings'

export const Route = createFileRoute('/dashboard/profile')({
  component: Profile,
})

function Profile() {
  const { data: session } = useSession()
  const user = session?.user
  if (!user) return null

  return (
    <div className="p-8 h-full w-full overflow-y-auto">
      <ProfileSettings />
    </div>
  )
}
