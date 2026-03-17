// Màn hình Thanh toán Hóa đơn (Sprint 2) - Redesigned UI/UX
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { ArrowLeft, FileText, AlertCircle, Check, Shield, X, Zap, Search, MapPin, User, Receipt } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { calculateLimit, lookupBill, payBill } from '../services/api';

type ServiceType = 'ELECTRIC' | 'WATER';

export default function BillPaymentScreen() {
    const router = useRouter();
    const { user, updateUser } = useAuth();

    const [serviceType, setServiceType] = useState<ServiceType>('ELECTRIC');
    const [customerId, setCustomerId] = useState('');
    const [limit, setLimit] = useState(0);
    const [isLooking, setIsLooking] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [billData, setBillData] = useState<any>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        if (user) {
            setLimit(calculateLimit(user as any));
        }
    }, [user]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN').format(value);
    };

    const handleServiceTypeChange = (type: ServiceType) => {
        setServiceType(type);
        setCustomerId('');
        setBillData(null);
        setError('');
    };

    const handleLookup = async () => {
        if (!customerId.trim()) {
            setError('Vui lòng nhập mã khách hàng');
            return;
        }

        setIsLooking(true);
        setError('');
        setBillData(null);

        try {
            const result = await lookupBill(serviceType, customerId.trim());

            if (result.success) {
                setBillData(result.data);
            } else {
                setError(result.error || 'Không tìm thấy hóa đơn');
            }
        } catch (err) {
            setError('Đã xảy ra lỗi, vui lòng thử lại');
        } finally {
            setIsLooking(false);
        }
    };

    const isOverLimit = billData && billData.amount > limit;
    const canPay = billData && !isOverLimit && billData.amount > 0;

    const showConfirmation = () => {
        if (!canPay) return;
        setShowConfirmModal(true);
    };

    const handlePayment = async () => {
        setShowConfirmModal(false);
        setError('');
        setIsProcessing(true);

        try {
            const result = await payBill(user.id, billData.billKey);

            if (result.success) {
                // Cập nhật advancedAmount trong AuthContext
                const newAdvancedAmount = (user.advancedAmount || 0) + billData.amount;
                await updateUser({ advancedAmount: newAdvancedAmount });

                // Navigate tới màn Success
                setTimeout(() => {
                    router.replace({
                        pathname: '/success',
                        params: {
                            transactionType: 'BILL_PAYMENT',
                            amount: billData.amount,
                            fee: 0,
                            netAmount: billData.amount,
                            newLimit: result.data.newLimit,
                            transactionId: result.data.transaction.id,
                            serviceType: billData.serviceType,
                            provider: billData.provider,
                            customerName: billData.customerName,
                            customerId: customerId,
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

    // Adjusted configuration for specific provider themes while keeping the main app theme consistent
    const serviceTypeConfig = {
        ELECTRIC: { label: 'Điện', icon: '⚡', color: '#EAB308', bgColor: 'bg-yellow-500', lightBg: 'bg-yellow-50', prefix: 'EVN' },
        WATER: { label: 'Nước', icon: '💧', color: '#3B82F6', bgColor: 'bg-blue-500', lightBg: 'bg-blue-50', prefix: 'Sawaco' },
    };

    const currentConfig = serviceTypeConfig[serviceType];

    return (
        <SafeAreaView className="flex-1 bg-slate-50">
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View className="flex-row items-center px-6 py-4 bg-white border-b border-slate-100">
                <TouchableOpacity onPress={() => router.back()}>
                    <ArrowLeft color="#334155" size={24} />
                </TouchableOpacity>
                <Text className="font-heading text-lg text-slate-900 ml-3">Thanh toán hóa đơn</Text>
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
                        <Text className="text-primary-200 text-xs mt-2">Miễn phí thanh toán hóa đơn</Text>
                    </View>

                    {/* Service Type Toggle */}
                    <View className="mb-6">
                        <Text className="font-medium text-slate-700 text-sm mb-3">Loại dịch vụ</Text>
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                className={`flex-1 p-4 rounded-2xl border-2 items-center shadow-sm ${
                                    serviceType === 'ELECTRIC'
                                        ? 'border-yellow-400 bg-yellow-50'
                                        : 'border-slate-100 bg-white'
                                }`}
                                onPress={() => handleServiceTypeChange('ELECTRIC')}
                                activeOpacity={0.7}
                            >
                                <Text className="text-3xl mb-2">⚡</Text>
                                <Text className={`font-bold ${serviceType === 'ELECTRIC' ? 'text-yellow-700' : 'text-slate-600'}`}>
                                    Điện (EVN)
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className={`flex-1 p-4 rounded-2xl border-2 items-center shadow-sm ${
                                    serviceType === 'WATER'
                                        ? 'border-blue-400 bg-blue-50'
                                        : 'border-slate-100 bg-white'
                                }`}
                                onPress={() => handleServiceTypeChange('WATER')}
                                activeOpacity={0.7}
                            >
                                <Text className="text-3xl mb-2">💧</Text>
                                <Text className={`font-bold ${serviceType === 'WATER' ? 'text-blue-700' : 'text-slate-600'}`}>
                                    Nước
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Customer ID Input */}
                    <View className="mb-6">
                        <Text className="font-medium text-slate-700 text-sm mb-2">
                            Mã khách hàng {serviceType === 'ELECTRIC' ? '(EVN)' : '(Cấp nước)'}
                        </Text>
                        <View className="flex-row items-center gap-3">
                            <View className="flex-1 flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 shadow-sm">
                                <Receipt color="#64748B" size={20} />
                                <TextInput
                                    className="flex-1 py-4 text-base text-slate-900 ml-3"
                                    placeholder={serviceType === 'ELECTRIC' ? 'VD: PE01234567' : 'VD: DN001234'}
                                    placeholderTextColor="#CBD5E1"
                                    value={customerId}
                                    onChangeText={(text) => {
                                        setCustomerId(text);
                                        setBillData(null);
                                        setError('');
                                    }}
                                    autoCapitalize="characters"
                                />
                            </View>
                            <TouchableOpacity
                                className={`p-4 rounded-2xl shadow-sm ${isLooking ? 'bg-slate-300' : 'bg-primary'}`}
                                onPress={handleLookup}
                                disabled={isLooking}
                                activeOpacity={0.8}
                            >
                                {isLooking ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Search color="white" size={24} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Bill Details */}
                    {billData && (
                        <View className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-6 shadow-sm">
                            {/* Bill Header */}
                            <View className={`p-5 border-b border-slate-100 ${serviceType === 'ELECTRIC' ? 'bg-yellow-50/50' : 'bg-blue-50/50'}`}>
                                <View className="flex-row items-center justify-between">
                                    <Text className="font-bold text-slate-800 text-base">
                                        {currentConfig.icon} Hóa đơn {currentConfig.label}
                                    </Text>
                                    <Text className="text-slate-500 text-sm">Kỳ {billData.period}</Text>
                                </View>
                            </View>

                            {/* Bill Body */}
                            <View className="p-5">
                                <View className="flex-row items-center mb-3">
                                    <User color="#64748B" size={16} />
                                    <Text className="text-slate-500 text-sm ml-2">Khách hàng:</Text>
                                    <Text className="text-slate-800 font-semibold ml-2">{billData.customerName}</Text>
                                </View>
                                <View className="flex-row items-start mb-4">
                                    <MapPin color="#64748B" size={16} />
                                    <Text className="text-slate-500 text-sm ml-2 mt-0.5">Địa chỉ:</Text>
                                    <Text className="text-slate-700 ml-2 flex-1 leading-5">{billData.address}</Text>
                                </View>

                                <View className="h-px bg-slate-100 mb-4" />

                                {/* Amount */}
                                <View className="flex-row justify-between items-center mb-3">
                                    <Text className="text-slate-600">Số tiền thanh toán</Text>
                                    <Text className={`font-heading text-2xl ${isOverLimit ? 'text-red-500' : 'text-slate-900'}`}>
                                        {formatCurrency(billData.amount)} ₫
                                    </Text>
                                </View>
                                <View className="flex-row justify-between items-center mb-3">
                                    <Text className="text-slate-600">Phí giao dịch</Text>
                                    <Text className="text-success font-bold">Miễn phí</Text>
                                </View>
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-slate-600">Nhà cung cấp</Text>
                                    <Text className="text-slate-800 font-medium">{billData.provider}</Text>
                                </View>
                            </View>

                            {isOverLimit && (
                                <View className="bg-red-50 p-4 flex-row items-center mx-5 mb-5 rounded-xl border border-red-100">
                                    <AlertCircle color="#EF4444" size={18} />
                                    <Text className="text-red-600 text-sm ml-2 flex-1 font-medium">
                                        Số tiền hóa đơn vượt quá hạn mức khả dụng
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Free Badge */}
                    {!billData && (
                        <View className="bg-success-50 p-4 rounded-2xl mb-6 flex-row items-center border border-success-100">
                            <Zap color="#10B981" size={20} />
                            <Text className="text-success-700 text-sm ml-2 font-medium flex-1">
                                🎉 Thanh toán hóa đơn <Text className="font-bold">Miễn phí 100%</Text> khi dùng hạn mức lương.
                            </Text>
                        </View>
                    )}

                    {/* Error Message */}
                    {error && (
                        <View className="flex-row items-center mb-4 bg-red-50 p-4 rounded-2xl border border-red-100">
                            <AlertCircle color="#EF4444" size={20} />
                            <Text className="text-red-600 text-sm ml-2 font-medium flex-1">{error}</Text>
                        </View>
                    )}

                    {/* Payment Button */}
                    {billData && (
                        <TouchableOpacity
                            className={`py-4 rounded-2xl items-center flex-row justify-center shadow-sm ${
                                canPay && !isProcessing ? 'bg-success' : 'bg-slate-300'
                            }`}
                            onPress={showConfirmation}
                            disabled={!canPay || isProcessing}
                            activeOpacity={0.8}
                        >
                            {isProcessing ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <FileText color="white" size={24} />
                                    <Text className="text-white font-bold text-lg ml-2">Thanh toán ngay</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

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
                                <Text className="text-white font-heading text-lg ml-2">Xác nhận thanh toán</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                                <X color="white" size={24} />
                            </TouchableOpacity>
                        </View>

                        {/* Modal Body */}
                        <View className="p-6">
                            {/* Amount Display */}
                            <View className="items-center mb-6 pb-6 border-b border-slate-100">
                                <Text className="text-slate-500 text-sm mb-1">Số tiền thanh toán</Text>
                                <Text className="text-primary font-heading text-4xl">
                                    {formatCurrency(billData?.amount || 0)}
                                </Text>
                            </View>

                            {/* Details */}
                            <View className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
                                <View className="flex-row items-center justify-between py-2">
                                    <Text className="text-slate-500">Loại dịch vụ</Text>
                                    <Text className="text-slate-800 font-semibold">
                                        {currentConfig.icon} Hóa đơn {currentConfig.label}
                                    </Text>
                                </View>
                                <View className="h-px bg-slate-200 my-2" />
                                <View className="flex-row items-center justify-between py-2">
                                    <Text className="text-slate-500">Khách hàng</Text>
                                    <Text className="text-slate-800 font-semibold">{billData?.customerName}</Text>
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
                                        {formatCurrency(limit - (billData?.amount || 0))} ₫
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
                                    onPress={handlePayment}
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
