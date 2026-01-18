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
    id: string;
    name: string;
    isActive: boolean;
    lastRun?: string;
    nodes?: WorkflowNode[];
    connections?: Record<string, string[]>;
    createdAt?: string;
    updatedAt?: string;
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

// Navigation types
export type RootStackParamList = {
    Home: undefined;
    WorkflowDetail: { id: string; title: string; status: string };
    CreateWorkflow: undefined;
    Profile: undefined;
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
}
