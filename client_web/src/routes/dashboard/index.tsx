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
import { Button } from '../../components/ui/button';
import { TriggerSelector } from '../../components/workflow/TriggerSelector';
import { ActionSelector } from '../../components/workflow/ActionSelector';
<<<<<<< HEAD:frontend/src/routes/dashboard/index.tsx
import type { TriggerConfig, ActionConfig } from '../../types/workflow';
import { parseWorkflowIdFromSlug, workflowSlug } from '../../lib/slug';
=======
import type { TriggerConfig, ActionConfig } from '@area/shared';
>>>>>>> origin/development:client_web/src/routes/dashboard/index.tsx

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
];

export const Route = createFileRoute('/dashboard/')({
  component: Dashboard,
});

function Dashboard() {
  const { workflow: workflowSlugParam = null } = useSearch({ from: '/dashboard' }) as {
    workflow?: string | null;
  };
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

        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700/60">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">
                Quick templates
              </h3>
              <p className="text-xs text-gray-400">
                Apply a ready-to-test trigger/action pair (webhook, Discord, cron, Gmail).
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {QUICK_TEMPLATES.map((template, idx) => (
              <button
                key={template.name}
                onClick={() => applyTemplate(idx)}
                className="text-left bg-gray-900/60 hover:bg-gray-900 border border-gray-700 rounded-lg p-4 transition-colors"
              >
                <div className="text-sm font-semibold text-white mb-1">{template.name}</div>
                <p className="text-xs text-gray-400 mb-3 leading-relaxed">{template.description}</p>
                <div className="flex items-center text-xs text-gray-300 gap-2">
                  <span className="px-2 py-1 rounded-full bg-gray-800 border border-gray-700">
                    {template.trigger.provider}:{template.trigger.triggerId}
                  </span>
                  <span className="text-gray-500">→</span>
                  <span className="px-2 py-1 rounded-full bg-gray-800 border border-gray-700">
                    {template.action.provider}:{template.action.actionId}
                  </span>
                </div>
              </button>
            ))}
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
