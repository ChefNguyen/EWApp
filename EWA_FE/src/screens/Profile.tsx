import React from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { colors, shadows } from '../theme/colors';
import TopBar from '../components/TopBar';

type MenuAction = 'employee-info' | 'link-bank' | 'devices' | 'notifications' | 'security' | 'terms' | 'support' | 'rating';

type MenuItem = {
  icon: string;
  label: string;
  action: MenuAction;
};

const PROFILE_SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: 'TÀI KHOẢN',
    items: [
      { icon: 'badge-account-horizontal-outline', label: 'Thông tin nhân viên', action: 'employee-info' },
      { icon: 'bank-outline', label: 'Ngân hàng liên kết', action: 'link-bank' },
      { icon: 'cellphone-link', label: 'Thiết bị đăng nhập', action: 'devices' },
    ],
  },
  {
    title: 'CÀI ĐẶT',
    items: [
      { icon: 'bell-ring-outline', label: 'Thông báo', action: 'notifications' },
      { icon: 'shield-check-outline', label: 'Bảo mật', action: 'security' },
    ],
  },
  {
    title: 'KHÁC',
    items: [
      { icon: 'file-document-outline', label: 'Điều khoản', action: 'terms' },
      { icon: 'headset', label: 'Hỗ trợ', action: 'support' },
      { icon: 'star-outline', label: 'Đánh giá', action: 'rating' },
    ],
  },
];

const PROFILE_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAtgGHEZcBhR3Rr2E1gKVQ6t79m8YETipj1g5Tk-HoExtMUqny_U8d9DsbLoVbdq2nQQAsIsjIUcrJQ98XqOI7luS0dGwoLPeqo5ieZ2pzRlSIA3el3QfJW9EpJmi7X9rw736ElV6-Zv1foUtxqO09-wF-BgpejFy36CWp6WvlDfghlFMcFQh2aXF8pvGKtGp_ltQPjjeOZikqx_vhbnxnOaWFoOf1RZn4UISypaL3pG-5tSN4HyPc46200d0ASWlyPtTOpI2dAzZEz';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { employee, logout } = useApp();

  if (!employee) return null;

  const linkedBankCount = employee.linkedBank ? 1 : 0;
  const memberTier = employee.linkedBank ? 'STANDARD' : 'BASIC';

  const handleComingSoon = (title: string) => {
    Alert.alert(title, 'Tính năng này sẽ được hoàn thiện ở bản cập nhật tiếp theo.');
  };

  const handleMenuPress = (item: MenuItem) => {
    if (item.action === 'link-bank') {
      navigation.navigate('LinkBank');
      return;
    }

    const titleMap: Record<MenuAction, string> = {
      'employee-info': 'Thông tin nhân viên',
      'link-bank': 'Ngân hàng liên kết',
      devices: 'Thiết bị đăng nhập',
      notifications: 'Thông báo',
      security: 'Bảo mật',
      terms: 'Điều khoản',
      support: 'Hỗ trợ',
      rating: 'Đánh giá',
    };

    handleComingSoon(titleMap[item.action]);
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopBar title="Cá nhân" onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#162B90', '#1F5DC5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTop}>
            <View style={styles.identityRow}>
              <View style={styles.avatarFrame}>
                <Image source={{ uri: PROFILE_IMAGE }} style={styles.avatarImage} />
              </View>
              <View style={styles.identityText}>
                <Text style={styles.employeeName} numberOfLines={1}>
                  {employee.name}
                </Text>
                <View style={styles.metaRow}>
                  <View style={styles.kycBadge}>
                    <MaterialCommunityIcons name="check-decagram" size={14} color={colors.white} />
                    <Text style={styles.kycText}>Đã KYC</Text>
                  </View>
                  <Text style={styles.employeeId}>ID: {employee.id}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.editButton} activeOpacity={0.85} onPress={() => handleComingSoon('Chỉnh sửa hồ sơ')}>
              <Feather name="edit-2" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>NGÀY CÔNG</Text>
              <Text style={styles.statValue}>{employee.workingDays}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>TK LIÊN KẾT</Text>
              <Text style={styles.statValue}>{linkedBankCount}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>HẠNG THẺ</Text>
              <Text style={styles.statValueSmall}>{memberTier}</Text>
            </View>
          </View>
        </LinearGradient>

        {PROFILE_SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, index < section.items.length - 1 && styles.menuItemBorder]}
                  activeOpacity={0.78}
                  onPress={() => handleMenuPress(item)}
                >
                  <View style={styles.menuIconBox}>
                    <MaterialCommunityIcons name={item.icon as any} size={24} color={colors.indigo900} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Feather name="chevron-right" size={22} color={colors.slate400} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.85} onPress={handleLogout}>
          <Feather name="log-out" size={22} color="#B3261E" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F5FF',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.indigo900,
    letterSpacing: -0.8,
  },
  heroCard: {
    borderRadius: 30,
    padding: 20,
    paddingTop: 28,
    paddingBottom: 24,
    ...shadows.lg,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  identityRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarFrame: {
    width: 86,
    height: 86,
    padding: 6,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  identityText: {
    flex: 1,
    paddingRight: 6,
  },
  employeeName: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -0.4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  kycText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.white,
  },
  employeeId: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  editButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  statCard: {
    flex: 1,
    minHeight: 92,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.62)',
    letterSpacing: 1.3,
    textAlign: 'center',
  },
  statValue: {
    marginTop: 14,
    fontSize: 24,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: -0.5,
  },
  statValueSmall: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  section: {
    marginTop: 30,
  },
  sectionTitle: {
    marginBottom: 12,
    marginLeft: 10,
    fontSize: 13,
    fontWeight: '800',
    color: '#2F2E41',
    letterSpacing: 3,
  },
  sectionCard: {
    borderRadius: 30,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 12,
    paddingVertical: 18,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F0F8',
  },
  menuIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F0FB',
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#14142B',
  },
  logoutButton: {
    marginTop: 30,
    borderRadius: 22,
    backgroundColor: '#FFDAD6',
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#B3261E',
  },
});
