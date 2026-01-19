// Shared TypeScript types for the mobile app

export interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Workflow {
    id: number;
    userId: string;
    name: string;
    description?: string | null;
    triggerProvider: string;
    triggerId: string;
    triggerConfig: Record<string, any>;
    actionProvider: string;
    actionId: string;
    actionConfig: Record<string, any>;
    actionCredentialsId?: number | null;
    isActive: boolean;
    lastRun?: Date | string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface WorkflowNode {
    id: string;
    type: string;
    data: {
        label?: string;
        description?: string;
        [key: string]: unknown;
    };
    position?: { x: number; y: number };
}


export interface WorkflowNodeUI {
    id: string;
    type: 'trigger' | 'action' | 'logic' | 'db';
    title: string;
    subtitle: string;
    status: 'success' | 'error' | 'waiting' | 'Idle';
    isStart?: boolean;
    isEnd?: boolean;
}

export interface ApiResponse<T> {
    data?: T;
    error?: ApiError;
    status?: number;
}

export interface ApiError {
    message: string;
    code?: string;
}

export interface WorkflowExecution {
    id: number;
    workflowId: number;
    status: 'completed' | 'failed' | 'running' | 'cancelled';
    startedAt: string;
    completedAt?: string;
    triggerData?: any;
    actionResults?: any;
    errorMessage?: string;
}

// Navigation types
export type RootStackParamList = {
    Home: undefined;
    WorkflowDetail: { id: number; title: string; status: string };
    CreateWorkflow: undefined;
    Profile: undefined;
    Services: undefined;
    Login: undefined;
    Register: undefined;
};

// Auth context types
export interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signIn: (email: string, password: string) => Promise<{ error?: ApiError; success?: boolean }>;
    signUp: (name: string, email: string, password: string) => Promise<{ error?: ApiError; success?: boolean }>;
    signOut: () => Promise<void>;
    checkSession: () => Promise<void>;
    updateProfile: (data: { name?: string; password?: string }) => Promise<{ error?: ApiError; success?: boolean }>;
}

// Workflow Metadata Types
export interface SchemaProperty {
    type: string;
    description?: string;
    default?: any;
    items?: {
        type: string;
    };
    example?: string;
}

export interface Schema {
    properties: Record<string, SchemaProperty>;
    required?: string[];
}

export interface TriggerMetadata {
    id: string;
    name: string;
    description: string;
    serviceProvider: string;
    configSchema?: Schema;
}

export interface ActionMetadata {
    id: string;
    name: string;
    description: string;
    serviceProvider: string;
    inputSchema?: Schema;
}
