import { createFileRoute } from '@tanstack/react-router'
import { ServiceDetails } from '../../../components/services/ServiceDetails'
import { useService } from '../../../hooks/useServices'
import { Loader2 } from 'lucide-react'
import { useSearchParams } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/services/$provider')({
  component: ServicePage,
})

function ServicePage() {
  const { provider } = Route.useParams()
  const { service, isLoading, isError } = useService(provider)
  const [searchParams] = useSearchParams({
    parse: (query) => Object.fromEntries(new URLSearchParams(query)),
    stringify: (params) => new URLSearchParams(params).toString(),
  })
  const authStatus = searchParams.success ? 'success' : (searchParams.error ? 'error' : undefined)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Loader2 className="animate-spin mr-2" /> Loading service details...
      </div>
    )
  }

  if (isError || !service) {
    return (
      <div className="p-8 text-center">
        <div className="text-destructive bg-destructive/10 p-4 rounded-lg inline-block">
          Failed to load service details. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 pl-72 h-full overflow-y-auto">
      <ServiceDetails service={service} authStatus={authStatus} />
    </div>
  )
}
