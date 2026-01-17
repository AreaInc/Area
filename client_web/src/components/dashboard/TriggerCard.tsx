import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TriggerSelector } from '@/components/workflow/TriggerSelector';
import type { TriggerConfig } from '@area/shared';

interface TriggerCardProps {
  trigger?: TriggerConfig;
  onChange: (trigger: TriggerConfig) => void;
}

export function TriggerCard({ trigger, onChange }: TriggerCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-l-4 border-l-node-webhook h-full">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-bold">
                {trigger?.provider ? `${trigger.provider} / ${trigger.triggerId}` : 'Select Trigger'}
            </CardTitle>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon"><Settings2 className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Configure Trigger</DialogTitle>
                        <DialogDescription>
                            Choose what starts your workflow.
                        </DialogDescription>
                    </DialogHeader>
                    <TriggerSelector value={trigger} onChange={onChange} />
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                {trigger?.provider ? 'Trigger configured' : 'No trigger selected'}
            </p>
        </CardContent>
    </Card>
  );
}
