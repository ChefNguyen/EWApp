// Màn hình Lịch sử Giao dịch (Sprint 2: phân loại theo type) - Redesigned UI/UX
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { ArrowLeft, DollarSign, Calendar, Filter, Wallet, Smartphone, FileText } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTransactionHistory } from '../services/api';

// Helper: Lấy metadata theo loại giao dịch - Streamlined colors for deductions
const getTransactionMeta = (type: string) => {
    switch (type) {
        case 'TOPUP':
            return {
                label: 'Nạp tiền ĐT',
                sublabel: 'Mobile Top-up',
                iconBg: 'bg-slate-100',
                iconColor: '#64748B', // Slate-500
                accentColor: 'text-slate-700',
                badgeBg: 'bg-slate-100',
                badgeText: 'text-slate-700',
                Icon: Smartphone,
            };
        case 'BILL_PAYMENT':
            return {
                label: 'Thanh toán HĐ',
                sublabel: 'Bill Payment',
                iconBg: 'bg-slate-100',
                iconColor: '#64748B',
                accentColor: 'text-slate-700',
                badgeBg: 'bg-slate-100',
                badgeText: 'text-slate-700',
                Icon: FileText,
            };
        case 'WITHDRAWAL':
        default:
            return {
                label: 'Rút tiền',
                sublabel: 'Bank Transfer',
                iconBg: 'bg-primary-50',
                iconColor: '#2563EB', // Trust Blue
                accentColor: 'text-primary-700',
                badgeBg: 'bg-primary-50',
                badgeText: 'text-primary-700',
                Icon: Wallet,
            };
    }
};

export default function HistoryScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterType, setFilterType] = useState<string | null>(null);

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        if (!user) return;

        setIsLoading(true);
        const result = await getTransactionHistory(user.id);
        if (result.success) {
            setTransactions(result.data);
        }
        setIsLoading(false);
    };

    const filteredTransactions = filterType
        ? transactions.filter((t) => t.type === filterType)
        : transactions;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'SUCCESS': return 'bg-success-50 text-success-700'; // Using success green for status
            case 'PENDING': return 'bg-amber-50 text-amber-700';
            case 'FAILED': return 'bg-red-50 text-red-700';
            default: return 'bg-slate-50 text-slate-700';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'SUCCESS': return 'Thành công';
            case 'PENDING': return 'Đang xử lý';
            case 'FAILED': return 'Thất bại';
            default: return status;
        }
    };

    // Thông tin phụ theo loại giao dịch
    const getExtraInfo = (item: any) => {
        switch (item.type) {
            case 'TOPUP':
                return `${item.carrier || ''} • ${item.phoneNumber || ''}`;
            case 'BILL_PAYMENT':
                return `${item.provider || ''} • MKH: ${item.customerId || ''}`;
            case 'WITHDRAWAL':
                return item.bankName || '';
            default:
                return '';
        }
    };

    const renderTransaction = ({ item }) => {
        const meta = getTransactionMeta(item.type);
        const TxnIcon = meta.Icon;
        const extraInfo = getExtraInfo(item);

        return (
            <View className="bg-white p-5 rounded-2xl border border-slate-100 mb-4 shadow-sm">
                <View className="flex-row items-start justify-between mb-4">
                    <View className="flex-row items-center gap-3">
                        <View className={`${meta.iconBg} w-10 h-10 rounded-xl items-center justify-center`}>
                            <TxnIcon color={meta.iconColor} size={20} />
                        </View>
                        <View>
                            <Text className="text-slate-800 font-semibold text-base">{meta.label}</Text>
                            {extraInfo ? (
                                <Text className="text-slate-500 text-xs mt-0.5">{extraInfo}</Text>
                            ) : (
                                <Text className="text-slate-500 text-xs mt-0.5">{item.id}</Text>
                            )}
                        </View>
                    </View>
                    <View className={`px-2.5 py-1 rounded-md ${getStatusColor(item.status).split(' ')[0]}`}>
                        <Text className={`text-[10px] font-bold uppercase tracking-wide ${getStatusColor(item.status).split(' ')[1]}`}>
                            {getStatusText(item.status)}
                        </Text>
                    </View>
                </View>

                <View className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-slate-500 text-sm">Số tiền</Text>
                        <Text className="text-slate-900 font-bold text-base">-{formatCurrency(item.amount)}</Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                        <Text className="text-slate-500 text-sm">Phí giao dịch</Text>
                        <Text className={item.fee === 0 ? 'text-success font-semibold text-sm' : 'text-slate-600 text-sm'}>
                            {item.fee === 0 ? 'Miễn phí' : formatCurrency(item.fee)}
                        </Text>
                    </View>
                    {item.type === 'WITHDRAWAL' && (
                        <>
                            <View className="h-px bg-slate-200 my-3" />
                            <View className="flex-row justify-between items-center">
                                <Text className="text-slate-500 text-sm font-medium">Thực nhận</Text>
                                <Text className="text-success font-bold text-base">{formatCurrency(item.netAmount)}</Text>
                            </View>
                        </>
                    )}
                </View>

                <View className="flex-row items-center mt-4">
                    <Calendar color="#94A3B8" size={14} />
                    <Text className="text-slate-400 text-xs ml-1.5">{formatDate(item.createdAt)}</Text>
                </View>
            </View>
        );
    };

    // Filter buttons using Trust Blue for active state
    const filterOptions = [
        { key: null, label: 'Tất cả' },
        { key: 'WITHDRAWAL', label: 'Rút tiền' },
        { key: 'TOPUP', label: 'Nạp ĐT' },
        { key: 'BILL_PAYMENT', label: 'Hóa đơn' },
    ];

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => router.back()}>
                        <ArrowLeft color="#334155" size={24} />
                    </TouchableOpacity>
                    <Text className="font-heading text-lg text-slate-900">Lịch sử giao dịch</Text>
                </View>
            </View>

            {/* Filter Tabs */}
            <View className="flex-row px-6 py-3 gap-2 bg-white border-b border-slate-100 shadow-sm z-10">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2 pr-6">
                        {filterOptions.map((opt) => {
                            const isActive = filterType === opt.key;
                            return (
                                <TouchableOpacity
                                    key={opt.key || 'all'}
                                    className={`px-5 py-2 rounded-xl border ${
                                        isActive
                                            ? 'bg-primary border-primary'
                                            : 'bg-white border-slate-200'
                                    }`}
                                    onPress={() => setFilterType(opt.key)}
                                    activeOpacity={0.7}
                                >
                                    <Text className={`text-sm font-semibold ${
                                        isActive ? 'text-white' : 'text-slate-600'
                                    }`}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            ) : filteredTransactions.length === 0 ? (
                <View className="flex-1 items-center justify-center px-6">
                    <View className="w-24 h-24 bg-slate-100 rounded-full items-center justify-center mb-5">
                        <DollarSign color="#CBD5E1" size={48} />
                    </View>
                    <Text className="text-slate-800 font-heading text-xl mb-2">Chưa có giao dịch</Text>
                    <Text className="text-slate-500 text-center leading-5">
                        {filterType
                            ? 'Không có giao dịch nào thuộc phân loại này.'
                            : 'Các giao dịch rút lương, nạp tiền và thanh toán hóa đơn của bạn sẽ xuất hiện ở đây.'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredTransactions}
                    renderItem={renderTransaction}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 20 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}
