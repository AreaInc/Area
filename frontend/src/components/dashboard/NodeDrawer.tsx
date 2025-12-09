import { X, Zap, Box, Split } from 'lucide-react'
import clsx from 'clsx'

interface NodeDrawerProps {
  isOpen: boolean
  onClose: () => void
  onAddNode: (type: string, label: string) => void
}

const NODE_TYPES = [
  { type: 'input', label: 'Webhook', icon: <Zap size={16} />, color: 'bg-node-webhook', desc: 'Start flow on HTTP request' },
  { type: 'default', label: 'Action', icon: <Box size={16} />, color: 'bg-node-action', desc: 'Perform an operation' },
  { type: 'output', label: 'Response', icon: <Split size={16} />, color: 'bg-node-response', desc: 'Return data to webhook' },
]

export function NodeDrawer({ isOpen, onClose, onAddNode }: NodeDrawerProps) {
  return (
    <div
      className={clsx(
        "absolute top-4 bottom-4 right-4 w-80 bg-card/95 backdrop-blur border border-border/50 shadow-2xl rounded-2xl transition-transform duration-300 ease-in-out z-30",
        isOpen ? "translate-x-0" : "translate-x-[110%]"
      )}
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-lg">Add Node</h2>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-accent rounded-md transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="p-4 space-y-3">
        {NODE_TYPES.map((node) => (
          <button
            key={node.label}
            onClick={() => onAddNode(node.type, node.label)}
            className="w-full flex items-start gap-3 p-3 rounded-lg border border-border bg-background/50 hover:bg-accent hover:border-accent-foreground/20 transition-all text-left group"
          >
            <div className={clsx("p-2 rounded-md text-white", node.color)}>
              {node.icon}
            </div>
            <div>
              <div className="font-medium text-foreground group-hover:text-foreground">{node.label}</div>
              <div className="text-xs text-muted-foreground">{node.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
