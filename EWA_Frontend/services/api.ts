import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as mockApi from './mockApi';

// For Android emulator, use 10.0.2.2 instead of localhost
// For iOS simulator, localhost works
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8080/api' : 'http://localhost:8080/api';

export interface Employee {
    id: string;
    name: string;
    phone: string;
    grossSalary: number;
    workingDays: number;
    advancedAmount: number;
    linkedBank: {
        bankCode: string;
        accountNo: string;
        accountName: string;
    } | null;
}

export interface AuthResponse {
    token: string;
    employee: Employee;
}

export const validateEmployee = async (employeeCode: string): Promise<{ success: boolean; data?: Employee; error?: string }> => {
    try {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeCode }),
        });
        if (!response.ok) {
            const errData = await response.json();
            return { success: false, error: errData.message || 'Mã nhân viên không tồn tại' };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (e: any) {
        console.error('API Error:', e);
        return { success: false, error: 'Lỗi mạng, vui lòng thử lại sau.' };
    }
};

export const verifyOtp = async (employeeCode: string, otp: string): Promise<{ success: boolean; data?: AuthResponse; error?: string }> => {
    try {
        const response = await fetch(`${BASE_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeCode, otp }),
        });

        if (!response.ok) {
            const errData = await response.json();
            return { success: false, error: errData.message || 'OTP không hợp lệ' };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (e: any) {
        return { success: false, error: 'Lỗi mạng, vui lòng thử lại sau.' };
    }
};

export const getAuthToken = async (): Promise<string | null> => {
    return AsyncStorage.getItem('jwtToken');
};

export const setAuthToken = async (token: string): Promise<void> => {
    await AsyncStorage.setItem('jwtToken', token);
};

export const clearAuthToken = async (): Promise<void> => {
    await AsyncStorage.removeItem('jwtToken');
};

// Delegate sang mockApi để có đầy đủ logic nghiệp vụ (KYC, trừ hạn mức, lịch sử)
export const getTransactionHistory = async (employeeId: string): Promise<{ success: boolean; data: any[] }> => {
    return mockApi.getTransactionHistory(employeeId);
};

export const linkBankAccount = async (employeeId: string, bankInfo: any): Promise<{ success: boolean; error?: string }> => {
    return mockApi.linkBankAccount(employeeId, bankInfo);
};

export const lookupBankAccount = async (bankCode: string, accountNo: string): Promise<{ success: boolean; accountName?: string; error?: string }> => {
    return mockApi.lookupBankAccount(bankCode, accountNo);
};

export const processWithdrawal = async (employeeId: string, amount: number): Promise<{ success: boolean; data?: any; error?: string }> => {
    return mockApi.processWithdrawal(employeeId, amount);
};

export const calculateLimit = (employee: Employee): number => {
    const STANDARD_WORKING_DAYS = 22;
    const ADVANCE_PERCENTAGE = 0.5;
    const dailyRate = employee.grossSalary / STANDARD_WORKING_DAYS;
    const earnedAmount = dailyRate * employee.workingDays * ADVANCE_PERCENTAGE;
    const availableLimit = earnedAmount - employee.advancedAmount;
    return Math.floor(availableLimit / 1000) * 1000;
};

export const calculateFee = (amount: number): number => {
    const FEE_THRESHOLD = 1000000;
    const FEE_LOW = 10000;
    const FEE_HIGH = 20000;
    return amount < FEE_THRESHOLD ? FEE_LOW : FEE_HIGH;
};
