import { useNavigate } from '@tanstack/react-router'
import { Clock, Plus } from 'lucide-react'
import clsx from 'clsx'
import { UserMenu } from './UserMenu'
import { type Workflow } from '../types/workflow'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import { setWorkflow } from '../store/slices/flowSlice'
import { INITIAL_NODES } from '../mocks/nodes'
import { useWorkflows } from '../hooks/useWorkflows'
import { useQueryClient } from '@tanstack/react-query' // Import useQueryClient

export function Sidebar() {
  const { workflows, createWorkflow } = useWorkflows()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const queryClient = useQueryClient() // Initialize queryClient

  const handleCreateWorkflow = () => {
    // We should probably have a modal for name/desc, but for now:
    createWorkflow({
        name: 'New Workflow',
        description: 'Created via Sidebar',
        nodes: INITIAL_NODES,
        connections: {} // API expects connections object, frontend currently uses 'edges' array in Redux.
                        // We need to adapt this. The backend schema uses 'connections'.
                        // The frontend 'flowSlice' uses 'edges'.
                        // For now, let's just pass empty connections.
    }, {
        onSuccess: (newWorkflow) => {
             // Optimistically update the cache
             queryClient.setQueryData(['workflows'], (old: Workflow[] | undefined) => {
                 return [...(old || []), newWorkflow];
             });

             dispatch(setWorkflow({
                id: String(newWorkflow.id),
                nodes: newWorkflow.nodes,
                edges: [] // Need to convert backend connections to edges if we load it immediately
            }))
            navigate({ to: '/dashboard' })
        }
    })
  }

  return (
    <div className="absolute top-4 left-4 bottom-4 w-64 bg-card/95 backdrop-blur-sm border border-border/50 text-foreground flex flex-col font-sans rounded-2xl z-30 transition-all duration-300">
      <div className="p-6 pb-2">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          Plug & Play
        </h1>
      </div>

      <div className="px-4 py-2">
        <button
            onClick={handleCreateWorkflow}
            className="w-full flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors text-sm font-medium border border-primary/20 cursor-pointer"
        >
            <Plus size={16} />
            <span>New Workflow</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
          Your Workflows
        </div>
        {workflows.map((wf) => (
          <WorkflowItem key={wf.id} workflow={wf} />
        ))}
      </div>

      <UserMenu />
    </div>
  )
}

function WorkflowItem({ workflow }: { workflow: Workflow }) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const activeWorkflowId = useAppSelector((state) => state.flow.activeWorkflowId)

  const isActive = String(activeWorkflowId) === String(workflow.id)

  const handleWorkflowClick = () => {
      dispatch(setWorkflow({
          id: String(workflow.id),
          nodes: workflow.nodes,
          edges: workflow.edges || []
      }))
      navigate({ to: '/dashboard' })
  }

  return (
    <button
      onClick={handleWorkflowClick}
      className={clsx(
        "w-full group flex flex-col gap-1.5 p-3 rounded-xl border border-transparent transition-all cursor-pointer text-left",
        isActive ? "bg-accent border-border" : "hover:bg-accent hover:border-border/50"
      )}
    >
      <div className="flex items-center justify-between w-full">
        <span className={clsx(
            "font-medium text-sm transition-colors",
            isActive ? "text-primary" : "text-foreground group-hover:text-primary"
        )}>
            {workflow.name}
        </span>
        <div className={clsx(
            "w-2 h-2 rounded-full ring-2 ring-background transition-all",
            workflow.isActive
                ? "bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500/50"
                : "bg-muted-foreground/30"
        )} />
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock size={12} />
        <span>{workflow.lastRun || 'Never'}</span>
      </div>
    </button>
  )
}
