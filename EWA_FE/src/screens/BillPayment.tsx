import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import * as mockApi from '../services/mockApi';
import { BillData } from '../types';
import ConfirmSheet from '../components/ConfirmSheet';
import SuccessScreen from '../components/SuccessScreen';
import TopBar from '../components/TopBar';
import { colors, shadows } from '../theme/colors';

type ServiceType = 'ELECTRIC' | 'WATER' | 'INTERNET' | 'TV' | 'TUITION' | 'APARTMENT';

const SERVICES: { id: ServiceType; name: string; icon: any; color: string; bg: string; placeholder: string }[] = [
  { id: 'ELECTRIC', name: 'Điện', icon: 'zap', color: '#ffffff', bg: '#1a237e', placeholder: 'VD: PE01234567' },
  { id: 'WATER', name: 'Nước', icon: 'droplet', color: '#0056c5', bg: '#E3F2FD', placeholder: 'VD: DN001234' },
  { id: 'INTERNET', name: 'Internet', icon: 'wifi', color: '#7e22ce', bg: '#F3E5F5', placeholder: 'VD: INT001' },
  { id: 'TV', name: 'Truyền hình', icon: 'tv', color: '#ea580c', bg: '#FFF3E0', placeholder: 'VD: TV001' },
  { id: 'TUITION', name: 'Học phí', icon: 'book', color: '#15803d', bg: '#E8F5E9', placeholder: 'VD: TUI001' },
  { id: 'APARTMENT', name: 'Phí chung cư', icon: 'home', color: '#0f766e', bg: '#E0F2F1', placeholder: 'VD: APT001' },
];

export default function BillPaymentScreen() {
  const navigation = useNavigation();
  const { employee, refreshEmployee } = useApp();
  const [serviceType, setServiceType] = useState<ServiceType>('ELECTRIC');
  const [limit, setLimit] = useState(0);
  const [billFee, setBillFee] = useState(0);
  const [customerId, setCustomerId] = useState('');
  const [billData, setBillData] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const fmt = (n: number) => {
    if (n === null || n === undefined || isNaN(n)) return '0';
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  useFocusEffect(
    useCallback(() => {
      if (!employee?.token) return;
      mockApi.getAvailableLimit(employee).then(setLimit);
    }, [employee?.token])
  );

  const totalBillDebit = useMemo(() => (billData?.amount || 0) + billFee, [billData?.amount, billFee]);

  const estimateBillFee = useCallback((amount: number) => {
    let fee = 0;
    if (amount > 500000) fee += 10000;
    if (amount > 1000000) fee += 20000;
    return fee;
  }, []);

  const handleLookup = async (typeOverride?: ServiceType, idOverride?: string) => {
    const sType = typeOverride || serviceType;
    const cId = (idOverride !== undefined ? idOverride : customerId).trim();
    
    if (typeOverride) setServiceType(typeOverride);
    if (idOverride !== undefined) setCustomerId(cId);

    if (!cId) { setError('Vui lòng nhập mã khách hàng'); return; }
    setLoading(true);
    setError('');
    setBillData(null);
    const result = await mockApi.lookupBill(sType, cId);
    setLoading(false);
    if (result.success && result.data) {
      // Đảm bảo billKey được set đúng
      const billDataWithKey = result.data as BillData;
      console.log('Bill data received:', billDataWithKey);
      console.log('Bill status:', billDataWithKey.status);
      console.log('Should show button:', billDataWithKey.status === 'UNPAID');
      setBillFee(estimateBillFee(billDataWithKey.amount));
      setBillData(billDataWithKey);
    } else {
      setError(result.error || 'Không tìm thấy hóa đơn');
    }
  };

  const handleShowConfirm = () => {
    if (!billData) {
      setError('Không có thông tin hóa đơn');
      return;
    }
    if (totalBillDebit > limit) {
      setError(`Tổng thanh toán (${fmt(totalBillDebit)}đ) vượt hạn mức (${fmt(limit)}đ)`);
      return;
    }
    setError(''); // Clear any existing errors
    setShowConfirm(true);
  };

  const handleCancelConfirm = () => {
    setShowConfirm(false);
    setError(''); // Clear errors when canceling
  };

  const handlePay = async () => {
    if (!employee || !billData) {
      setShowConfirm(false);
      setError('Thiếu thông tin nhân viên hoặc hóa đơn');
      return;
    }
    if (!billData.billKey) {
      setShowConfirm(false);
      setError('Thiếu thông tin billKey');
      return;
    }
    setPaying(true);
    setError('');
    console.log('Paying bill with key:', billData.billKey);
    
    try {
      const result = await mockApi.payBill(employee, billData.billKey);
      setPaying(false);
      
      if (result.success) {
        setShowConfirm(false);
        setSuccess(true);
        setLimit(result.data?.newLimit ?? limit);
        setBillFee(result.data?.billFeeVnd ?? billFee);
        refreshEmployee();
      } else {
        setShowConfirm(false);
        setError(result.error || 'Thanh toán thất bại');
      }
    } catch (err) {
      setPaying(false);
      setShowConfirm(false);
      setError('Có lỗi xảy ra khi thanh toán');
      console.error('Payment error:', err);
    }
  };

  if (!employee) return null;

  const activeService = SERVICES.find((s) => s.id === serviceType);
  const serviceName = activeService?.name || 'Dịch vụ';

  // Debug logging
  console.log('BillPayment render - billData:', billData);
  console.log('BillPayment render - should show button:', !!billData);
  console.log('BillPayment render - bill status:', billData?.status);

  if (success) {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}, ${now.getDate().toString().padStart(2,'0')} Th${(now.getMonth()+1).toString().padStart(2,'0')} ${now.getFullYear()}`;
    const txId = `EWA${Date.now().toString().slice(-9)}`;
    
    const handleBackToDashboard = () => {
      setSuccess(false);
      setBillData(null);
      setCustomerId('');
      setError('');
      navigation.goBack();
    };
    
    const handleNewTransaction = () => {
      setSuccess(false);
      setBillData(null);
      setCustomerId('');
      setError('');
    };
    
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <SuccessScreen
          title="Giao dịch thành công!"
          subtitle={`Hóa đơn ${serviceName} đã được thanh toán`}
          amountLabel="Số tiền thanh toán"
          amount={`${fmt(billData?.amount || 0)} đ`}
          breakdown={[
            { label: 'Phí dịch vụ', value: `${fmt(billFee)} đ` },
            { label: 'Tổng trừ hạn mức', value: `${fmt(totalBillDebit)} đ` },
          ]}
          meta={[
            { label: 'Mã giao dịch', value: txId },
            { label: 'Thời gian', value: timeStr },
            { label: 'Dịch vụ', value: serviceName },
            { label: 'Khách hàng', value: billData?.customerName || '' },
          ]}
          primaryAction={{ label: 'Về Trang chủ', onClick: handleBackToDashboard }}
          secondaryAction={{ label: 'Giao dịch mới', onClick: handleNewTransaction }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopBar title="Thanh toán hóa đơn" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView 
          style={styles.scroll} 
          contentContainerStyle={{ paddingBottom: 24 }} 
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          
          <View style={styles.content}>
            
            {/* Search Top Bar */}
            <View style={styles.searchContainer}>
              <Feather name="search" size={20} color="#767683" />
              <TextInput
                style={styles.searchTopInput}
                value={customerId}
                onChangeText={(val) => { setCustomerId(val.toUpperCase()); setError(''); }}
                placeholder={activeService?.placeholder || 'Tìm kiếm nhà cung cấp dịch vụ...'}
                placeholderTextColor="#767683"
                autoCapitalize="characters"
              />
              <TouchableOpacity
                onPress={() => handleLookup()}
                disabled={loading}
                style={{ padding: 8 }}
                activeOpacity={0.8}
              >
                {loading ? <ActivityIndicator size="small" color="#1a237e" /> : <Feather name="arrow-right" size={20} color={customerId.length > 0 ? '#1a237e' : '#c6c5d4'} />}
              </TouchableOpacity>
            </View>

            {/* Only show promo banner when no bill data */}
            {!billData && (
              <View style={styles.promoBanner}>
                <Image 
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1UxJP8tbUo4sYL4GqBhFwcH8-eBIjPrVpwJRvOEinVJB5tcNqqoI60zK5U6QE243ewWwEFTu7QnsWC3CVD4NmbiDpn7up_a8_iurhDVdVilHuT9c7P3LLEbA4-bAoX-VlZN955XVVFzrbdSS3g3st_8hooimW-9YYhyS1ZdDKVk-fceThzq6o4Tk6CnB30r_KzaSBCem8ByNDnE-MwizfY8_oq2FxubIN8AYLTLqg79TjTdKX4coQl079_PBGqJ-B-ZXQhNx-WGxM' }} 
                  style={[StyleSheet.absoluteFill, { opacity: 0.6 }]}
                />
                <LinearGradient 
                  colors={['rgba(26,35,126,0.9)', 'rgba(26,35,126,0.1)']} 
                  style={styles.promoGradient}
                  start={{ x: 0, y: 0 }} 
                  end={{ x: 1, y: 0 }}
                />
                <View style={styles.promoContent}>
                  <Text style={styles.promoTag}>ƯU ĐÃI EWA THÁNG 10</Text>
                  <Text style={styles.promoTitle}>Giảm 20% khi thanh toán{'\n'}hóa đơn điện nước</Text>
                  <TouchableOpacity style={styles.promoBtn}>
                    <Text style={styles.promoBtnText}>Nhận mã ngay</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Categories - Compact when bill data exists */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>DỊCH VỤ CHÍNH</Text>
              <View style={styles.bentoGrid}>
                {SERVICES.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => { setServiceType(s.id); setBillData(null); setError(''); setCustomerId(''); }}
                    style={[styles.bentoCard, serviceType === s.id && styles.bentoCardActive]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.bentoIconBox, { backgroundColor: s.bg }]}>
                      <Feather name={s.icon as any} size={20} color={s.color} />
                    </View>
                    <Text style={[styles.bentoName, { color: serviceType === s.id ? '#1a237e' : '#1b1b21', fontWeight: serviceType === s.id ? '700' : '600' }]}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
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
              <>
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
                      <Text style={[styles.detailLabel, { marginTop: 6 }]}>Phí dịch vụ: {fmt(billFee)}đ</Text>
                      <Text style={[styles.detailValue, { marginTop: 2 }]}>Tổng trừ hạn mức: {fmt(totalBillDebit)}đ</Text>
                      {totalBillDebit > limit && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                          <Feather name="alert-circle" size={12} color={colors.red500} />
                          <Text style={styles.limitError}>Vượt hạn mức ({fmt(limit)}đ)</Text>
                        </View>
                      )}
                    </View>

                    {/* Payment Button - Inside bill card */}
                    {billData.status === 'UNPAID' && (
                      <View style={{ marginTop: 16 }}>
                        <TouchableOpacity
                          onPress={handleShowConfirm}
                          disabled={totalBillDebit > limit || billData.amount === 0}
                          style={[styles.payBtn, (totalBillDebit > limit || billData.amount === 0) && { opacity: 0.4 }]}
                          activeOpacity={0.85}
                        >
                          <LinearGradient colors={[colors.primary, colors.indigo400]} style={styles.payGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Text style={styles.payText}>Thanh toán ngay</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                        <View style={[styles.securityRow, { marginTop: 10 }]}>
                          <Feather name="shield" size={12} color={colors.slate400} />
                          <Text style={styles.securityText}>Giao dịch được bảo mật bởi chuẩn PCI DSS</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </>
            )}

            {/* Recent Bills (Mock) - Only show if no bill data and no error */}
            {!billData && !error && (
              <View style={[styles.section, { marginTop: 8 }]}>
                <View style={styles.recentHeader}>
                  <Text style={styles.sectionTitle}>HÓA ĐƠN GẦN ĐÂY</Text>
                  <TouchableOpacity><Text style={styles.seeAllText}>Xem tất cả</Text></TouchableOpacity>
                </View>
                <View style={styles.recentList}>
                  
                  <TouchableOpacity 
                    style={styles.recentItem} 
                    activeOpacity={0.7}
                    onPress={() => handleLookup('ELECTRIC', 'PE01234567')}
                  >
                    <View style={styles.recentLeft}>
                      <View style={styles.recentIconBox}>
                        <Feather name="zap" size={20} color="#1a237e" />
                      </View>
                      <View>
                        <Text style={styles.recentTitle}>Điện lực Miền Nam</Text>
                        <Text style={styles.recentSub}>Mã KH: PE01234567</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.recentAmount}>350.000 đ</Text>
                      <Text style={styles.recentStatusUnpaid}>Chưa đóng</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.recentItem} 
                    activeOpacity={0.7}
                    onPress={() => handleLookup('WATER', 'DN001234')}
                  >
                    <View style={styles.recentLeft}>
                      <View style={[styles.recentIconBox, { backgroundColor: '#E3F2FD' }]}>
                        <Feather name="droplet" size={20} color="#0056c5" />
                      </View>
                      <View>
                        <Text style={styles.recentTitle}>Cấp nước Sawaco</Text>
                        <Text style={styles.recentSub}>Mã KH: DN001234</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.recentAmount}>95.000 đ</Text>
                      <Text style={styles.recentStatusUnpaid}>Chưa đóng</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.recentItem} 
                    activeOpacity={0.7}
                    onPress={() => handleLookup('INTERNET', 'INT001')}
                  >
                    <View style={styles.recentLeft}>
                      <View style={[styles.recentIconBox, { backgroundColor: '#F3E5F5' }]}>
                        <Feather name="wifi" size={20} color="#7e22ce" />
                      </View>
                      <View>
                        <Text style={styles.recentTitle}>Viettel Internet</Text>
                        <Text style={styles.recentSub}>Mã KH: INT001</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.recentAmount}>250.000 đ</Text>
                      <Text style={styles.recentStatusUnpaid}>Chưa đóng</Text>
                    </View>
                  </TouchableOpacity>

                </View>
              </View>
            )}

            {/* Quick Tips */}
            {!billData && (
              <View style={styles.tipBox}>
                <Feather name="info" size={24} color="#1a237e" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tipTitle}>Thanh toán tự động</Text>
                  <Text style={styles.tipDesc}>Thiết lập thanh toán tự động hàng tháng trên EWA để không bao giờ bị cắt dịch vụ do quên đóng tiền.</Text>
                  <TouchableOpacity style={styles.tipLink}>
                    <Text style={styles.tipLinkText}>Cài đặt ngay</Text>
                    <Feather name="chevron-right" size={14} color="#000666" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmSheet
        visible={showConfirm}
        title="Xác nhận thanh toán"
        icon={<Feather name="file-text" size={22} color={colors.primary} />}
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
        onCancel={handleCancelConfirm}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fbf8ff' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, gap: 16 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#454652', letterSpacing: 0.5, textTransform: 'uppercase' },
  
  // Search Bar UI
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#eae7ef',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 4, height: 52,
  },
  searchTopInput: { flex: 1, fontSize: 14, color: '#1b1b21', marginLeft: 12, height: '100%' },

  // Promo Banner
  promoBanner: {
    backgroundColor: '#000666',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    height: 100,
  },
  promoGradient: { ...StyleSheet.absoluteFillObject },
  promoContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  promoTag: { fontSize: 9, fontWeight: '800', color: '#d9e2ff', letterSpacing: 1.2, marginBottom: 6 },
  promoTitle: { fontSize: 15, fontWeight: '900', color: '#ffffff', lineHeight: 20, marginBottom: 12 },
  promoBtn: { backgroundColor: '#0056c5', paddingHorizontal: 14, paddingVertical: 5, borderRadius: 6, alignSelf: 'flex-start' },
  promoBtnText: { fontSize: 11, fontWeight: '800', color: '#ffffff' },

  // Bento Grid
  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  bentoCard: {
    width: '31%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#1a237e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  bentoCardActive: { borderColor: '#1a237e', backgroundColor: '#f5f2fb' },
  bentoIconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  bentoName: { fontSize: 10, fontWeight: '600', color: '#1b1b21', textAlign: 'center' },

  // Recent Bills
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  seeAllText: { fontSize: 12, fontWeight: '700', color: '#0056c5' },
  recentList: { gap: 12 },
  recentItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#ffffff', borderRadius: 16,
    shadowColor: '#1a237e', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 12, elevation: 1
  },
  recentLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recentIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f5f2fb', alignItems: 'center', justifyContent: 'center' },
  recentTitle: { fontSize: 14, fontWeight: '700', color: '#1b1b21' },
  recentSub: { fontSize: 10, color: '#454652', marginTop: 2 },
  recentAmount: { fontSize: 14, fontWeight: '700', color: '#000666' },
  recentAmountPaid: { fontSize: 14, fontWeight: '700', color: '#454652' },
  recentStatusUnpaid: { fontSize: 10, fontWeight: '600', color: '#ba1a1a', marginTop: 2 },
  recentStatusPaid: { fontSize: 10, fontWeight: '600', color: '#16a34a', marginTop: 2 },

  // Quick Tips
  tipBox: {
    flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#eef2ff',
    borderRadius: 16, borderWidth: 1, borderColor: '#e0e7ff', marginTop: 8
  },
  tipTitle: { fontSize: 14, fontWeight: '700', color: '#1a237e', marginBottom: 4 },
  tipDesc: { fontSize: 12, color: '#454652', lineHeight: 18 },
  tipLink: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  tipLinkText: { fontSize: 12, fontWeight: '700', color: '#000666' },

  // Other Existing Styles
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.red50,
    padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#fee2e2',
  },
  errorText: { color: colors.red600, fontSize: 14, fontWeight: '500' },
  billCard: {
    backgroundColor: colors.white, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: colors.slate100, ...shadows.md,
  },
  billHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  billTag: { fontSize: 9, fontWeight: '700', color: colors.primary, letterSpacing: 1.2, marginBottom: 3 },
  billTitle: { fontSize: 16, fontWeight: '700', color: colors.slate900 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 16 },
  statusText: { fontSize: 9, fontWeight: '700' },
  billDetails: { gap: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.slate50, borderStyle: 'dashed', paddingBottom: 12 },
  detailRowAlt: { gap: 3 },
  detailLabel: { fontSize: 10, color: colors.slate400, fontWeight: '500' },
  detailValue: { fontSize: 13, fontWeight: '700', color: colors.slate800 },
  amountBox: { marginTop: 2 },
  amountText: { fontSize: 28, fontWeight: '900', color: colors.indigo600, letterSpacing: -1 },
  amountCurrency: { fontSize: 16, fontWeight: '700', color: colors.indigo600 },
  limitError: { fontSize: 11, color: colors.red500, fontWeight: '600' },
  paymentSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 24 : 16, paddingTop: 16,
    backgroundColor: 'rgba(255,255,255,0.95)', borderTopWidth: 1, borderTopColor: colors.slate100,
  },
  payBtn: { borderRadius: 12, overflow: 'hidden', ...shadows.primary },
  payGradient: { paddingVertical: 14, alignItems: 'center' },
  payText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  securityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  securityText: { fontSize: 10, color: colors.slate400, fontWeight: '500' },
});
