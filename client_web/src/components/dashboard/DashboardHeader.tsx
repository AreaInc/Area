import { Zap, Power, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useState } from 'react';
import { toast } from 'sonner';

interface Template {
    name: string;
    description: string;
}

interface DashboardHeaderProps {
  workflowName: string;
  onNameChange: (name: string) => void;
  isActive: boolean;
  onToggleActive: () => void;
  onSave: () => void;
  onDelete: () => void;
  isSaving: boolean;
  isPending: boolean;
  templates: Template[];
  onApplyTemplate: (index: number) => void;
}

export function DashboardHeader({
  workflowName,
  onNameChange,
  isActive,
  onToggleActive,
  onSave,
  onDelete,
  isSaving,
  isPending,
  templates,
  onApplyTemplate,
}: DashboardHeaderProps) {
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);

  const handleApplyTemplate = (idx: number) => {
    onApplyTemplate(idx);
    setIsTemplateOpen(false);
    toast.success(`Applied template: ${templates[idx].name}`);
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
      <Input
        type="text"
        value={workflowName}
        onChange={(e) => onNameChange(e.target.value)}
        className="text-2xl font-bold bg-transparent border-transparent hover:border-input focus:border-input px-2 h-12 w-full md:w-auto"
      />
      <div className="flex items-center gap-2">
        <Sheet open={isTemplateOpen} onOpenChange={setIsTemplateOpen}>
            <SheetTrigger asChild>
                <Button variant="outline">
                    <Zap className="mr-2 h-4 w-4" />
                    Quick Templates
                </Button>
            </SheetTrigger>
            <SheetContent side="right">
                <SheetHeader>
                    <SheetTitle>Quick Templates</SheetTitle>
                    <SheetDescription>Pick a template to get started.</SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                    {templates.map((template, idx) => (
                        <Button 
                            key={template.name} 
                            variant="secondary" 
                            className="justify-start h-auto py-4 flex-col items-start gap-1 whitespace-normal text-left"
                            onClick={() => handleApplyTemplate(idx)}
                        >
                            <span className="font-semibold">{template.name}</span>
                            <span className="text-xs text-muted-foreground font-normal leading-snug">{template.description}</span>
                        </Button>
                    ))}
                </div>
            </SheetContent>
        </Sheet>

        <Button
          onClick={onToggleActive}
          disabled={isPending}
          variant={isActive ? "secondary" : "default"}
        >
          <Power className="mr-2 h-4 w-4" />
          {isActive ? 'Deactivate' : 'Activate'}
        </Button>
        <Button onClick={onSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
        <Button onClick={onDelete} disabled={isPending} variant="destructive" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
