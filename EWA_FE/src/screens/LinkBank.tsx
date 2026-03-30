import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import * as mockApi from '../services/mockApi';
import { MOCK_BANKS } from '../data/mockData';
import TopBar from '../components/TopBar';
import { colors, shadows } from '../theme/colors';

type LinkStep = 'select-bank' | 'enter-account' | 'confirm';

export default function LinkBankScreen() {
  const navigation = useNavigation<any>();
  const { employee, refreshEmployee } = useApp();
  const [step, setStep] = useState<LinkStep>('select-bank');
  const [selectedBank, setSelectedBank] = useState<{ code: string; name: string } | null>(null);
  const [accountNo, setAccountNo] = useState('');
  const [accountName, setAccountName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const banksData = MOCK_BANKS.map(b => ({
    code: b.code,
    name: b.name,
    shortName: b.code,
    color: b.code === 'VCB' ? colors.emerald600 :
           b.code === 'TCB' ? colors.red600 :
           b.code === 'MB'  ? colors.indigo600 :
           b.code === 'ACB' ? colors.blue500 :
           colors.cyan600,
    bgColor: b.code === 'VCB' ? colors.emerald50 :
             b.code === 'TCB' ? colors.red50 :
             b.code === 'MB'  ? colors.indigo50 :
             b.code === 'ACB' ? colors.blue50 :
             colors.cyan50,
  }));

  const filteredBanks = searchQuery
    ? banksData.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.code.toLowerCase().includes(searchQuery.toLowerCase()))
    : banksData;

  const handleSelectBank = (bank: typeof banksData[0]) => {
    setSelectedBank({ code: bank.code, name: bank.name });
    setStep('enter-account');
    setError('');
    setAccountNo('');
    setAccountName('');
  };

  const handleLookup = async () => {
    if (!accountNo.trim()) { setError('Vui lòng nhập số tài khoản'); return; }
    setLoading(true);
    setError('');
    const result = await mockApi.lookupBankAccount(selectedBank!.code, accountNo);
    setLoading(false);
    if (result.success) {
      setAccountName(result.accountName!);
      setStep('confirm');
    } else {
      setError(result.error || 'Không tìm thấy tài khoản');
    }
  };

  const handleLink = async () => {
    if (!employee) return;
    setLoading(true);
    setError('');
    const result = await mockApi.linkBankAccount(employee.id, {
      bankCode: selectedBank!.code,
      accountNo,
      accountName,
    });
    setLoading(false);
    if (result.success) {
      setSuccess(true);
      refreshEmployee();
      setTimeout(() => navigation.goBack(), 1500);
    } else {
      setError(result.error || 'Không thể liên kết tài khoản');
    }
  };

  const handleBack = () => {
    if (step === 'enter-account') { setStep('select-bank'); setError(''); }
    else if (step === 'confirm') { setStep('enter-account'); setError(''); }
    else navigation.goBack();
  };

  if (!employee) return null;

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Liên kết ngân hàng" onBack={handleBack} />
      
      <View style={styles.main}>
        {success ? (
          <View style={styles.successContainer}>
            <View style={styles.successIconBox}>
              <Feather name="check" size={40} color={colors.emerald600} />
            </View>
            <Text style={styles.successTitle}>Liên kết thành công!</Text>
            <Text style={styles.successSubtitle}>{selectedBank?.name} • ****{accountNo.slice(-4)}</Text>
          </View>
        ) : step === 'select-bank' ? (
          <View style={{ flex: 1 }}>
            <View style={styles.searchContainer}>
              <Feather name="search" size={20} color={colors.slate400} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm ngân hàng..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.slate400}
              />
            </View>

            <FlatList
              data={filteredBanks}
              keyExtractor={(item) => item.code}
              numColumns={2}
              columnWrapperStyle={styles.bankGrid}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={<Text style={styles.sectionTitle}>NGÂN HÀNG PHỔ BIẾN</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectBank(item)}
                  style={styles.bankCard}
                  activeOpacity={0.8}
                >
                  <View style={[styles.bankIconBox, { backgroundColor: item.bgColor }]}>
                    <MaterialCommunityIcons name="bank" size={24} color={item.color} />
                  </View>
                  <Text style={styles.bankShortName}>{item.shortName}</Text>
                  <Text style={styles.bankFullName} numberOfLines={1}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        ) : step === 'enter-account' ? (
          <ScrollView contentContainerStyle={styles.formContainer}>
            <View style={styles.bankBanner}>
              <MaterialCommunityIcons name="bank" size={24} color={colors.indigo600} />
              <View>
                <Text style={styles.bannerBankName}>{selectedBank?.name}</Text>
                <Text style={styles.bannerHint}>Nhập số tài khoản ngân hàng</Text>
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>SỐ TÀI KHOẢN</Text>
              <TextInput
                style={styles.accountInput}
                placeholder="Nhập số tài khoản"
                value={accountNo}
                onChangeText={(val) => { setAccountNo(val); setError(''); }}
                keyboardType="numeric"
                autoFocus
              />
            </View>

            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

            <TouchableOpacity
              onPress={handleLookup}
              disabled={loading}
              style={styles.actionBtn}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[colors.indigo600, colors.blue500]} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <View style={styles.btnContent}>
                    <Feather name="search" size={20} color="#fff" />
                    <Text style={styles.btnText}>Tra cứu tài khoản</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.formContainer}>
            <View style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>Xác nhận liên kết</Text>
              <View style={styles.confirmDetails}>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Ngân hàng</Text>
                  <Text style={styles.confirmValue}>{selectedBank?.name}</Text>
                </View>
                <View style={[styles.confirmRow, styles.confirmRowBorder]}>
                  <Text style={styles.confirmLabel}>Số tài khoản</Text>
                  <Text style={styles.confirmValue}>{accountNo}</Text>
                </View>
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Chủ tài khoản</Text>
                  <Text style={[styles.confirmValue, { color: colors.emerald600 }]}>{accountName}</Text>
                </View>
              </View>
            </View>

            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

            <TouchableOpacity
              onPress={handleLink}
              disabled={loading}
              style={styles.actionBtn}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[colors.indigo600, colors.blue500]} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <View style={styles.btnContent}>
                    <Feather name="link" size={20} color="#fff" />
                    <Text style={styles.btnText}>Xác nhận liên kết</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  main: { flex: 1 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  successIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 24, fontWeight: '800', color: colors.slate900 },
  successSubtitle: { fontSize: 16, color: colors.slate500, fontWeight: '500' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.slate100,
    margin: 24, paddingHorizontal: 16, height: 60, borderRadius: 30,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.slate900 },
  listContent: { paddingHorizontal: 24, paddingBottom: 40 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.slate500, letterSpacing: 1.2, marginBottom: 16, marginLeft: 4 },
  bankGrid: { justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  bankCard: {
    width: '48%', backgroundColor: colors.white, borderRadius: 32, padding: 20,
    alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.slate100, ...shadows.sm,
  },
  bankIconBox: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  bankShortName: { fontSize: 16, fontWeight: '900', color: colors.slate900, marginTop: 4 },
  bankFullName: { fontSize: 11, color: colors.slate400, textAlign: 'center', fontWeight: '500' },
  formContainer: { padding: 24, gap: 24 },
  bankBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(79, 70, 229, 0.05)', padding: 20, borderRadius: 24,
  },
  bannerBankName: { fontSize: 16, fontWeight: '800', color: colors.indigo700 },
  bannerHint: { fontSize: 13, color: colors.indigo500, fontWeight: '500' },
  inputSection: { gap: 12 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: colors.slate500, letterSpacing: 1.2, marginLeft: 4 },
  accountInput: {
    backgroundColor: colors.white, borderRadius: 24, paddingHorizontal: 24,
    height: 72, fontSize: 24, fontWeight: '800', color: colors.slate900,
    borderWidth: 1, borderColor: colors.slate100, ...shadows.sm,
  },
  errorBox: { backgroundColor: colors.red50, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#fee2e2' },
  errorText: { color: colors.red600, fontSize: 14, fontWeight: '500' },
  actionBtn: { borderRadius: 32, overflow: 'hidden', ...shadows.primary, marginTop: 12 },
  actionGradient: { height: 64, alignItems: 'center', justifyContent: 'center' },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  confirmCard: {
    backgroundColor: colors.white, borderRadius: 32, padding: 24,
    borderWidth: 1, borderColor: colors.slate100, ...shadows.md,
  },
  confirmTitle: { fontSize: 20, fontWeight: '800', color: colors.slate900, marginBottom: 20 },
  confirmDetails: { gap: 4 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  confirmRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.slate50, borderStyle: 'dashed' },
  confirmLabel: { fontSize: 14, color: colors.slate500, fontWeight: '500' },
  confirmValue: { fontSize: 15, fontWeight: '800', color: colors.slate900 },
});
