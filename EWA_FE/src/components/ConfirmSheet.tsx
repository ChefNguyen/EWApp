import React from 'react';
import {
  View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback,
  StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, shadows } from '../theme/colors';

interface ConfirmDetail {
  label: string;
  value: string;
  highlight?: boolean;
  accent?: 'emerald' | 'indigo' | 'red';
}

interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  icon?: React.ReactNode;
  details: ConfirmDetail[];
  note?: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmSheet({
  visible, title, icon, details, note, confirmLabel = 'Xác nhận', loading, onConfirm, onCancel,
}: ConfirmSheetProps) {
  const accentColor = (a?: string) => {
    if (a === 'emerald') return colors.emerald600;
    if (a === 'red') return colors.red600;
    if (a === 'indigo') return colors.indigo600;
    return colors.textPrimary;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.sheet}>
        {/* Drag handle */}
        <View style={styles.handle} />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>Vui lòng kiểm tra thông tin trước khi xác nhận</Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.detailsCard}>
            {details.map((item, i) => (
              <View key={i} style={[styles.detailRow, i < details.length - 1 && styles.detailBorder]}>
                <Text style={styles.detailLabel}>{item.label}</Text>
                <Text style={[
                  styles.detailValue,
                  item.highlight && styles.detailHighlight,
                  { color: accentColor(item.accent) },
                ]}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Note */}
          {note && (
            <View style={styles.noteRow}>
              <Feather name="shield" size={16} color={colors.indigo600} style={{ marginTop: 1 }} />
              <Text style={styles.noteText}>{note}</Text>
            </View>
          )}

          {/* Actions */}
          <TouchableOpacity
            onPress={onConfirm}
            disabled={loading}
            style={[styles.confirmBtn, loading && { opacity: 0.6 }]}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onCancel} disabled={loading} style={styles.cancelBtn} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Quay lại</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
    ...shadows.lg,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: colors.slate200,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  iconWrap: {
    width: 48,
    height: 48,
    backgroundColor: colors.indigo50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  detailsCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  detailBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  detailHighlight: {
    fontSize: 17,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.indigo50,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 20,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: colors.indigo700,
    lineHeight: 18,
    fontWeight: '500',
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...shadows.primary,
  },
  confirmText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
