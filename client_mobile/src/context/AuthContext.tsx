import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { api } from '../services/api';
import type { User, AuthContextType, ApiError } from '../types';

interface SessionResponse {
    user?: User;
    session?: unknown;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    const checkSession = async (): Promise<void> => {
        try {
            // Standard better-auth session endpoint
            const { data, error } = await api.get<SessionResponse>('/api/auth/get-session');

            if (data && (data.user || data.session)) {
                setUser(data.user || null);
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (e) {
            console.log('Session check failed', e);
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkSession();
    }, []);

    const signIn = async (email: string, password: string): Promise<{ error?: ApiError; success?: boolean }> => {
        setIsLoading(true);
        const result = await api.post<{ user?: User }>('/api/auth/sign-in/email', { email, password });

        if (result.error) {
            setIsLoading(false);
            return { error: result.error };
        }

        await checkSession(); // Refresh session to get user data
        return { success: true };
    };

    const signUp = async (name: string, email: string, password: string): Promise<{ error?: ApiError; success?: boolean }> => {
        setIsLoading(true);
        const result = await api.post<{ user?: User }>('/api/auth/sign-up/email', { name, email, password });

        if (result.error) {
            setIsLoading(false);
            return { error: result.error };
        }

        await checkSession();
        return { success: true };
    };

    const signOut = async (): Promise<void> => {
        setIsLoading(true);
        await api.post('/api/auth/sign-out');
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
    };

    const updateProfile = async (data: { name?: string; password?: string }): Promise<{ error?: ApiError; success?: boolean }> => {
        setIsLoading(true);
        const result = await api.post<{ user?: User }>('/api/auth/update-user', data);

        if (result.error) {
            setIsLoading(false);
            return { error: result.error };
        }

        await checkSession();
        return { success: true };
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, isAuthenticated, signIn, signUp, signOut, checkSession, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
