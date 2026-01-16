import { Link } from '@tanstack/react-router';

interface ServiceCardProps {
    provider: string;
    name: string;
    description: string;
    imageUrl: string;
    isConnected?: boolean;
    onConnect?: () => void;
}

export function ServiceCard({ provider, name, description, imageUrl, isConnected = false }: ServiceCardProps) {
    return (
        <div className="bg-card border border-border rounded-xl p-6 hover:border-muted-foreground/20 transition-colors flex flex-col h-full">
            <Link 
                to="/dashboard/services/$provider" 
                params={{ provider }}
                className="flex-1 group"
            >
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-muted rounded-lg text-foreground w-14 h-14 flex items-center justify-center overflow-hidden">
                        {imageUrl ? (
                            <img src={imageUrl} alt={name} className="w-full h-full object-contain" />
                        ) : (
                            <div className="w-8 h-8 bg-gray-400 rounded-full" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{name}</h3>
                        <span className={`text-xs uppercase tracking-wider ${isConnected ? 'text-green-500' : 'text-muted-foreground'}`}>
                            {isConnected ? 'Connected' : 'Not Connected'}
                        </span>
                    </div>
                </div>
                <p className="text-muted-foreground text-sm mb-6 line-clamp-3">{description}</p>
            </Link>
            
            <button 
                onClick={() => {}}
                className={`w-full py-2 rounded-lg transition-colors border ${
                    isConnected 
                        ? 'bg-secondary/50 text-muted-foreground border-border cursor-default' 
                        : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border-border'
                }`}
            >
                {isConnected ? 'Connected' : 'Connect'}
            </button>
        </div>
    );
}