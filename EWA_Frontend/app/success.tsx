// Màn hình Xác nhận giao dịch thành công (Sprint 2) - Redesigned UI/UX
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { CheckCircle, Home, Copy, Clock, Smartphone, FileText, Wallet } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';

export default function SuccessScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [copied, setCopied] = useState(false);

    const {
        transactionType,
        amount, fee, netAmount, newLimit, transactionId, transactionTime,
        // Withdrawal params
        bankName,
        // Top-up params
        phoneNumber, carrier,
        // Bill Payment params
        serviceType, provider, customerName, customerId,
    } = params;

    const type = (transactionType as string) || 'WITHDRAWAL';

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN').format(value || 0) + ' ₫';
    };

    const formatDateTime = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString as string);
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
            await Clipboard.setStringAsync(transactionId as string);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleGoHome = () => {
        router.replace('/');
    };

    // Unified success theme using the app's 'success' color palette
    const typeConfig = {
        WITHDRAWAL: {
            title: 'Rút tiền thành công!',
            subtitle: 'Tiền đã được chuyển về tài khoản của bạn',
            amountLabel: 'Số tiền thực nhận',
            Icon: Wallet,
        },
        TOPUP: {
            title: 'Nạp tiền thành công!',
            subtitle: 'Tài khoản điện thoại đã được nạp tiền',
            amountLabel: 'Mệnh giá đã nạp',
            Icon: Smartphone,
        },
        BILL_PAYMENT: {
            title: 'Thanh toán thành công!',
            subtitle: 'Hóa đơn đã được thanh toán',
            amountLabel: 'Số tiền đã thanh toán',
            Icon: FileText,
        },
    };

    const config = typeConfig[type] || typeConfig.WITHDRAWAL;

    return (
        <SafeAreaView className="flex-1 bg-success">
            <StatusBar barStyle="light-content" />

            <View className="flex-1 items-center justify-center px-6">
                {/* Success Icon */}
                <View className="w-24 h-24 bg-white/20 rounded-full items-center justify-center mb-6">
                    <View className="w-20 h-20 bg-white rounded-full items-center justify-center shadow-sm">
                        <CheckCircle color="#10B981" size={48} strokeWidth={2.5} />
                    </View>
                </View>

                {/* Success Title */}
                <Text className="text-white font-heading text-3xl mb-2 text-center">{config.title}</Text>
                <Text className="text-success-100 text-base mb-8 text-center px-4">{config.subtitle}</Text>

                {/* Transaction Details Ticket */}
                <View className="bg-white w-full rounded-3xl p-6 shadow-xl mb-6 relative">
                    {/* Ticket notch cutouts for visual flair */}
                    <View className="absolute -left-3 top-28 w-6 h-6 bg-success rounded-full" />
                    <View className="absolute -right-3 top-28 w-6 h-6 bg-success rounded-full" />

                    {/* Amount */}
                    <View className="items-center mb-6 pb-6 border-b border-dashed border-slate-200">
                        <View className="bg-success-50 p-3 rounded-full mb-3">
                            <config.Icon color="#10B981" size={28} />
                        </View>
                        <Text className="text-slate-500 text-sm mb-1">{config.amountLabel}</Text>
                        <Text className="text-success font-heading text-4xl">{formatCurrency(netAmount)}</Text>
                    </View>

                    {/* Details */}
                    <View className="space-y-3 px-2">
                        {/* Type-specific details */}
                        {type === 'WITHDRAWAL' && (
                            <>
                                <View className="flex-row justify-between py-1.5">
                                    <Text className="text-slate-500">Số tiền rút</Text>
                                    <Text className="text-slate-800 font-semibold">{formatCurrency(amount)}</Text>
                                </View>
                                <View className="flex-row justify-between py-1.5">
                                    <Text className="text-slate-500">Phí giao dịch</Text>
                                    <Text className="text-slate-800 font-semibold">{formatCurrency(fee)}</Text>
                                </View>
                                <View className="flex-row justify-between py-1.5">
                                    <Text className="text-slate-500">Ngân hàng nhận</Text>
                                    <Text className="text-slate-800 font-semibold">{bankName || 'N/A'}</Text>
                                </View>
                            </>
                        )}

                        {type === 'TOPUP' && (
                            <>
                                <View className="flex-row justify-between py-1.5">
                                    <Text className="text-slate-500">Mệnh giá</Text>
                                    <Text className="text-slate-800 font-semibold">{formatCurrency(amount)}</Text>
                                </View>
                                <View className="flex-row justify-between py-1.5">
                                    <Text className="text-slate-500">Số điện thoại</Text>
                                    <Text className="text-slate-800 font-semibold">{phoneNumber || 'N/A'}</Text>
                                </View>
                                <View className="flex-row justify-between py-1.5">
                                    <Text className="text-slate-500">Nhà mạng</Text>
                                    <Text className="text-slate-800 font-semibold">{carrier || 'N/A'}</Text>
                                </View>
                                <View className="flex-row justify-between py-1.5">
                                    <Text className="text-slate-500">Phí giao dịch</Text>
                                    <Text className="text-success font-bold">Miễn phí</Text>
                                </View>
                            </>
                        )}

                        {type === 'BILL_PAYMENT' && (
                            <>
                                <View className="flex-row justify-between py-1.5">
                                    <Text className="text-slate-500">Loại dịch vụ</Text>
                                    <Text className="text-slate-800 font-semibold">
                                        {serviceType === 'ELECTRIC' ? '⚡ Điện' : '💧 Nước'}
                                    </Text>
                                </View>
                                <View className="flex-row justify-between py-1.5">
                                    <Text className="text-slate-500">Khách hàng</Text>
                                    <Text className="text-slate-800 font-semibold">{customerName || 'N/A'}</Text>
                                </View>
                                <View className="flex-row justify-between py-1.5">
                                    <Text className="text-slate-500">Mã KH</Text>
                                    <Text className="text-slate-800 font-semibold">{customerId || 'N/A'}</Text>
                                </View>
                                <View className="flex-row justify-between py-1.5">
                                    <Text className="text-slate-500">Nhà cung cấp</Text>
                                    <Text className="text-slate-800 font-semibold">{provider || 'N/A'}</Text>
                                </View>
                                <View className="flex-row justify-between py-1.5">
                                    <Text className="text-slate-500">Phí giao dịch</Text>
                                    <Text className="text-success font-bold">Miễn phí</Text>
                                </View>
                            </>
                        )}

                        {/* Transaction Time */}
                        <View className="flex-row justify-between py-1.5">
                            <View className="flex-row items-center">
                                <Clock color="#64748B" size={16} />
                                <Text className="text-slate-500 ml-1.5">Thời gian</Text>
                            </View>
                            <Text className="text-slate-800 font-semibold">{formatDateTime(transactionTime)}</Text>
                        </View>

                        <View className="h-px bg-slate-100 my-3" />
                        <View className="flex-row justify-between py-1.5">
                            <Text className="text-slate-500">Hạn mức còn lại</Text>
                            <Text className="text-primary font-bold">{formatCurrency(newLimit)}</Text>
                        </View>
                    </View>

                    {/* Transaction ID */}
                    <TouchableOpacity
                        className="mt-6 bg-slate-50 p-4 rounded-xl flex-row items-center justify-between border border-slate-100"
                        onPress={handleCopyTransactionId}
                        activeOpacity={0.7}
                    >
                        <View>
                            <Text className="text-slate-400 text-xs mb-1">Mã giao dịch</Text>
                            <Text className="text-slate-700 font-mono text-sm font-semibold">{transactionId || 'N/A'}</Text>
                        </View>
                        <View className="flex-row items-center bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                            <Copy color={copied ? '#10B981' : '#64748B'} size={16} />
                            {copied && <Text className="text-success text-xs ml-1.5 font-medium">Đã chép</Text>}
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Home Button */}
                <TouchableOpacity
                    className="bg-white/20 w-full py-4 rounded-2xl border border-white/30 flex-row items-center justify-center"
                    onPress={handleGoHome}
                    activeOpacity={0.8}
                >
                    <Home color="white" size={24} />
                    <Text className="font-bold text-lg text-white ml-2">Về trang chủ</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
