import type { Workflow } from '../types/workflow';
import { INITIAL_NODES } from './nodes';

export const MOCK_WORKFLOWS: Workflow[] = [
  { 
    id: '1', 
    name: 'GitHub to Slack Alert', 
    isActive: true, 
    lastRun: '2 mins ago',
    nodes: INITIAL_NODES,
    edges: []
  },
  { 
    id: '2', 
    name: 'New Lead Processing', 
    isActive: true, 
    lastRun: '1 hour ago',
    nodes: [
      { 
        id: '2-1', 
        position: { x: 100, y: 100 }, 
        data: { label: 'Typeform Trigger' },
        type: 'input',
        style: { background: 'var(--node-webhook)', color: 'white', border: '1px solid var(--border)', width: 180 }
      },
      { 
        id: '2-2', 
        position: { x: 400, y: 100 }, 
        data: { label: 'Send Email' },
        type: 'default',
        style: { background: 'var(--node-action)', color: 'white', border: '1px solid var(--border)', width: 180 }
      }
    ],
    edges: [
        { id: 'e2-1-2', source: '2-1', target: '2-2', animated: true }
    ]
  },
  { 
    id: '3', 
    name: 'Weekly Database Backup', 
    isActive: false, 
    lastRun: '5 days ago',
    nodes: [],
    edges: []
  },
  { 
    id: '4', 
    name: 'Email Auto-responder', 
    isActive: false, 
    lastRun: 'Just now',
    nodes: [],
    edges: []
  },
]
