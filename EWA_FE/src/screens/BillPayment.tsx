import React, { useState, useMemo } from 'react';
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
import { BillData } from '../types';
import ConfirmSheet from '../components/ConfirmSheet';
import SuccessScreen from '../components/SuccessScreen';
import TopBar from '../components/TopBar';
import { colors, shadows } from '../theme/colors';

type ServiceType = 'ELECTRIC' | 'WATER';

export default function BillPaymentScreen() {
  const navigation = useNavigation();
  const { employee, refreshEmployee } = useApp();
  const [serviceType, setServiceType] = useState<ServiceType>('ELECTRIC');
  const [customerId, setCustomerId] = useState('');
  const [billData, setBillData] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const limit = useMemo(() => employee ? mockApi.calculateLimit(employee) : 0, [employee]);
  const fmt = (n: number) => n.toLocaleString('vi-VN');

  const handleLookup = async () => {
    if (!customerId.trim()) { setError('Vui lòng nhập mã khách hàng'); return; }
    setLoading(true);
    setError('');
    setBillData(null);
    const result = await mockApi.lookupBill(serviceType, customerId);
    setLoading(false);
    if (result.success) {
      setBillData(result.data as BillData);
    } else {
      setError(result.error || 'Không tìm thấy hóa đơn');
    }
  };

  const handleShowConfirm = () => {
    if (!billData) return;
    if (billData.amount > limit) { setError(`Số tiền (${fmt(billData.amount)}đ) vượt hạn mức (${fmt(limit)}đ)`); return; }
    setShowConfirm(true);
  };

  const handlePay = async () => {
    if (!employee || !billData) return;
    setPaying(true);
    setError('');
    const result = await mockApi.payBill(employee.id, billData.billKey);
    setPaying(false);
    if (result.success) {
      setShowConfirm(false);
      setSuccess(true);
      refreshEmployee();
    } else {
      setShowConfirm(false);
      setError(result.error || 'Thanh toán thất bại');
    }
  };

  if (!employee) return null;

  const serviceName = serviceType === 'ELECTRIC' ? 'Điện (EVN)' : 'Nước';

  if (success) {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}, ${now.getDate().toString().padStart(2,'0')} Th${(now.getMonth()+1).toString().padStart(2,'0')} ${now.getFullYear()}`;
    const txId = `EWA${Date.now().toString().slice(-9)}`;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <SuccessScreen
          title="Giao dịch thành công!"
          subtitle={`Hóa đơn ${serviceName} đã được thanh toán`}
          amountLabel="Số tiền thanh toán"
          amount={`${fmt(billData?.amount || 0)} đ`}
          breakdown={[
            { label: 'Phí dịch vụ', value: 'Miễn phí' },
          ]}
          meta={[
            { label: 'Mã giao dịch', value: txId },
            { label: 'Thời gian', value: timeStr },
            { label: 'Dịch vụ', value: serviceName },
            { label: 'Khách hàng', value: billData?.customerName || '' },
          ]}
          primaryAction={{ label: 'Về Trang chủ', onClick: () => navigation.goBack() }}
          secondaryAction={{ label: 'Giao dịch mới', onClick: () => { setSuccess(false); setBillData(null); setCustomerId(''); } }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopBar title="Thanh toán hóa đơn" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          
          <View style={styles.content}>
            {/* Service Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DỊCH VỤ</Text>
              <View style={styles.serviceRow}>
                <TouchableOpacity
                  onPress={() => { setServiceType('ELECTRIC'); setBillData(null); setError(''); setCustomerId(''); }}
                  style={[styles.serviceCard, serviceType === 'ELECTRIC' && styles.serviceCardActive]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconBox, { backgroundColor: serviceType === 'ELECTRIC' ? colors.indigo600 : colors.white }]}>
                    <Feather name="zap" size={24} color={serviceType === 'ELECTRIC' ? colors.white : colors.indigo400} />
                  </View>
                  <View>
                    <Text style={[styles.serviceStatus, { color: serviceType === 'ELECTRIC' ? colors.indigo600 : colors.slate400 }]}>
                      {serviceType === 'ELECTRIC' ? 'ĐANG CHỌN' : 'CHƯA CHỌN'}
                    </Text>
                    <Text style={[styles.serviceName, { color: serviceType === 'ELECTRIC' ? colors.slate900 : colors.slate500 }]}>Điện (EVN)</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => { setServiceType('WATER'); setBillData(null); setError(''); setCustomerId(''); }}
                  style={[styles.serviceCard, serviceType === 'WATER' && styles.serviceCardActive]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconBox, { backgroundColor: serviceType === 'WATER' ? colors.indigo600 : colors.white }]}>
                    <Feather name="droplet" size={24} color={serviceType === 'WATER' ? colors.white : colors.indigo400} />
                  </View>
                  <View>
                    <Text style={[styles.serviceStatus, { color: serviceType === 'WATER' ? colors.indigo600 : colors.slate400 }]}>
                      {serviceType === 'WATER' ? 'ĐANG CHỌN' : 'CHƯA CHỌN'}
                    </Text>
                    <Text style={[styles.serviceName, { color: serviceType === 'WATER' ? colors.slate900 : colors.slate500 }]}>Nước</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>MÃ KHÁCH HÀNG</Text>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  value={customerId}
                  onChangeText={(val) => { setCustomerId(val.toUpperCase()); setError(''); }}
                  placeholder={serviceType === 'ELECTRIC' ? 'VD: PE01234567' : 'VD: DN001234'}
                  placeholderTextColor={colors.slate300}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  onPress={handleLookup}
                  disabled={loading}
                  style={styles.searchBtn}
                  activeOpacity={0.8}
                >
                  {loading ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="search" size={24} color="#fff" />}
                </TouchableOpacity>
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={16} color={colors.red600} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Bill Details Card */}
            {billData && (
              <View style={styles.billCard}>
                <View style={styles.billHeader}>
                  <View>
                    <Text style={styles.billTag}>CHI TIẾT HÓA ĐƠN</Text>
                    <Text style={styles.billTitle}>Thông tin thanh toán</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: billData.status === 'PAID' ? colors.slate100 : colors.emerald50 }]}>
                    <Text style={[styles.statusText, { color: billData.status === 'PAID' ? colors.slate500 : colors.emerald600 }]}>
                      {billData.status === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}
                    </Text>
                  </View>
                </View>

                <View style={styles.billDetails}>
                  <View style={styles.detailRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>Tên khách hàng</Text>
                      <Text style={styles.detailValue}>{billData.customerName}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.detailLabel}>Kỳ thanh toán</Text>
                      <Text style={styles.detailValue}>{billData.period}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailRowAlt}>
                    <Text style={styles.detailLabel}>Địa chỉ</Text>
                    <Text style={styles.detailValue}>{billData.address}</Text>
                  </View>

                  <View style={styles.amountBox}>
                    <Text style={styles.detailLabel}>Số tiền cần trả</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <Text style={styles.amountText}>{fmt(billData.amount)}</Text>
                      <Text style={styles.amountCurrency}>đ</Text>
                    </View>
                    {billData.amount > limit && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Feather name="alert-circle" size={12} color={colors.red500} />
                        <Text style={styles.limitError}>Vượt hạn mức ({fmt(limit)}đ)</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Fixed Bottom CTA */}
        {billData && billData.status === 'UNPAID' && (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              onPress={handleShowConfirm}
              disabled={billData.amount > limit || billData.amount === 0}
              style={[styles.payBtn, (billData.amount > limit || billData.amount === 0) && { opacity: 0.4 }]}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[colors.indigo600, colors.blue500]} style={styles.payGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.payText}>Thanh toán ngay</Text>
              </LinearGradient>
            </TouchableOpacity>
            <View style={styles.securityRow}>
              <Feather name="shield" size={14} color={colors.slate400} />
              <Text style={styles.securityText}>Giao dịch được bảo mật bởi chuẩn PCI DSS</Text>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      <ConfirmSheet
        visible={showConfirm}
        title="Xác nhận thanh toán"
        icon={<Feather name="file-text" size={22} color={colors.indigo600} />}
        details={[
          { label: 'Dịch vụ', value: serviceName },
          { label: 'Khách hàng', value: billData?.customerName || '' },
          { label: 'Kỳ thanh toán', value: billData?.period || '' },
          { label: 'Số tiền', value: `${fmt(billData?.amount || 0)}đ`, highlight: true },
          { label: 'Phí', value: 'Miễn phí', accent: 'emerald' },
        ]}
        note="Hóa đơn sẽ được cập nhật trạng thái thanh toán ngay sau khi xác nhận."
        confirmLabel="Đồng ý thanh toán"
        loading={paying}
        onConfirm={handlePay}
        onCancel={() => setShowConfirm(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingVertical: 24, gap: 32 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.slate500, letterSpacing: 1.2 },
  serviceRow: { flexDirection: 'row', gap: 16 },
  serviceCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 16, padding: 20,
    gap: 12, borderWidth: 1, borderColor: 'transparent',
  },
  serviceCardActive: { backgroundColor: colors.white, borderColor: 'rgba(79, 70, 229, 0.1)', ...shadows.sm },
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  serviceStatus: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  serviceName: { fontSize: 15, fontWeight: '700' },
  searchRow: { flexDirection: 'row', gap: 10 },
  searchInput: {
    flex: 1, backgroundColor: colors.slate100, borderRadius: 16,
    paddingHorizontal: 20, height: 56, fontSize: 16, fontWeight: '600', color: colors.slate900,
  },
  searchBtn: {
    width: 56, height: 56, backgroundColor: colors.primary, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', ...shadows.primary,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.red50,
    padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#fee2e2',
  },
  errorText: { color: colors.red600, fontSize: 14, fontWeight: '500' },
  billCard: {
    backgroundColor: colors.white, borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: colors.slate100, ...shadows.md,
  },
  billHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  billTag: { fontSize: 10, fontWeight: '700', color: colors.primary, letterSpacing: 1.5, marginBottom: 4 },
  billTitle: { fontSize: 18, fontWeight: '700', color: colors.slate900 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '700' },
  billDetails: { gap: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.slate50, borderStyle: 'dashed', paddingBottom: 16 },
  detailRowAlt: { gap: 4 },
  detailLabel: { fontSize: 11, color: colors.slate400, fontWeight: '500' },
  detailValue: { fontSize: 14, fontWeight: '700', color: colors.slate800 },
  amountBox: { marginTop: 4 },
  amountText: { fontSize: 32, fontWeight: '900', color: colors.indigo600, letterSpacing: -1 },
  amountCurrency: { fontSize: 18, fontWeight: '700', color: colors.indigo600 },
  limitError: { fontSize: 11, color: colors.red500, fontWeight: '600' },
  bottomBar: {
    paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 24 : 16, paddingTop: 16,
    backgroundColor: 'rgba(255,255,255,0.95)', borderTopWidth: 1, borderTopColor: colors.slate100,
  },
  payBtn: { borderRadius: 16, overflow: 'hidden', ...shadows.primary },
  payGradient: { paddingVertical: 18, alignItems: 'center' },
  payText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 },
  securityText: { fontSize: 11, color: colors.slate400, fontWeight: '500' },
});
