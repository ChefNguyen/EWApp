import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { colors, shadows } from '../theme/colors';

const MENU_SECTIONS = [
  {
    title: 'TÀI KHOẢN',
    items: [
      { icon: 'credit-card', label: 'Thông tin nhân viên', desc: 'Lương, ngày công, bộ phận', color: colors.indigo600, bg: colors.indigo50 },
      { icon: 'underline', label: 'Ngân hàng liên kết', desc: 'Quản lý tài khoản nhận tiền', color: colors.emerald600, bg: colors.emerald50, screen: 'LinkBank' },
      { icon: 'smartphone', label: 'Thiết bị đăng nhập', desc: 'Quản lý các phiên hoạt động', color: colors.blue500, bg: colors.blue50 },
    ],
  },
  {
    title: 'CÀI ĐẶT',
    items: [
      { icon: 'bell', label: 'Thông báo', desc: 'Tùy chỉnh thông báo giao dịch', color: colors.amber600, bg: colors.amber50 },
      { icon: 'shield', label: 'Bảo mật', desc: 'Mật khẩu, FaceID, mã PIN', color: colors.purple, bg: colors.purple50 },
    ],
  },
  {
    title: 'KHÁC',
    items: [
      { icon: 'file-text', label: 'Điều khoản sử dụng', desc: 'Chính sách bảo mật & sử dụng', color: colors.slate600, bg: colors.slate100 },
      { icon: 'help-circle', label: 'Trung tâm hỗ trợ', desc: 'Câu thường gặp & liên hệ', color: colors.teal600, bg: colors.teal50 },
      { icon: 'star', label: 'Đánh giá ứng dụng', desc: 'Góp ý để chúng tôi hoàn thiện', color: colors.amber500, bg: colors.amber50 },
    ],
  },
];

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { employee, logout } = useApp();

  if (!employee) return null;

  const initials = employee.name
    .split(' ')
    .map(w => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    Alert.alert(
      "Đăng xuất",
      "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Đăng xuất", 
          style: "destructive",
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tài khoản</Text>
        <View style={styles.headerIconBox}>
          <Feather name="user" size={20} color={colors.indigo600} />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileMain}>
            <LinearGradient colors={[colors.indigo600, '#9333ea']} style={styles.avatarBox}>
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
            <View style={styles.profileInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <Text style={styles.profileName} numberOfLines={1} ellipsizeMode="tail">{employee.name}</Text>
                <View style={styles.kycBadge}>
                  <MaterialCommunityIcons name="check-decagram" size={14} color={colors.emerald600} />
                  <Text style={styles.kycText}>Đã KYC</Text>
                </View>
              </View>
              <Text style={styles.profileId}>Mã NV: <Text style={styles.idHighlight}>{employee.id}</Text></Text>
              <Text style={styles.profilePhone}>{employee.phone}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{employee.workingDays}</Text>
              <Text style={styles.statLabel}>Ngày công</Text>
            </View>
            <View style={[styles.statItem, styles.statDivider]}>
              <Text style={styles.statValue}>{employee.linkedBank ? '1' : '0'}</Text>
              <Text style={styles.statLabel}>TK liên kết</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Standard</Text>
              <Text style={styles.statLabel}>Hạng thẻ</Text>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuGroup}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, i < section.items.length - 1 && styles.menuItemBorder]}
                  onPress={() => item.screen && navigation.navigate(item.screen)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIconBox, { backgroundColor: item.bg }]}>
                    <Feather name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <Text style={styles.menuDesc}>{item.desc}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.slate300} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={20} color={colors.red600} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>EWA v1.0.0 • Secured by Lumina</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: colors.slate900, letterSpacing: -0.5 },
  headerIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.indigo50, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 120, paddingTop: 8 },
  profileCard: { backgroundColor: colors.white, borderRadius: 32, padding: 24, ...shadows.md, borderWidth: 1, borderColor: colors.slate100 },
  profileMain: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarBox: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', ...shadows.primary },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  profileInfo: { flex: 1, flexShrink: 1 },
  profileName: { fontSize: 20, fontWeight: '800', color: colors.slate900, flexShrink: 1 },
  profileId: { fontSize: 13, color: colors.slate500, marginTop: 4 },
  idHighlight: { fontWeight: '700', color: colors.indigo600 },
  profilePhone: { fontSize: 13, color: colors.slate400, marginTop: 2 },
  kycBadge: { backgroundColor: colors.emerald50, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  kycText: { fontSize: 10, fontWeight: '700', color: colors.emerald600 },
  statsRow: { flexDirection: 'row', marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: colors.slate50 },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderLeftColor: colors.slate50, borderRightColor: colors.slate50 },
  statValue: { fontSize: 18, fontWeight: '900', color: colors.slate900, flexShrink: 1 },
  statLabel: { fontSize: 11, color: colors.slate400, fontWeight: '600', marginTop: 4 },
  section: { marginTop: 32 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: colors.slate400, letterSpacing: 1.5, marginBottom: 12, paddingLeft: 8 },
  menuGroup: { backgroundColor: colors.white, borderRadius: 32, overflow: 'hidden', ...shadows.sm, borderWidth: 1, borderColor: colors.slate100 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.slate50 },
  menuIconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '800', color: colors.slate900 },
  menuDesc: { fontSize: 12, color: colors.slate400, marginTop: 2 },
  logoutBtn: {
    marginTop: 32, backgroundColor: '#fef2f2', borderRadius: 32, paddingVertical: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    borderWidth: 1, borderColor: '#fee2e2',
  },
  logoutText: { color: colors.red600, fontSize: 16, fontWeight: '800' },
  footer: { marginTop: 40, alignItems: 'center' },
  footerText: { fontSize: 11, color: colors.slate300, fontWeight: '500' },
});
