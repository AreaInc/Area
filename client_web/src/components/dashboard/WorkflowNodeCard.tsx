import { useState } from 'react';
import { Settings2, Zap, Play } from 'lucide-react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardFooter,
    CardContent
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { ActionSelector } from '@/components/workflow/ActionSelector';
import { TriggerSelector } from '@/components/workflow/TriggerSelector';
import { useActions, useTriggers } from '@area/shared';
import type { ActionConfig, TriggerConfig } from '@area/shared';

type NodeType = 'action' | 'trigger';

interface WorkflowNodeCardProps {
    type: NodeType;
    data?: ActionConfig | TriggerConfig;
    onChange: (data: any) => void;
}

export function WorkflowNodeCard({ type, data, onChange }: WorkflowNodeCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const isAction = type === 'action';

    const { data: actions } = useActions();
    const { data: triggers } = useTriggers();

    const isConfigured = !!data?.provider;

    // Find metadata for the selected node
    const metadata = isAction
        ? actions?.find(a => a.serviceProvider === data?.provider && a.id === (data as ActionConfig).actionId)
        : triggers?.find(t => t.serviceProvider === data?.provider && t.id === (data as TriggerConfig).triggerId);

    const provider = data?.provider || '';
    const name = metadata?.name || (isAction ? 'Select Action' : 'Select Trigger');
    const description = metadata?.description || (isConfigured ? '' : `Choose the ${type} for your workflow.`);

    // Visual styles based on type
    const borderColorClass = isAction ? "hover:border-node-action/30" : "hover:border-node-webhook/30";
    const iconBgClass = isAction ? "bg-node-action/10 text-node-action" : "bg-node-webhook/10 text-node-webhook";

    const Icon = isAction ? Play : Zap;

    const renderNodeImage = () => {
        if (!isConfigured) {
            return (
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border-2 border-dashed border-border", iconBgClass)}>
                    <Icon size={20} className="opacity-50" />
                </div>
            );
        }

        if (metadata?.imageUrl) {
            return (
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden border border-border bg-white p-1.5 shadow-sm")}>
                    <img src={metadata.imageUrl} alt={name} className="w-full h-full object-contain" />
                </div>
            );
        }

        return (
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg uppercase", iconBgClass)}>
                {provider.charAt(0)}
            </div>
        );
    };

    return (
        <>
            <Card
                className={cn(
                    "relative h-full flex flex-col transition-all border-2 border-transparent bg-card/60 backdrop-blur-none group overflow-hidden",
                    borderColorClass,
                    !isConfigured && "border-dashed border-border bg-muted/5"
                )}
            >
                {/* Hover Blur and Gradient Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-0" />
                <div className="absolute inset-0 backdrop-blur-none group-hover:backdrop-blur-md transition-all duration-300 pointer-events-none z-0" />

                <div className="relative z-10 flex flex-col h-full">
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                        {renderNodeImage()}
                        <div className="flex flex-col">
                            <CardTitle className="text-base font-bold">
                                {name}
                            </CardTitle>
                            {isConfigured && (
                                <p className="text-xs text-muted-foreground capitalize">{provider}</p>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="flex-grow py-2">
                        <p className={cn("text-sm text-muted-foreground line-clamp-2", !isConfigured && "italic")}>
                            {description}
                        </p>
                        {isConfigured && (
                            <div className="mt-4 flex flex-wrap gap-1">
                                {Object.keys(data.config).map(key => (
                                    <Badge key={key} variant="secondary" className="text-[10px] px-1 py-0 h-5">
                                        {key}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2 text-xs h-8 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors"
                            onClick={() => setIsOpen(true)}
                        >
                            <Settings2 size={14} />
                            {isConfigured ? 'Configure' : 'Setup'}
                        </Button>
                    </CardFooter>
                </div>
            </Card>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Configure {isAction ? 'Action' : 'Trigger'}</DialogTitle>
                        <DialogDescription>
                            {isAction
                                ? 'Choose what happens when the trigger fires.'
                                : 'Choose the event that starts your workflow.'}
                        </DialogDescription>
                    </DialogHeader>
                    {isAction ? (
                        <ActionSelector value={data as ActionConfig} onChange={onChange} />
                    ) : (
                        <TriggerSelector value={data as TriggerConfig} onChange={onChange} />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}