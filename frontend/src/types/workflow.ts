import { type Node, type Edge } from '@xyflow/react';

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    nodes: Node[];
    edges: Edge[];
    connections?: Record<string, any>;
    lastRun?: string;
    createdAt?: string;
    updatedAt?: string;
}

export type WorkflowSummary = Pick<Workflow, 'id' | 'name' | 'isActive' | 'lastRun' | 'description'>;
