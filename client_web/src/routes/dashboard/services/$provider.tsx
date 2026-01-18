import { createFileRoute } from '@tanstack/react-router'
import { ServiceDetails } from '../../../components/services/ServiceDetails'
import { useService, useServiceTriggers, useServiceActions } from '@area/shared'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/dashboard/services/$provider')({
  component: ServicePage,
})

function ServicePage() {
  const { provider } = Route.useParams()
  
  const { service, isLoading: isServiceLoading, isError: isServiceError } = useService(provider)
  const { data: triggers, isLoading: isTriggersLoading } = useServiceTriggers(provider)
  const { data: actions, isLoading: isActionsLoading } = useServiceActions(provider)

  const isLoading = isServiceLoading || isTriggersLoading || isActionsLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Loader2 className="animate-spin mr-2" /> Loading service details...
      </div>
    )
  }

  if (isServiceError || !service) {
    return (
      <div className="p-8 text-center">
        <div className="text-destructive bg-destructive/10 p-4 rounded-lg inline-block">
          Failed to load service details. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div className="py-6 pr-6 h-full overflow-y-auto w-full">
      <ServiceDetails 
        service={service} 
        triggers={triggers || []} 
        actions={actions || []} 
      />
    </div>
  )
}