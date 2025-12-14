import { createFileRoute } from '@tanstack/react-router'
import { ServiceGrid } from '../../components/services/ServiceGrid'

export const Route = createFileRoute('/dashboard/services')({
  component: Services,
})

function Services() {
  return (
    <div className="p-8 pl-72">
      <h1 className="text-3xl font-bold mb-8">Services</h1>
      <ServiceGrid />
    </div>
  )
}