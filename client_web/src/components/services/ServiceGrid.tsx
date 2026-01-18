import { useServices } from '@area/shared';
import { ServiceCard } from './ServiceCard';
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from 'lucide-react';

export function ServiceGrid() {
  const { services, isLoading, isError } = useServices();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-full border border-border rounded-xl p-6 flex flex-col space-y-4 bg-card">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-xl" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                        </div>
                        <div className="space-y-2 pt-2">
                             <Skeleton className="h-4 w-full" />
                             <Skeleton className="h-4 w-[90%]" />
                             <Skeleton className="h-4 w-[60%]" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-muted/30">
                <div className="bg-destructive/10 p-3 rounded-full mb-4">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Failed to load services</h3>
                <p className="text-muted-foreground max-w-sm">
                    We couldn't fetch the available services. Please check your connection or try again later.
                </p>
            </div>
        );
    }

    if (!services || services.length === 0) {
         return (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-muted/30">
                <h3 className="font-semibold text-lg mb-2">No services found</h3>
                <p className="text-muted-foreground">
                    There are no services available at the moment.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {services.map((service) => (
                <ServiceCard
                    key={service.id}
                    provider={service.provider}
                    name={service.name}
                    description={service.description}
                    imageUrl={service.imageUrl}
                />
            ))}
        </div>
    );
}
