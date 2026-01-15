import { useNavigate, useSearch } from '@tanstack/react-router';
import { Clock, Plus, Key, Grid } from 'lucide-react';
import clsx from 'clsx';
import { UserMenu } from './UserMenu';
import { type Workflow } from '../types/workflow';
import { useWorkflows, useCreateWorkflow } from '../hooks/useWorkflows';
import { workflowSlug } from '../lib/slug';

export function Sidebar() {
  const { data: workflows } = useWorkflows();
  const createMutation = useCreateWorkflow();
  const navigate = useNavigate();
  const { workflow: selectedWorkflowSlug } = useSearch({ from: '/dashboard' }) as {
    workflow?: string | null;
  };

  const handleCreateWorkflow = async () => {
    try {
      const newWorkflow = await createMutation.mutateAsync({
        name: 'New Workflow',
        description: 'Created via Sidebar',
        trigger: {
          provider: 'gmail',
          triggerId: 'receive-email',
          config: {},
        },
        action: {
          provider: 'gmail',
          actionId: 'send-email',
          config: {},
        },
      });
      navigate({
        to: '/dashboard',
        search: { workflow: workflowSlug(newWorkflow.id, newWorkflow.name) },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create workflow';
      alert(`Failed to create workflow: ${errorMessage}`);
    }
  };

  return (
    <div className="absolute top-4 left-4 bottom-4 w-64 bg-card/95 backdrop-blur-sm border border-border/50 text-foreground flex flex-col font-sans rounded-2xl z-30 transition-all duration-300">
      <div className="p-6 pb-2">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          Plug & Play
        </h1>
      </div>

      <div className="px-4 py-2 space-y-2">
        <button
          onClick={handleCreateWorkflow}
          disabled={createMutation.isPending}
          className="w-full flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors text-sm font-medium border border-primary/20 cursor-pointer disabled:opacity-50"
        >
          <Plus size={16} />
          <span>{createMutation.isPending ? 'Creating...' : 'New Workflow'}</span>
        </button>

        <button
          onClick={() => navigate({ to: '/dashboard/services' })}
          className="w-full flex items-center gap-2 px-3 py-2 text-foreground hover:bg-accent rounded-lg transition-colors text-sm font-medium cursor-pointer"
        >
          <Grid size={16} />
          <span>Services</span>
        </button>

        <button
          onClick={() => navigate({ to: '/dashboard/credentials' })}
          className="w-full flex items-center gap-2 px-3 py-2 text-foreground hover:bg-accent rounded-lg transition-colors text-sm font-medium cursor-pointer"
        >
          <Key size={16} />
          <span>Credentials</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
          Your Workflows
        </div>
        {workflows?.map((wf) => (
          <WorkflowItem
            key={wf.id}
            workflow={wf}
            isSelected={selectedWorkflowSlug === workflowSlug(wf.id, wf.name)}
            onSelect={() => {
              navigate({
                to: '/dashboard',
                search: { workflow: workflowSlug(wf.id, wf.name) },
              });
            }}
          />
        ))}
      </div>

      <UserMenu />
    </div>
  );
}

function WorkflowItem({
  workflow,
  isSelected,
  onSelect,
}: {
  workflow: Workflow;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const formatLastRun = (date: Date | null | undefined) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  };

  return (
    <button
      onClick={onSelect}
      className={clsx(
        'w-full group flex flex-col gap-1.5 p-3 rounded-xl border border-transparent transition-all cursor-pointer text-left',
        isSelected ? 'bg-accent border-border' : 'hover:bg-accent hover:border-border/50'
      )}
    >
      <div className="flex items-center justify-between w-full">
        <span
          className={clsx(
            'font-medium text-sm transition-colors',
            isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'
          )}
        >
          {workflow.name}
        </span>
        <div
          className={clsx(
            'w-2 h-2 rounded-full ring-2 ring-background transition-all',
            workflow.isActive
              ? 'bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500/50'
              : 'bg-muted-foreground/30'
          )}
        />
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock size={12} />
        <span>{formatLastRun(workflow.lastRun)}</span>
      </div>
      <div className="text-xs text-muted-foreground truncate">
        {workflow.triggerId} → {workflow.actionId}
      </div>
    </button>
  );
}
