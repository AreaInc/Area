import { useState } from 'react'
import { Search, Loader2, Zap, Split, ChevronLeft, X, Box } from 'lucide-react'
import { useServices } from '@area/shared'
import type { Service, Action } from '@area/shared'
import clsx from 'clsx'

interface NodeDrawerProps {
  isOpen: boolean
  onClose: () => void
  onAddNode: (type: string, label: string, metadata?: Record<string, any>) => void
}

const GENERIC_NODES = [
  { type: 'input', label: 'Webhook', icon: <Zap size={16} />, color: 'bg-node-webhook', desc: 'Start flow on HTTP request' },
  { type: 'output', label: 'Response', icon: <Split size={16} />, color: 'bg-node-response', desc: 'Return data to webhook' },
]

export function NodeDrawer({ isOpen, onClose, onAddNode }: NodeDrawerProps) {
  const { services, isLoading } = useServices()
  const [search, setSearch] = useState('')
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleServiceClick = (service: Service) => {
    setSelectedService(service)
    setSearch('')
  }

  const handleBack = () => {
    setSelectedService(null)
    setSearch('')
  }

  const handleAddAction = (action: Action) => {
    onAddNode('default', action.name, {
      serviceId: selectedService?.id,
      actionId: action.id,
      description: action.description
    })
  }

  return (
    <div
      className={clsx(
        "absolute top-4 bottom-4 right-4 w-80 bg-card/95 backdrop-blur border border-border/50 shadow-2xl rounded-2xl transition-transform duration-300 ease-in-out z-30 flex flex-col overflow-hidden",
        isOpen ? "translate-x-0" : "translate-x-[110%]"
      )}
    >
      <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {selectedService && (
            <button onClick={handleBack} className="p-1 hover:bg-accent rounded-md transition-colors">
              <ChevronLeft size={20} />
            </button>
          )}
          <h2 className="font-semibold text-lg">
            {selectedService ? selectedService.name : 'Add Node'}
          </h2>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-accent rounded-md transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="p-4 space-y-3 overflow-y-auto flex-1">
        {!selectedService && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input 
                type="text"
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Core</div>
              {GENERIC_NODES.map((node) => (
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

            <div className="space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Services</div>
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin text-muted-foreground" />
                </div>
              ) : (
                filteredServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceClick(service)}
                    className="w-full flex items-start gap-3 p-3 rounded-lg border border-border bg-background/50 hover:bg-accent hover:border-accent-foreground/20 transition-all text-left group"
                  >
                    <div className="p-2 rounded-md bg-muted text-foreground shrink-0 flex items-center justify-center w-10 h-10">
                        {service.imageUrl ? (
                            <img src={service.imageUrl} alt={service.name} className="w-6 h-6 object-contain" />
                        ) : (
                            <Box size={16} />
                        )}
                    </div>
                    <div>
                      <div className="font-medium text-foreground group-hover:text-foreground">{service.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{service.description}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        )}

        {selectedService && (
           <div className="space-y-3">
             <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</div>
             {selectedService.actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleAddAction(action)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg border border-border bg-background/50 hover:bg-accent hover:border-accent-foreground/20 transition-all text-left group"
                >
                  <div className="p-2 rounded-md bg-node-action text-white">
                     <Box size={16} />
                  </div>
                  <div>
                    <div className="font-medium text-foreground group-hover:text-foreground">{action.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{action.description}</div>
                  </div>
                </button>
             ))}
             {selectedService.actions.length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                    No actions available for this service.
                </div>
             )}
           </div>
        )}
      </div>
    </div>
  )
}