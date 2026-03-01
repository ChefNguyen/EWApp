// Mock API Services cho Sprint 1 EWApp
// Giả lập các API call với delay để mô phỏng network

import {
    MOCK_EMPLOYEES,
    MOCK_BANK_ACCOUNTS,
    MOCK_TRANSACTIONS,
    BUSINESS_CONSTANTS
} from '../data/mockData';

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Validate mã nhân viên
 * @param {string} employeeCode - Mã nhân viên (vd: NV001)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const validateEmployee = async (employeeCode) => {
    await delay(500); // Giả lập network

    const employee = MOCK_EMPLOYEES[employeeCode.toUpperCase()];

    if (employee) {
        return { success: true, data: employee };
    }

    return { success: false, error: 'Mã nhân viên không tồn tại' };
};

/**
 * Xác thực OTP
 * @param {string} otp - Mã OTP 6 số
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const verifyOtp = async (otp) => {
    await delay(300);

    if (otp === BUSINESS_CONSTANTS.DEV_OTP) {
        return { success: true };
    }

    return { success: false, error: 'Mã OTP không đúng' };
};

/**
 * Tính hạn mức khả dụng
 * Công thức: (Gross / 22) * Ngày công * 50% - Đã ứng
 * @param {object} employee - Thông tin nhân viên
 * @returns {number} Hạn mức (làm tròn xuống nghìn đồng)
 */
export const calculateLimit = (employee) => {
    const { grossSalary, workingDays, advancedAmount } = employee;
    const { STANDARD_WORKING_DAYS, ADVANCE_PERCENTAGE } = BUSINESS_CONSTANTS;

    const dailyRate = grossSalary / STANDARD_WORKING_DAYS;
    const earnedAmount = dailyRate * workingDays * ADVANCE_PERCENTAGE;
    const availableLimit = earnedAmount - advancedAmount;

    // Làm tròn xuống đơn vị nghìn đồng
    return Math.floor(availableLimit / 1000) * 1000;
};

/**
 * Tra cứu tên chủ tài khoản ngân hàng
 * @param {string} bankCode - Mã ngân hàng (VCB, TCB...)
 * @param {string} accountNo - Số tài khoản
 * @returns {Promise<{success: boolean, accountName?: string, error?: string}>}
 */
export const lookupBankAccount = async (bankCode, accountNo) => {
    await delay(800); // Giả lập gọi API ngân hàng

    const key = `${bankCode}-${accountNo}`;
    const accountName = MOCK_BANK_ACCOUNTS[key];

    if (accountName) {
        return { success: true, accountName };
    }

    return { success: false, error: 'Không tìm thấy tài khoản' };
};

/**
 * Tính phí rút tiền
 * @param {number} amount - Số tiền rút
 * @returns {number} Phí
 */
export const calculateFee = (amount) => {
    const { FEE_THRESHOLD, FEE_LOW, FEE_HIGH } = BUSINESS_CONSTANTS;
    return amount < FEE_THRESHOLD ? FEE_LOW : FEE_HIGH;
};

/**
 * Thực hiện rút tiền
 * @param {string} employeeId - Mã nhân viên
 * @param {number} amount - Số tiền rút
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const processWithdrawal = async (employeeId, amount) => {
    await delay(1000); // Giả lập xử lý thanh toán

    const employee = MOCK_EMPLOYEES[employeeId];
    if (!employee) {
        return { success: false, error: 'Nhân viên không tồn tại' };
    }

    const limit = calculateLimit(employee);
    const fee = calculateFee(amount);
    const totalDeduction = amount + fee;

    if (totalDeduction > limit) {
        return {
            success: false,
            error: `Số tiền rút + phí (${totalDeduction.toLocaleString()}đ) vượt quá hạn mức (${limit.toLocaleString()}đ)`
        };
    }

    // Cập nhật mock data (trong thực tế sẽ gọi API backend)
    employee.advancedAmount += totalDeduction;

    // Tạo transaction mới
    const newTransaction = {
        id: `TXN${Date.now()}`,
        amount,
        fee,
        netAmount: amount, // Thực nhận = Số tiền nhập (phí trừ vào hạn mức, không trừ vào tiền nhận)
        status: 'SUCCESS',
        createdAt: new Date().toISOString(),
        bankName: employee.linkedBank?.bankCode || 'N/A',
    };

    // Thêm vào lịch sử
    if (!MOCK_TRANSACTIONS[employeeId]) {
        MOCK_TRANSACTIONS[employeeId] = [];
    }
    MOCK_TRANSACTIONS[employeeId].unshift(newTransaction);

    return {
        success: true,
        data: {
            transaction: newTransaction,
            newLimit: calculateLimit(employee),
        },
    };
};

/**
 * Lấy lịch sử giao dịch
 * @param {string} employeeId - Mã nhân viên
 * @returns {Promise<{success: boolean, data: array}>}
 */
export const getTransactionHistory = async (employeeId) => {
    await delay(300);

    const transactions = MOCK_TRANSACTIONS[employeeId] || [];
    return { success: true, data: transactions };
};

/**
 * Liên kết tài khoản ngân hàng
 * @param {string} employeeId - Mã nhân viên
 * @param {object} bankInfo - Thông tin ngân hàng {bankCode, accountNo, accountName}
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const linkBankAccount = async (employeeId, bankInfo) => {
    await delay(500);

    const employee = MOCK_EMPLOYEES[employeeId];
    if (!employee) {
        return { success: false, error: 'Nhân viên không tồn tại' };
    }

    // Validate tên chủ thẻ khớp với tên nhân viên
    // So sánh nguyên từ (whole word), không phải substring
    // VD: tên "NGUYEN VAN A" → tên riêng "A"; "LE VAN C" không chứa từ "A" → fail
    const employeeNameNormalized = employee.name.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const accountNameNormalized = bankInfo.accountName.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const employeeFirstName = employeeNameNormalized.split(' ').pop(); // tên riêng (từ cuối)
    const accountNameWords = accountNameNormalized.split(' ');         // tách từng từ

    if (!accountNameWords.includes(employeeFirstName)) {
        return {
            success: false,
            error: 'Tên chủ tài khoản không khớp với tên nhân viên'
        };
    }

    // Lưu liên kết
    employee.linkedBank = bankInfo;

    return { success: true };
};
