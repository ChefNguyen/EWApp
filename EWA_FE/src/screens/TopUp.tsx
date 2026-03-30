import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import * as mockApi from '../services/mockApi';
import { TOPUP_DENOMINATIONS } from '../data/mockData';
import ConfirmSheet from '../components/ConfirmSheet';
import SuccessScreen from '../components/SuccessScreen';
import TopBar from '../components/TopBar';
import { colors, shadows } from '../theme/colors';

export default function TopUpScreen() {
  const navigation = useNavigation();
  const { employee, refreshEmployee } = useApp();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedDenom, setSelectedDenom] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resultData, setResultData] = useState<any>(null);

  useEffect(() => {
    if (employee) {
      setPhoneNumber(employee.phone);
    }
  }, [employee]);

  const limit = useMemo(() => {
    if (!employee) return 0;
    return mockApi.calculateLimit(employee);
  }, [employee]);

  const carrierInfo = useMemo(() => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length >= 3) {
      return mockApi.detectCarrier(cleaned);
    }
    return null;
  }, [phoneNumber]);

  const fmt = (n: number | null | undefined) => {
    if (n == null) return '0';
    return n.toLocaleString('vi-VN');
  };

  const formatPhone = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(cleaned);
    setError('');
  };

  const handleShowConfirm = () => {
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    if (cleanedPhone.length < 10) { setError('Số điện thoại không hợp lệ'); return; }
    if (!selectedDenom) { setError('Vui lòng chọn mệnh giá'); return; }
    if (selectedDenom > limit) { setError(`Mệnh giá vượt hạn mức (${fmt(limit)}đ)`); return; }
    setShowConfirm(true);
  };

  const handleTopup = async () => {
    if (!employee || !selectedDenom) return;
    setLoading(true);
    setError('');
    const result = await mockApi.processTopup(employee.id, phoneNumber.replace(/\D/g, ''), selectedDenom);
    setLoading(false);
    if (result.success) {
      setShowConfirm(false);
      setSuccess(true);
      setResultData(result.data);
      refreshEmployee();
    } else {
      setShowConfirm(false);
      setError(result.error || 'Giao dịch thất bại');
    }
  };

  if (!employee) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <TopBar title="Nạp điện thoại" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.indigo600} />
        </View>
      </SafeAreaView>
    );
  }

  if (success) {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}, ${now.getDate().toString().padStart(2,'0')} Th${(now.getMonth()+1).toString().padStart(2,'0')} ${now.getFullYear()}`;
    const txId = `EWA${Date.now().toString().slice(-9)}`;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <SuccessScreen
          title="Giao dịch thành công!"
          subtitle="Nạp tiền điện thoại đã được xử lý"
          amountLabel="Mệnh giá nạp"
          amount={`${fmt(selectedDenom!)} đ`}
          breakdown={[
            { label: 'Phí dịch vụ', value: 'Miễn phí' },
          ]}
          meta={[
            { label: 'Mã giao dịch', value: txId },
            { label: 'Thời gian', value: timeStr },
            { label: 'Số điện thoại', value: formatPhone(phoneNumber) },
            { label: 'Nhà mạng', value: carrierInfo?.carrier.name || 'Không xác định' },
          ]}
          primaryAction={{ label: 'Về Trang chủ', onClick: () => navigation.goBack() }}
          secondaryAction={{ label: 'Giao dịch mới', onClick: () => { setSuccess(false); setSelectedDenom(null); setResultData(null); } }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopBar title="Nạp điện thoại" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          
          <View style={styles.content}>
            {/* Phone Input Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>THÔNG TIN THUÊ BAO</Text>
                {carrierInfo && (
                  <View style={[styles.carrierBadge, { backgroundColor: `${carrierInfo.carrier.color}15` }]}>
                    <Feather name="check" size={12} color={carrierInfo.carrier.color} />
                    <Text style={[styles.carrierText, { color: carrierInfo.carrier.color }]}>{carrierInfo.carrier.name}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Feather name="smartphone" size={20} color={colors.indigo600} />
                </View>
                <TextInput
                  style={styles.phoneInput}
                  value={formatPhone(phoneNumber)}
                  onChangeText={handlePhoneChange}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor={colors.slate300}
                  keyboardType="phone-pad"
                  maxLength={13} // with spaces
                />
                <TouchableOpacity style={styles.contactBtn}>
                  <Feather name="users" size={20} color={colors.slate400} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Denominations Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>CHỌN MỆNH GIÁ</Text>
                <View style={styles.freeBadge}>
                  <Text style={styles.freeText}>Phí: 0đ (Miễn phí)</Text>
                </View>
              </View>

              <View style={styles.grid}>
                {TOPUP_DENOMINATIONS.map((denom) => {
                  const isSelected = selectedDenom === denom;
                  const isOverLimit = denom > limit;
                  return (
                    <TouchableOpacity
                      key={denom}
                      onPress={() => { if (!isOverLimit) { setSelectedDenom(denom); setError(''); } }}
                      disabled={isOverLimit}
                      style={[
                        styles.gridItem,
                        isSelected ? styles.gridItemActive : isOverLimit ? styles.gridItemDisabled : styles.gridItemDefault
                      ]}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.denomText, isSelected ? styles.denomTextActive : {}]}>{fmt(denom)}đ</Text>
                      {isOverLimit && <Text style={styles.overLimitTag}>Vượt hạn mức</Text>}
                      {isSelected && (
                        <View style={styles.checkBadge}>
                          <Feather name="check" size={10} color="#fff" strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Limit Info */}
            <View style={styles.limitBox}>
              <Text style={styles.limitLabel}>Hạn mức hiện tại: </Text>
              <Text style={styles.limitValue}>{fmt(limit)}đ</Text>
            </View>

            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
          </View>
        </ScrollView>

        {/* Bottom Action */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={handleShowConfirm}
            disabled={!selectedDenom}
            style={[styles.submitBtn, !selectedDenom && { opacity: 0.4 }]}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[colors.indigo600, colors.blue500]} style={styles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.submitText}>
                {selectedDenom ? `Nạp ${fmt(selectedDenom)}đ` : 'Chọn mệnh giá'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ConfirmSheet
        visible={showConfirm}
        title="Xác nhận nạp tiền"
        icon={<Feather name="phone" size={22} color={colors.indigo600} />}
        details={[
          { label: 'Số điện thoại', value: formatPhone(phoneNumber) },
          { label: 'Nhà mạng', value: carrierInfo?.carrier.name || 'Không xác định' },
          { label: 'Mệnh giá', value: `${fmt(selectedDenom!)}đ`, highlight: true },
          { label: 'Phí', value: 'Miễn phí', accent: 'emerald' },
        ]}
        note="Thẻ nạp sẽ được kích hoạt ngay sau khi xác nhận giao dịch."
        confirmLabel="Đồng ý nạp tiền"
        loading={loading}
        onConfirm={handleTopup}
        onCancel={() => setShowConfirm(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingVertical: 24, gap: 24 },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.slate500, letterSpacing: 1.2 },
  carrierBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  carrierText: { fontSize: 10, fontWeight: '700' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderRadius: 16, borderWidth: 1, borderColor: colors.slate100,
    ...shadows.sm,
  },
  inputIcon: { paddingLeft: 16, paddingRight: 12 },
  phoneInput: { flex: 1, paddingVertical: 16, fontSize: 20, fontWeight: '700', color: colors.slate900 },
  contactBtn: { paddingHorizontal: 16, paddingVertical: 16 },
  freeBadge: { backgroundColor: colors.emerald50, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  freeText: { fontSize: 10, fontWeight: '700', color: colors.emerald600 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: {
    width: '48%', padding: 16, borderRadius: 16, position: 'relative', overflow: 'hidden',
    borderWidth: 1, height: 80, justifyContent: 'center',
  },
  gridItemDefault: { backgroundColor: colors.white, borderColor: colors.slate100, ...shadows.sm },
  gridItemActive: { backgroundColor: colors.indigo50, borderColor: colors.indigo600, borderWidth: 2 },
  gridItemDisabled: { backgroundColor: colors.slate50, borderColor: colors.slate100, opacity: 0.5 },
  denomText: { fontSize: 20, fontWeight: '900', color: colors.slate800 },
  denomTextActive: { color: colors.indigo700 },
  overLimitTag: { fontSize: 10, fontWeight: '700', color: colors.red500, textTransform: 'uppercase', marginTop: 2 },
  checkBadge: {
    position: 'absolute', top: 0, right: 0, width: 24, height: 24,
    backgroundColor: colors.indigo600, borderBottomLeftRadius: 12,
    alignItems: 'center', justifyContent: 'center', paddingTop: 2, paddingLeft: 4,
  },
  limitBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(79, 70, 229, 0.05)',
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
  },
  limitLabel: { fontSize: 12, color: colors.slate600, fontWeight: '500' },
  limitValue: { fontSize: 12, fontWeight: '700', color: colors.indigo600 },
  errorBox: { backgroundColor: colors.red50, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#fee2e2' },
  errorText: { color: colors.red600, fontSize: 14, fontWeight: '500' },
  bottomBar: {
    paddingHorizontal: 24, paddingVertical: 20, backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1, borderTopColor: colors.slate100,
  },
  submitBtn: { borderRadius: 16, overflow: 'hidden', ...shadows.primary },
  submitGradient: { paddingVertical: 18, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
