import { type Node } from '@xyflow/react'

export const INITIAL_NODES: Node[] = [
  { 
    id: '1', 
    position: { x: 350, y: 200 }, 
    data: { label: 'Webhook Trigger' },
    type: 'input',
    style: { background: 'var(--node-webhook)', color: 'white', border: '1px solid var(--border)', width: 180 }
  },
]
