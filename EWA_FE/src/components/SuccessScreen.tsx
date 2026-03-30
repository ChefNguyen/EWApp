import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadows } from '../theme/colors';

interface SuccessScreenProps {
  title: string;
  subtitle?: string;
  amountLabel?: string;
  amount?: string;
  breakdown?: { label: string; value: string }[];
  meta?: { label: string; value: string }[];
  primaryAction: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}

export default function SuccessScreen({
  title, subtitle, amountLabel, amount, breakdown, meta, primaryAction, secondaryAction,
}: SuccessScreenProps) {
  // Get current date and time
  const now = new Date();
  const dateTimeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}, ${now.getDate().toString().padStart(2,'0')} Th${(now.getMonth()+1).toString().padStart(2,'0')} ${now.getFullYear()}`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon Visualization */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={['#6366f1', '#4338ca']}
            style={styles.mainCircle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="checkmark" size={48} color="#fff" />
          </LinearGradient>
          
          {/* Decorative floating dots */}
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>

        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        {/* Amount prominently */}
        {amount && (
          <View style={styles.amountBox}>
            {amountLabel && <Text style={styles.amountLabel}>{amountLabel}</Text>}
            <Text style={styles.amountText}>{amount}</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Hoàn thành</Text>
            </View>
          </View>
        )}

        {/* Transaction Time */}
        <View style={styles.timeCard}>
          <Ionicons name="time-outline" size={16} color={colors.indigo600} />
          <Text style={styles.timeText}>{dateTimeStr}</Text>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsList}>
            {breakdown && breakdown.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Chi tiết giao dịch</Text>
                {breakdown.map((item, i) => (
                  <View key={`breakdown-${i}`} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{item.label}</Text>
                    <Text style={styles.detailValue}>{item.value}</Text>
                  </View>
                ))}
              </>
            )}
            
            {meta && meta.length > 0 && (
              <>
                {breakdown && breakdown.length > 0 && <View style={styles.divider} />}
                <Text style={styles.sectionTitle}>Thông tin thêm</Text>
                {meta.map((item, i) => (
                  <View key={`meta-${i}`} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{item.label}</Text>
                    <View style={styles.detailValueBox}>
                      {item.label.toLowerCase().includes('phương thức') && (
                        <MaterialCommunityIcons name="bank" size={14} color={colors.indigo600} style={{ marginRight: 6 }} />
                      )}
                      <Text style={styles.detailValue}>{item.value}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Xác nhận bởi EWA • 2026</Text>
        </View>
      </ScrollView>

      {/* Fixed Actions at Bottom */}
      <View style={styles.fixedActions}>
        <TouchableOpacity 
          onPress={primaryAction.onClick} 
          style={styles.primaryBtn} 
          activeOpacity={0.9}
        >
          <Text style={styles.primaryBtnText}>{primaryAction.label}</Text>
        </TouchableOpacity>

        {secondaryAction && (
          <TouchableOpacity 
            onPress={secondaryAction.onClick} 
            style={styles.secondaryBtn} 
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryBtnText}>{secondaryAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollView: { flex: 1 },
  scrollContent: { 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: 40, 
    paddingBottom: 20,
  },
  
  iconContainer: { position: 'relative', marginBottom: 24 },
  mainCircle: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', ...shadows.primary },
  dot: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
  dot1: { top: 0, right: -8, backgroundColor: '#cbd5e1' },
  dot2: { bottom: 15, left: -15, backgroundColor: '#6366f1', opacity: 0.4 },
  dot3: { bottom: 8, right: -15, backgroundColor: '#4f46e5' },

  title: { fontSize: 24, fontWeight: '900', color: colors.slate900, textAlign: 'center' },
  subtitle: { fontSize: 13, color: colors.slate500, textAlign: 'center', marginTop: 6, lineHeight: 20, maxWidth: '85%' },
  
  amountBox: { alignItems: 'center', marginTop: 24, marginBottom: 16 },
  amountLabel: { fontSize: 12, color: colors.slate500, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  amountText: { fontSize: 38, fontWeight: '900', color: '#4338ca', letterSpacing: -1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginTop: 10 },
  statusDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#10b981', marginRight: 6 },
  statusText: { color: '#10b981', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  
  timeCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.indigo50, 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 16, 
    gap: 6,
    marginBottom: 20,
  },
  timeText: { fontSize: 12, color: colors.indigo700, fontWeight: '700' },
  
  detailsCard: { width: '100%', backgroundColor: '#fff', borderRadius: 28, padding: 20, ...shadows.sm, marginBottom: 16 },
  detailsList: { gap: 10 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: colors.slate500, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  detailLabel: { fontSize: 12, color: colors.slate500, fontWeight: '600', flex: 1 },
  detailValueBox: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end' },
  detailValue: { fontSize: 13, color: colors.slate900, fontWeight: '700', textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.slate100, marginVertical: 10 },
  
  footer: { marginTop: 16, marginBottom: 8 },
  footerText: { fontSize: 10, color: colors.slate400, fontWeight: '500', letterSpacing: 0.5, textAlign: 'center' },
  
  fixedActions: { 
    paddingHorizontal: 24, 
    paddingTop: 16, 
    paddingBottom: 20, 
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  primaryBtn: { backgroundColor: '#4338ca', paddingVertical: 16, borderRadius: 20, alignItems: 'center', ...shadows.md },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  secondaryBtn: { paddingVertical: 14, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  secondaryBtnText: { color: colors.slate600, fontSize: 13, fontWeight: '700' },
});
