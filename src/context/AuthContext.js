import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    removeFromLocalStorage,
    setToLocalStorage,
    getFromLocalStorage,
} from '../lib/utils/storage-utils';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Initialize state from localStorage immediately
    const getInitialState = () => {
        try {
            const storedAuth = getFromLocalStorage('auth-storage');
            if (storedAuth) {
                const parsed = JSON.parse(storedAuth);
                if (parsed.state) {
                    return {
                        user: parsed.state.user,
                        tokens: parsed.state.tokens,
                        isAuthenticated: parsed.state.isAuthenticated,
                    };
                }
            }
        } catch (error) {
            console.error('Error loading auth state:', error);
        }
        return {
            user: null,
            tokens: null,
            isAuthenticated: false,
        };
    };

    const initialState = getInitialState();
    const [user, setUser] = useState(initialState.user);
    const [tokens, setTokens] = useState(initialState.tokens);
    const [isAuthenticated, setIsAuthenticated] = useState(initialState.isAuthenticated);
    const [isInitialized, setIsInitialized] = useState(false);

    // Mark as initialized after first render
    useEffect(() => {
        setIsInitialized(true);
    }, []);

    // Save auth state to localStorage whenever it changes (but not on initial mount)
    useEffect(() => {
        if (!isInitialized) return; // Skip saving on initial mount

        const authState = {
            state: {
                user,
                tokens,
                isAuthenticated,
            },
        };
        setToLocalStorage('auth-storage', JSON.stringify(authState));
    }, [user, tokens, isAuthenticated, isInitialized]);

    const login = (userData, userTokens) => {
        setUser(userData);
        setTokens(userTokens);
        setIsAuthenticated(true);
        setToLocalStorage('accessToken', userTokens.accessToken);
        setToLocalStorage('refreshToken', userTokens.refreshToken);
    };

    const logout = () => {
        removeFromLocalStorage('accessToken');
        removeFromLocalStorage('refreshToken');
        removeFromLocalStorage('auth-storage'); // Clear the auth state storage
        setUser(null);
        setTokens(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ user, tokens, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthStore = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthStore must be used within AuthProvider');
    }
    return context;
};
