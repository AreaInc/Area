import { Link } from '@tanstack/react-router'
import { ArrowLeft, Shield, Zap, Play } from 'lucide-react'
import type { Service, ActionMetadata, TriggerMetadata } from '@area/shared'
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface ServiceDetailsProps {
    service: Service
    triggers: TriggerMetadata[]
    actions: ActionMetadata[]
}

export function ServiceDetails({ service, triggers, actions }: ServiceDetailsProps) {
    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header Section */}
            <div>
                 <Link
                    to="/dashboard/services"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Services
                </Link>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="h-24 w-24 rounded-2xl bg-background p-4 flex items-center justify-center shrink-0 border border-border shadow-sm">
                         {service.imageUrl ? (
                            <img src={service.imageUrl} alt={service.name} className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-3xl font-bold uppercase text-muted-foreground">
                                {service.name.charAt(0)}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight">{service.name}</h1>
                            <Badge variant="secondary" className="font-normal">v{service.version}</Badge>
                        </div>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                            {service.description}
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Shield size={16} />
                                <span>{service.credentialTypes.join(', ')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Content Tabs */}
            <Tabs defaultValue="triggers" className="w-full">
                <TabsList className="w-full justify-start h-auto p-1 bg-transparent border-b rounded-none mb-6 gap-6">
                    <TabsTrigger 
                        value="triggers" 
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 shadow-none"
                    >
                        Triggers <Badge variant="secondary" className="ml-2">{triggers.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger 
                        value="actions" 
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2 shadow-none"
                    >
                        Actions <Badge variant="secondary" className="ml-2">{actions.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="triggers" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {triggers.length > 0 ? triggers.map(trigger => (
                            <NodeCard key={trigger.id} node={trigger} type="trigger" />
                        )) : (
                            <EmptyState type="trigger" />
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="actions" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {actions.length > 0 ? actions.map(action => (
                            <NodeCard key={action.id} node={action} type="action" />
                        )) : (
                            <EmptyState type="action" />
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function NodeCard({ node, type }: { node: any, type: 'trigger' | 'action' }) {
    const Icon = type === 'trigger' ? Zap : Play;
    return (
        <Card className="hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${type === 'trigger' ? 'bg-node-webhook/10 text-node-webhook' : 'bg-node-action/10 text-node-action'}`}>
                            <Icon size={18} />
                        </div>
                        <CardTitle className="text-base font-semibold">{node.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
                        {node.id}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <CardDescription className="line-clamp-2 mb-3">
                    {node.description}
                </CardDescription>
                {/* Schema hints could be added here if needed */}
            </CardContent>
        </Card>
    )
}

function EmptyState({ type }: { type: string }) {
    return (
        <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl bg-muted/30">
            <p>No {type}s available for this service.</p>
        </div>
    )
}