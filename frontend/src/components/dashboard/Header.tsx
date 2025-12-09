import { Trash2, Save } from 'lucide-react'
import clsx from 'clsx'

interface DashboardHeaderProps {
  workflowName: string
  isActive: boolean
  onToggleActive: () => void
  onDelete: () => void
  onSave: () => void
}

export function DashboardHeader({ workflowName, isActive, onToggleActive, onDelete, onSave }: DashboardHeaderProps) {
  return (
    <div className="absolute top-4 left-72 right-4 h-16 bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl shadow-sm z-10 flex items-center justify-between px-6 transition-all duration-300">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{workflowName}</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
             <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
             Last saved just now
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={clsx("text-sm font-medium transition-colors", isActive ? "text-primary" : "text-muted-foreground")}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
        <button 
          onClick={onToggleActive}
          className={clsx(
            "relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50",
            isActive ? "bg-primary" : "bg-muted"
          )}
        >
          <div 
            className={clsx(
              "absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300",
              isActive ? "translate-x-6" : "translate-x-0"
            )} 
          />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={onSave}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
        >
          <Save size={20} />
        </button>
        <button 
          onClick={onDelete}
          className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  )
}
