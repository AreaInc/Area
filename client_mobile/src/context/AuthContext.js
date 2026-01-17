import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const checkSession = async () => {
        try {
            // Standard better-auth session endpoint
            const { data, error } = await api.get('/api/auth/get-session');

            if (data && (data.user || data.session)) {
                setUser(data.user);
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

    const signIn = async (email, password) => {
        setIsLoading(true);
        const result = await api.post('/api/auth/sign-in/email', { email, password });

        if (result.error) {
            setIsLoading(false);
            return { error: result.error };
        }

        await checkSession(); // Refresh session to get user data
        return { success: true };
    };

    const signUp = async (name, email, password) => {
        setIsLoading(true);
        // Better-auth usually expects 'name', 'email', 'password' for email registration
        const result = await api.post('/api/auth/sign-up/email', { name, email, password });

        if (result.error) {
            setIsLoading(false);
            return { error: result.error };
        }

        await checkSession();
        return { success: true };
    };

    const signOut = async () => {
        setIsLoading(true);
        await api.post('/api/auth/sign-out');
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

export const useAuth = () => useContext(AuthContext);
