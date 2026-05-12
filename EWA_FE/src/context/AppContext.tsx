import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Employee } from '../types';

const STORAGE_KEY = 'ewa_session';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

interface AppContextType {
  employee: Employee | null;
  isLoggedIn: boolean;
  token: string | null;
  login: (token: string, employee: Employee) => void;
  logout: () => Promise<void>;
  refreshEmployee: () => void;
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  clearChat: () => void;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: 'Xin chào! Tôi có thể hỗ trợ gì cho bạn?',
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);

  // Restore session from AsyncStorage on app start
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          try {
            const { token: storedToken, employee: storedEmployee } = JSON.parse(stored);
            setToken(storedToken);
            setEmployee(storedEmployee);
          } catch (e) {
            AsyncStorage.removeItem(STORAGE_KEY);
          }
        }
      })
      .catch((err) => {
        console.warn('AsyncStorage init error:', err);
      })
      .finally(() => {
        setReady(true);
      });
  }, []);

  const login = useCallback((newToken: string, emp: Employee) => {
    console.log('[Context] login called with token:', newToken.substring(0, 10) + '...');
    try {
      setToken(newToken);
      setEmployee(emp);
      console.log('[Context] State updated, isLoggedIn should be true');
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ token: newToken, employee: emp })).catch(e => {
        console.warn('AsyncStorage error:', e);
      });
    } catch (err) {
      console.error('Login state update error:', err);
    }
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setEmployee(null);
    setChatMessages([WELCOME_MESSAGE]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const refreshEmployee = useCallback(() => {
    if (employee) {
      setEmployee((prev) => prev ? { ...prev } : null);
    }
  }, [employee]);

  const clearChat = useCallback(() => {
    setChatMessages([WELCOME_MESSAGE]);
  }, []);

  return (
    <AppContext.Provider value={{ 
      employee, 
      isLoggedIn: ready && !!employee, 
      token, 
      login, 
      logout, 
      refreshEmployee, 
      chatMessages, 
      setChatMessages, 
      clearChat 
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
