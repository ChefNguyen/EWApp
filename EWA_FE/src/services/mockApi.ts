// Mock API Services cho EWApp Mobile
// Auth = real backend calls. Other functions = real API where available.

import { Platform } from 'react-native';
import { Employee } from '../types';
import {
  MOCK_EMPLOYEES,
  MOCK_BANK_ACCOUNTS,
  MOCK_TRANSACTIONS,
  MOCK_CARRIERS,
  MOCK_BILLS,
  BUSINESS_CONSTANTS,
} from '../data/mockData';

const DEV_IP = '172.20.10.2';

export const BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:8080/api'
  : `http://${DEV_IP}:8080/api`;

// Auth — real backend
export const validateEmployee = async (employeeCode: string, password?: string) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeCode, ...(password ? { password } : {}) }),
    });
    const result = await response.json();
    console.log('[Network] API Result Keys:', Object.keys(result || {}));
    if (response.ok) {
      console.log('[Network] Login success, token present:', !!result.token);
      console.log('[Network] Employee present:', !!result.employee);
      return { success: true, data: result };
    }
    return { success: false, error: result.message || 'Mã nhân viên không tồn tại' };
  } catch {
    return { success: false, error: 'Không thể kết nối đến máy chủ' };
  }
};

export const verifyOtp = async (employeeCode: string, otp: string) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeCode, otp }),
    });
    const result = await response.json();
    if (response.ok) return { success: true, data: result };
    return { success: false, error: result.message || 'Mã OTP không đúng' };
  } catch {
    return { success: false, error: 'Không thể kết nối đến máy chủ' };
  }
};
// hàm callback resolve
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getEmployee = (_employeeId: string) => null;

// Limit & fee calculation — local fallback when API unavailable
export const calculateLimit = (employee: Employee): number => {
  const { grossSalary, workingDays } = employee;
  const { STANDARD_WORKING_DAYS, ADVANCE_PERCENTAGE } = BUSINESS_CONSTANTS;
  const transactions = MOCK_TRANSACTIONS[employee.id] || [];
  const totalUsed = transactions.reduce((sum: number, txn: any) => {
    if (txn.status === 'SUCCESS' || txn.status === 'PENDING') {
      return sum + txn.amount + (txn.fee || 0);
    }
    return sum;
  }, 0);
  const dailyRate = grossSalary / STANDARD_WORKING_DAYS;
  const earnedAmount = dailyRate * workingDays * ADVANCE_PERCENTAGE;
  const actualUsed = Math.max(totalUsed, employee.advancedAmount || 0);
  const availableLimit = earnedAmount - actualUsed;
  return Math.floor(availableLimit / 1000) * 1000;
};

export const calculateFee = (amount: number): number => {
  const { FEE_THRESHOLD, FEE_LOW, FEE_HIGH } = BUSINESS_CONSTANTS;
  return amount < FEE_THRESHOLD ? FEE_LOW : FEE_HIGH;
};

export const lookupBankAccount = async (bankCode: string, accountNo: string) => {
  await delay(800);
  const key = `${bankCode}-${accountNo}`;
  const accountName = MOCK_BANK_ACCOUNTS[key];
  if (accountName) return { success: true, accountName };
  return { success: false, error: 'Không tìm thấy tài khoản' };
};

// Withdrawals — real API with dynamic bankAccountId
export const processWithdrawal = async (employee: Employee, amount: number) => {
  const bankAccountId = employee.linkedBankId;
  if (!bankAccountId) {
    return { success: false, error: 'Chưa liên kết tài khoản ngân hàng' };
  }
  try {
    const response = await fetch(`${BASE_URL}/withdrawals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${employee.token}`,
      },
      body: JSON.stringify({
        employeeCode: employee.id,
        amountVnd: amount,
        bankAccountId,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.message || 'Lỗi hệ thống' };
    }
    const newTransaction = {
      id: result.transactionId || `TXN${Date.now()}`,
      type: 'WITHDRAWAL',
      amount: result.amountVnd || amount,
      fee: result.feeVnd || 0,
      netAmount: result.netAmountVnd || amount,
      status: result.status,
      createdAt: new Date().toISOString(),
      bankName: employee.linkedBank?.bankCode || 'Bank',
    };
    return { success: true, data: { transaction: newTransaction, newLimit: result.newLimitVnd || 0 } };
  } catch {
    return { success: false, error: 'Không thể kết nối đến máy chủ' };
  }
};

// Fetch available limit from backend
export const getAvailableLimit = async (employee: Employee): Promise<number> => {
  try {
    const response = await fetch(`${BASE_URL}/limit`, {
      headers: { 'Authorization': `Bearer ${employee.token}` },
    });
    if (response.ok) {
      const result = await response.json();
      return result.limitVnd ?? 0;
    }
  } catch {
    // Fallback to local calculation
  }
  return calculateLimit(employee);
};

export const getTransactionHistory = async (employee: Employee) => {
  console.log('[Network] Fetching transaction history from /api/transactions');
  try {
    const response = await fetch(`${BASE_URL}/transactions`, {
      headers: { 'Authorization': `Bearer ${employee.token}` },
    });
    if (response.ok) {
      const result = await response.json();
      return {
        success: true,
        data: result.map((tx: any) => {
          let type: 'WITHDRAWAL' | 'TOPUP' | 'BILL_PAYMENT' = 'WITHDRAWAL';
          if (tx.type === 'TOPUP_DEBIT') type = 'TOPUP';
          if (tx.type === 'BILL_DEBIT') type = 'BILL_PAYMENT';
          
          return {
            id: tx.id,
            type,
            amount: tx.amount,
            fee: 0, // Fee is handled as a separate ledger entry in the monolith
            netAmount: tx.amount,
            status: tx.status === 'SUCCESS' ? 'SUCCESS' : 'PENDING',
            createdAt: tx.occurredAt,
            bankName: tx.description,
          };
        }),
      };
    }
  } catch {
    // Fallback to mock
  }
  await delay(300);
  const transactions = MOCK_TRANSACTIONS[employee.id] || [];
  return { success: true, data: transactions };
};

export const linkBankAccount = async (employeeId: string, bankInfo: any) => {
  await delay(500);
  const employee = MOCK_EMPLOYEES[employeeId];
  if (!employee) return { success: false, error: 'Nhân viên không tồn tại' };
  const employeeNameNormalized = employee.name.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const accountNameNormalized = bankInfo.accountName.toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const employeeFirstName = employeeNameNormalized.split(' ').pop();
  const accountNameWords = accountNameNormalized.split(' ');
  if (!accountNameWords.includes(employeeFirstName)) {
    return { success: false, error: 'Tên chủ tài khoản không khớp với tên nhân viên' };
  }
  employee.linkedBank = bankInfo;
  return { success: true };
};

export const detectCarrier = (phoneNumber: string) => {
  const cleaned = phoneNumber.replace(/[\s\-\.]/g, '');
  let prefix = cleaned;
  if (prefix.startsWith('+84')) prefix = '0' + prefix.slice(3);
  else if (prefix.startsWith('84') && prefix.length > 10) prefix = '0' + prefix.slice(2);
  prefix = prefix.substring(0, 3);
  for (const [key, carrier] of Object.entries(MOCK_CARRIERS)) {
    if ((carrier as any).prefixes.includes(prefix)) return { carrierKey: key, carrier };
  }
  return null;
};

export const processTopup = async (employee: Employee, phoneNumber: string, denomination: number) => {
  try {
    const response = await fetch(`${BASE_URL}/topup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${employee.token}`,
      },
      body: JSON.stringify({ employeeCode: employee.id, phoneNumber, denomination }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      return { success: false, error: result.error || result.message || 'Nạp tiền thất bại' };
    }
    const carrierInfo = detectCarrier(phoneNumber);
    const newTransaction = {
      id: result.transactionId,
      type: 'TOPUP', amount: denomination, fee: 0, netAmount: denomination,
      status: 'SUCCESS', createdAt: new Date().toISOString(), phoneNumber,
      carrier: carrierInfo ? (carrierInfo.carrier as any).name : 'Payoo',
    };
    return { success: true, data: { transaction: newTransaction, newLimit: result.newLimit || 0 } };
  } catch {
    return { success: false, error: 'Không thể kết nối đến máy chủ' };
  }
};

export const lookupBill = async (serviceType: string, customerId: string) => {
  try {
    const response = await fetch(`${BASE_URL}/bills/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceType, customerId }),
    });
    const result = await response.json();
    if (!response.ok || result.error) {
      return { success: false, error: result.error || 'Không tìm thấy hóa đơn' };
    }
    return { success: true, data: result };
  } catch {
    return { success: false, error: 'Không thể kết nối đến máy chủ' };
  }
};

export const payBill = async (employee: Employee, billKey: string) => {
  try {
    const response = await fetch(`${BASE_URL}/bills/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${employee.token}`,
      },
      body: JSON.stringify({ employeeCode: employee.id, billKey }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Thanh toán lỗi' };
    }
    const newTransaction = {
      id: result.transactionId, type: 'BILL_PAYMENT', amount: 0, fee: 0, netAmount: 0,
      status: 'SUCCESS', createdAt: new Date().toISOString(), serviceType: 'BILLS', provider: 'Payoo', customerId: billKey,
    };
    return { success: true, data: { transaction: newTransaction, newLimit: result.newLimit || 0, billFeeVnd: result.feeVnd || 0, bill: { status: 'PAID' } } };
  } catch {
    return { success: false, error: 'Không thể kết nối đến máy chủ' };
  }
};

export const sendChatMessage = async (employeeId: string, message: string) => {
  try {
    const response = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeCode: employeeId, message })
    });
    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.message || result.error || 'Trợ lý AI đang bận' };
    }
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: 'Không thể kết nối đến Chatbot AI' };
  }
};
