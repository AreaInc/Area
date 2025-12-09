import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  BackgroundVariant,
  type Connection,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

interface WorkflowCanvasProps {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: (connection: Connection) => void
}

export function WorkflowCanvas({ nodes, edges, onNodesChange, onEdgesChange, onConnect }: WorkflowCanvasProps) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
      colorMode="dark"
    >
      <Background color="var(--border)" gap={16} variant={BackgroundVariant.Dots} />
      <Controls className="bg-card border-border fill-foreground" position="bottom-left" style={{ marginBottom: 80, marginLeft: 270 }} />
      <MiniMap className="bg-card border-border" nodeColor="var(--muted)" position="bottom-right" style={{ marginBottom: 100 }} />
    </ReactFlow>
  )
}
