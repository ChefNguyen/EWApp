export type Screen = 'login' | 'dashboard' | 'withdraw' | 'topup' | 'history' | 'bill' | 'link-bank' | 'offers' | 'profile';

export interface BankInfo {
  bankCode: string;
  accountNo: string;
  accountName: string;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  grossSalary: number;
  workingDays: number;
  advancedAmount: number;
  linkedBank: BankInfo | null;
}

export interface Transaction {
  id: string;
  type: 'WITHDRAWAL' | 'TOPUP' | 'BILL_PAYMENT';
  amount: number;
  fee: number;
  netAmount: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  createdAt: string;
  bankName?: string;
  phoneNumber?: string;
  carrier?: string;
  serviceType?: string;
  provider?: string;
  customerId?: string;
}

export interface BillData {
  billKey: string;
  customerName: string;
  address: string;
  amount: number;
  serviceType: 'ELECTRIC' | 'WATER';
  provider: string;
  period: string;
  status: 'PAID' | 'UNPAID';
}

export interface CarrierInfo {
  carrierKey: string;
  carrier: {
    name: string;
    prefixes: string[];
    color: string;
  };
}

// Navigation param lists
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Withdraw: undefined;
  TopUp: undefined;
  BillPayment: undefined;
  LinkBank: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Offers: undefined;
  History: undefined;
  Profile: undefined;
};
