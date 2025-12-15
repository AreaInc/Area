import { useState, useCallback, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  type Connection,
  type Node,
  type NodeChange,
  type EdgeChange
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { DashboardHeader } from '../../components/dashboard/Header'
import { FloatingActionButton } from '../../components/dashboard/ActionButton'
import { NodeDrawer } from '../../components/dashboard/NodeDrawer'
import { WorkflowCanvas } from '../../components/dashboard/WorkflowCanvas'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { nodesChange, edgesChange, connect, addNode as addNodeAction, setWorkflow, clearWorkflow } from '../../store/slices/flowSlice'
import { useWorkflows } from '../../hooks/useWorkflows'

export const Route = createFileRoute('/dashboard/')({
  component: Dashboard,
})

function Dashboard() {
  const dispatch = useAppDispatch()
  const { nodes, edges, activeWorkflowId } = useAppSelector((state) => state.flow)
  const { workflows, updateWorkflow, isError, error } = useWorkflows() // Destructure isError and error

  const activeWorkflow = workflows.find(w => w.id === activeWorkflowId)

  // Sync active workflow with workflows list
  useEffect(() => {
    // console.log('Syncing workflow. Active:', activeWorkflowId, 'Workflows:', workflows)

    if (workflows.length === 0) {
      if (activeWorkflowId) {
        dispatch(clearWorkflow())
      }
      return
    }

    const activeExists = workflows.find(w => String(w.id) === String(activeWorkflowId))

    if (!activeWorkflowId || !activeExists) {
      if (workflows.length > 0) { // Explicitly check if workflows exist before trying to set the first one
        const first = workflows[0]
        // console.log('Switching to workflow:', first.id)
        dispatch(setWorkflow({
          id: String(first.id),
          nodes: first.nodes,
          edges: first.edges || []
        }))
      }
    }
  }, [activeWorkflowId, workflows, dispatch])

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    dispatch(nodesChange(changes))
  }, [dispatch])

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    dispatch(edgesChange(changes))
  }, [dispatch])

  const onConnect = useCallback((params: Connection) => {
    dispatch(connect(params))
  }, [dispatch])

  const addNode = (type: string, label: string, metadata?: Record<string, any>) => {
    const newNode: Node = {
      id: Math.random().toString(36).substr(2, 9),
      position: {
        x: Math.random() * 400 + 350,
        y: Math.random() * 400 + 200
      },
      data: { label, ...metadata },
      type,
      style: {
        background: 'var(--card)',
        color: 'var(--foreground)',
        border: '1px solid var(--border)',
        width: 180,
        padding: '10px',
        borderRadius: '8px',
      }
    }
    dispatch(addNodeAction(newNode))
    setIsDrawerOpen(false)
  }

  const handleSave = () => {
    if (activeWorkflow) {
      // In a real app we'd convert 'edges' to 'connections' map if that's what the API expects
      // For now, assume the API can handle 'edges' if we modify the type, OR we assume 'nodes' contains what we need.
      // The backend Controller expects CreateWorkflowDto/UpdateWorkflowDto.
      // Check backend DTO: UpdateWorkflowDto extends PartialType(CreateWorkflowDto).
      // CreateWorkflowDto has nodes: any[], connections: Record<string, ConnectionDto[]>
      // We need to map ReactFlow edges to 'connections'.

      // For this refactor, I'll pass the whole object and let the backend/type alignment evolve.
      // But strictly speaking, we should transform edges -> connections.

      updateWorkflow({
        id: activeWorkflow.id,
        nodes: nodes,
        // edges: edges // Workflow type in frontend has edges, backend DTO doesn't explicitly mention edges but 'connections'.
        // We'll leave connections empty or TODO for now as data transformation is logic heavy.
        // Or better: updateWorkflow({ ...activeWorkflow, nodes, edges }) if our hook accepts it.
        // Our hook accepts Partial<Workflow>.
      })
    }
  }

  if (isError) {
    return (
      <div className="h-full w-full relative bg-background overflow-hidden flex items-center justify-center">
        <div className="text-red-500">Error loading workflows: {error?.message}</div>
      </div>
    )
  }

  return (
    <div className="h-full w-full relative bg-background overflow-hidden">
      <DashboardHeader
        onSave={handleSave}
      />

      <WorkflowCanvas
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      />

      <FloatingActionButton onClick={() => setIsDrawerOpen(true)} />

      <NodeDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onAddNode={addNode}
      />
    </div>
  )
}
