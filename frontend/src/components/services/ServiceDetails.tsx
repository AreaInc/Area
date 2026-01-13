import { Link } from '@tanstack/react-router'
import { ArrowLeft, Shield, Info, Activity, Plug } from 'lucide-react'
import type { Service, Action } from '../../types/service'
import { Button } from '../ui/button'

interface ServiceDetailsProps {
    service: Service
    authStatus?: 'success' | 'error'
}

const API_BASE = `http://${import.meta.env.VITE_DEPLOY_ADDRESS ?? "localhost"}:8080/api`

export function ServiceDetails({ service, authStatus }: ServiceDetailsProps) {
    const isOAuth2Service = service.credentialTypes.includes('OAUTH2')
    const backendAuthUrl = `${API_BASE}/auth/${service.provider}/authorize` // Adjust if needed

    return (
        <div className="max-w-5xl mx-auto">
            <Link
                to="/dashboard/services"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
                <ArrowLeft size={16} />
                Back to Services
            </Link>

            <div className="bg-card border border-border rounded-xl p-8 mb-8 shadow-sm">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="p-6 bg-muted rounded-xl w-32 h-32 flex items-center justify-center shrink-0">
                         {service.imageUrl ? (
                            <img src={service.imageUrl} alt={service.name} className="w-full h-full object-contain" />
                        ) : (
                            <div className="w-16 h-16 bg-gray-400 rounded-full" />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                            <h1 className="text-3xl font-bold">{service.name}</h1>
                            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20">
                                v{service.version}
                            </span>
                        </div>
                        <p className="text-muted-foreground text-lg mb-6">{service.description}</p>

                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-lg border border-border">
                                <Shield size={16} className="text-muted-foreground" />
                                <span className="text-sm font-medium">
                                    Auth: {service.credentialTypes.join(', ')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-lg border border-border">
                                <Activity size={16} className="text-muted-foreground" />
                                <span className="text-sm font-medium">
                                    Actions: {service.actions.length}
                                </span>
                            </div>
                            {isOAuth2Service && (
                                <Button asChild variant="secondary" className="group">
                                    <a href={backendAuthUrl}>
                                        <Plug size={16} className="mr-2 group-hover:rotate-45 transition-transform" />
                                        Connect {service.name}
                                    </a>
                                </Button>
                            )}
                        </div>
                        {authStatus === 'success' && (
                            <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">
                                Successfully connected to {service.name}!
                            </div>
                        )}
                        {authStatus === 'error' && (
                            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                                Failed to connect to {service.name}. Please try again.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                Available Actions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {service.actions.map((action) => (
                    <ActionCard key={action.id} action={action} />
                ))}
            </div>
        </div>
    )
}

function ActionCard({ action }: { action: Action }) {
    return (
        <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors group">
            <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {action.name}
                </h3>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">
                    {action.id}
                </span>
            </div>
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                {action.description}
            </p>

            <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Info size={14} />
                    <span className="font-medium">Inputs:</span>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 font-mono text-xs">
                    {Object.keys(action.inputSchema.properties || {}).map((prop) => (
                         <div key={prop} className="flex items-center gap-2 mb-1 last:mb-0">
                            <span className="text-primary">{prop}</span>
                            <span className="text-muted-foreground">: {action.inputSchema.properties[prop].type}</span>
                         </div>
                    ))}
                    {Object.keys(action.inputSchema.properties || {}).length === 0 && (
                        <span className="text-muted-foreground italic">No inputs required</span>
                    )}
                </div>
            </div>
        </div>
    )
}
