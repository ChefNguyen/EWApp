// Mock API Services cho EWApp Mobile
// Logic giống hệt web app, không cần thay đổi

import {
  MOCK_EMPLOYEES,
  MOCK_BANK_ACCOUNTS,
  MOCK_TRANSACTIONS,
  MOCK_CARRIERS,
  MOCK_BILLS,
  BUSINESS_CONSTANTS,
} from '../data/mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getEmployee = (employeeId: string) => {
  return MOCK_EMPLOYEES[employeeId] || null;
};

export const validateEmployee = async (employeeCode: string) => {
  await delay(500);
  const employee = MOCK_EMPLOYEES[employeeCode.toUpperCase()];
  if (employee) return { success: true, data: employee };
  return { success: false, error: 'Mã nhân viên không tồn tại' };
};

export const verifyOtp = async (otp: string) => {
  await delay(300);
  if (otp === BUSINESS_CONSTANTS.DEV_OTP) return { success: true };
  return { success: false, error: 'Mã OTP không đúng' };
};

export const calculateLimit = (employee: any): number => {
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

import { Platform } from 'react-native';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8080/api' : 'http://localhost:8080/api';

export const processWithdrawal = async (employeeId: string, amount: number) => {
  try {
    const response = await fetch(`${BASE_URL}/withdrawals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeCode: employeeId,
        amountVnd: amount,
        bankAccountId: "11111111-1111-1111-1111-111111111111" // Seeded account
      })
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
      bankName: 'VCB'
    };
    return { success: true, data: { transaction: newTransaction, newLimit: result.newLimitVnd || 0 } };
  } catch (error: any) {
    return { success: false, error: 'Không thể kết nối đến máy chủ' };
  }
};

export const getTransactionHistory = async (employeeId: string) => {
  try {
    const response = await fetch(`${BASE_URL}/withdrawals/history/${employeeId}`);
    if (response.ok) {
      const result = await response.json();
      return { success: true, data: result };
    }
  } catch (e) {
    // Fallback to mock
  }
  await delay(300);
  const transactions = MOCK_TRANSACTIONS[employeeId] || [];
  return { success: true, data: transactions };
};

export const linkBankAccount = async (employeeId: string, bankInfo: any) => {
  await delay(500);
  const employee = MOCK_EMPLOYEES[employeeId];
  if (!employee) return { success: false, error: 'Nhân viên không tồn tại' };
  const employeeNameNormalized = employee.name.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const accountNameNormalized = bankInfo.accountName.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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

export const processTopup = async (employeeId: string, phoneNumber: string, denomination: number) => {
  try {
    const response = await fetch(`${BASE_URL}/topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeCode: employeeId, phoneNumber, denomination })
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
  } catch (error: any) {
    return { success: false, error: 'Không thể kết nối đến máy chủ' };
  }
};

export const lookupBill = async (serviceType: string, customerId: string) => {
  try {
    const response = await fetch(`${BASE_URL}/bills/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceType, customerId })
    });
    const result = await response.json();
    if (!response.ok || result.error) {
      return { success: false, error: result.error || 'Không tìm thấy hóa đơn' };
    }
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: 'Không thể kết nối đến máy chủ' };
  }
};

export const payBill = async (employeeId: string, billKey: string) => {
  try {
    const response = await fetch(`${BASE_URL}/bills/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeCode: employeeId, billKey })
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Thanh toán lỗi' };
    }
    const newTransaction = {
      id: result.transactionId, type: 'BILL_PAYMENT', amount: 0, fee: 0, netAmount: 0,
      status: 'SUCCESS', createdAt: new Date().toISOString(), serviceType: 'BILLS', provider: 'Payoo', customerId: billKey
    };
    return { success: true, data: { transaction: newTransaction, newLimit: result.newLimit || 0, bill: { status: 'PAID' } } };
  } catch (error: any) {
    return { success: false, error: 'Không thể kết nối đến máy chủ' };
  }
};
