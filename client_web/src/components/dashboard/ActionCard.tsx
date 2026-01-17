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
import { ActionSelector } from '@/components/workflow/ActionSelector';
import type { ActionConfig } from '@area/shared';

interface ActionCardProps {
  action?: ActionConfig;
  onChange: (action: ActionConfig) => void;
}

export function ActionCard({ action, onChange }: ActionCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-l-4 border-l-node-action h-full">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-bold">
                {action?.provider ? `${action.provider} / ${action.actionId}` : 'Select Action'}
            </CardTitle>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon"><Settings2 className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Configure Action</DialogTitle>
                        <DialogDescription>
                            Choose what happens next.
                        </DialogDescription>
                    </DialogHeader>
                    <ActionSelector value={action} onChange={onChange} />
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                {action?.provider ? 'Action configured' : 'No action selected'}
            </p>
        </CardContent>
    </Card>
  );
}
