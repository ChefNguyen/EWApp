// Mock Data cho EWApp Mobile
// Dữ liệu giả lập nhân viên, ngân hàng, giao dịch, nhà mạng, và hóa đơn

export const MOCK_EMPLOYEES: Record<string, any> = {
  'NV001': {
    id: 'NV001',
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    grossSalary: 20000000,
    workingDays: 15,
    advancedAmount: 2020000,
    linkedBank: null,
  },
  'NV002': {
    id: 'NV002',
    name: 'Trần Thị B',
    phone: '0909876543',
    grossSalary: 15000000,
    workingDays: 20,
    advancedAmount: 0,
    linkedBank: {
      bankCode: 'VCB',
      accountNo: '1234567890',
      accountName: 'TRAN THI B',
    },
  },
  'NV003': {
    id: 'NV003',
    name: 'Lê Văn C',
    phone: '0912345678',
    grossSalary: 10000000,
    workingDays: 10,
    advancedAmount: 2272000,
    linkedBank: {
      bankCode: 'MB',
      accountNo: '5555666677',
      accountName: 'LE VAN C',
    },
  },
  'NV004': {
    id: 'NV004',
    name: 'Phạm Thị D',
    phone: '0987654321',
    grossSalary: 5000000,
    workingDays: 5,
    advancedAmount: 0,
    linkedBank: {
      bankCode: 'ACB',
      accountNo: '9999888877',
      accountName: 'PHAM THI D',
    },
  },
};

export interface Bank {
  code: string;
  name: string;
  logoUrl: string;
}

export const MOCK_BANKS: Bank[] = [
  { code: 'VCB', name: 'Vietcombank', logoUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzXFxBKhjlwr8yuJW-HrnVXHXj3B4zSf9mDngH94ngxYYicCdEA1WeqdD9zflO92wVGogE8M95hxV2Akz1mi6i0yMQgv2gQ2NgHu0B1Vwy9YLywiCJG7qAqCNoG0m9LhRwYHYu-HLZe9DYQBL1nOYzT8yBsMiVq7HBClxryU3NzIpfTlWi7NLWgqXEOwwNcM2sVZcvzU2jX6muPZnJj_uvuYIC4ZbYvGWZltiYLnkoLfhDDZ9R6Jh5c2a6inPMhzNm0nzFGZPxtf2S' },
  { code: 'TCB', name: 'Techcombank', logoUrl: 'https://media.vov.vn/sites/default/files/styles/large/public/2021-04/logo_techcombank.jpg' },
  { code: 'MB', name: 'MB Bank', logoUrl: 'https://www.mbbank.com.vn/2023/images/logo.png' },
  { code: 'ACB', name: 'ACB', logoUrl: 'https://acb.com.vn/static/media/logo.8d2d3e02.png' },
  { code: 'VPB', name: 'VPBank', logoUrl: 'https://www.vpbank.com.vn/-/media/vpbank-latest/logo/vpbank-logo-final.png' },
];

export const MOCK_BANK_ACCOUNTS: Record<string, string> = {
  'VCB-1234567890': 'TRAN THI B',
  'VCB-0987654321': 'NGUYEN VAN A',
  'TCB-1111222233': 'NGUYEN VAN A',
  'MB-5555666677': 'LE VAN C',
  'ACB-9999888877': 'PHAM THI D',
};

export const MOCK_CARRIERS: Record<string, any> = {
  VIETTEL: {
    name: 'Viettel',
    prefixes: ['032','033','034','035','036','037','038','039','086','096','097','098'],
    color: '#E6232A',
  },
  VINAPHONE: {
    name: 'Vinaphone',
    prefixes: ['081','082','083','084','085','088','091','094'],
    color: '#005BAA',
  },
  MOBIFONE: {
    name: 'Mobifone',
    prefixes: ['070','076','077','078','079','089','090','093'],
    color: '#1C75BC',
  },
};

export const TOPUP_DENOMINATIONS = [10000, 20000, 50000, 100000, 200000, 500000];

export const MOCK_BILLS: Record<string, any> = {
  'EVN-PE01234567': {
    customerName: 'Nguyễn Văn A',
    address: '123 Lê Lợi, Q.1, TP.HCM',
    amount: 350000,
    serviceType: 'ELECTRIC',
    provider: 'EVN HCM',
    period: '02/2026',
    status: 'UNPAID',
  },
  'EVN-PE09876543': {
    customerName: 'Trần Thị B',
    address: '456 Nguyễn Huệ, Q.3, TP.HCM',
    amount: 180000,
    serviceType: 'ELECTRIC',
    provider: 'EVN HCM',
    period: '02/2026',
    status: 'UNPAID',
  },
  'WATER-DN001234': {
    customerName: 'Nguyễn Văn A',
    address: '123 Lê Lợi, Q.1, TP.HCM',
    amount: 95000,
    serviceType: 'WATER',
    provider: 'Sawaco',
    period: '02/2026',
    status: 'UNPAID',
  },
  'WATER-DN005678': {
    customerName: 'Phạm Thị D',
    address: '789 CMT8, Q.10, TP.HCM',
    amount: 62000,
    serviceType: 'WATER',
    provider: 'Sawaco',
    period: '02/2026',
    status: 'UNPAID',
  },
  'EVN-PE00000001': {
    customerName: 'Lê Văn C',
    address: '100 Hai Bà Trưng, Q.1',
    amount: 0,
    serviceType: 'ELECTRIC',
    provider: 'EVN HCM',
    period: '02/2026',
    status: 'PAID',
  },
  'EVN-PE99999999': {
    customerName: 'Khách hàng Nợ Lớn',
    address: '999 Đường Vô Tận, Q.12',
    amount: 50000000,
    serviceType: 'ELECTRIC',
    provider: 'EVN HCM',
    period: '02/2026',
    status: 'UNPAID',
  },
};

export const MOCK_TRANSACTIONS: Record<string, any[]> = {
  'NV001': [
    {
      id: 'TXN001', type: 'WITHDRAWAL', amount: 1000000, fee: 10000, netAmount: 1000000,
      status: 'SUCCESS', createdAt: '2026-01-28T10:30:00', bankName: 'Vietcombank',
    },
    {
      id: 'TXN002', type: 'WITHDRAWAL', amount: 1000000, fee: 10000, netAmount: 1000000,
      status: 'SUCCESS', createdAt: '2026-01-25T14:15:00', bankName: 'Vietcombank',
    },
    {
      id: 'TXN003', type: 'TOPUP', amount: 50000, fee: 0, netAmount: 50000,
      status: 'SUCCESS', createdAt: '2026-02-01T09:00:00', phoneNumber: '0901234567', carrier: 'Mobifone',
    },
    {
      id: 'TXN004', type: 'BILL_PAYMENT', amount: 350000, fee: 0, netAmount: 350000,
      status: 'SUCCESS', createdAt: '2026-02-03T11:20:00', serviceType: 'ELECTRIC', provider: 'EVN HCM', customerId: 'PE01234567',
    },
  ],
  'NV002': [],
  'NV003': [
    {
      id: 'TXN_EDGE_001', type: 'WITHDRAWAL', amount: 2262000, fee: 10000, netAmount: 2262000,
      status: 'SUCCESS', createdAt: '2026-02-14T10:00:00', bankName: 'MB Bank',
    },
  ],
};

export const BUSINESS_CONSTANTS = {
  STANDARD_WORKING_DAYS: 22,
  ADVANCE_PERCENTAGE: 0.5,
  FEE_THRESHOLD: 1000000,
  FEE_LOW: 10000,
  FEE_HIGH: 20000,
  DEV_OTP: '123456',
};
