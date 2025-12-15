import { useState, useEffect, useRef } from 'react'
import { Trash2, Save, Pencil, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { useWorkflows } from '../../hooks/useWorkflows'
import { Modal } from '../ui/Modal'
import { clearWorkflow } from '../../store/slices/flowSlice'

interface DashboardHeaderProps {
  onSave: () => void
}

export function DashboardHeader({ onSave }: DashboardHeaderProps) {
  const dispatch = useAppDispatch()
  const { activeWorkflowId } = useAppSelector((state) => state.flow)
  const { workflows, isLoading, updateWorkflow, activateWorkflow, deactivateWorkflow, deleteWorkflow } = useWorkflows()

  const activeWorkflow = workflows.find(w => String(w.id) === activeWorkflowId)

  const [isEditing, setIsEditing] = useState(false)
  const [tempName, setTempName] = useState(activeWorkflow?.name || 'Untitled Workflow')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTempName(activeWorkflow?.name || 'Untitled Workflow')
  }, [activeWorkflow?.name])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleBlur = () => {
    setIsEditing(false)
    if (activeWorkflow && tempName.trim() !== activeWorkflow.name) {
      updateWorkflow({ id: activeWorkflow.id, name: tempName })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    }
    if (e.key === 'Escape') {
      setIsEditing(false)
      setTempName(activeWorkflow?.name || 'Untitled Workflow')
    }
  }

  const handleToggleActive = () => {
    if (activeWorkflow) {
        if (activeWorkflow.isActive) {
            deactivateWorkflow(activeWorkflow.id)
        } else {
            activateWorkflow(activeWorkflow.id)
        }
    }
  }

  const handleDelete = () => {
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (activeWorkflow) {
        try {
            await deleteWorkflow(String(activeWorkflow.id))
            setIsDeleteModalOpen(false)
            if (workflows.length === 1 && workflows[0].id === activeWorkflow.id) {
              dispatch(clearWorkflow())
            }
        } catch (error) {
            console.error("Failed to delete workflow:", error)
        }
    }
  }

  if (isLoading) {
    return (
      <div className="absolute top-4 left-72 right-4 h-16 bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl shadow-sm z-10 flex items-center px-6 transition-all duration-300">
        <h1 className="text-lg font-semibold text-foreground">Loading Workflows...</h1>
      </div>
    )
  }

  if (!activeWorkflow) {
    return (
      <div className="absolute top-4 left-72 right-4 h-16 bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl shadow-sm z-10 flex items-center px-6 transition-all duration-300">
        <h1 className="text-lg font-semibold text-foreground">No Workflow Selected</h1>
      </div>
    )
  }

  return (
    <div className="absolute top-4 left-72 right-4 h-16 bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl shadow-sm z-10 flex items-center px-6 transition-all duration-300">
      <div className="flex items-center gap-4 flex-1 justify-start min-w-0">
        <div>
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="text-lg font-semibold text-foreground bg-transparent border-b border-primary focus:outline-none min-w-[200px]"
            />
          ) : (
            <h1
              className="text-lg font-semibold text-foreground truncate cursor-pointer hover:underline decoration-dashed decoration-muted-foreground/50 underline-offset-4 flex items-center gap-2 group"
              onClick={() => setIsEditing(true)}
              title="Click to rename"
            >
              {activeWorkflow.name}
              <Pencil size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" />
            </h1>
          )}

        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <button
          onClick={handleToggleActive}
          className={clsx(
            "relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50",
            activeWorkflow.isActive ? "bg-primary" : "bg-muted"
          )}
          title={activeWorkflow.isActive ? "Deactivate Workflow" : "Activate Workflow"}
        >
          <div
            className={clsx(
              "absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300",
              activeWorkflow.isActive ? "translate-x-6" : "translate-x-0"
            )}
          />
        </button>
      </div>

      <div className="flex items-center gap-2 flex-1 justify-end">
        <button
          onClick={onSave}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
        >
          <Save size={20} />
        </button>
        <button
          onClick={handleDelete}
          className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Workflow"
      >
        <div className="space-y-4">
            <div className="flex items-center gap-3 text-destructive p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <AlertTriangle size={24} />
                <p className="font-medium">This action cannot be undone.</p>
            </div>
            <p className="text-muted-foreground">
                Are you sure you want to delete this workflow? It will be permanently removed.
            </p>
            <div className="flex justify-end gap-3 mt-6">
                <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 hover:bg-muted rounded-lg transition-colors text-foreground"
                >
                    Cancel
                </button>
                <button
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg transition-colors"
                >
                    Delete Workflow
                </button>
            </div>
        </div>
      </Modal>
    </div>
  )
}
