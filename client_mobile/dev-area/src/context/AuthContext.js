import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Ensure WebBrowser can handle redirects properly
WebBrowser.maybeCompleteAuthSession();

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

    const signInWithGoogle = async () => {
        setIsLoading(true);
        try {
            const callbackURL = Linking.createURL('/auth/callback');

            // 1. Get the Google Auth URL from Backend
            const { data, error } = await api.post('/api/auth/sign-in/social', {
                provider: 'google',
                callbackURL
            });

            if (error || !data?.url) {
                setIsLoading(false);
                return { error: error || { message: 'Failed to initiate Google login' } };
            }

            // 2. Open the browser for auth
            const result = await WebBrowser.openAuthSessionAsync(data.url, callbackURL);

            if (result.type === 'success') {
                // Auth successful on backend (cookie set), refresh session
                await checkSession();
                return { success: true };
            } else {
                setIsLoading(false);
                return { error: { message: 'Login cancelled or failed' } };
            }
        } catch (e) {
            console.error('Google Sign-In Error:', e);
            setIsLoading(false);
            return { error: { message: 'An unexpected error occurred during Google Sign-In' } };
        }
    };

    const updateProfile = async (updates) => {
        setIsLoading(true);
        try {
            const { data, error } = await api.post('/api/auth/update-user', updates);

            if (error) {
                setIsLoading(false);
                return { error };
            }

            // Update local user state
            setUser((prev) => ({ ...prev, ...updates }));

            // Optionally refresh full session to be sure
            // await checkSession(); 

            setIsLoading(false);
            return { success: true };
        } catch (e) {
            console.error('Update Profile Error:', e);
            setIsLoading(false);
            return { error: { message: 'Failed to update profile' } };
        }
    };

    const signOut = async () => {
        setIsLoading(true);
        await api.post('/api/auth/sign-out');
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, isAuthenticated, signIn, signUp, signInWithGoogle, signOut, checkSession, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
