// Màn hình Nạp tiền điện thoại (Sprint 2) - Redesigned UI/UX
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { ArrowLeft, Smartphone, AlertCircle, Check, Shield, X, Zap, Phone } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { calculateLimit, detectCarrier, processTopup } from '../services/api';
import { TOPUP_DENOMINATIONS } from '../data/mockData';

export default function TopupScreen() {
    const router = useRouter();
    const { user, updateUser } = useAuth();

    const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
    const [selectedDenomination, setSelectedDenomination] = useState<number | null>(null);
    const [limit, setLimit] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Nhận diện nhà mạng
    const carrierInfo = phoneNumber.length >= 3 ? detectCarrier(phoneNumber) : null;

    useEffect(() => {
        if (user) {
            setLimit(calculateLimit(user as any));
        }
    }, [user]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN').format(value);
    };

    const formatPhoneDisplay = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length <= 4) return cleaned;
        if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 10)}`;
    };

    const handlePhoneChange = (text: string) => {
        const numericValue = text.replace(/[^\d]/g, '');
        if (numericValue.length <= 10) {
            setPhoneNumber(numericValue);
        }
        setError('');
    };

    const isValidPhone = phoneNumber.length === 10 && phoneNumber.startsWith('0');
    const canTopup = isValidPhone && selectedDenomination !== null && selectedDenomination <= limit;

    const showConfirmation = () => {
        if (!canTopup) return;
        setShowConfirmModal(true);
    };

    const handleTopup = async () => {
        setShowConfirmModal(false);
        setError('');
        setIsProcessing(true);

        try {
            const result = await processTopup(user.id, phoneNumber, selectedDenomination!);

            if (result.success) {
                // Cập nhật advancedAmount trong AuthContext
                const newAdvancedAmount = (user.advancedAmount || 0) + selectedDenomination!;
                await updateUser({ advancedAmount: newAdvancedAmount });

                // Navigate tới màn Success
                setTimeout(() => {
                    router.replace({
                        pathname: '/success',
                        params: {
                            transactionType: 'TOPUP',
                            amount: selectedDenomination,
                            fee: 0,
                            netAmount: selectedDenomination,
                            newLimit: result.data.newLimit,
                            transactionId: result.data.transaction.id,
                            phoneNumber: phoneNumber,
                            carrier: carrierInfo?.carrier.name || 'Không xác định',
                            transactionTime: new Date().toISOString(),
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

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View className="flex-row items-center px-6 py-4 bg-white border-b border-slate-100">
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft color="#334155" size={24} />
                </TouchableOpacity>
                <Text className="font-heading text-lg text-slate-900 ml-3">Nạp tiền điện thoại</Text>
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
                        <Text className="text-primary-200 text-xs mt-2">Miễn phí giao dịch nạp tiền</Text>
                    </View>

                    {/* Phone Number Input */}
                    <View className="mb-6">
                        <Text className="font-medium text-slate-700 text-sm mb-2">Số điện thoại</Text>
                        <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 shadow-sm">
                            <Phone color="#64748B" size={20} />
                            <TextInput
                                className="flex-1 py-4 text-lg text-slate-900 ml-3"
                                placeholder="0901 234 567"
                                placeholderTextColor="#CBD5E1"
                                value={formatPhoneDisplay(phoneNumber)}
                                onChangeText={handlePhoneChange}
                                keyboardType="phone-pad"
                                maxLength={13}
                            />
                            {carrierInfo && (
                                <View 
                                    className="px-3 py-1.5 rounded-full"
                                    style={{ backgroundColor: carrierInfo.carrier.color + '15' }}
                                >
                                    <Text 
                                        className="text-xs font-bold"
                                        style={{ color: carrierInfo.carrier.color }}
                                    >
                                        {carrierInfo.carrier.name}
                                    </Text>
                                </View>
                            )}
                        </View>
                        {phoneNumber.length >= 3 && !carrierInfo && (
                            <View className="flex-row items-center mt-2">
                                <AlertCircle color="#F59E0B" size={14} />
                                <Text className="text-amber-600 text-xs ml-1">Không nhận diện được nhà mạng</Text>
                            </View>
                        )}
                    </View>

                    {/* Denomination Selection */}
                    <View className="mb-6">
                        <Text className="font-medium text-slate-700 text-sm mb-3">Chọn mệnh giá</Text>
                        <View className="flex-row flex-wrap gap-3">
                            {TOPUP_DENOMINATIONS.map((denom) => {
                                const isOverLimit = denom > limit;
                                const isSelected = selectedDenomination === denom;
                                return (
                                    <TouchableOpacity
                                        key={denom}
                                        className={`w-[30%] py-4 rounded-2xl items-center border shadow-sm ${
                                            isSelected
                                                ? 'bg-primary border-primary'
                                                : isOverLimit
                                                    ? 'bg-slate-100 border-slate-200'
                                                    : 'bg-white border-slate-100'
                                        }`}
                                        onPress={() => {
                                            if (!isOverLimit) {
                                                setSelectedDenomination(denom);
                                                setError('');
                                            }
                                        }}
                                        disabled={isOverLimit}
                                        activeOpacity={0.7}
                                    >
                                        <Text className={`font-bold text-base ${
                                            isSelected
                                                ? 'text-white'
                                                : isOverLimit
                                                    ? 'text-slate-300'
                                                    : 'text-slate-800'
                                        }`}>
                                            {formatCurrency(denom)}
                                        </Text>
                                        <Text className={`text-xs mt-0.5 ${
                                            isSelected
                                                ? 'text-primary-100'
                                                : isOverLimit
                                                    ? 'text-slate-300'
                                                    : 'text-slate-400'
                                        }`}>
                                            VND
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Transaction Summary */}
                    {selectedDenomination && (
                        <View className="bg-white p-5 rounded-2xl border border-slate-100 mb-6 shadow-sm">
                            <View className="flex-row justify-between mb-3">
                                <Text className="text-slate-500">Mệnh giá nạp</Text>
                                <Text className="text-slate-800 font-medium">{formatCurrency(selectedDenomination)} ₫</Text>
                            </View>
                            <View className="flex-row justify-between mb-3">
                                <Text className="text-slate-500">Phí giao dịch</Text>
                                <Text className="text-success font-bold">Miễn phí</Text>
                            </View>
                            <View className="h-px bg-slate-100 mb-3" />
                            <View className="flex-row justify-between items-center">
                                <Text className="text-slate-600 font-medium">Tổng trừ hạn mức</Text>
                                <Text className="text-slate-900 font-heading text-lg">{formatCurrency(selectedDenomination)} ₫</Text>
                            </View>
                        </View>
                    )}

                    {/* Free Badge */}
                    <View className="bg-success-50 p-4 rounded-2xl mb-6 flex-row items-center border border-success-100">
                        <Zap color="#10B981" size={20} />
                        <Text className="text-success-700 text-sm ml-2 font-medium flex-1">
                            🎉 Nạp tiền điện thoại <Text className="font-bold">Miễn phí 100%</Text> khi dùng hạn mức lương.
                        </Text>
                    </View>

                    {/* Error Message */}
                    {error && (
                        <View className="flex-row items-center mb-4 bg-red-50 p-4 rounded-2xl border border-red-100">
                            <AlertCircle color="#EF4444" size={20} />
                            <Text className="text-red-600 text-sm ml-2 font-medium flex-1">{error}</Text>
                        </View>
                    )}

                    {/* Topup Button */}
                    <TouchableOpacity
                        className={`py-4 rounded-2xl items-center flex-row justify-center shadow-sm ${
                            canTopup && !isProcessing ? 'bg-success' : 'bg-slate-300'
                        }`}
                        onPress={showConfirmation}
                        disabled={!canTopup || isProcessing}
                        activeOpacity={0.8}
                    >
                        {isProcessing ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Smartphone color="white" size={24} />
                                <Text className="text-white font-bold text-lg ml-2">Nạp tiền ngay</Text>
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
                                <Text className="text-white font-heading text-lg ml-2">Xác nhận nạp tiền</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                                <X color="white" size={24} />
                            </TouchableOpacity>
                        </View>

                        {/* Modal Body */}
                        <View className="p-6">
                            {/* Amount Display */}
                            <View className="items-center mb-6 pb-6 border-b border-slate-100">
                                <Text className="text-slate-500 text-sm mb-1">Mệnh giá nạp</Text>
                                <Text className="text-primary font-heading text-4xl">{formatCurrency(selectedDenomination || 0)}</Text>
                            </View>

                            {/* Details */}
                            <View className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
                                <View className="flex-row items-center justify-between py-2">
                                    <Text className="text-slate-500">Số điện thoại</Text>
                                    <Text className="text-slate-800 font-semibold">{formatPhoneDisplay(phoneNumber)}</Text>
                                </View>
                                <View className="h-px bg-slate-200 my-2" />
                                <View className="flex-row items-center justify-between py-2">
                                    <Text className="text-slate-500">Nhà mạng</Text>
                                    <Text className="font-semibold" style={{ color: carrierInfo?.carrier.color || '#64748B' }}>
                                        {carrierInfo?.carrier.name || 'Không xác định'}
                                    </Text>
                                </View>
                                <View className="h-px bg-slate-200 my-2" />
                                <View className="flex-row items-center justify-between py-2">
                                    <Text className="text-slate-500">Phí giao dịch</Text>
                                    <Text className="text-success font-bold">Miễn phí</Text>
                                </View>
                                <View className="h-px bg-slate-200 my-2" />
                                <View className="flex-row items-center justify-between py-2">
                                    <Text className="text-slate-500">Hạn mức còn lại</Text>
                                    <Text className="text-success font-bold">
                                        {formatCurrency(limit - (selectedDenomination || 0))} ₫
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
                                    onPress={handleTopup}
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
