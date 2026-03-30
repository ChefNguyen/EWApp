import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Dimensions, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { colors, shadows } from '../theme/colors';
import TopBar from '../components/TopBar';

const { width } = Dimensions.get('window');

const CATEGORIES = ['Tất cả', 'Hóa đơn', 'Viễn thông', 'Sức khỏe'];

const OFFERS = [
  {
    id: 1,
    tag: 'MỚI',
    tagColor: colors.emerald500,
    title: 'Giảm 20k thanh toán hóa đơn điện',
    subtitle: 'Áp dụng cho hóa đơn từ 500k',
    expiry: '30/11',
    icon: 'flash',
    iconBg: '#fff7ed',
    iconColor: '#f97316',
  },
  {
    id: 2,
    tag: 'SẮP HẾT HẠN',
    tagColor: colors.red500,
    title: 'Hoàn tiền 10k nạp thẻ Viettel',
    subtitle: 'Cho mệnh giá từ 100k',
    expiry: '15/11',
    icon: 'phone-portrait',
    iconBg: '#eff6ff',
    iconColor: '#3b82f6',
  },
  {
    id: 3,
    tag: 'MỚI',
    tagColor: colors.emerald500,
    title: 'Ưu đãi liên kết ngân hàng mới',
    subtitle: 'Nhận ngay combo quà 200k',
    expiry: '31/12',
    icon: 'business',
    iconBg: '#f5f3ff',
    iconColor: '#8b5cf6',
  },
  {
    id: 4,
    tag: 'THÀNH VIÊN',
    tagColor: colors.indigo500,
    title: 'Voucher 50k mua sắm tại Winmart',
    subtitle: 'Cho mọi hóa đơn qua EWA Pay',
    expiry: '24/11',
    icon: 'cart',
    iconBg: '#ecfdf5',
    iconColor: '#10b981',
  },
];

export default function OffersScreen() {
  const navigation = useNavigation();
  const { employee } = useApp();

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="Ưu đãi" onBack={() => navigation.goBack()} />
      
      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.mainTitle}>Ưu đãi</Text>
          <Text style={styles.mainDesc}>Khám phá các chương trình đặc quyền dành riêng cho thành viên EWA.</Text>
        </View>

        {/* Gift Box Card */}
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.giftCard}
        >
          <View style={styles.giftHeader}>
            <View style={styles.starCircle}>
              <Ionicons name="star" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.giftTitle}>Ví quà tặng</Text>
              <Text style={styles.giftSub}>Bạn đang có 12 mã chưa sử dụng.</Text>
            </View>
          </View>
          
          <View style={styles.giftFooter}>
            <View style={styles.activityIcons}>
              <View style={styles.activityIcon}><Ionicons name="gift" size={12} color="#fff" /></View>
              <View style={styles.activityIcon}><Ionicons name="ticket" size={12} color="#fff" /></View>
              <View style={styles.activityIcon}><Ionicons name="card" size={12} color="#fff" /></View>
            </View>
            <TouchableOpacity style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.map((cat, i) => (
            <TouchableOpacity key={i} style={[styles.catChip, i === 0 && styles.catChipActive]}>
              <Text style={[styles.catText, i === 0 && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Offers List */}
        <View style={styles.offersList}>
          {OFFERS.map((offer) => (
            <TouchableOpacity key={offer.id} style={styles.offerCard} activeOpacity={0.9}>
              <View style={styles.offerTop}>
                <View style={[styles.offerIconBox, { backgroundColor: offer.iconBg }]}>
                  <Ionicons name={offer.icon as any} size={28} color={offer.iconColor} />
                </View>
                <View style={styles.offerBody}>
                  <View style={[styles.offerTag, { backgroundColor: offer.tag.includes('SẮP') ? '#fee2e2' : '#f0fdf4' }]}>
                    <Text style={[styles.offerTagText, { color: offer.tagColor }]}>{offer.tag}</Text>
                  </View>
                  <Text style={styles.offerTitle}>{offer.title}</Text>
                  <Text style={styles.offerSubtitle}>{offer.subtitle}</Text>
                </View>
              </View>
              <View style={styles.offerFooter}>
                <View style={styles.expiryRow}>
                  <Ionicons name="time-outline" size={14} color={colors.slate400} />
                  <Text style={styles.expiryText}>Hạn: {offer.expiry}</Text>
                </View>
                <TouchableOpacity style={styles.useBtn}>
                  <Text style={styles.useBtnText}>Dùng ngay</Text>
                  <Ionicons name="flash" size={14} color={colors.indigo600} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 100 },
  intro: { marginTop: 24, marginBottom: 24 },
  mainTitle: { fontSize: 32, fontWeight: '900', color: '#4338ca' },
  mainDesc: { fontSize: 14, color: colors.slate600, marginTop: 8, lineHeight: 20 },
  
  giftCard: { borderRadius: 40, padding: 24, ...shadows.primary },
  giftHeader: { flexDirection: 'row', alignItems: 'center' },
  starCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  giftTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  giftSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, flexShrink: 1 },
  giftFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
  activityIcons: { flexDirection: 'row', gap: 6 },
  activityIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  seeAllText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  
  categoryRow: { marginTop: 32, gap: 12, paddingBottom: 8 },
  catChip: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25, backgroundColor: '#fff', borderWidth: 1, borderColor: '#f1f5f9' },
  catChipActive: { backgroundColor: '#4338ca', borderColor: '#4338ca' },
  catText: { fontSize: 13, fontWeight: '700', color: colors.slate600 },
  catTextActive: { color: '#fff' },
  
  offersList: { marginTop: 24, gap: 16 },
  offerCard: { backgroundColor: '#fff', borderRadius: 32, overflow: 'hidden', ...shadows.sm },
  offerTop: { padding: 20, flexDirection: 'row', gap: 16 },
  offerIconBox: { width: 64, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  offerBody: { flex: 1 },
  offerTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 6 },
  offerTagText: { fontSize: 10, fontWeight: '900' },
  offerTitle: { fontSize: 16, fontWeight: '800', color: colors.slate900, lineHeight: 22 },
  offerSubtitle: { fontSize: 12, color: colors.slate500, marginTop: 4 },
  offerFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#f8fafc',
    backgroundColor: '#fbfcfd'
  },
  expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  expiryText: { fontSize: 11, color: colors.slate400, fontWeight: '600' },
  useBtn: { flexDirection: 'row', alignItems: 'center' },
  useBtnText: { color: colors.indigo600, fontSize: 13, fontWeight: '800' },
});
