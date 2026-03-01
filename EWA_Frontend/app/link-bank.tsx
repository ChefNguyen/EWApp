// Màn hình Liên kết Tài khoản Ngân hàng
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { ArrowLeft, Building2, Search, Check, AlertCircle, ChevronDown } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { lookupBankAccount, linkBankAccount } from '../services/api';
import { MOCK_BANKS } from '../data/mockData';

export default function LinkBankScreen() {
    const router = useRouter();
    const { user, updateUser } = useAuth();

    const [selectedBank, setSelectedBank] = useState(null);
    const [accountNo, setAccountNo] = useState('');
    const [accountName, setAccountName] = useState('');
    const [showBankList, setShowBankList] = useState(false);
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [isLinking, setIsLinking] = useState(false);
    const [error, setError] = useState('');
    const [lookupDone, setLookupDone] = useState(false);

    const handleLookup = async () => {
        if (!selectedBank || !accountNo) {
            setError('Vui lòng chọn ngân hàng và nhập số tài khoản');
            return;
        }

        setError('');
        setIsLookingUp(true);
        setLookupDone(false);

        try {
            const result = await lookupBankAccount(selectedBank.code, accountNo);

            if (result.success) {
                setAccountName(result.accountName);
                setLookupDone(true);
            } else {
                setError(result.error);
                setAccountName('');
            }
        } catch (err) {
            setError('Đã xảy ra lỗi khi tra cứu');
        } finally {
            setIsLookingUp(false);
        }
    };

    const handleLink = async () => {
        if (!accountName) {
            setError('Vui lòng tra cứu tài khoản trước');
            return;
        }

        setError('');
        setIsLinking(true);

        try {
            const result = await linkBankAccount(user.id, {
                bankCode: selectedBank.code,
                accountNo,
                accountName,
            });

            if (result.success) {
                // Cập nhật user với thông tin bank mới
                await updateUser({
                    linkedBank: {
                        bankCode: selectedBank.code,
                        accountNo,
                        accountName,
                    }
                });
                router.back();
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Đã xảy ra lỗi khi liên kết');
        } finally {
            setIsLinking(false);
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
                <Text className="font-heading text-lg text-slate-900 ml-3">Liên kết tài khoản</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* Current linked bank */}
                    {user?.linkedBank && (
                        <View className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 mb-6">
                            <View className="flex-row items-center gap-2 mb-2">
                                <Check color="#10B981" size={20} />
                                <Text className="text-emerald-700 font-semibold">Đã liên kết</Text>
                            </View>
                            <Text className="text-slate-700">{user.linkedBank.bankCode} - ****{user.linkedBank.accountNo.slice(-4)}</Text>
                            <Text className="text-slate-500 text-sm">{user.linkedBank.accountName}</Text>
                        </View>
                    )}

                    {/* Bank Selection */}
                    <View className="mb-4">
                        <Text className="font-medium text-slate-700 text-sm mb-2">Chọn ngân hàng</Text>
                        <TouchableOpacity
                            className="flex-row items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-4"
                            onPress={() => setShowBankList(!showBankList)}
                        >
                            {selectedBank ? (
                                <View className="flex-row items-center gap-3">
                                    <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center">
                                        <Building2 color="#4F46E5" size={20} />
                                    </View>
                                    <Text className="font-medium text-slate-800">{selectedBank.name}</Text>
                                </View>
                            ) : (
                                <Text className="text-slate-400">Chọn ngân hàng...</Text>
                            )}
                            <ChevronDown color="#94A3B8" size={20} />
                        </TouchableOpacity>

                        {/* Bank List Dropdown */}
                        {showBankList && (
                            <View className="bg-white border border-slate-200 rounded-xl mt-2 overflow-hidden">
                                {MOCK_BANKS.map((bank) => (
                                    <TouchableOpacity
                                        key={bank.code}
                                        className="flex-row items-center gap-3 px-4 py-3 border-b border-slate-100"
                                        onPress={() => {
                                            setSelectedBank(bank);
                                            setShowBankList(false);
                                            setAccountName('');
                                            setLookupDone(false);
                                        }}
                                    >
                                        <Text className="text-2xl">{bank.logo}</Text>
                                        <Text className="font-medium text-slate-800">{bank.name}</Text>
                                        {selectedBank?.code === bank.code && <Check color="#10B981" size={18} />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Account Number Input */}
                    <View className="mb-4">
                        <Text className="font-medium text-slate-700 text-sm mb-2">Số tài khoản</Text>
                        <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-4">
                            <TextInput
                                className="flex-1 py-4 text-lg font-medium text-slate-900"
                                placeholder="Nhập số tài khoản"
                                placeholderTextColor="#94A3B8"
                                value={accountNo}
                                onChangeText={(text) => {
                                    setAccountNo(text);
                                    setAccountName('');
                                    setLookupDone(false);
                                    setError('');
                                }}
                                keyboardType="number-pad"
                            />
                            <TouchableOpacity
                                className="p-2 bg-primary-100 rounded-lg"
                                onPress={handleLookup}
                                disabled={isLookingUp}
                            >
                                {isLookingUp ? (
                                    <ActivityIndicator size="small" color="#4F46E5" />
                                ) : (
                                    <Search color="#4F46E5" size={20} />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Demo hint */}
                    <View className="bg-primary-50 p-3 rounded-xl mb-4 border border-primary-100">
                        <Text className="text-primary-700 text-xs">
                            💡 Demo STK: <Text className="font-bold">VCB-0987654321</Text> (khớp NV001) hoặc <Text className="font-bold">MB-5555666677</Text> (không khớp)
                        </Text>
                    </View>

                    {/* Account Name Result */}
                    {accountName && (
                        <View className={`p-4 rounded-xl mb-4 ${lookupDone ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-100'}`}>
                            <Text className="text-slate-500 text-sm mb-1">Tên chủ tài khoản</Text>
                            <Text className="text-slate-800 font-bold text-lg">{accountName}</Text>
                        </View>
                    )}

                    {/* Error Message */}
                    {error && (
                        <View className="flex-row items-center mb-4 bg-red-50 p-3 rounded-xl">
                            <AlertCircle color="#EF4444" size={18} />
                            <Text className="text-red-500 text-sm ml-2 font-medium flex-1">{error}</Text>
                        </View>
                    )}

                    {/* Link Button */}
                    {lookupDone && (
                        <TouchableOpacity
                            className={`py-4 rounded-xl items-center ${isLinking ? 'bg-primary-400' : 'bg-primary'}`}
                            onPress={handleLink}
                            disabled={isLinking}
                        >
                            {isLinking ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Xác nhận liên kết</Text>
                            )}
                        </TouchableOpacity>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
