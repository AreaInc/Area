import { useState, useCallback } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { 
  useNodesState, 
  useEdgesState, 
  addEdge,
  type Connection,
  type Node,
  type Edge
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { DashboardLayout } from '../components/dashboard/DashboardLayout'
import { DashboardHeader } from '../components/dashboard/Header'
import { FloatingActionButton } from '../components/dashboard/ActionButton'
import { NodeDrawer } from '../components/dashboard/NodeDrawer'
import { WorkflowCanvas } from '../components/dashboard/WorkflowCanvas'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

const INITIAL_NODES: Node[] = [
  { 
    id: '1', 
    position: { x: 350, y: 200 }, 
    data: { label: 'Webhook Trigger' },
    type: 'input',
    style: { background: 'var(--node-webhook)', color: 'white', border: '1px solid var(--border)', width: 180 }
  },
]

function Dashboard() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isWorkflowActive, setIsWorkflowActive] = useState(true)

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds))
  }, [setEdges])

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
    setNodes((nds) => [...nds, newNode])
    setIsDrawerOpen(false)
  }

  return (
    <DashboardLayout>
      <div className="h-full w-full relative bg-background overflow-hidden">
        <DashboardHeader 
          workflowName="GitHub to Slack Alert"
          isActive={isWorkflowActive}
          onToggleActive={() => setIsWorkflowActive(!isWorkflowActive)}
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
