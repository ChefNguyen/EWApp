import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { useApp } from '../context/AppContext';
import * as mockApi from '../services/mockApi';
import { colors, shadows } from '../theme/colors';
import { RootStackParamList } from '../types';

type LoginNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

type LoginStep = 'employee' | 'otp';

export default function LoginScreen({ navigation }: { navigation: LoginNavigationProp }) {
  const { login } = useApp();
  const [step, setStep] = useState<LoginStep>('employee');
  const [employeeCode, setEmployeeCode] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const handleValidateEmployee = async () => {
    if (!employeeCode.trim()) { setError('Vui lòng nhập mã nhân viên'); return; }
    setLoading(true);
    setError('');
    const result = await mockApi.validateEmployee(employeeCode);
    setLoading(false);
    if (result.success) {
      setEmployeeData(result.data);
      setStep('otp');
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    } else {
      setError(result.error || 'Mã nhân viên không tồn tại');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);
    setError('');
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    const fullOtp = newDigits.join('');
    if (fullOtp.length === 6 && !newDigits.includes('')) handleVerifyOtp(fullOtp);
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    setLoading(true);
    setError('');
    const result = await mockApi.verifyOtp(otp);
    setLoading(false);
    if (result.success) {
      login(employeeData);
    } else {
      setError(result.error || 'Mã OTP không đúng');
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  };

  const maskedPhone = employeeData?.phone
    ? employeeData.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')
    : '***';

  if (step === 'otp') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <LinearGradient colors={['#f8fafc', '#ffffff']} style={styles.background} />
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            <View style={styles.iconWrapper}>
              <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.iconGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="lock-closed" size={36} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={styles.heading}>Xác thực OTP</Text>
            <Text style={styles.subheading}>
              Mã xác thực đã được gửi đến{'\n'}số điện thoại <Text style={styles.phoneHighlight}>{maskedPhone}</Text>
            </Text>

            <View style={styles.otpRow}>
              {otpDigits.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={el => { otpRefs.current[i] = el; }}
                  style={[styles.otpBox, digit ? styles.otpBoxFilled : {}]}
                  value={digit}
                  onChangeText={val => handleOtpChange(i, val)}
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(i, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                />
              ))}
            </View>

            <View style={styles.otpLinks}>
              <TouchableOpacity onPress={() => { setStep('employee'); setOtpDigits(['','','','','','']); setError(''); }}>
                <Text style={styles.linkText}>Đổi mã nhân viên</Text>
              </TouchableOpacity>
              <Text style={styles.dot}>|</Text>
              <TouchableOpacity><Text style={styles.linkText}>Gửi lại mã</Text></TouchableOpacity>
            </View>

            {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

            <TouchableOpacity
              onPress={() => handleVerifyOtp(otpDigits.join(''))}
              disabled={loading || otpDigits.join('').length < 6}
              style={[styles.submitBtnWrapper, (loading || otpDigits.join('').length < 6) && { opacity: 0.5 }]}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#5c5adb', '#4338ca']} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <><Text style={styles.submitText}>Xác nhận</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></>}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>BẢO MẬT BỞI EWA</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <LinearGradient colors={['#f8fafc', '#ffffff']} style={styles.background} />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Logo Section */}
          <View style={styles.logoSection}>
            <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.logoBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <MaterialCommunityIcons name="wallet" size={40} color="#fff" />
            </LinearGradient>
            <Text style={styles.logoTitle}>EWA</Text>
            <Text style={styles.logoSubtitle}>Enterprise Solutions</Text>
          </View>

          <Text style={styles.heading}>Chào mừng trở lại</Text>
          <Text style={styles.subheading}>
            Vui lòng nhập mã nhân viên để tiếp tục truy cập{'\n'}quyền lợi của bạn.
          </Text>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>MÃ NHÂN VIÊN</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="card-account-details-outline" size={24} color={colors.slate400} />
              <TextInput
                style={styles.textInput}
                placeholder="VD: NV001"
                placeholderTextColor={colors.slate300}
                value={employeeCode}
                onChangeText={val => { setEmployeeCode(val.toUpperCase()); setError(''); }}
                onSubmitEditing={handleValidateEmployee}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="go"
              />
            </View>
          </View>

          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

          {/* Button */}
          <TouchableOpacity
            onPress={handleValidateEmployee}
            disabled={loading}
            style={[styles.submitBtnWrapper, loading && { opacity: 0.5 }]}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#5c5adb', '#4338ca']} style={styles.submitBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <><Text style={styles.submitText}>Tiếp tục</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></>}
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>BẢO MẬT BỞI EWA</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Feature Card */}
          <View style={styles.featureCard}>
            <View style={styles.shieldIconBox}>
              <Ionicons name="shield-checkmark" size={20} color={colors.indigo600} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>Truy cập tức thì</Text>
              <Text style={styles.featureDesc}>Nhận lương sớm bất cứ khi nào bạn cần mà không cần thủ tục rườm rà.</Text>
            </View>
          </View>

          {/* Footer Links */}
          <View style={styles.footerLinks}>
            <TouchableOpacity><Text style={styles.footerLinkText}>Hỗ trợ khách hàng</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.footerLinkText}>Điều khoản sử dụng</Text></TouchableOpacity>
            <TouchableOpacity><Text style={styles.footerLinkText}>Bảo mật</Text></TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  background: { ...StyleSheet.absoluteFillObject },
  content: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 40,
  },
  logoSection: { alignItems: 'center', marginBottom: 40 },
  logoBox: {
    width: 90, height: 90, borderRadius: 45,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16, 
    ...shadows.primary,
  },
  logoTitle: { fontSize: 44, fontWeight: '900', color: '#4338ca', letterSpacing: -1 },
  logoSubtitle: { fontSize: 16, color: colors.slate500, fontWeight: '600', marginTop: 4 },

  heading: { fontSize: 32, fontWeight: '900', color: colors.slate900, textAlign: 'center', marginBottom: 16 },
  subheading: { fontSize: 15, color: colors.slate500, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  
  inputSection: { width: '100%', marginBottom: 12 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: colors.slate500, letterSpacing: 1.2, marginBottom: 10, paddingLeft: 4 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#eceef0', borderRadius: 40,
    paddingHorizontal: 20, paddingVertical: 4,
  },
  textInput: {
    flex: 1, height: 56, fontSize: 18, fontWeight: '700',
    color: colors.slate900, marginLeft: 12,
  },

  submitBtnWrapper: { 
    width: '100%', borderRadius: 100, overflow: 'hidden', 
    marginTop: 20, marginBottom: 40, 
    ...shadows.primary,
    borderWidth: 2, borderColor: 'rgba(99,102,241,0.2)',
  },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  submitText: { color: colors.white, fontSize: 17, fontWeight: '800' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: 12, marginBottom: 40 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#f1f5f9' },
  dividerText: { fontSize: 11, fontWeight: '800', color: colors.slate400, letterSpacing: 1.5 },

  featureCard: {
    width: '100%', backgroundColor: '#eceef0', borderRadius: 40,
    padding: 24, flexDirection: 'row', alignItems: 'center', gap: 16,
    marginBottom: 40,
  },
  shieldIconBox: { width: 44, height: 44, backgroundColor: colors.white, borderRadius: 22, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  featureTitle: { fontSize: 15, fontWeight: '800', color: colors.slate900, marginBottom: 4 },
  featureDesc: { fontSize: 13, color: colors.slate500, lineHeight: 20, fontWeight: '500' },

  footerLinks: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 20, marginTop: 20 },
  footerLinkText: { fontSize: 13, fontWeight: '700', color: colors.slate900 },

  // OTP Styles (maintained but subtly updated colors)
  iconWrapper: { marginBottom: 32 },
  iconGradient: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  phoneHighlight: { fontWeight: '700', color: colors.slate700 },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  otpBox: { width: 46, height: 56, borderWidth: 2, borderColor: colors.slate200, borderRadius: 14, fontSize: 22, fontWeight: '700', color: colors.slate900, backgroundColor: colors.white },
  otpBoxFilled: { borderColor: colors.indigo600, backgroundColor: colors.indigo50, color: colors.indigo700 },
  otpLinks: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  dot: { color: colors.slate300, fontSize: 14 },
  linkText: { color: colors.indigo600, fontSize: 12, fontWeight: '700' },
  errorBox: { width: '100%', backgroundColor: colors.red50, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#fecaca', marginBottom: 20, alignItems: 'center' },
  errorText: { color: colors.red600, fontSize: 14, fontWeight: '500' },
  footer: { alignItems: 'center', marginTop: 20 },
  footerText: { fontSize: 11, color: colors.slate400, fontWeight: '800', letterSpacing: 1.5 },
});
