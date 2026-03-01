// Màn hình Home - Hiển thị hạn mức và thao tác rút tiền
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, RefreshControl } from 'react-native';
import { Bell, History, Menu, DollarSign, CreditCard, LogOut, ChevronRight, Wallet } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { calculateLimit, getTransactionHistory } from '../services/api';

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

                {/* Quick Actions */}
                <View className="flex-row gap-4 mb-6">
                    <TouchableOpacity
                        className="flex-1 bg-white p-4 rounded-xl border border-slate-100 items-center"
                        onPress={() => router.push('/withdraw')}
                    >
                        <View className="w-12 h-12 bg-emerald-100 rounded-full items-center justify-center mb-2">
                            <Wallet color="#10B981" size={24} />
                        </View>
                        <Text className="font-semibold text-slate-800 text-sm">Rút tiền</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-1 bg-white p-4 rounded-xl border border-slate-100 items-center"
                        onPress={() => router.push('/link-bank')}
                    >
                        <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center mb-2">
                            <CreditCard color="#4F46E5" size={24} />
                        </View>
                        <Text className="font-semibold text-slate-800 text-sm">Liên kết TK</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="flex-1 bg-white p-4 rounded-xl border border-slate-100 items-center"
                        onPress={() => router.push('/history')}
                    >
                        <View className="w-12 h-12 bg-amber-100 rounded-full items-center justify-center mb-2">
                            <History color="#F59E0B" size={24} />
                        </View>
                        <Text className="font-semibold text-slate-800 text-sm">Lịch sử</Text>
                    </TouchableOpacity>
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

                {/* Recent Transactions */}
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
                    recentTransactions.map((txn) => (
                        <View key={txn.id} className="bg-white p-4 rounded-xl border border-slate-100 mb-3 flex-row items-center justify-between">
                            <View className="flex-row items-center gap-3">
                                <View className="bg-emerald-100 p-2 rounded-full">
                                    <DollarSign color="#10B981" size={20} />
                                </View>
                                <View>
                                    <Text className="text-slate-800 font-semibold">Rút tiền</Text>
                                    <Text className="text-slate-400 text-xs">{formatDate(txn.createdAt)}</Text>
                                </View>
                            </View>
                            <View className="items-end">
                                <Text className="text-emerald-600 font-bold">-{formatCurrency(txn.amount)}</Text>
                                <Text className="text-slate-400 text-xs">Phí: {formatCurrency(txn.fee)}</Text>
                            </View>
                        </View>
                    ))
                )}

            </ScrollView>
        </SafeAreaView>
    );
}
