// Màn hình Xác nhận giao dịch thành công
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { CheckCircle, ArrowRight, Home, Copy, Clock } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';

export default function SuccessScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [copied, setCopied] = useState(false);

    const { amount, fee, netAmount, newLimit, transactionId, bankName, transactionTime } = params;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN').format(value || 0) + ' ₫';
    };

    const formatDateTime = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const handleCopyTransactionId = async () => {
        if (transactionId) {
            await Clipboard.setStringAsync(transactionId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleGoHome = () => {
        router.replace('/');
    };

    return (
        <SafeAreaView className="flex-1 bg-emerald-500">
            <StatusBar barStyle="light-content" />

            <View className="flex-1 items-center justify-center px-6">
                {/* Success Icon */}
                <View className="w-28 h-28 bg-white rounded-full items-center justify-center mb-6 shadow-lg">
                    <CheckCircle color="#10B981" size={64} strokeWidth={2} />
                </View>

                {/* Success Title */}
                <Text className="text-white font-heading text-3xl mb-2">Giao dịch thành công!</Text>
                <Text className="text-emerald-100 text-base mb-8">Tiền đã được chuyển về tài khoản của bạn</Text>

                {/* Transaction Details Card */}
                <View className="bg-white w-full rounded-2xl p-6 shadow-xl mb-6">
                    {/* Amount */}
                    <View className="items-center mb-6 pb-6 border-b border-slate-100">
                        <Text className="text-slate-500 text-sm mb-1">Số tiền thực nhận</Text>
                        <Text className="text-emerald-600 font-heading text-4xl">{formatCurrency(netAmount)}</Text>
                    </View>

                    {/* Details */}
                    <View className="space-y-3">
                        <View className="flex-row justify-between py-2">
                            <Text className="text-slate-500">Số tiền rút</Text>
                            <Text className="text-slate-800 font-medium">{formatCurrency(amount)}</Text>
                        </View>
                        <View className="flex-row justify-between py-2">
                            <Text className="text-slate-500">Phí giao dịch</Text>
                            <Text className="text-slate-800 font-medium">{formatCurrency(fee)}</Text>
                        </View>
                        <View className="flex-row justify-between py-2">
                            <Text className="text-slate-500">Ngân hàng nhận</Text>
                            <Text className="text-slate-800 font-medium">{bankName || 'N/A'}</Text>
                        </View>

                        {/* Transaction Time */}
                        <View className="flex-row justify-between py-2">
                            <View className="flex-row items-center">
                                <Clock color="#64748B" size={14} />
                                <Text className="text-slate-500 ml-1">Thời gian</Text>
                            </View>
                            <Text className="text-slate-800 font-medium">{formatDateTime(transactionTime)}</Text>
                        </View>

                        <View className="h-px bg-slate-200 my-2" />
                        <View className="flex-row justify-between py-2">
                            <Text className="text-slate-500">Hạn mức còn lại</Text>
                            <Text className="text-primary font-bold">{formatCurrency(newLimit)}</Text>
                        </View>
                    </View>

                    {/* Transaction ID */}
                    <TouchableOpacity
                        className="mt-4 bg-slate-50 p-3 rounded-lg flex-row items-center justify-between"
                        onPress={handleCopyTransactionId}
                    >
                        <View>
                            <Text className="text-slate-400 text-xs">Mã giao dịch</Text>
                            <Text className="text-slate-700 font-mono text-sm">{transactionId || 'N/A'}</Text>
                        </View>
                        <View className="flex-row items-center">
                            <Copy color={copied ? '#10B981' : '#94A3B8'} size={18} />
                            {copied && <Text className="text-emerald-500 text-xs ml-1">Đã sao chép</Text>}
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Home Button */}
                <TouchableOpacity
                    className="bg-white w-full py-4 rounded-xl flex-row items-center justify-center shadow-lg"
                    onPress={handleGoHome}
                    activeOpacity={0.8}
                >
                    <Home color="#10B981" size={24} />
                    <Text className="text-emerald-600 font-bold text-lg ml-2">Về trang chủ</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
