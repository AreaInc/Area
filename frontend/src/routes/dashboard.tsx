import { useState, useCallback } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { 
  type Connection,
  type Node,
  type NodeChange,
  type EdgeChange
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { DashboardLayout } from '../components/dashboard/DashboardLayout'
import { DashboardHeader } from '../components/dashboard/Header'
import { FloatingActionButton } from '../components/dashboard/ActionButton'
import { NodeDrawer } from '../components/dashboard/NodeDrawer'
import { WorkflowCanvas } from '../components/dashboard/WorkflowCanvas'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { nodesChange, edgesChange, connect, addNode as addNodeAction } from '../store/slices/flowSlice'
import { updateWorkflow } from '../store/slices/workflowsSlice'
import { authClient } from '../lib/auth-client'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const session = await authClient.getSession()
    if (!session.data) {
      throw redirect({ to: '/login' })
    }
  },
  component: Dashboard,
})

function Dashboard() {
  const dispatch = useAppDispatch()
  const { nodes, edges, activeWorkflowId } = useAppSelector((state) => state.flow)
  const workflows = useAppSelector((state) => state.workflows.items)
  
  const activeWorkflow = workflows.find(w => w.id === activeWorkflowId) || workflows[0]
  
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

  const addNode = (type: string, label: string) => {
    const newNode: Node = {
      id: Math.random().toString(36).substr(2, 9),
      position: { 
        x: Math.random() * 400 + 350, 
        y: Math.random() * 400 + 200 
      },
      data: { label },
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

  const handleToggleActive = () => {
    if (activeWorkflow) {
      dispatch(updateWorkflow({ ...activeWorkflow, isActive: !activeWorkflow.isActive }))
    }
  }

  return (
    <DashboardLayout>
      <div className="h-full w-full relative bg-background overflow-hidden">
        <DashboardHeader 
          workflowName={activeWorkflow?.name || 'Untitled Workflow'}
          isActive={activeWorkflow?.isActive || false}
          onToggleActive={handleToggleActive}
          onDelete={() => alert('Delete workflow?')}
          onSave={() => alert('Save workflow?')}
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
    </DashboardLayout>
  )
}