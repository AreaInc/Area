import { useState, useEffect, useMemo } from 'react';
import { createFileRoute, useSearch } from '@tanstack/react-router';
import {
  useWorkflows,
  useUpdateWorkflow,
  useDeleteWorkflow,
  useActivateWorkflow,
  useDeactivateWorkflow,
  useActions,
} from '@area/shared';
import { Button } from '@/components/ui/button';
import { TriggerSelector } from '@/components/workflow/TriggerSelector';
import { ActionSelector } from '@/components/workflow/ActionSelector';
import type { TriggerConfig, ActionConfig } from '@area/shared';
import { parseWorkflowIdFromSlug, workflowSlug } from '@/lib/slug';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Zap, Play, Settings2, Trash2, Power, Save } from 'lucide-react';
import { toast } from 'sonner';

const QUICK_TEMPLATES: {
  name: string;
  description: string;
  trigger: TriggerConfig;
  action: ActionConfig;
}[] = [
    {
      name: 'Public webhook → Discord',
      description: 'Start from an unauthenticated webhook and fan out to a Discord channel.',
      trigger: {
        provider: 'webhook',
        triggerId: 'incoming-webhook',
        config: { path: '/hooks/public', secret: '' },
      },
      action: {
        provider: 'discord',
        actionId: 'send-webhook',
        config: {
          webhookUrl: 'https://discord.com/api/webhooks/xxx/yyy',
          content: 'Hello from AREA!',
        },
      },
    },
    {
      name: 'Cron (hourly) → Gmail send',
      description: 'Run every hour and send a status email through Gmail.',
      trigger: {
        provider: 'scheduler',
        triggerId: 'cron',
        config: { cron: '0 * * * *' },
      },
      action: {
        provider: 'gmail',
        actionId: 'send-email',
        config: {
          to: 'you@example.com',
          subject: 'Hourly ping from AREA',
          body: 'This is a scheduled notification.',
        },
      },
    },
    {
      name: 'Gmail inbound → Gmail auto-reply',
      description: 'Use Gmail receive trigger to auto-reply to matching emails.',
      trigger: {
        provider: 'gmail',
        triggerId: 'receive-email',
        config: { from: '' },
      },
      action: {
        provider: 'gmail',
        actionId: 'send-email',
        config: {
          to: '{{from}}',
          subject: 'Re: {{subject}}',
          body: 'Thanks for reaching out!',
        },
      },
    },
    {
      name: 'One-shot Execution',
      description: 'Run a workflow exactly once immediately upon activation.',
      trigger: {
        provider: 'scheduler',
        triggerId: 'on-activation',
        config: {},
      },
      action: {
        provider: 'discord',
        actionId: 'send-webhook',
        config: {
          webhookUrl: '',
          content: 'One-shot workflow executed!',
        },
      },
    },
  ];

export const Route = createFileRoute('/dashboard/')({
  component: Dashboard,
});

function Dashboard() {
  const { workflow: workflowSlugParam = null } = useSearch({ from: '/dashboard' });
  const navigate = Route.useNavigate();
  const { data: workflows, isLoading, error } = useWorkflows();
  const { data: actions } = useActions();
  const selectedWorkflow = useMemo(() => {
    if (!workflows || workflows.length === 0) return undefined;
    const desiredId = parseWorkflowIdFromSlug(workflowSlugParam);
    const desiredWorkflow = desiredId
      ? workflows.find((w) => String(w.id) === desiredId)
      : undefined;
    return desiredWorkflow ?? workflows[0];
  }, [workflows, workflowSlugParam]);

  const updateMutation = useUpdateWorkflow();
  const deleteMutation = useDeleteWorkflow();
  const activateMutation = useActivateWorkflow();
  const deactivateMutation = useDeactivateWorkflow();

  const [workflowName, setWorkflowName] = useState('');
  const [trigger, setTrigger] = useState<TriggerConfig | undefined>();
  const [action, setAction] = useState<ActionConfig | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  
  const [isTriggerOpen, setIsTriggerOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  // Ensure URL slug reflects the selected workflow (helps bookmarking/sharing)
  useEffect(() => {
    if (!workflows || workflows.length === 0 || !selectedWorkflow) return;
    const slug = workflowSlug(selectedWorkflow.id, selectedWorkflow.name);
    if (workflowSlugParam !== slug) {
      navigate({
        to: '/dashboard',
        search: { workflow: slug },
        replace: true,
      });
    }
  }, [workflows, selectedWorkflow, workflowSlugParam, navigate]);

  useEffect(() => {
    if (selectedWorkflow) {
      setWorkflowName(selectedWorkflow.name);
      setTrigger({
        provider: selectedWorkflow.triggerProvider,
        triggerId: selectedWorkflow.triggerId,
        config: selectedWorkflow.triggerConfig,
      });
      setAction({
        provider: selectedWorkflow.actionProvider,
        actionId: selectedWorkflow.actionId,
        config: selectedWorkflow.actionConfig,
        credentialsId: selectedWorkflow.actionCredentialsId || undefined,
      });
    }
  }, [selectedWorkflow]);

  const applyTemplate = (templateIndex: number) => {
    const template = QUICK_TEMPLATES[templateIndex];
    if (!template) return;

    setWorkflowName(template.name);
    setTrigger({ ...template.trigger });
    setAction({ ...template.action });
    setIsTemplateOpen(false);
    toast.success(`Applied template: ${template.name}`);
  };

  const handleSave = async () => {
    if (!selectedWorkflow || !trigger || !action) {
      toast.error('Please configure both trigger and action');
      return;
    }

    // Validate action has credentials if required
    const selectedActionMeta = actions?.find(
      (a) => a.serviceProvider === action.provider && a.id === action.actionId
    );

    if (selectedActionMeta?.requiresCredentials && !action.credentialsId) {
      toast.error('Please select credentials for this action');
      return;
    }

    // Validate required action config fields
    if (selectedActionMeta?.inputSchema?.required) {
      const missingFields = selectedActionMeta.inputSchema.required.filter(
        (field: string) => !action.config[field] || action.config[field] === ''
      );
      if (missingFields.length > 0) {
        toast.error(`Please fill in required fields: ${missingFields.join(', ')}`);
        return;
      }
    }

    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        id: selectedWorkflow.id,
        dto: {
          name: workflowName,
          trigger,
          action,
        },
      });
      toast.success('Workflow saved successfully!');
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to save workflow';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedWorkflow) return;
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedWorkflow) return;
    try {
      await deleteMutation.mutateAsync(selectedWorkflow.id);
      toast.success('Workflow deleted');
    } catch (err) {
      toast.error('Failed to delete workflow');
    } finally {
      setIsDeleteAlertOpen(false);
    }
  };

  const handleToggleActive = async () => {
    if (!selectedWorkflow) return;

    // Validate before activating
    if (!selectedWorkflow.isActive) {
      if (!trigger || !action) {
        toast.error('Please configure both trigger and action before activating');
        return;
      }

      // Check if action requires credentials
      const selectedActionMeta = actions?.find(
        (a) => a.serviceProvider === action?.provider && a.id === action?.actionId
      );

      if (selectedActionMeta?.requiresCredentials && !action?.credentialsId) {
        toast.error('Please select credentials for this action before activating');
        return;
      }

      // Validate required action config fields
      if (selectedActionMeta?.inputSchema?.required && action) {
        const missingFields = selectedActionMeta.inputSchema.required.filter(
          (field: string) => !action.config[field] || action.config[field] === ''
        );
        if (missingFields.length > 0) {
          toast.error(`Please fill in required fields before activating: ${missingFields.join(', ')}`);
          return;
        }
      }
    }

    try {
      if (selectedWorkflow.isActive) {
        await deactivateMutation.mutateAsync(selectedWorkflow.id);
        toast.success('Workflow deactivated');
      } else {
        await activateMutation.mutateAsync(selectedWorkflow.id);
        toast.success('Workflow activated');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to toggle workflow status';
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading workflows...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Failed to load workflows</p>
      </div>
    );
  }

  if (!workflows || workflows.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No workflows yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first workflow using the sidebar
          </p>
        </div>
      </div>
    );
  }

  if (!selectedWorkflow) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Select a workflow from the sidebar</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 flex flex-col w-full">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
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
                        {QUICK_TEMPLATES.map((template, idx) => (
                            <Button 
                                key={template.name} 
                                variant="secondary" 
                                className="justify-start h-auto py-4 flex-col items-start gap-1 whitespace-normal text-left"
                                onClick={() => applyTemplate(idx)}
                            >
                                <span className="font-semibold">{template.name}</span>
                                <span className="text-xs text-muted-foreground font-normal leading-snug">{template.description}</span>
                            </Button>
                        ))}
                    </div>
                </SheetContent>
            </Sheet>

            <Button
              onClick={handleToggleActive}
              disabled={activateMutation.isPending || deactivateMutation.isPending}
              variant={selectedWorkflow.isActive ? "secondary" : "default"}
            >
              <Power className="mr-2 h-4 w-4" />
              {selectedWorkflow.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button onClick={handleDelete} disabled={deleteMutation.isPending} variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Workflow Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative">
            {/* Connector Line (Desktop) */}
            <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
                <div className="bg-border h-px w-8"></div>
                <div className="bg-border h-px w-8 -rotate-90"></div> 
                <div className="flex items-center justify-center bg-muted rounded-full p-2 border border-border">
                    <Play className="h-4 w-4 text-muted-foreground" />
                </div>
            </div>

            {/* Trigger Side */}
            <div className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold text-muted-foreground uppercase tracking-wider text-center lg:text-left">Trigger</h3>
                <Card className="border-l-4 border-l-node-webhook h-full">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-bold">
                            {trigger?.provider ? `${trigger.provider} / ${trigger.triggerId}` : 'Select Trigger'}
                        </CardTitle>
                        <Dialog open={isTriggerOpen} onOpenChange={setIsTriggerOpen}>
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
                                <TriggerSelector value={trigger} onChange={setTrigger} />
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {trigger?.provider ? 'Trigger configured' : 'No trigger selected'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Action Side */}
            <div className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold text-muted-foreground uppercase tracking-wider text-center lg:text-right">Action</h3>
                <Card className="border-l-4 border-l-node-action h-full">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-bold">
                            {action?.provider ? `${action.provider} / ${action.actionId}` : 'Select Action'}
                        </CardTitle>
                        <Dialog open={isActionOpen} onOpenChange={setIsActionOpen}>
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
                                <ActionSelector value={action} onChange={setAction} />
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {action?.provider ? 'Action configured' : 'No action selected'}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>

        {selectedWorkflow.lastRun && (
          <div className="text-center text-sm text-muted-foreground pt-8">
            Last run: {new Date(selectedWorkflow.lastRun).toLocaleString()}
          </div>
        )}

        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the workflow "{selectedWorkflow.name}".
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}