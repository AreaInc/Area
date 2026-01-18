import { useState, useEffect, useMemo } from 'react';
import { createFileRoute, useSearch } from '@tanstack/react-router';
import {
  useWorkflows,
  useUpdateWorkflow,
  useDeleteWorkflow,
  useActivateWorkflow,
  useDeactivateWorkflow,
  useWorkflowExecutions,
  useActions,
} from '@area/shared';
import type { TriggerConfig, ActionConfig } from '@area/shared';
import { parseWorkflowIdFromSlug, workflowSlug } from '@/lib/slug';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from 'sonner';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { WorkflowSteps } from '@/components/dashboard/WorkflowSteps';
import { TriggerCard } from '@/components/dashboard/TriggerCard';
import { ActionCard } from '@/components/dashboard/ActionCard';
import { QUICK_TEMPLATES } from '@/lib/templates';

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

  const handleDelete = () => {
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
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <DashboardHeader
          workflowName={workflowName}
          onNameChange={setWorkflowName}
          isActive={selectedWorkflow.isActive}
          onToggleActive={handleToggleActive}
          onSave={handleSave}
          onDelete={handleDelete}
          isSaving={isSaving}
          isPending={activateMutation.isPending || deactivateMutation.isPending || deleteMutation.isPending}
          templates={QUICK_TEMPLATES}
          onApplyTemplate={applyTemplate}
        />

        <WorkflowSteps
          triggerNode={<TriggerCard trigger={trigger} onChange={setTrigger} />}
          actionNode={<ActionCard action={action} onChange={setAction} />}
        />

        <WorkflowExecutionsTable workflowId={selectedWorkflow.id} />

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

function WorkflowExecutionsTable({ workflowId }: { workflowId: number }) {
  const { data: executions, isLoading } = useWorkflowExecutions(workflowId);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Recent Activity</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Loading history...
                </TableCell>
              </TableRow>
            ) : !executions || executions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No execution history
                </TableCell>
              </TableRow>
            ) : (
              executions.map((execution) => (
                <TableRow key={execution.id}>
                  <TableCell>
                    <span
                      className={`capitalize ${execution.status === 'completed'
                          ? 'text-green-600'
                          : execution.status === 'failed'
                            ? 'text-red-600'
                            : 'text-yellow-600'
                        }`}
                    >
                      {execution.status}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(execution.startedAt).toLocaleString()}</TableCell>
                  <TableCell>
                    {execution.completedAt ? new Date(execution.completedAt).toLocaleString() : '-'}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={execution.errorMessage || ''}>
                    {execution.errorMessage || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
