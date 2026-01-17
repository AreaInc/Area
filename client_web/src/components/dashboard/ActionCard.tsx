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
import { ActionSelector } from '@/components/workflow/ActionSelector';
import type { ActionConfig } from '@area/shared';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ActionCardProps {
  action?: ActionConfig;
  onChange: (action: ActionConfig) => void;
}

export function ActionCard({ action, onChange }: ActionCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isConfigured = !!action?.provider;

  return (
    <>
        <Card 
            onClick={() => setIsOpen(true)}
            role="button"
            tabIndex={0}
            className={cn(
                "relative h-full cursor-pointer transition-all hover:shadow-md border-2 border-transparent hover:border-node-action/50 bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                !isConfigured && "border-dashed border-border hover:border-node-action/50 bg-muted/10"
            )}
        >
            <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        {isConfigured ? (
                            <>
                                <span className="capitalize">{action.provider}</span>
                                <Badge variant="outline" className="font-normal text-xs bg-node-action/10 text-node-action border-node-action/20">
                                    {action.actionId}
                                </Badge>
                            </>
                        ) : (
                            <span className="text-muted-foreground">Select Action</span>
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
                {isConfigured && <CardDescription>Action configured</CardDescription>}
            </CardHeader>
            <CardContent className={cn("pt-4", !isConfigured && "flex flex-col items-center justify-center py-12 text-muted-foreground gap-2")}>
                {!isConfigured && (
                    <>
                        <MousePointerClick className="h-8 w-8 opacity-50" />
                        <p>Click to configure action</p>
                    </>
                )}
                {isConfigured && (
                    <div className="text-sm text-muted-foreground space-y-2">
                        {/* Summary */}
                        <div className="flex flex-wrap gap-1">
                            {Object.keys(action.config).map(key => (
                                <Badge key={key} variant="secondary" className="text-[10px] px-1 py-0 h-5">
                                    {key}
                                </Badge>
                            ))}
                        </div>
                        {action.credentialsId && (
                            <div className="text-xs flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Credentials linked
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Configure Action</DialogTitle>
                    <DialogDescription>
                        Choose what happens when the trigger fires.
                    </DialogDescription>
                </DialogHeader>
                <ActionSelector value={action} onChange={onChange} />
            </DialogContent>
        </Dialog>
    </>
  );
}
