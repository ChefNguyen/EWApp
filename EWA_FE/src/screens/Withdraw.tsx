import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import * as mockApi from '../services/mockApi';
import { MOCK_BANKS } from '../data/mockData';
import ConfirmSheet from '../components/ConfirmSheet';
import SuccessScreen from '../components/SuccessScreen';
import TopBar from '../components/TopBar';
import { colors, shadows } from '../theme/colors';

const QUICK_AMOUNTS = [500000, 1000000, 2000000, 3000000];

export default function WithdrawScreen() {
  const navigation = useNavigation();
  const { employee, refreshEmployee } = useApp();
  const [amountStr, setAmountStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resultData, setResultData] = useState<any>(null);

  useEffect(() => { refreshEmployee(); }, []);

  const limit = useMemo(() => employee ? mockApi.calculateLimit(employee) : 0, [employee]);
  const amount = useMemo(() => {
    const n = parseInt(amountStr.replace(/\D/g, ''), 10);
    return isNaN(n) ? 0 : n;
  }, [amountStr]);
  const fee = useMemo(() => amount > 0 ? mockApi.calculateFee(amount) : 0, [amount]);
  const totalDeduction = amount + fee;

  const fmt = (n: number) => n.toLocaleString('vi-VN');
  const formatInput = (val: string) => {
    const num = parseInt(val.replace(/\D/g, ''), 10);
    if (isNaN(num) || num === 0) return '';
    return num.toLocaleString('vi-VN');
  };

  const handleAmountChange = (val: string) => {
    const raw = val.replace(/\D/g, '');
    setAmountStr(raw ? formatInput(raw) : '');
    setError('');
  };

  const handleShowConfirm = () => {
    if (!employee) return;
    if (amount <= 0) { setError('Vui lòng nhập số tiền rút'); return; }
    if (!employee.linkedBank) { setError('Vui lòng liên kết ngân hàng trước khi rút tiền'); return; }
    if (totalDeduction > limit) { setError(`Số tiền rút + phí (${fmt(totalDeduction)}đ) vượt quá hạn mức (${fmt(limit)}đ)`); return; }
    setShowConfirm(true);
  };

  const handleWithdraw = async () => {
    if (!employee) return;
    setLoading(true);
    setError('');
    const result = await mockApi.processWithdrawal(employee.id, amount);
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

  if (!employee) return null;

  const bankName = employee.linkedBank
    ? (MOCK_BANKS.find(b => b.code === employee.linkedBank!.bankCode)?.name || employee.linkedBank.bankCode)
    : null;

  if (success) {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}, ${now.getDate().toString().padStart(2,'0')} Th${(now.getMonth()+1).toString().padStart(2,'0')} ${now.getFullYear()}`;
    const txId = `EWA${Date.now().toString().slice(-9)}`;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <SuccessScreen
          title="Giao dịch thành công!"
          subtitle="Khoản ứng lương của bạn đã được xử lý"
          amountLabel="Số tiền nhận thực tế"
          amount={`${fmt(amount)} đ`}
          breakdown={[
            { label: 'Số tiền ứng', value: `${fmt(amount + fee)} đ` },
            { label: 'Phí dịch vụ', value: `${fmt(fee)} đ` },
          ]}
          meta={[
            { label: 'Mã giao dịch', value: txId },
            { label: 'Thời gian', value: timeStr },
            { label: 'Phương thức', value: `${bankName} ****${employee.linkedBank?.accountNo.slice(-4)}` },
          ]}
          primaryAction={{ label: 'Về Trang chủ', onClick: () => navigation.goBack() }}
          secondaryAction={{ label: 'Giao dịch mới', onClick: () => { setSuccess(false); setAmountStr(''); setResultData(null); } }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopBar title="Rút tiền" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

          {/* Balance Hero */}
          <View style={styles.heroCard}>
            <LinearGradient colors={[colors.indigo600, colors.blue500]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <Text style={styles.heroLabel}>Hạn mức khả dụng</Text>
            <Text style={styles.heroAmount}>{fmt(limit)}<Text style={styles.heroUnit}> đ</Text></Text>
          </View>

          <View style={styles.content}>
            {/* Bank */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>NGÂN HÀNG NHẬN</Text>
                <TouchableOpacity onPress={() => navigation.navigate('LinkBank' as never)}>
                  <Text style={styles.linkAction}>Thay đổi</Text>
                </TouchableOpacity>
              </View>
              {employee.linkedBank ? (
                <TouchableOpacity style={styles.bankCard} onPress={() => navigation.navigate('LinkBank' as never)} activeOpacity={0.8}>
                  <View style={styles.bankIcon}>
                    <Feather name="credit-card" size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bankName}>{bankName}</Text>
                    <Text style={styles.bankSub}>**** {employee.linkedBank.accountNo.slice(-4)} • {employee.linkedBank.accountName}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.slate300} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.noBankCard} onPress={() => navigation.navigate('LinkBank' as never)} activeOpacity={0.8}>
                  <Feather name="alert-circle" size={22} color={colors.warning} />
                  <Text style={styles.noBankText}>Chưa có tài khoản liên kết. Nhấn để thêm.</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Amount */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SỐ TIỀN RÚT</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.amountInput}
                  value={amountStr}
                  onChangeText={handleAmountChange}
                  placeholder="0"
                  placeholderTextColor={colors.slate300}
                  keyboardType="number-pad"
                />
                <Text style={styles.currency}>đ</Text>
              </View>
              <View style={styles.quickGrid}>
                {QUICK_AMOUNTS.map(val => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => { setAmountStr(formatInput(val.toString())); setError(''); }}
                    style={[styles.quickBtn, amount === val && styles.quickBtnActive]}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.quickBtnText, amount === val && styles.quickBtnTextActive]}>{fmt(val)}đ</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Fee Info */}
            {amount > 0 && (
              <View style={styles.feeCard}>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Phí giao dịch</Text>
                  <Text style={styles.feeValue}>{fmt(fee)} đ</Text>
                </View>
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Tiền thực nhận</Text>
                  <Text style={[styles.feeValue, { color: colors.success }]}>{fmt(amount)} đ</Text>
                </View>
                {totalDeduction > limit && (
                  <View style={styles.overLimitRow}>
                    <Feather name="alert-circle" size={13} color={colors.red500} />
                    <Text style={styles.overLimitText}>Số tiền + phí vượt hạn mức khả dụng!</Text>
                  </View>
                )}
              </View>
            )}

            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
          </View>
        </ScrollView>

        {/* Fixed bottom button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={handleShowConfirm}
            disabled={amount <= 0}
            style={[styles.submitBtn, amount <= 0 && { opacity: 0.4 }]}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[colors.indigo600, colors.blue500]} style={styles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.submitText}>Xác nhận rút tiền</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ConfirmSheet
        visible={showConfirm}
        title="Xác nhận rút tiền"
        icon={<Feather name="credit-card" size={22} color={colors.indigo600} />}
        details={[
          { label: 'Ngân hàng', value: bankName || '' },
          { label: 'Tài khoản', value: `****${employee.linkedBank?.accountNo.slice(-4)}` },
          { label: 'Số tiền rút', value: `${fmt(amount)}đ`, highlight: true },
          { label: 'Phí giao dịch', value: `${fmt(fee)}đ` },
          { label: 'Tổng trừ hạn mức', value: `${fmt(totalDeduction)}đ`, accent: 'indigo' },
        ]}
        note="Tiền sẽ được chuyển về tài khoản ngân hàng của bạn ngay lập tức sau khi xác nhận."
        confirmLabel="Đồng ý rút tiền"
        loading={loading}
        onConfirm={handleWithdraw}
        onCancel={() => setShowConfirm(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  heroCard: { margin: 20, borderRadius: 20, padding: 24, overflow: 'hidden', ...shadows.primary },
  heroLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: 8 },
  heroAmount: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  heroUnit: { fontSize: 20, fontWeight: '700' },
  content: { paddingHorizontal: 20, gap: 20 },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1.2, textTransform: 'uppercase' },
  linkAction: { fontSize: 12, fontWeight: '700', color: colors.primary },
  bankCard: {
    backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: colors.slate100,
  },
  bankIcon: { width: 48, height: 48, backgroundColor: colors.surfaceVariant, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bankName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  bankSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  noBankCard: {
    backgroundColor: colors.warningLight, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#fef3c7',
  },
  noBankText: { fontSize: 13, fontWeight: '700', color: colors.warning, flex: 1 },
  inputWrap: { position: 'relative' },
  amountInput: {
    backgroundColor: colors.surfaceVariant, borderRadius: 14, padding: 20,
    fontSize: 28, fontWeight: '700', color: colors.primary,
  },
  currency: { position: 'absolute', right: 20, top: '50%', transform: [{ translateY: -12 }], fontSize: 18, fontWeight: '700', color: colors.primary },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickBtn: {
    flex: 1, minWidth: '45%', backgroundColor: colors.white, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.slate100,
  },
  quickBtnActive: { backgroundColor: colors.indigo50, borderColor: colors.indigo600 },
  quickBtnText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  quickBtnTextActive: { color: colors.indigo700 },
  feeCard: {
    backgroundColor: colors.indigo50, borderRadius: 14, padding: 16, gap: 10,
    borderLeftWidth: 4, borderLeftColor: colors.primary,
  },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  feeLabel: { fontSize: 13, color: colors.textSecondary },
  feeValue: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  overLimitRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  overLimitText: { fontSize: 12, color: colors.red500, fontWeight: '500' },
  errorBox: {
    backgroundColor: colors.red50, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#fecaca',
  },
  errorText: { color: colors.red600, fontSize: 13, fontWeight: '500' },
  bottomBar: {
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 24 : 16, paddingTop: 16,
    backgroundColor: 'rgba(255,255,255,0.9)', borderTopWidth: 1, borderTopColor: colors.slate100,
  },
  submitBtn: { borderRadius: 14, overflow: 'hidden' },
  submitGradient: { paddingVertical: 18, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
