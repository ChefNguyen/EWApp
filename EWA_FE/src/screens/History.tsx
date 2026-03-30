import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SectionList,
  ActivityIndicator, Image, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import * as mockApi from '../services/mockApi';
import { Transaction } from '../types';
import TopBar from '../components/TopBar';
import { colors, shadows } from '../theme/colors';

type FilterType = 'ALL' | 'WITHDRAWAL' | 'TOPUP' | 'BILL_PAYMENT';

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'WITHDRAWAL', label: 'Rút tiền' },
  { key: 'TOPUP', label: 'Nạp ĐT' },
  { key: 'BILL_PAYMENT', label: 'Hóa đơn' },
];

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'WITHDRAWAL': return { name: 'wallet', bg: '#ecfdf5', color: '#059669' };
    case 'TOPUP': return { name: 'smartphone', bg: '#fff7ed', color: '#f59e0b' };
    case 'BILL_PAYMENT': return { name: 'file-text', bg: '#f5f3ff', color: '#7c3aed' };
    default: return { name: 'credit-card', bg: '#f8fafc', color: '#64748b' };
  }
};

const getTransactionLabel = (txn: Transaction) => {
  switch (txn.type) {
    case 'WITHDRAWAL': return `Rút tiền về tài khoản`;
    case 'TOPUP': return `Nạp tiền điện thoại`;
    case 'BILL_PAYMENT': return `Thanh toán tiền điện`;
    default: return 'Giao dịch';
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'SUCCESS': return { bg: '#ecfdf5', color: '#059669', label: 'SUCCESS' };
    case 'PENDING': return { bg: '#fffbeb', color: '#d97706', label: 'PENDING' };
    case 'FAILED': return { bg: '#fef2f2', color: '#dc2626', label: 'FAILED' };
    default: return { bg: '#f8fafc', color: '#64748b', label: status };
  }
};

const formatTime = (isoStr: string) => {
  const d = new Date(isoStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const formatDate = (isoStr: string) => {
  const d = new Date(isoStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  
  if (d.toDateString() === today.toDateString()) return 'Hôm nay';
  if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

export default function HistoryScreen() {
  const navigation = useNavigation<any>();
  const { employee } = useApp();
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employee) {
      setLoading(true);
      mockApi.getTransactionHistory(employee.id).then(res => {
        setTransactions(res.data as Transaction[]);
        setLoading(false);
      });
    }
  }, [employee]);

  const sections = useMemo(() => {
    const filtered = filter === 'ALL' ? transactions : transactions.filter(t => t.type === filter);
    const groups: { [key: string]: { title: string, data: Transaction[] } } = {};
    
    filtered.forEach(txn => {
      const dateKey = new Date(txn.createdAt).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = { title: formatDate(txn.createdAt), data: [] };
      }
      groups[dateKey].data.push(txn);
    });
    
    return Object.values(groups);
  }, [transactions, filter]);

  const fmt = (n: number) => n.toLocaleString('vi-VN');

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const icon = getTransactionIcon(item.type);
    const status = getStatusBadge(item.status);
    return (
      <View style={styles.card}>
        <View style={styles.leftPart}>
          <View style={[styles.iconBox, { backgroundColor: icon.bg }]}>
            <MaterialCommunityIcons name={icon.name === 'smartphone' ? 'cellphone' : (icon.name === 'wallet' ? 'wallet' : 'receipt')} size={24} color={icon.color} />
          </View>
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{getTransactionLabel(item)}</Text>
            <View style={styles.meta}>
              <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
              <View style={styles.dot} />
              <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.rightPart}>
          <Text style={styles.amount}>- {fmt(item.amount)}đ</Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {FILTER_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setFilter(tab.key)}
            style={[styles.tab, filter === tab.key && styles.tabActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, filter === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <LinearGradient 
        colors={['#6366f1', '#8b5cf6']} 
        style={styles.promoCard} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.promoContent}>
          <Text style={styles.promoTitle}>Thanh toán hóa đơn {"\n"}nhận hoàn tiền 5%</Text>
          <Text style={styles.promoSubtitle}>Ưu đãi dành riêng cho người dùng EWA tháng này. Thanh toán ngay!</Text>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('BillPayment')}
            style={styles.promoBtn}
          >
            <Text style={styles.promoBtnText}>Thanh toán ngay</Text>
          </TouchableOpacity>

          <View style={styles.promoIconOuter}>
            <View style={styles.promoIconInner}>
              <MaterialCommunityIcons name="gift-outline" size={40} color="#fff" />
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Lịch sử giao dịch" onBack={() => navigation.goBack()} />
      
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.indigo600} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderTransaction}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title.toUpperCase()}</Text>
          )}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="file-text" size={64} color={colors.slate200} />
              <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 100 },
  header: { paddingVertical: 16, paddingHorizontal: 24 },
  tabs: { gap: 12 },
  tab: {
    paddingHorizontal: 24, paddingVertical: 10, borderRadius: 25,
    backgroundColor: '#e2e8f0',
  },
  tabActive: { backgroundColor: '#4f46e5', ...shadows.md },
  tabText: { fontSize: 13, fontWeight: '700', color: colors.slate600 },
  tabTextActive: { color: colors.white },
  sectionHeader: {
    fontSize: 12, fontWeight: '800', color: colors.slate900,
    letterSpacing: 1, marginTop: 24, marginBottom: 16, marginHorizontal: 24,
  },
  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.white, marginHorizontal: 24, marginBottom: 12,
    padding: 16, borderRadius: 32,
    ...shadows.sm,
  },
  leftPart: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 },
  iconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: colors.slate900 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  time: { fontSize: 11, color: colors.slate500, fontWeight: '600' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.slate300 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  rightPart: { alignItems: 'flex-end' },
  amount: { fontSize: 16, fontWeight: '800', color: colors.slate900 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 16 },
  emptyText: { fontSize: 14, color: colors.slate400, fontWeight: '500' },
  footer: { paddingHorizontal: 24, marginTop: 24 },
  promoCard: { borderRadius: 40, padding: 32, overflow: 'hidden' },
  promoContent: { alignItems: 'center', gap: 16 },
  promoTitle: { fontSize: 24, fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 32 },
  promoSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', fontWeight: '500', lineHeight: 20 },
  promoBtn: { backgroundColor: '#fff', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 25, marginTop: 8 },
  promoBtnText: { color: colors.indigo700, fontSize: 15, fontWeight: '900' },
  promoIconOuter: { 
    width: 120, height: 120, borderRadius: 60, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    alignItems: 'center', justifyContent: 'center',
    marginTop: 10
  },
  promoIconInner: { 
    width: 90, height: 90, borderRadius: 45, 
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center'
  },
});
