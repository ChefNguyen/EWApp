// Mock Data cho Sprint 1 EWApp
// Dữ liệu giả lập nhân viên, ngân hàng, và giao dịch

export const MOCK_EMPLOYEES = {
    'NV001': {
        id: 'NV001',
        name: 'Nguyễn Văn A',
        phone: '0901234567',
        grossSalary: 20000000, // 20 triệu
        workingDays: 15, // 15 ngày công thực tế
        advancedAmount: 2020000, // Đã ứng 2tr + 20k phí
        linkedBank: null, // Chưa liên kết ngân hàng
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
    // ========== EDGE CASES ==========
    'NV003': {
        // CASE: Đã hết sạch hạn mức (không còn tiền để rút)
        id: 'NV003',
        name: 'Lê Văn C',
        phone: '0912345678',
        grossSalary: 10000000, // 10 triệu
        workingDays: 10, // 10 ngày công
        // Hạn mức max = (10tr/22)*10*50% = 2,272,727 -> làm tròn = 2,272,000
        advancedAmount: 2272000, // Đã ứng hết 100% hạn mức -> Còn lại = 0
        linkedBank: {
            bankCode: 'MB',
            accountNo: '5555666677',
            accountName: 'LE VAN C',
        },
    },
    'NV004': {
        // CASE: Lương rất thấp (hạn mức < mức rút tối thiểu)
        id: 'NV004',
        name: 'Phạm Thị D',
        phone: '0987654321',
        grossSalary: 5000000, // 5 triệu (lương thấp)
        workingDays: 5, // Chỉ làm 5 ngày
        // Hạn mức max = (5tr/22)*5*50% = 568,181 -> làm tròn = 568,000
        advancedAmount: 0, // Chưa ứng
        linkedBank: {
            bankCode: 'ACB',
            accountNo: '9999888877',
            accountName: 'PHAM THI D',
        },
    },
};

export const MOCK_BANKS = [
    { code: 'VCB', name: 'Vietcombank', logo: '🏦' },
    { code: 'TCB', name: 'Techcombank', logo: '🏛️' },
    { code: 'MB', name: 'MB Bank', logo: '🏢' },
    { code: 'ACB', name: 'ACB', logo: '🏣' },
    { code: 'VPB', name: 'VPBank', logo: '🏤' },
];

// Mock danh sách tài khoản ngân hàng (để tra cứu tên chủ thẻ)
export const MOCK_BANK_ACCOUNTS = {
    'VCB-1234567890': 'TRAN THI B',
    'VCB-0987654321': 'NGUYEN VAN A',
    'TCB-1111222233': 'NGUYEN VAN A',
    'MB-5555666677': 'LE VAN C',
    'ACB-9999888877': 'PHAM THI D', // Edge case: User lương thấp
};

export const MOCK_TRANSACTIONS = {
    'NV001': [
        {
            id: 'TXN001',
            amount: 1000000,
            fee: 10000,
            netAmount: 1000000,
            status: 'SUCCESS',
            createdAt: '2026-01-28T10:30:00',
            bankName: 'Vietcombank',
        },
        {
            id: 'TXN002',
            amount: 1000000,
            fee: 10000,
            netAmount: 1000000,
            status: 'SUCCESS',
            createdAt: '2026-01-25T14:15:00',
            bankName: 'Vietcombank',
        },
    ],
    'NV002': [],
};

// Hằng số nghiệp vụ
export const BUSINESS_CONSTANTS = {
    STANDARD_WORKING_DAYS: 22, // Số ngày công chuẩn
    ADVANCE_PERCENTAGE: 0.5, // Tỷ lệ được ứng trước (50%)
    FEE_THRESHOLD: 1000000, // Ngưỡng tính phí
    FEE_LOW: 10000, // Phí < 1 triệu
    FEE_HIGH: 20000, // Phí >= 1 triệu
    DEV_OTP: '123456', // OTP cố định cho môi trường Dev
};
