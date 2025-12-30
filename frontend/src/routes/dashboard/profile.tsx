import { createFileRoute } from '@tanstack/react-router'
import { useSession } from '../../lib/auth-client'
import { ProfileSettings } from '../../components/profile/ProfileSettings'

export const Route = createFileRoute('/dashboard/profile')({
  component: Profile,
})

function Profile() {
  const { data: session } = useSession()
  const user = session?.user

  // Ideally we show a loader if session is loading, but useSession usually returns user or null
  // We can just render ProfileSettings which handles user check internally or passes it down
  // But let's keep consistency with container styling
  
  if (!user) return null

  return (
    <div className="pl-72 p-8 h-full w-full overflow-y-auto">
       <ProfileSettings />
    </div>
  )
}
