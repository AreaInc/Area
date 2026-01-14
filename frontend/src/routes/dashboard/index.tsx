import { useState, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import {
  useWorkflows,
  useUpdateWorkflow,
  useDeleteWorkflow,
  useActivateWorkflow,
  useDeactivateWorkflow,
  useActions,
} from '../../hooks/useWorkflows';
import { Button } from '../../components/ui/button';
import { TriggerSelector } from '../../components/workflow/TriggerSelector';
import { ActionSelector } from '../../components/workflow/ActionSelector';
import type { TriggerConfig, ActionConfig } from '../../types/workflow';

export const Route = createFileRoute('/dashboard/')({
  component: Dashboard,
});

function Dashboard() {
  const { data: workflows, isLoading, error } = useWorkflows();
  const { data: actions } = useActions();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);

  const selectedWorkflow = workflows?.find((w) => w.id === selectedWorkflowId);

  const updateMutation = useUpdateWorkflow();
  const deleteMutation = useDeleteWorkflow();
  const activateMutation = useActivateWorkflow();
  const deactivateMutation = useDeactivateWorkflow();

  const [workflowName, setWorkflowName] = useState('');
  const [trigger, setTrigger] = useState<TriggerConfig | undefined>();
  const [action, setAction] = useState<ActionConfig | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (workflows && workflows.length > 0 && !selectedWorkflowId) {
      setSelectedWorkflowId(workflows[0].id);
    }
  }, [workflows, selectedWorkflowId]);

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

  const handleSave = async () => {
    if (!selectedWorkflow || !trigger || !action) {
      alert('Please configure both trigger and action');
      return;
    }

    // Validate action has credentials if required
    const selectedActionMeta = actions?.find(
      (a) => a.serviceProvider === action.provider && a.id === action.actionId
    );

    if (selectedActionMeta?.requiresCredentials && !action.credentialsId) {
      alert('Please select credentials for this action');
      return;
    }

    // Validate required action config fields
    if (selectedActionMeta?.inputSchema?.required) {
      const missingFields = selectedActionMeta.inputSchema.required.filter(
        (field: string) => !action.config[field] || action.config[field] === ''
      );
      if (missingFields.length > 0) {
        alert(`Please fill in required fields: ${missingFields.join(', ')}`);
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
      alert('Workflow saved successfully!');
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to save workflow';
      alert(`Failed to save workflow: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedWorkflow) return;

    if (!confirm(`Are you sure you want to delete "${selectedWorkflow.name}"?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(selectedWorkflow.id);
      setSelectedWorkflowId(null);
    } catch (err) {
      alert('Failed to delete workflow');
    }
  };

  const handleToggleActive = async () => {
    if (!selectedWorkflow) return;

    // Validate before activating
    if (!selectedWorkflow.isActive) {
      if (!trigger || !action) {
        alert('Please configure both trigger and action before activating');
        return;
      }

      // Check if action requires credentials
      const selectedActionMeta = actions?.find(
        (a) => a.serviceProvider === action?.provider && a.id === action?.actionId
      );

      if (selectedActionMeta?.requiresCredentials && !action?.credentialsId) {
        alert('Please select credentials for this action before activating');
        return;
      }

      // Validate required action config fields
      if (selectedActionMeta?.inputSchema?.required && action) {
        const missingFields = selectedActionMeta.inputSchema.required.filter(
          (field: string) => !action.config[field] || action.config[field] === ''
        );
        if (missingFields.length > 0) {
          alert(`Please fill in required fields before activating: ${missingFields.join(', ')}`);
          return;
        }
      }
    }

    try {
      if (selectedWorkflow.isActive) {
        await deactivateMutation.mutateAsync(selectedWorkflow.id);
      } else {
        await activateMutation.mutateAsync(selectedWorkflow.id);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to toggle workflow status';
      alert(`Failed to toggle workflow status: ${errorMessage}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Loading workflows...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-400">Failed to load workflows</p>
      </div>
    );
  }

  if (!workflows || workflows.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No workflows yet</p>
          <p className="text-sm text-gray-500">
            Create your first workflow using the sidebar
          </p>
        </div>
      </div>
    );
  }

  if (!selectedWorkflow) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Select a workflow from the sidebar</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-2xl font-bold bg-transparent border-none text-white focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <Button
              onClick={handleToggleActive}
              disabled={activateMutation.isPending || deactivateMutation.isPending}
            >
              {selectedWorkflow.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Trigger</h2>
          <p className="text-sm text-gray-400 mb-4">
            What event should start this workflow?
          </p>
          <TriggerSelector value={trigger} onChange={setTrigger} />
        </div>

        <div className="flex items-center justify-center">
          <div className="text-gray-500">↓</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Action</h2>
          <p className="text-sm text-gray-400 mb-4">
            What should happen when the trigger fires?
          </p>
          <ActionSelector value={action} onChange={setAction} />
        </div>

        {selectedWorkflow.lastRun && (
          <div className="text-center text-sm text-gray-500">
            Last run: {new Date(selectedWorkflow.lastRun).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
