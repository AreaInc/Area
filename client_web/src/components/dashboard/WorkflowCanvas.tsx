import { 
  ReactFlow, 
  Background, 
  Controls, 
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
      <Controls 
        position="top-right" 
        style={{ marginTop: 100 }}
        showZoom={true}
        showFitView={true}
        showInteractive={true}
      />
    </ReactFlow>
  )
}
