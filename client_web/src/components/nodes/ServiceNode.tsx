import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import type { ReactNode } from 'react';

export type ServiceNodeData = {
    label?: string;
    icon?: ReactNode;
    imageUrl?: string;
};

type ServiceNodeType = Node<ServiceNodeData>;

export function ServiceNode({ data }: NodeProps<ServiceNodeType>) {
    return (
        <div className="relative w-16 h-16 rounded-lg bg-card border border-border flex items-center justify-center shadow-md">
            {/* Left Handle */}
            <Handle 
                type="target" 
                position={Position.Left} 
                className="!w-3 !h-3 !-left-1.5 !bg-blue-500 !border-2 !border-background" 
            />

            {/* Node Content (Image/Icon) */}
            <div className="w-10 h-10 flex items-center justify-center">
                {data.imageUrl ? (
                    <img src={data.imageUrl} alt={data.label || 'Node'} className="w-full h-full object-contain" />
                ) : (
                    data.icon || <div className="text-xs font-bold text-foreground">{data.label?.substring(0,2)}</div>
                )}
            </div>

            {/* Right Handle */}
            <Handle 
                type="source" 
                position={Position.Right} 
                className="!w-3 !h-3 !-right-1.5 !bg-blue-500 !border-2 !border-background" 
            />
        </div>
    );
}
