import { X } from 'lucide-react'
import { useEffect, useRef } from 'react' // Import useRef
import { createPortal } from 'react-dom' // Import createPortal

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRoot = useRef<HTMLElement | null>(null); // Ref to store the portal root element

  useEffect(() => {
    // Create a div element for the modal portal if it doesn't exist
    if (!modalRoot.current) {
      const el = document.createElement('div');
      el.setAttribute('id', 'modal-root'); // Assign an ID for identification
      document.body.appendChild(el);
      modalRoot.current = el;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
      // Clean up the modal root element if this is the last modal using it
      // For simplicity, we're not removing the modalRoot.current element here.
      // In a more complex app, you might track active modals and remove the root when none are active.
    }
  }, [isOpen, onClose])

  if (!isOpen || !modalRoot.current) return null // Render nothing if not open or modalRoot not ready

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>,
    modalRoot.current // Render into the dedicated modal-root div
  )
}
