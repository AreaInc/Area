import { createFileRoute } from '@tanstack/react-router'
import { ServiceGrid } from '../../../components/services/ServiceGrid'
import { Separator } from "@/components/ui/separator"

export const Route = createFileRoute('/dashboard/services/')({
  component: Services,
})

function Services() {
  return (
    <div className="space-y-6 p-6 pb-16 block">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Services</h2>
        <p className="text-muted-foreground">
          Explore available integrations and their capabilities.
        </p>
      </div>
      <Separator className="my-6" />
      <ServiceGrid />
    </div>
  )
}
