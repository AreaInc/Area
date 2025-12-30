import { Plus } from 'lucide-react'

interface FloatingActionButtonProps {
  onClick: () => void
}

export function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-8 right-8 w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg shadow-primary/40 flex items-center justify-center transition-transform hover:scale-105 z-20"
    >
      <Plus size={28} />
    </button>
  )
}
