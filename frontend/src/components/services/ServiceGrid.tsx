import { useServices } from '../../hooks/useServices';
import { ServiceCard } from './ServiceCard';
import { Loader2 } from 'lucide-react';

export function ServiceGrid() {
    const { services, isLoading, isError } = useServices();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                <Loader2 className="animate-spin mr-2" /> Loading services...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center p-8 text-destructive border border-destructive/20 rounded-xl bg-destructive/5">
                Failed to load services. Please try again later.
            </div>
        );
    }

    if (services.length === 0) {
         return (
            <div className="text-center p-8 text-muted-foreground border border-border rounded-xl">
                No services available at the moment.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
                <ServiceCard
                    key={service.id}
                    provider={service.provider}
                    name={service.name}
                    description={service.description}
                    imageUrl={service.imageUrl}
                    isConnected={false}
                />
            ))}
        </div>
    );
}