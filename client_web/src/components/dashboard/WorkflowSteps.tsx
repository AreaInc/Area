import { ArrowRight } from 'lucide-react';

interface WorkflowStepsProps {
    triggerNode: React.ReactNode;
    actionNode: React.ReactNode;
}

export function WorkflowSteps({ triggerNode, actionNode }: WorkflowStepsProps) {
    return (
        <div className="w-full py-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-12 items-start max-w-6xl mx-auto">

                {/* Trigger Side */}
                <div className="flex flex-col gap-6">
                    <h2 className="text-2xl align-center font-semibold tracking-tight">Trigger</h2>
                    <div className="relative h-full">
                        {triggerNode}
                    </div>
                </div>

                {/* Connector (Desktop) */}
                <div className="hidden h-full lg:flex items-center justify-center pt-20">
                    <div className="bg-muted p-2 rounded-full">
                        <ArrowRight className="text-muted-foreground" size={20} />
                    </div>
                </div>

                {/* Connector (Mobile) */}
                <div className="lg:hidden h-full flex justify-center">
                    <ArrowRight className="text-muted-foreground rotate-90" size={24} />
                </div>

                {/* Action Side */}
                <div className="flex flex-col gap-6">
                    <h2 className="text-2xl align-center font-semibold tracking-tight">Action</h2>
                    <div className="relative h-full">
                        {actionNode}
                    </div>
                </div>
            </div>
        </div>
    );
}