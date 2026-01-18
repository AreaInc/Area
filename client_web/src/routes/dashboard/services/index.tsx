import { createFileRoute } from '@tanstack/react-router'
import { ServiceGrid } from '../../../components/services/ServiceGrid'

export const Route = createFileRoute('/dashboard/services/')({
  component: Services,
})

function Services() {
  return (
    <div className="py-6 pr-6 w-full">
      <h1 className="text-3xl font-bold mb-8">Services oui oui</h1>
      <ServiceGrid />
    </div>
  )
}