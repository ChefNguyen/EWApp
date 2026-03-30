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

export const processWithdrawal = async (employeeId: string, amount: number) => {
  await delay(1000);
  const employee = MOCK_EMPLOYEES[employeeId];
  if (!employee) return { success: false, error: 'Nhân viên không tồn tại' };
  const limit = calculateLimit(employee);
  const fee = calculateFee(amount);
  const totalDeduction = amount + fee;
  if (totalDeduction > limit) {
    return { success: false, error: `Số tiền rút + phí (${totalDeduction.toLocaleString()}đ) vượt quá hạn mức (${limit.toLocaleString()}đ)` };
  }
  employee.advancedAmount += totalDeduction;
  const newTransaction = {
    id: `TXN${Date.now()}`, type: 'WITHDRAWAL', amount, fee, netAmount: amount,
    status: 'SUCCESS', createdAt: new Date().toISOString(), bankName: employee.linkedBank?.bankCode || 'N/A',
  };
  if (!MOCK_TRANSACTIONS[employeeId]) MOCK_TRANSACTIONS[employeeId] = [];
  MOCK_TRANSACTIONS[employeeId].unshift(newTransaction);
  return { success: true, data: { transaction: newTransaction, newLimit: calculateLimit(employee) } };
};

export const getTransactionHistory = async (employeeId: string) => {
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
  await delay(1000);
  const employee = MOCK_EMPLOYEES[employeeId];
  if (!employee) return { success: false, error: 'Nhân viên không tồn tại' };
  const limit = calculateLimit(employee);
  if (denomination > limit) {
    return { success: false, error: `Mệnh giá nạp (${denomination.toLocaleString()}đ) vượt quá hạn mức khả dụng (${limit.toLocaleString()}đ)` };
  }
  const carrierInfo = detectCarrier(phoneNumber);
  employee.advancedAmount += denomination;
  const newTransaction = {
    id: `TXN${Date.now()}`, type: 'TOPUP', amount: denomination, fee: 0, netAmount: denomination,
    status: 'SUCCESS', createdAt: new Date().toISOString(), phoneNumber,
    carrier: carrierInfo ? (carrierInfo.carrier as any).name : 'Không xác định',
  };
  if (!MOCK_TRANSACTIONS[employeeId]) MOCK_TRANSACTIONS[employeeId] = [];
  MOCK_TRANSACTIONS[employeeId].unshift(newTransaction);
  return { success: true, data: { transaction: newTransaction, newLimit: calculateLimit(employee) } };
};

export const lookupBill = async (serviceType: string, customerId: string) => {
  await delay(800);
  const prefix = serviceType === 'ELECTRIC' ? 'EVN' : 'WATER';
  const key = `${prefix}-${customerId}`;
  const bill = MOCK_BILLS[key];
  if (!bill) return { success: false, error: 'Không tìm thấy hóa đơn với mã khách hàng này' };
  if (bill.status === 'PAID') return { success: false, error: 'Hóa đơn này đã được thanh toán trước đó' };
  return { success: true, data: { billKey: key, ...bill } };
};

export const payBill = async (employeeId: string, billKey: string) => {
  await delay(1000);
  const employee = MOCK_EMPLOYEES[employeeId];
  if (!employee) return { success: false, error: 'Nhân viên không tồn tại' };
  const bill = MOCK_BILLS[billKey];
  if (!bill) return { success: false, error: 'Hóa đơn không tồn tại' };
  if (bill.status === 'PAID') return { success: false, error: 'Hóa đơn này đã được thanh toán' };
  const limit = calculateLimit(employee);
  if (bill.amount > limit) {
    return { success: false, error: `Số tiền hóa đơn (${bill.amount.toLocaleString()}đ) vượt quá hạn mức khả dụng (${limit.toLocaleString()}đ)` };
  }
  employee.advancedAmount += bill.amount;
  bill.status = 'PAID';
  const newTransaction = {
    id: `TXN${Date.now()}`, type: 'BILL_PAYMENT', amount: bill.amount, fee: 0, netAmount: bill.amount,
    status: 'SUCCESS', createdAt: new Date().toISOString(), serviceType: bill.serviceType,
    provider: bill.provider, customerId: billKey.split('-').slice(1).join('-'),
  };
  if (!MOCK_TRANSACTIONS[employeeId]) MOCK_TRANSACTIONS[employeeId] = [];
  MOCK_TRANSACTIONS[employeeId].unshift(newTransaction);
  return { success: true, data: { transaction: newTransaction, newLimit: calculateLimit(employee), bill: { ...bill } } };
};
