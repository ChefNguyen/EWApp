// Màn hình Home - Hiển thị hạn mức và thao tác nhanh
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, RefreshControl } from 'react-native';
import { Bell, History, DollarSign, CreditCard, LogOut, ChevronRight, Wallet, Smartphone, FileText } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { calculateLimit, getTransactionHistory } from '../services/api';

// Helper: Lấy icon, label, color theo loại giao dịch
const getTransactionMeta = (type: string) => {
    switch (type) {
        case 'TOPUP':
            return {
                label: 'Nạp tiền ĐT',
                iconBg: 'bg-orange-100',
                iconColor: '#F97316',
                amountColor: 'text-orange-600',
                Icon: Smartphone,
            };
        case 'BILL_PAYMENT':
            return {
                label: 'Thanh toán HĐ',
                iconBg: 'bg-violet-100',
                iconColor: '#7C3AED',
                amountColor: 'text-violet-600',
                Icon: FileText,
            };
        case 'WITHDRAWAL':
        default:
            return {
                label: 'Rút tiền',
                iconBg: 'bg-emerald-100',
                iconColor: '#10B981',
                amountColor: 'text-emerald-600',
                Icon: DollarSign,
            };
    }
};

export default function HomeScreen() {
    const router = useRouter();
    const { user, logout, updateUser } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [limit, setLimit] = useState(0);
    const [recentTransactions, setRecentTransactions] = useState([]);

    // Dùng trực tiếp user object từ AuthContext (data đến từ backend)
    const loadData = useCallback(async () => {
        if (!user) return;

        // Tính limit từ user object (grossSalary, workingDays, advancedAmount)
        const newLimit = calculateLimit(user as any);
        setLimit(newLimit);

        // Lấy lịch sử giao dịch
        const historyResult = await getTransactionHistory(user.id);
        if (historyResult.success) {
            setRecentTransactions(historyResult.data.slice(0, 3));
        }
    }, [user?.id, user?.advancedAmount]); // Re-run khi advancedAmount thay đổi (sau rút tiền)

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    const handleLogout = async () => {
        await logout();
        // Small delay to ensure state update propagates
        setTimeout(() => {
            router.replace('/login');
        }, 100);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    if (!user) return null;

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View className="flex-row justify-between items-center px-6 py-4 bg-white border-b border-slate-100">
                <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center">
                        <Text className="text-primary font-bold text-lg">{user.name?.charAt(0)}</Text>
                    </View>
                    <View>
                        <Text className="font-heading text-base text-slate-900">{user.name}</Text>
                        <Text className="text-slate-500 text-sm">{user.id}</Text>
                    </View>
                </View>
                <View className="flex-row gap-2">
                    <TouchableOpacity className="p-2 bg-slate-100 rounded-full" activeOpacity={0.7}>
                        <Bell color="#64748B" size={20} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="p-3 bg-red-50 rounded-full"
                        onPress={handleLogout}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <LogOut color="#EF4444" size={20} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                className="flex-1 px-6 pt-6"
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
                }
            >

                {/* Balance Card */}
                <View className="bg-primary rounded-2xl p-6 shadow-xl mb-6 relative overflow-hidden">
                    <View className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
                    <View className="absolute bottom-10 -left-10 w-24 h-24 bg-white/5 rounded-full" />

                    <Text className="text-primary-100 font-medium text-sm mb-1">Hạn mức khả dụng</Text>
                    <Text className="text-white font-heading text-4xl mb-4">{formatCurrency(limit)}</Text>

                    <View className="flex-row justify-between items-end">
                        <View>
                            <Text className="text-primary-200 text-xs">Lương Gross: {formatCurrency(user.grossSalary)}</Text>
                            <Text className="text-primary-200 text-xs">Ngày công: {user.workingDays}/22 ngày</Text>
                        </View>
                        <View className="bg-white/20 px-3 py-1 rounded-lg">
                            <Text className="text-white font-medium text-xs">Tháng 01/2026</Text>
                        </View>
                    </View>
                </View>

                {/* Quick Actions - Bento Grid */}
                <View className="mb-6">
                    <Text className="font-heading text-slate-800 text-lg mb-3">Tiện ích</Text>
                    <View className="flex-col gap-3">
                        {/* Row 1 */}
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                className="flex-1 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"
                                onPress={() => router.push('/withdraw')}
                                activeOpacity={0.7}
                            >
                                <View className="w-10 h-10 bg-emerald-50 rounded-xl items-center justify-center mb-3">
                                    <Wallet color="#10B981" size={20} />
                                </View>
                                <Text className="font-semibold text-slate-800 text-base">Rút tiền</Text>
                                <Text className="text-slate-400 text-xs mt-1">Chuyển về tài khoản</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="flex-1 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"
                                onPress={() => router.push('/topup')}
                                activeOpacity={0.7}
                            >
                                <View className="w-10 h-10 bg-orange-50 rounded-xl items-center justify-center mb-3">
                                    <Smartphone color="#F97316" size={20} />
                                </View>
                                <Text className="font-semibold text-slate-800 text-base">Nạp ĐT</Text>
                                <Text className="text-slate-400 text-xs mt-1">Miễn phí giao dịch</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {/* Row 2 */}
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                className="flex-1 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"
                                onPress={() => router.push('/bill-payment')}
                                activeOpacity={0.7}
                            >
                                <View className="w-10 h-10 bg-violet-50 rounded-xl items-center justify-center mb-3">
                                    <FileText color="#7C3AED" size={20} />
                                </View>
                                <Text className="font-semibold text-slate-800 text-base">Hóa đơn</Text>
                                <Text className="text-slate-400 text-xs mt-1">Điện, nước, internet</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="flex-1 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"
                                onPress={() => router.push('/history')}
                                activeOpacity={0.7}
                            >
                                <View className="w-10 h-10 bg-primary-50 rounded-xl items-center justify-center mb-3">
                                    <History color="#2563EB" size={20} />
                                </View>
                                <Text className="font-semibold text-slate-800 text-base">Lịch sử</Text>
                                <Text className="text-slate-400 text-xs mt-1">Quản lý giao dịch</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Bank Account Status */}
                <TouchableOpacity
                    className="bg-white p-4 rounded-xl border border-slate-100 mb-6 flex-row items-center justify-between"
                    onPress={() => router.push('/link-bank')}
                >
                    <View className="flex-row items-center gap-3">
                        <View className={`w-10 h-10 rounded-full items-center justify-center ${user.linkedBank ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                            <CreditCard color={user.linkedBank ? '#10B981' : '#F59E0B'} size={20} />
                        </View>
                        <View>
                            <Text className="font-semibold text-slate-800">
                                {user.linkedBank ? user.linkedBank.bankCode : 'Chưa liên kết ngân hàng'}
                            </Text>
                            <Text className="text-slate-500 text-sm">
                                {user.linkedBank
                                    ? `****${user.linkedBank.accountNo.slice(-4)}`
                                    : 'Nhấn để liên kết tài khoản nhận tiền'}
                            </Text>
                        </View>
                    </View>
                    <ChevronRight color="#94A3B8" size={20} />
                </TouchableOpacity>

                {/* Recent Transactions (Sprint 2: type-based rendering) */}
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-slate-800 font-bold text-lg">Giao dịch gần đây</Text>
                    <TouchableOpacity onPress={() => router.push('/history')}>
                        <Text className="text-primary text-sm font-semibold">Xem tất cả</Text>
                    </TouchableOpacity>
                </View>

                {recentTransactions.length === 0 ? (
                    <View className="bg-white p-8 rounded-xl border border-slate-100 items-center">
                        <History color="#CBD5E1" size={40} />
                        <Text className="text-slate-400 mt-2">Chưa có giao dịch nào</Text>
                    </View>
                ) : (
                    recentTransactions.map((txn) => {
                        const meta = getTransactionMeta(txn.type);
                        const TxnIcon = meta.Icon;
                        return (
                            <View key={txn.id} className="bg-white p-4 rounded-xl border border-slate-100 mb-3 flex-row items-center justify-between">
                                <View className="flex-row items-center gap-3">
                                    <View className={`${meta.iconBg} p-2 rounded-full`}>
                                        <TxnIcon color={meta.iconColor} size={20} />
                                    </View>
                                    <View>
                                        <Text className="text-slate-800 font-semibold">{meta.label}</Text>
                                        <Text className="text-slate-400 text-xs">{formatDate(txn.createdAt)}</Text>
                                    </View>
                                </View>
                                <View className="items-end">
                                    <Text className={`${meta.amountColor} font-bold`}>-{formatCurrency(txn.amount)}</Text>
                                    <Text className="text-slate-400 text-xs">
                                        {txn.fee > 0 ? `Phí: ${formatCurrency(txn.fee)}` : 'Miễn phí'}
                                    </Text>
                                </View>
                            </View>
                        );
                    })
                )}

            </ScrollView>
        </SafeAreaView>
    );
}
