import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import type { User, AuthContextType, ApiError } from '../types';
import { getApiBase } from '@area/shared';

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
            const response = await fetch(`${getApiBase()}/auth/get-session`, {
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (response.ok) {
                const data: SessionResponse = await response.json();
                if (data && (data.user || data.session)) {
                    setUser(data.user || null);
                    setIsAuthenticated(true);
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                }
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
        try {
            const response = await fetch(`${getApiBase()}/auth/sign-in/email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });

            if (!response.ok) {
                let errorDetails: ApiError = { message: 'Sign in failed' };
                try {
                    const errorData = await response.json();
                    errorDetails.message = errorData.message || response.statusText;
                } catch (e) { }

                setIsLoading(false);
                return { error: errorDetails };
            }

            await checkSession();
            return { success: true };
        } catch (e: any) {
            setIsLoading(false);
            return { error: { message: e.message || 'Network error' } };
        }
    };

    const signUp = async (name: string, email: string, password: string): Promise<{ error?: ApiError; success?: boolean }> => {
        setIsLoading(true);
        try {
            const response = await fetch(`${getApiBase()}/auth/sign-up/email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
                credentials: 'include'
            });

            if (!response.ok) {
                let errorDetails: ApiError = { message: 'Sign up failed' };
                try {
                    const errorData = await response.json();
                    errorDetails.message = errorData.message || response.statusText;
                } catch (e) { }

                setIsLoading(false);
                return { error: errorDetails };
            }

            await checkSession();
            return { success: true };
        } catch (e: any) {
            setIsLoading(false);
            return { error: { message: e.message || 'Network error' } };
        }
    };

    const signOut = async (): Promise<void> => {
        setIsLoading(true);
        try {
            await fetch(`${getApiBase()}/auth/sign-out`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
        } catch (e) {
            console.error('Sign out error', e);
        }
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, isAuthenticated, signIn, signUp, signOut, checkSession }}>
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
