import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useApp } from '../context/AppContext';
import * as mockApi from '../services/mockApi';
import { MOCK_BANKS } from '../data/mockData';
import { colors, shadows } from '../theme/colors';
import { RootStackParamList } from '../types';

type DashboardNav = StackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardNav>();
  const { employee, logout } = useApp();
  const [limit, setLimit] = useState(0);
  const [loadingLimit, setLoadingLimit] = useState(true);

  useEffect(() => {
    if (!employee?.token) return;
    setLoadingLimit(true);
    mockApi.getAvailableLimit(employee).then(res => {
      setLimit(res);
      setLoadingLimit(false);
    });
  }, [employee?.token]);

  useFocusEffect(
    useCallback(() => {
      if (!employee?.token) return;
      mockApi.getAvailableLimit(employee).then(setLimit);
    }, [employee?.token])
  );

  if (!employee) return null;

  const hasLinkedBank = !!employee.linkedBank;
  const dailyRate = (employee.grossSalary || 0) / 22;
  const earnedSalary = Math.floor(dailyRate * (employee.workingDays || 0));
  const workProgress = Math.round(((employee.workingDays || 0) / 22) * 100);
  
  // Safe currency formatter for iOS/Android/Web
  const fmt = (n: number) => {
    if (n === null || n === undefined || isNaN(n)) return '0';
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const bankIconUrl = hasLinkedBank
    ? MOCK_BANKS.find(b => b.code === employee.linkedBank!.bankCode)?.logoUrl
    : null;

  const bankDisplay = hasLinkedBank
    ? `${employee.linkedBank!.bankCode} ${employee.linkedBank!.maskedAccountNo || employee.linkedBank!.accountNo}`
    : null;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={{ paddingBottom: 120 }} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtgGHEZcBhR3Rr2E1gKVQ6t79m8YETipj1g5Tk-HoExtMUqny_U8d9DsbLoVbdq2nQQAsIsjIUcrJQ98XqOI7luS0dGwoLPeqo5ieZ2pzRlSIA3el3QfJW9EpJmi7X9rw736ElV6-Zv1foUtxqO09-wF-BgpejFy36CWp6WvlDfghlFMcFQh2aXF8pvGKtGp_ltQPjjeOZikqx_vhbnxnOaWFoOf1RZn4UISypaL3pG-5tSN4HyPc46200d0ASWlyPtTOpI2dAzZEz' }} 
              style={styles.avatarImg}
            />
            <View>
              <Text style={styles.greetLabel}>CHÀO BUỔI SÁNG</Text>
              <Text style={styles.brandName}>EWA</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerBtn}>
              <Feather name="bell" size={20} color={colors.indigo600} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.headerBtn, styles.logoutBtn]} onPress={handleLogout}>
              <Feather name="log-out" size={20} color={colors.red600} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {/* Hero Card */}
          <View style={styles.heroCard}>
            {/* Standard Badge moved here */}
            <View style={styles.badge}>
              <MaterialCommunityIcons name="check-decagram" size={14} color={colors.indigo600} style={{ marginRight: 4 }} />
              <Text style={styles.badgeText}>STANDARD</Text>
            </View>

            <View style={styles.heroTop}>
              <View style={styles.heroAmountContainer}>
                <Text style={styles.heroLabel}>Hạn mức khả dụng</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text 
                    style={styles.heroAmount} 
                    numberOfLines={1} 
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.6}
                  >
                    {fmt(limit)}
                  </Text>
                  <Text style={styles.heroUnit}>đ</Text>
                </View>
              </View>
            </View>

            {/* Salary Details Grid */}
            <View style={styles.heroGrid}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatLabel}>Lương tạm tính</Text>
                <Text style={styles.heroStatValue}>{fmt(earnedSalary)}đ</Text>
              </View>
              <View style={styles.heroStatItemEnd}>
                <Text style={styles.heroStatLabel}>Ngày công</Text>
                <Text style={styles.heroStatValue}>
                  {employee.workingDays}/22 <Text style={styles.heroStatUnit}>ngày</Text>
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>TIẾN ĐỘ THÁNG NÀY</Text>
                <Text style={styles.progressPercent}>{workProgress}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={[colors.indigo600, colors.blue500]}
                  style={[styles.progressBar, { width: `${workProgress}%` }]}
                  start={{ x: 0, y: 0 }} 
                  end={{ x: 1, y: 0 }}
                />
              </View>
            </View>
          </View>

          {/* Bank Status Card */}
          <TouchableOpacity 
            style={styles.bankCard} 
            onPress={() => navigation.navigate('LinkBank')}
            activeOpacity={0.7}
          >
            <View style={styles.bankLeft}>
              <View style={styles.bankIconWrap}>
                {bankIconUrl ? (
                  <Image source={{ uri: bankIconUrl }} style={styles.bankImg} />
                ) : (
                  <MaterialCommunityIcons name="bank" size={20} color={colors.slate400} />
                )}
              </View>
              <View>
                <Text style={styles.bankLabel}>Tài khoản liên kết</Text>
                <Text style={styles.bankValue}>
                  {hasLinkedBank
                    ? bankDisplay
                    : 'Chưa liên kết'}
                </Text>
              </View>
            </View>
            {hasLinkedBank && (
              <MaterialCommunityIcons name="check-circle" size={24} color={colors.emerald500} />
            )}
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionGrid}>
            {/* Withdraw Button */}
            <TouchableOpacity 
              style={styles.mainAction} 
              onPress={() => navigation.navigate('Withdraw')} 
              activeOpacity={0.9}
            >
              <LinearGradient 
                colors={['#1A237E', '#3949AB']} 
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.mainActionIcon}>
                <Ionicons name="wallet-sharp" size={32} color="#fff" />
              </View>
              <View>
                <Text style={styles.mainActionTitle}>Rút tiền</Text>
                <Text style={styles.mainActionSub}>Về tài khoản ngay</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.sideActions}>
              {/* Top-up Button */}
              <TouchableOpacity 
                style={styles.sideAction} 
                onPress={() => navigation.navigate('TopUp')} 
                activeOpacity={0.9}
              >
                <View style={[styles.sideActionIcon, { backgroundColor: '#e0f7fa' }]}>
                  <Ionicons name="phone-portrait-sharp" size={24} color="#00838f" />
                </View>
                <View style={styles.sideActionText}>
                  <Text 
                    style={styles.sideActionLabel}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                  >
                    Nạp ĐT
                  </Text>
                  <Text style={styles.sideActionSub} numberOfLines={1}>Nạp nhanh</Text>
                </View>
              </TouchableOpacity>

              {/* Bill Button */}
              <TouchableOpacity 
                style={styles.sideAction} 
                onPress={() => navigation.navigate('BillPayment')} 
                activeOpacity={0.9}
              >
                <View style={[styles.sideActionIcon, { backgroundColor: colors.indigo50 }]}>
                  <Ionicons name="receipt-sharp" size={24} color={colors.primary} />
                </View>
                <View style={styles.sideActionText}>
                  <Text 
                    style={styles.sideActionLabel}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                  >
                    Hóa đơn
                  </Text>
                  <Text style={styles.sideActionSub} numberOfLines={1}>Điện, nước</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Banner */}
          <View style={styles.promoCard}>
            <Image 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFE9rBwQjYJ1pf-J3WtakoItU3SSFncXA36RA3fXokmezCNx95BHRPzC76CkbEoDgMImveuSxJPoGw-K-P9LkJV8DRs_xvxSd5a-rLWR2TLx3CuvkpQJKsjha45F5LsMCdkJdNI3E9XG6f_ajBy_zYUgvoXTR0n2NUTHsKnz4jFrCITBsZQmz9J9GMMsYyV2lz7khptWEZaZO8nXW0_MrTWTuoYxkAO3SXnnw3DVNIOik3ABiKJYL8ZsRxCBRAz6IpT5V3t_KsX4VY' }} 
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient 
              colors={['rgba(26, 35, 126, 0.7)', 'transparent']} 
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0.5 }}
            />
            <View style={styles.promoBody}>
              <Text style={styles.promoTag}>DÀNH CHO BẠN</Text>
              <Text style={styles.promoText}>Nhận ngay bảo{'\n'}hiểm sức khỏe</Text>
              <TouchableOpacity style={styles.promoBtn}>
                <Text style={styles.promoBtnText}>KHÁM PHÁ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1 },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  greetLabel: { fontSize: 10, color: colors.slate500, fontWeight: '600', letterSpacing: 1.2 },
  brandName: { fontSize: 26, fontWeight: '900', color: colors.indigo700, letterSpacing: -0.5, marginTop: -2 },
  headerRight: { flexDirection: 'row', gap: 8 },
  headerBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  logoutBtn: { backgroundColor: '#fef2f2' },
  
  content: { paddingHorizontal: 24, paddingVertical: 12, gap: 20 },
  
  // Hero Card
  heroCard: { 
    backgroundColor: '#fff', 
    borderRadius: 40, 
    padding: 24, 
    paddingTop: 32, // More top padding for the absolute badge
    ...shadows.lg, 
    elevation: 10,
    position: 'relative', // for absolute positioning of children
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 28 },
  heroAmountContainer: { flex: 1, flexGrow: 1, flexShrink: 1, marginRight: 64 }, // Space for badge
  heroLabel: { fontSize: 13, color: colors.slate500, fontWeight: '700', marginBottom: 6, letterSpacing: 0.2 },
  heroAmount: { fontSize: 40, fontWeight: '900', color: colors.indigo600, letterSpacing: -1.5 },
  heroUnit: { fontSize: 24, fontWeight: '700', color: colors.indigo600, marginLeft: 4 },
  badge: { 
    position: 'absolute',
    top: 24,
    right: 24,
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.indigo50, 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 30,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: colors.indigo600, letterSpacing: 0.5 },
  heroGrid: { 
    flexDirection: 'row', 
    borderTopWidth: 1, 
    borderTopColor: '#f1f5f9', 
    paddingTop: 24, 
    marginBottom: 24,
    gap: 16,
  },
  heroStatItem: { flex: 1 },
  heroStatItemEnd: { flex: 1, alignItems: 'flex-end' },
  heroStatLabel: { fontSize: 12, color: colors.slate500, marginBottom: 6, fontWeight: '500' },
  heroStatValue: { fontSize: 18, fontWeight: '800', color: colors.slate900 },
  heroStatUnit: { fontSize: 14, fontWeight: '500', color: colors.slate500 },
  progressSection: { marginTop: 4 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressLabel: { fontSize: 11, fontWeight: '800', color: colors.indigo600, letterSpacing: 0.5 },
  progressPercent: { fontSize: 11, fontWeight: '800', color: colors.indigo600 },
  progressTrack: { height: 10, backgroundColor: '#f1f5f9', borderRadius: 10, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 10 },
  
  // Bank Status Card
  bankCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  bankLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  bankIconWrap: {
    width: 48,
    height: 48,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  bankImg: { width: 28, height: 28, resizeMode: 'contain' },
  bankLabel: { fontSize: 12, color: colors.slate600, fontWeight: '500', marginBottom: 2 },
  bankValue: { fontSize: 14, fontWeight: '800', color: colors.slate900 },
  
  // Action Grid
  actionGrid: { flexDirection: 'row', gap: 12, height: 180 },
  mainAction: {
    flex: 0.8,
    borderRadius: 40,
    padding: 24,
    overflow: 'hidden',
    justifyContent: 'space-between',
    ...shadows.primary,
  },
  mainActionIcon: {
    width: 52,
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainActionTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  mainActionSub: { fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', fontWeight: '600' },
  sideActions: { flex: 1.1, gap: 12 },
  sideAction: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 36,
    padding: 10,
    paddingRight: 14, // Extra right padding for text
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sideActionIcon: {
    width: 44, // Reduced from 48
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideActionText: { flex: 1 },
  sideActionLabel: { fontSize: 16, fontWeight: '800', color: colors.slate900 },
  sideActionSub: { fontSize: 11, color: colors.slate400, fontWeight: '500', marginTop: 1 },

  // Banner
  promoCard: {
    borderRadius: 40,
    overflow: 'hidden',
    height: 180,
    ...shadows.md,
    marginTop: 8,
  },
  promoBody: { padding: 32, justifyContent: 'center', flex: 1 },
  promoTag: { fontSize: 11, fontWeight: '800', color: 'rgba(255, 255, 255, 0.9)', letterSpacing: 1.5, marginBottom: 12 },
  promoText: { fontSize: 22, fontWeight: '900', color: '#fff', lineHeight: 28, marginBottom: 20 },
  promoBtn: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, alignSelf: 'flex-start' },
  promoBtnText: { fontSize: 12, fontWeight: '900', color: colors.indigo600 },
});
