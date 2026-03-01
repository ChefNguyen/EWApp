// Màn hình Lịch sử Giao dịch
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, FlatList, ActivityIndicator } from 'react-native';
import { ArrowLeft, DollarSign, Calendar, Filter } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTransactionHistory } from '../services/api';

export default function HistoryScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

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
            case 'SUCCESS': return 'bg-emerald-100 text-emerald-700';
            case 'PENDING': return 'bg-amber-100 text-amber-700';
            case 'FAILED': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
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

    const renderTransaction = ({ item }) => (
        <View className="bg-white p-4 rounded-xl border border-slate-100 mb-3">
            <View className="flex-row items-start justify-between mb-3">
                <View className="flex-row items-center gap-3">
                    <View className="bg-primary-100 p-2 rounded-full">
                        <DollarSign color="#4F46E5" size={20} />
                    </View>
                    <View>
                        <Text className="text-slate-800 font-semibold">Rút lương</Text>
                        <Text className="text-slate-400 text-xs">{item.id}</Text>
                    </View>
                </View>
                <View className={`px-2 py-1 rounded-full ${getStatusColor(item.status).split(' ')[0]}`}>
                    <Text className={`text-xs font-medium ${getStatusColor(item.status).split(' ')[1]}`}>
                        {getStatusText(item.status)}
                    </Text>
                </View>
            </View>

            <View className="bg-slate-50 p-3 rounded-lg">
                <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-500 text-sm">Số tiền rút</Text>
                    <Text className="text-slate-800 font-semibold">{formatCurrency(item.amount)}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-500 text-sm">Phí giao dịch</Text>
                    <Text className="text-slate-600">{formatCurrency(item.fee)}</Text>
                </View>
                <View className="h-px bg-slate-200 my-2" />
                <View className="flex-row justify-between">
                    <Text className="text-slate-500 text-sm">Thực nhận</Text>
                    <Text className="text-emerald-600 font-bold">{formatCurrency(item.netAmount)}</Text>
                </View>
            </View>

            <View className="flex-row items-center mt-3">
                <Calendar color="#94A3B8" size={14} />
                <Text className="text-slate-400 text-xs ml-1">{formatDate(item.createdAt)}</Text>
            </View>
        </View>
    );

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
                <TouchableOpacity className="p-2 bg-slate-100 rounded-full">
                    <Filter color="#64748B" size={20} />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            ) : transactions.length === 0 ? (
                <View className="flex-1 items-center justify-center px-6">
                    <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4">
                        <DollarSign color="#CBD5E1" size={40} />
                    </View>
                    <Text className="text-slate-800 font-semibold text-lg mb-2">Chưa có giao dịch</Text>
                    <Text className="text-slate-500 text-center">Các giao dịch rút lương của bạn sẽ xuất hiện ở đây</Text>
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    renderItem={renderTransaction}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 24 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}
