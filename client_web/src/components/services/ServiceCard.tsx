import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
    provider: string;
    name: string;
    description: string;
    imageUrl?: string;
}

export function ServiceCard({ provider, name, description, imageUrl }: ServiceCardProps) {
    return (
        <Link 
            to="/dashboard/services/$provider" 
            params={{ provider }}
            className="group block h-full outline-none"
        >
            <Card className="h-full transition-all hover:shadow-md hover:border-primary/20 bg-card/50 hover:bg-card border-muted flex flex-col">
                <CardHeader className="flex flex-row items-center gap-4 pb-3">
                    <div className={cn(
                        "h-12 w-12 rounded-xl bg-background p-2.5 flex items-center justify-center shrink-0 border border-border shadow-sm group-hover:scale-105 transition-transform",
                        !imageUrl && "bg-muted"
                    )}>
                        {imageUrl ? (
                            <img src={imageUrl} alt={name} className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-lg font-bold uppercase text-muted-foreground">
                                {name.charAt(0)}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col space-y-1">
                         <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                            {name}
                         </CardTitle>
                         <Badge variant="outline" className="w-fit text-[10px] px-2 py-0 h-5 capitalize font-normal text-muted-foreground bg-background/50">
                            {provider}
                         </Badge>
                    </div>
                </CardHeader>
                <CardContent className="pb-4 flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {description}
                    </p>
                </CardContent>
                <CardFooter className="pt-0 text-xs font-medium text-muted-foreground group-hover:text-primary flex items-center gap-1 transition-colors">
                    Explore Integration <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </CardFooter>
            </Card>
        </Link>
    );
}
