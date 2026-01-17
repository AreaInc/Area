import { useState } from 'react';
import { Settings2, MousePointerClick } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { TriggerSelector } from '@/components/workflow/TriggerSelector';
import type { TriggerConfig } from '@area/shared';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TriggerCardProps {
  trigger?: TriggerConfig;
  onChange: (trigger: TriggerConfig) => void;
}

export function TriggerCard({ trigger, onChange }: TriggerCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isConfigured = !!trigger?.provider;

  return (
    <>
        <Card 
            onClick={() => setIsOpen(true)}
            role="button"
            tabIndex={0}
            className={cn(
                "relative h-full cursor-pointer transition-all hover:shadow-md border-2 border-transparent hover:border-node-webhook/50 bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                !isConfigured && "border-dashed border-border hover:border-node-webhook/50 bg-muted/10"
            )}
        >
            <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        {isConfigured ? (
                            <>
                                <span className="capitalize">{trigger.provider}</span>
                                <Badge variant="outline" className="font-normal text-xs bg-node-webhook/10 text-node-webhook border-node-webhook/20">
                                    {trigger.triggerId}
                                </Badge>
                            </>
                        ) : (
                            <span className="text-muted-foreground">Select Trigger</span>
                        )}
                    </CardTitle>
                    {isConfigured && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            type="button"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
                        >
                            <Settings2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                {isConfigured && <CardDescription>Trigger configured</CardDescription>}
            </CardHeader>
            <CardContent className={cn("pt-4", !isConfigured && "flex flex-col items-center justify-center py-12 text-muted-foreground gap-2")}>
                {!isConfigured && (
                    <>
                        <MousePointerClick className="h-8 w-8 opacity-50" />
                        <p>Click to configure trigger</p>
                    </>
                )}
                {isConfigured && (
                    <div className="text-sm text-muted-foreground">
                        {/* Potential to show summary of config here */}
                        <div className="flex flex-wrap gap-1">
                            {Object.keys(trigger.config).map(key => (
                                <Badge key={key} variant="secondary" className="text-[10px] px-1 py-0 h-5">
                                    {key}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Configure Trigger</DialogTitle>
                    <DialogDescription>
                        Choose the event that starts your workflow.
                    </DialogDescription>
                </DialogHeader>
                <TriggerSelector value={trigger} onChange={onChange} />
            </DialogContent>
        </Dialog>
    </>
  );
}
