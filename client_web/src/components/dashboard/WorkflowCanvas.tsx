import { Play } from 'lucide-react';

interface WorkflowCanvasProps {
  triggerNode: React.ReactNode;
  actionNode: React.ReactNode;
}

export function WorkflowCanvas({ triggerNode, actionNode }: WorkflowCanvasProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start relative">
        {/* Connector Line (Desktop) */}
        <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
            <div className="bg-border h-px w-8"></div>
            <div className="bg-border h-px w-8 -rotate-90"></div> 
            <div className="flex items-center justify-center bg-muted rounded-full p-2 border border-border">
                <Play className="h-4 w-4 text-muted-foreground" />
            </div>
        </div>

        {/* Trigger Side */}
        <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-muted-foreground uppercase tracking-wider text-center lg:text-left">Trigger</h3>
            {triggerNode}
        </div>

        {/* Action Side */}
        <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-muted-foreground uppercase tracking-wider text-center lg:text-right">Action</h3>
            {actionNode}
        </div>
    </div>
  );
}