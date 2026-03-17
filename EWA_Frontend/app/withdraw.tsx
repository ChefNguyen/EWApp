// Màn hình Rút tiền - Redesigned UI/UX
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { ArrowLeft, Wallet, AlertCircle, Check, CreditCard, Shield, Clock, DollarSign, TrendingDown, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { calculateLimit, calculateFee, processWithdrawal } from '../services/api';

export default function WithdrawScreen() {
    const router = useRouter();
    const { user, updateUser } = useAuth();

    const [amount, setAmount] = useState('');
    const [limit, setLimit] = useState(0);
    const [fee, setFee] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        if (user) {
            setLimit(calculateLimit(user as any));
        }
    }, [user]);

    useEffect(() => {
        const numAmount = parseInt(amount.replace(/\D/g, '')) || 0;
        setFee(numAmount > 0 ? calculateFee(numAmount) : 0);
        setError('');
    }, [amount]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN').format(value);
    };

    const handleAmountChange = (text) => {
        const numericValue = text.replace(/\D/g, '');
        setAmount(numericValue);
    };

    const getDisplayAmount = () => {
        if (!amount) return '';
        return formatCurrency(parseInt(amount));
    };

    const numericAmount = parseInt(amount) || 0;
    const totalDeduction = numericAmount + fee;
    const netReceived = numericAmount;
    const isOverLimit = totalDeduction > limit;
    const canWithdraw = numericAmount > 0 && !isOverLimit && user?.linkedBank;
    const newLimitAfterWithdraw = limit - totalDeduction;

    const showConfirmation = () => {
        if (!canWithdraw) return;
        setShowConfirmModal(true);
    };

    const handleWithdraw = async () => {
        setShowConfirmModal(false);
        setError('');
        setIsProcessing(true);

        try {
            const result = await processWithdrawal(user.id, numericAmount);

            if (result.success) {
                setSuccess(true);
                const newAdvancedAmount = (user.advancedAmount || 0) + numericAmount + fee;
                await updateUser({ advancedAmount: newAdvancedAmount });

                setTimeout(() => {
                    router.replace({
                        pathname: '/success',
                        params: {
                            transactionType: 'WITHDRAWAL',
                            amount: numericAmount,
                            fee: fee,
                            netAmount: numericAmount,
                            newLimit: result.data.newLimit,
                            transactionId: result.data.transaction.id,
                            bankName: user.linkedBank?.bankCode || 'N/A',
                            transactionTime: new Date().toISOString()
                        }
                    });
                }, 500);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Đã xảy ra lỗi, vui lòng thử lại');
        } finally {
            setIsProcessing(false);
        }
    };

    const quickAmounts = [500000, 1000000, 2000000, 3000000];

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View className="flex-row items-center px-6 py-4 bg-white border-b border-slate-100">
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft color="#334155" size={24} />
                </TouchableOpacity>
                <Text className="font-heading text-lg text-slate-900 ml-3">Rút tiền</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* Available Limit */}
                    <View className="bg-primary rounded-2xl p-5 shadow-sm mb-6 relative overflow-hidden">
                        <View className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
                        <View className="absolute bottom-10 -left-10 w-24 h-24 bg-white/5 rounded-full" />
                        <Text className="text-primary-100 text-sm mb-1 font-medium">Hạn mức khả dụng</Text>
                        <Text className="text-white font-heading text-3xl">{formatCurrency(limit)} ₫</Text>
                    </View>

                    {/* Bank Account Check */}
                    {!user?.linkedBank && (
                        <TouchableOpacity
                            className="bg-amber-50 p-4 rounded-2xl border border-amber-200 mb-6 flex-row items-center shadow-sm"
                            onPress={() => router.push('/link-bank')}
                            activeOpacity={0.7}
                        >
                            <CreditCard color="#F59E0B" size={24} />
                            <View className="ml-3 flex-1">
                                <Text className="text-amber-800 font-semibold text-base">Chưa liên kết ngân hàng</Text>
                                <Text className="text-amber-600 text-sm mt-0.5">Nhấn để liên kết tài khoản nhận tiền</Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* Amount Input */}
                    <View className="mb-5">
                        <Text className="font-medium text-slate-700 text-sm mb-2">Số tiền muốn rút</Text>
                        <View className={`flex-row items-center bg-white border rounded-2xl px-4 shadow-sm ${isOverLimit ? 'border-red-400' : 'border-slate-200'}`}>
                            <TextInput
                                className="flex-1 py-4 text-2xl font-bold text-slate-900"
                                placeholder="0"
                                placeholderTextColor="#CBD5E1"
                                value={getDisplayAmount()}
                                onChangeText={handleAmountChange}
                                keyboardType="number-pad"
                            />
                            <Text className="text-slate-400 font-medium text-lg">VND</Text>
                        </View>
                        {isOverLimit && (
                            <View className="flex-row items-center mt-2">
                                <AlertCircle color="#EF4444" size={16} />
                                <Text className="text-red-500 text-sm ml-1 font-medium">Số tiền + phí vượt quá hạn mức</Text>
                            </View>
                        )}
                    </View>

                    {/* Quick Amount Buttons */}
                    <View className="flex-row flex-wrap gap-3 mb-6">
                        {quickAmounts.map((quickAmount) => (
                            <TouchableOpacity
                                key={quickAmount}
                                className={`px-4 py-3 rounded-xl border shadow-sm ${parseInt(amount) === quickAmount
                                    ? 'bg-primary border-primary'
                                    : 'bg-white border-slate-200'
                                    }`}
                                onPress={() => setAmount(quickAmount.toString())}
                                activeOpacity={0.7}
                            >
                                <Text className={`font-semibold ${parseInt(amount) === quickAmount ? 'text-white' : 'text-slate-700'
                                    }`}>
                                    {formatCurrency(quickAmount)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Fee Breakdown */}
                    {numericAmount > 0 && (
                        <View className="bg-white p-5 rounded-2xl border border-slate-100 mb-6 shadow-sm">
                            <View className="flex-row justify-between mb-3">
                                <Text className="text-slate-500">Số tiền rút</Text>
                                <Text className="text-slate-800 font-medium">{formatCurrency(numericAmount)} ₫</Text>
                            </View>
                            <View className="flex-row justify-between mb-3">
                                <Text className="text-slate-500">Phí giao dịch</Text>
                                <Text className="text-slate-800 font-medium">{formatCurrency(fee)} ₫</Text>
                            </View>
                            <View className="h-px bg-slate-100 mb-3" />
                            <View className="flex-row justify-between items-center mb-3">
                                <Text className="text-slate-600 font-medium">Tổng trừ hạn mức</Text>
                                <Text className={`font-bold ${isOverLimit ? 'text-red-500 text-lg' : 'text-slate-800 text-lg'}`}>
                                    {formatCurrency(totalDeduction)} ₫
                                </Text>
                            </View>
                            <View className="flex-row justify-between items-center">
                                <Text className="text-slate-600 font-medium">Thực nhận</Text>
                                <Text className="text-success font-heading text-xl">{formatCurrency(netReceived)} ₫</Text>
                            </View>
                        </View>
                    )}

                    {/* Fee Info */}
                    <View className="bg-slate-100/50 p-4 rounded-2xl mb-6 border border-slate-200">
                        <Text className="text-slate-600 text-sm leading-5">
                            💡 <Text className="font-semibold">Phí giao dịch:</Text> Dưới 1 triệu phí <Text className="font-bold">10,000đ</Text>, từ 1 triệu trở lên phí <Text className="font-bold">20,000đ</Text>.
                        </Text>
                    </View>

                    {/* Error Message */}
                    {error && (
                        <View className="flex-row items-center mb-4 bg-red-50 p-4 rounded-2xl border border-red-100">
                            <AlertCircle color="#EF4444" size={20} />
                            <Text className="text-red-600 text-sm ml-2 font-medium flex-1">{error}</Text>
                        </View>
                    )}

                    {/* Withdraw Button */}
                    <TouchableOpacity
                        className={`py-4 rounded-2xl items-center flex-row justify-center shadow-sm ${
                            canWithdraw && !isProcessing ? 'bg-success' : 'bg-slate-300'
                        }`}
                        onPress={showConfirmation}
                        disabled={!canWithdraw || isProcessing}
                        activeOpacity={0.8}
                    >
                        {isProcessing ? (
                            <ActivityIndicator color="white" />
                        ) : success ? (
                            <>
                                <Check color="white" size={24} />
                                <Text className="text-white font-bold text-lg ml-2">Thành công!</Text>
                            </>
                        ) : (
                            <>
                                <Wallet color="white" size={24} />
                                <Text className="text-white font-bold text-lg ml-2">Rút tiền ngay</Text>
                            </>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Confirmation Modal */}
            <Modal
                visible={showConfirmModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowConfirmModal(false)}
            >
                <View className="flex-1 bg-slate-900/40 justify-center items-center px-6">
                    <View className="bg-white w-full rounded-3xl overflow-hidden shadow-xl">
                        {/* Modal Header */}
                        <View className="bg-primary p-5 flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <Shield color="white" size={24} />
                                <Text className="text-white font-heading text-lg ml-2">Xác nhận giao dịch</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                                <X color="white" size={24} />
                            </TouchableOpacity>
                        </View>

                        {/* Modal Body */}
                        <View className="p-6">
                            {/* Amount Display */}
                            <View className="items-center mb-6 pb-6 border-b border-slate-100">
                                <Text className="text-slate-500 text-sm mb-1">Số tiền rút</Text>
                                <Text className="text-primary font-heading text-4xl">{formatCurrency(numericAmount)}</Text>
                            </View>

                            {/* Transaction Details */}
                            <View className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100">
                                <View className="flex-row items-center justify-between py-2">
                                    <View className="flex-row items-center">
                                        <DollarSign color="#64748B" size={18} />
                                        <Text className="text-slate-600 ml-2">Phí giao dịch</Text>
                                    </View>
                                    <Text className="text-slate-800 font-semibold">{formatCurrency(fee)}</Text>
                                </View>
                                <View className="h-px bg-slate-200 my-2" />
                                <View className="flex-row items-center justify-between py-2">
                                    <View className="flex-row items-center">
                                        <TrendingDown color="#64748B" size={18} />
                                        <Text className="text-slate-600 ml-2">Tổng trừ hạn mức</Text>
                                    </View>
                                    <Text className="text-red-500 font-semibold">{formatCurrency(totalDeduction)}</Text>
                                </View>
                                <View className="h-px bg-slate-200 my-2" />
                                <View className="flex-row items-center justify-between py-2">
                                    <View className="flex-row items-center">
                                        <Wallet color="#64748B" size={18} />
                                        <Text className="text-slate-600 ml-2">Hạn mức còn lại</Text>
                                    </View>
                                    <Text className="text-success font-bold">{formatCurrency(newLimitAfterWithdraw)}</Text>
                                </View>
                            </View>

                            {/* Bank Info */}
                            <View className="flex-row items-center bg-primary-50 p-4 rounded-2xl mb-6 border border-primary-100">
                                <CreditCard color="#2563EB" size={24} />
                                <View className="ml-3">
                                    <Text className="text-slate-500 text-xs mb-0.5">Tài khoản nhận</Text>
                                    <Text className="text-slate-800 font-semibold">
                                        {user?.linkedBank?.bankCode} - ****{user?.linkedBank?.accountNo?.slice(-4)}
                                    </Text>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    className="flex-1 py-4 rounded-2xl border border-slate-200 items-center bg-white"
                                    onPress={() => setShowConfirmModal(false)}
                                    activeOpacity={0.7}
                                >
                                    <Text className="text-slate-600 font-semibold text-base">Hủy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="flex-1 py-4 rounded-2xl bg-success items-center flex-row justify-center"
                                    onPress={handleWithdraw}
                                    disabled={isProcessing}
                                    activeOpacity={0.8}
                                >
                                    {isProcessing ? (
                                        <ActivityIndicator color="white" size="small" />
                                    ) : (
                                        <>
                                            <Check color="white" size={20} />
                                            <Text className="text-white font-bold text-base ml-2">Xác nhận</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
