import { ArrowRight, Zap, Play } from 'lucide-react';

interface WorkflowStepsProps {
    triggerNode: React.ReactNode;
    actionNode: React.ReactNode;
}

export function WorkflowSteps({ triggerNode, actionNode }: WorkflowStepsProps) {
    return (
        <div className="relative w-full rounded-xl border bg-muted/30 p-8 md:p-12 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-30 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 items-center max-w-5xl mx-auto">

                {/* Trigger Side */}
                <div className="flex flex-col gap-4 group">
                    <div className="flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-xs font-semibold pl-1">
                        <div className="bg-node-webhook/20 text-node-webhook rounded-full p-1">
                            <Zap size={12} />
                        </div>
                        Step 1: Trigger
                    </div>
                    <div className="relative">
                        {triggerNode}
                    </div>
                </div>

                {/* Connector (Desktop) */}
                <div className="hidden lg:flex flex-col items-center justify-center gap-2 text-muted-foreground opacity-50">
                    <div className="w-16 h-px bg-border relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
                            <ArrowRight size={16} />
                        </div>
                    </div>
                </div>

                {/* Connector (Mobile) */}
                <div className="lg:hidden flex justify-center py-4">
                    <ArrowRight className="text-muted-foreground rotate-90" />
                </div>

                {/* Action Side */}
                <div className="flex flex-col gap-4 group">
                    <div className="flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-xs font-semibold pl-1">
                        <div className="bg-node-action/20 text-node-action rounded-full p-1">
                            <Play size={12} />
                        </div>
                        Step 2: Action
                    </div>
                    <div className="relative">
                        {actionNode}
                    </div>
                </div>
            </div>
        </div>
    );
}
