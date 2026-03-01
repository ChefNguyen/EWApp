// AuthContext - Quản lý trạng thái đăng nhập
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Load session từ AsyncStorage khi app khởi động
    useEffect(() => {
        loadSession();
    }, []);

    const loadSession = async () => {
        try {
            // Không load lại session nếu đang trong quá trình logout
            if (isLoggingOut) {
                setIsLoading(false);
                return;
            }
            const savedUser = await AsyncStorage.getItem('currentUser');
            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }
        } catch (error) {
            console.error('Load session error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (userData) => {
        try {
            setIsLoggingOut(false); // Reset logout flag when logging in
            await AsyncStorage.setItem('currentUser', JSON.stringify(userData));
            setUser(userData);
        } catch (error) {
            console.error('Save session error:', error);
        }
    };

    const logout = async () => {
        try {
            setIsLoggingOut(true); // Set flag trước khi clear
            setUser(null); // Clear user state ngay lập tức
            await AsyncStorage.removeItem('currentUser');
        } catch (error) {
            console.error('Clear session error:', error);
            setIsLoggingOut(false);
        }
    };

    const updateUser = async (updates) => {
        if (isLoggingOut) return; // Không update nếu đang logout
        const updatedUser = { ...user, ...updates };
        await login(updatedUser);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, isLoggingOut, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
