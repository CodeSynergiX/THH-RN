/**
 * ForgotPasswordScreen — translated faithfully from Stitch design
 * "Forgot Password / પાસવર્ડ ભૂલી ગયા" (screen: 199bff5727704272b9305559808ca74e).
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTranslation } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CanopyHeader } from '../components/CanopyHeader';

// ── Stitch Design Tokens ──────────────────────────────────────────────────────
const C = {
  primary: '#006026',
  primaryCont: '#1b7a38',
  primaryFixed: '#9bf7a6',
  surface: '#fff8f5',
  surfaceLow: '#fff1ea',
  surfaceCont: '#ffeadf',
  surfaceHigh: '#ffe3d4',
  surfaceHiest: '#ffdbc8',
  white: '#ffffff',
  secondary: '#79573c',
  secCont: '#ffd1af',
  onSurface: '#2a170b',
  onSurfaceVar: '#3f493f',
  muted: '#6f7a6e',
  outlineVar: '#bfcabb',
  whatsapp: '#25D366',
  error: '#ba1a1a',
  errCont: '#ffdad6',
};

export const ForgotPasswordScreen: React.FC<{ onBack: () => void }> = ({
  onBack,
}) => {
  const { locale } = useTranslation();
  const auth = useAuth();

  const gu = locale === 'gu';

  // Form State
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [contact, setContact] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(48);

  const otpInputRefs = [
    useRef<any>(null),
    useRef<any>(null),
    useRef<any>(null),
    useRef<any>(null),
    useRef<any>(null),
    useRef<any>(null),
  ];

  // Timer countdown
  useEffect(() => {
    let timer: any;
    if (otpSent && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, resendTimer]);

  // const handleLangToggle = (newLang: 'en' | 'gu') => {
  //   setLang(newLang);
  //   switchLanguage(newLang).catch(() => {});
  // };

  // OTP Input Handler
  const handleOtpChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length > 1) {
      const digits = cleaned.slice(0, 6).split('');
      const updated = [...otpCode];
      digits.forEach((d, i) => {
        if (index + i < 6) updated[index + i] = d;
      });
      setOtpCode(updated);
      const nextIdx = Math.min(index + digits.length, 5);
      otpInputRefs[nextIdx].current?.focus();
      return;
    }

    const updated = [...otpCode];
    updated[index] = cleaned;
    setOtpCode(updated);

    if (cleaned.length === 1 && index < 5) {
      otpInputRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  const { showToast } = useToast();

  const fullCode = otpCode.join('');

  // Send OTP
  const sendOtp = async () => {
    if (!contact.trim()) {
      showToast(
        gu
          ? 'કૃપા કરીને રજિસ્ટર્ડ નંબર અથવા ઈમેલ દાખલ કરો'
          : 'Please enter your registered phone or email',
        'warning',
        gu ? 'માહિતી ખૂટે છે' : 'Missing Information',
      );
      return;
    }

    setBusy(true);
    try {
      const payload =
        method === 'email'
          ? { email: contact.trim(), purpose: 'reset' }
          : { phone: contact.trim(), purpose: 'reset' };

      await auth.requestOtp(payload);
      setOtpSent(true);
      setResendTimer(48);

      showToast(
        gu
          ? 'તમારા રજિસ્ટર્ડ સંપર્ક પર ઓટીપી મોકલ્યો છે. કૃપા કરીને તમારું ઇનબોક્સ તપાસો.'
          : 'Verification code sent to your registered contact. Please check your inbox.',
        'success',
        gu ? 'ઓટીપી મોકલવામાં આવ્યો' : 'OTP Sent Successfully',
      );
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : gu
          ? 'ઓટીપી મોકલી શકાયો નહીં'
          : 'Could not send OTP',
        'error',
        gu ? 'ઓટીપી નિષ્ફળ' : 'Could not send OTP',
      );
    } finally {
      setBusy(false);
    }
  };

  // Reset Password
  const handleResetPassword = async () => {
    if (!contact.trim()) {
      showToast(
        gu
          ? 'કૃપા કરીને રજિસ્ટર્ડ સંપર્ક દાખલ કરો'
          : 'Please enter your registered contact',
        'warning',
      );
      return;
    }
    if (fullCode.length < 6) {
      showToast(
        gu
          ? 'કૃપા કરીને ૬-અંકનો ઓટીપી દાખલ કરો'
          : 'Please enter the 6-digit OTP code',
        'warning',
      );
      return;
    }
    if (newPassword.length < 4) {
      showToast(
        gu
          ? 'નવો પિન / પાસવર્ડ ઓછામાં ઓછો ૪ અક્ષરનો હોવો જોઈએ'
          : 'New PIN/password must be at least 4 characters',
        'warning',
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast(
        gu ? 'બંને પિન / પાસવર્ડ સરખા નથી' : 'PINs/passwords do not match',
        'warning',
      );
      return;
    }

    setBusy(true);
    try {
      await auth.resetPasswordWithOtp({
        email: method === 'email' ? contact.trim() : undefined,
        phone: method === 'phone' ? contact.trim() : undefined,
        code: fullCode,
        password: newPassword,
        password_confirmation: confirmPassword,
        purpose: 'reset',
      });

      showToast(
        gu
          ? 'તમારો પાસવર્ડ સફળતાપૂર્વક બદલાઈ ગયો છે. હવે લોગિન કરો.'
          : 'Your password has been reset successfully. Please log in.',
        'success',
        gu ? 'સફળતા!' : 'Success!',
      );
      setTimeout(() => {
        onBack();
      }, 1200);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : gu
          ? 'અમાન્ય ઓટીપી અથવા વિનંતી સમાપ્ત થઈ ગઈ છે.'
          : 'Invalid OTP or expired request.',
        'error',
        gu ? 'પાસવર્ડ બદલવામાં નિષ્ફળ' : 'Password Reset Failed',
      );
    } finally {
      setBusy(false);
    }
  };

  const isContactValid =
    method === 'phone'
      ? contact.replace(/\D/g, '').length === 10
      : contact.includes('@');

  const passwordsMatch =
    newPassword.length >= 4 && newPassword === confirmPassword;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: C.surface }]}
      edges={['bottom']}
    >
      {/* ── Top Reusable Canopy Header ── */}
      <CanopyHeader showBack onBack={onBack} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Top Visual Badge / Safe Shelter Iconography ── */}
          <View style={styles.heroSection}>
            <View style={styles.badgeContainer}>
              <View style={styles.badgeOuterRing}>
                <View style={styles.badgeInnerCircle}>
                  <Ionicons name="refresh" size={30} color="#fff" />
                </View>
              </View>
              <View style={styles.verifiedShield}>
                <Ionicons name="shield-checkmark" size={13} color={C.primary} />
              </View>
            </View>

            <Text style={styles.headline}>Forgot Password?</Text>
            <Text style={styles.subHeadline}>પાસવર્ડ પુનઃપ્રાપ્તિ</Text>
            <Text style={styles.instructions}>
              Enter your registered contact to receive a secure recovery code ·
              તમારા રજિસ્ટર્ડ નંબર પર ઓટીપી મેળવો
            </Text>
          </View>

          {/* ── Recovery Method Toggle Pills ── */}
          <View style={styles.methodToggleWrap}>
            <TouchableOpacity
              style={[
                styles.methodBtn,
                method === 'phone' && styles.methodBtnActive,
              ]}
              onPress={() => {
                setMethod('phone');
                setContact('');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={17}
                color={method === 'phone' ? C.primary : C.onSurfaceVar}
              />
              <Text
                style={[
                  styles.methodBtnText,
                  method === 'phone' && styles.methodBtnTextActive,
                ]}
              >
                Mobile (+91)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodBtn,
                method === 'email' && styles.methodBtnActive,
              ]}
              onPress={() => {
                setMethod('email');
                setContact('');
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="at-outline"
                size={17}
                color={method === 'email' ? C.primary : C.onSurfaceVar}
              />
              <Text
                style={[
                  styles.methodBtnText,
                  method === 'email' && styles.methodBtnTextActive,
                ]}
              >
                Email ID
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Card 1: Primary Credentials Input Card ── */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardLabel}>
                {method === 'phone' ? 'Registered Mobile' : 'Registered Email'}
                <Text style={styles.cardLabelGu}>
                  {method === 'phone'
                    ? ' / રજિસ્ટર્ડ નંબર'
                    : ' / રજિસ્ટર્ડ ઈમેલ'}
                </Text>
              </Text>

              <View style={styles.verifiedMemberPill}>
                <Ionicons name="checkmark-circle" size={13} color={C.primary} />
                <Text style={styles.verifiedMemberText}>Verified Member</Text>
              </View>
            </View>

            {/* Input field with prefix & green checkmark */}
            <View style={styles.inputWrap}>
              <View style={styles.inputPrefix}>
                <Ionicons
                  name={
                    method === 'phone'
                      ? 'phone-portrait-outline'
                      : 'mail-outline'
                  }
                  size={17}
                  color={C.onSurfaceVar}
                />
                <Text style={styles.prefixText}>
                  {method === 'phone' ? '+91' : ''}
                </Text>
                {method === 'phone' ? (
                  <View style={styles.prefixDivider} />
                ) : null}
              </View>

              <TextInput
                style={styles.textInput}
                placeholder={
                  method === 'phone' ? '98251 44320' : 'name@example.com'
                }
                placeholderTextColor={C.muted}
                value={contact}
                onChangeText={setContact}
                keyboardType={
                  method === 'phone' ? 'phone-pad' : 'email-address'
                }
                autoCapitalize="none"
                maxLength={method === 'phone' ? 10 : 80}
              />

              {isContactValid || contact.length > 0 ? (
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={C.primary}
                  style={styles.inputRightIcon}
                />
              ) : null}
            </View>

            {/* Unit link & Change action */}
            <View style={styles.contactFooterRow}>
              <View style={styles.unitTag}>
                <Ionicons name="compass-outline" size={14} color={C.primary} />
                <Text style={styles.unitText}>
                  Linked with Surendranagar Sevak Unit
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  if (otpSent) {
                    setContact('');
                    setOtpSent(false);
                  } else {
                    sendOtp();
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.changeLinkText}>
                  {otpSent
                    ? 'Change'
                    : contact.length > 0
                    ? 'Change'
                    : 'Send OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Card 2: OTP Verification Card ── */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconTitleRow}>
                <View
                  style={[styles.stepIconWrap, { backgroundColor: C.secCont }]}
                >
                  <Ionicons name="keypad" size={15} color={C.secondary} />
                </View>
                <View>
                  <Text style={styles.stepTitle}>Enter 6-Digit OTP</Text>
                  <Text style={styles.stepTitleGu}>છ અંકનો ઓટીપી દાખલ કરો</Text>
                </View>
              </View>

              <View
                style={[styles.stepPill, { backgroundColor: C.surfaceHigh }]}
              >
                <Text style={styles.stepPillText}>Step 2 of 3</Text>
              </View>
            </View>

            <Text style={styles.otpSubtitle}>
              {`Sent to ${
                contact
                  ? `+91${contact.slice(0, 5)}•••${contact.slice(-2)}`
                  : '+9198251•••20'
              } via SMS & Community App.`}
            </Text>

            {/* 6 OTP Digit Boxes */}
            <View style={styles.otpBoxesRow}>
              {[0, 1, 2, 3, 4, 5].map(index => {
                const val = otpCode[index];
                return (
                  <View
                    key={index}
                    style={[styles.otpBox, val !== '' && styles.otpBoxFilled]}
                  >
                    <TextInput
                      ref={otpInputRefs[index]}
                      style={styles.otpInput}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={val}
                      placeholder="—"
                      placeholderTextColor={C.muted}
                      onChangeText={text => handleOtpChange(text, index)}
                      onKeyPress={e => handleOtpKeyPress(e, index)}
                      selectTextOnFocus
                    />
                  </View>
                );
              })}
            </View>

            {/* Timer & Resend SMS */}
            <View style={styles.timerRow}>
              <View style={styles.timerGroup}>
                <Ionicons name="time-outline" size={15} color={C.muted} />
                <Text style={styles.timerText}>
                  {'Resend code in '}
                  <Text style={styles.timerHighlight}>
                    00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}
                  </Text>
                </Text>
              </View>

              <TouchableOpacity
                onPress={sendOtp}
                disabled={resendTimer > 0 || busy}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.resendLink,
                    resendTimer === 0
                      ? { color: C.primary, fontWeight: '700' }
                      : { color: C.muted },
                  ]}
                >
                  Resend SMS
                </Text>
              </TouchableOpacity>
            </View>

            {/* WhatsApp Fallback Button */}
            <TouchableOpacity
              style={styles.whatsappBtn}
              onPress={sendOtp}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-whatsapp" size={17} color={C.whatsapp} />
              <Text style={styles.whatsappBtnText}>
                Send code via WhatsApp / વોટ્સએપ પર મેળવો
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Card 3: Create New Security PIN / Password ── */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconTitleRow}>
                <View
                  style={[
                    styles.stepIconWrap,
                    { backgroundColor: C.primaryFixed },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={15}
                    color={C.primary}
                  />
                </View>
                <View>
                  <Text style={styles.stepTitle}>Create New Security PIN</Text>
                  <Text style={styles.stepTitleGu}>
                    નવો ૪-અંકનો સુરક્ષા પિન બનાવો
                  </Text>
                </View>
              </View>
            </View>

            {/* New PIN Input */}
            <View style={styles.credentialField}>
              <Text style={styles.fieldLabel}>New 4-Digit PIN / નવો પિન</Text>
              <View style={styles.inputWrap}>
                <Ionicons
                  name="lock-closed-outline"
                  size={17}
                  color={C.muted}
                  style={styles.inputLeftIcon}
                />
                <TextInput
                  style={[
                    styles.textInput,
                    { letterSpacing: showPassword ? 1 : 6 },
                  ]}
                  placeholder="• • • •"
                  placeholderTextColor={C.muted}
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.inputRightIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={19}
                    color={C.muted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm PIN Input */}
            <View style={styles.credentialField}>
              <Text style={styles.fieldLabel}>
                Confirm PIN / પિન પુષ્ટિ કરો
              </Text>
              <View style={styles.inputWrap}>
                <Ionicons
                  name="lock-closed-outline"
                  size={17}
                  color={C.muted}
                  style={styles.inputLeftIcon}
                />
                <TextInput
                  style={[
                    styles.textInput,
                    { letterSpacing: showPassword ? 1 : 6 },
                  ]}
                  placeholder="• • • •"
                  placeholderTextColor={C.muted}
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                />
                {passwordsMatch || confirmPassword.length >= 4 ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={C.primary}
                    style={styles.inputRightIcon}
                  />
                ) : null}
              </View>
            </View>

            {/* Info callout */}
            <View style={styles.infoCallout}>
              <Ionicons
                name="information-circle-outline"
                size={17}
                color={C.primary}
              />
              <Text style={styles.infoCalloutText}>
                Use this PIN for instant village module check-ins and member
                welfare claims.
              </Text>
            </View>
          </View>

          {/* ── Card 4: Community Trust & Sevak Assistance Banner ── */}
          <View style={styles.supportBanner}>
            <View style={styles.supportLeft}>
              <View style={styles.supportAvatar}>
                <Svg width={30} height={30} viewBox="0 0 100 100">
                  <Circle cx={50} cy={50} r={48} fill="#ffeadf" />
                  <Circle cx={40} cy={35} r={14} fill="#79573c" />
                  <Circle cx={64} cy={40} r={11} fill="#006026" />
                  <Path
                    d="M22 82 C22 62 34 54 48 54 C60 54 70 64 72 82 Z"
                    fill="#79573c"
                  />
                  <Path
                    d="M52 82 C54 68 62 62 76 62 C84 62 90 70 92 82 Z"
                    fill="#006026"
                  />
                </Svg>
              </View>
              <View style={styles.supportTextWrap}>
                <Text style={styles.supportTitle}>
                  Having trouble? / સહાયકની મદદ
                </Text>
                <Text style={styles.supportSub}>
                  Call Sevak Desk: 1800-233-844 (Toll-Free)
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.supportCallBtn}
              onPress={() => Linking.openURL('tel:1800233844').catch(() => {})}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={17} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* ── Primary Action Button ── */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: C.primary }]}
              onPress={handleResetPassword}
              disabled={busy}
              activeOpacity={0.88}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.submitBtnContentRow}>
                  <Text style={styles.submitBtnText}>
                    Reset Password & Login
                  </Text>
                  <Text style={styles.submitBtnSub}>/ પાસવર્ડ બદલો</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#fff"
                    style={{ marginLeft: 4 }}
                  />
                </View>
              )}
            </TouchableOpacity>

            {/* Back to Sign In */}
            <TouchableOpacity
              style={styles.backToLoginBtn}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={15} color={C.onSurfaceVar} />
              <Text style={styles.backToLoginText}>
                Back to Sign In / પાછા લોગિન પર જાઓ
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Trust Seal / Footer Dignity Branding ── */}
          <View style={styles.footerBranding}>
            <View style={styles.shieldBadge}>
              <Ionicons name="shield-checkmark" size={14} color={C.primary} />
              <Text style={styles.shieldText}>
                THH VILLAGE SHIELD • 256-BIT ENCRYPTED
              </Text>
            </View>
            <Text style={styles.copyrightText}>
              The Helping Hands © Gram Vikas Suraksha Trust
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  topHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000010',
  },
  topLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 14,
  },
  brandSubtitle: {
    fontSize: 9,
    lineHeight: 10,
  },
  topRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  langPill: {
    flexDirection: 'row',
    borderRadius: 99,
    padding: 2,
  },
  langSegment: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  langSegmentActive: {
    backgroundColor: C.white,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  langSegmentText: {
    fontSize: 11,
    color: C.onSurfaceVar,
    fontWeight: '500',
  },
  langSegmentTextActive: {
    color: C.primary,
    fontWeight: '700',
  },
  treeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 14,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  badgeContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  badgeOuterRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeInnerCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.primaryCont,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: C.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  verifiedShield: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    color: C.onSurface,
    letterSpacing: -0.3,
  },
  subHeadline: {
    fontSize: 14,
    fontWeight: '700',
    color: C.primary,
    marginTop: 2,
  },
  instructions: {
    fontSize: 12,
    color: C.onSurfaceVar,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
    paddingHorizontal: 16,
  },

  // Toggle pills
  methodToggleWrap: {
    flexDirection: 'row',
    backgroundColor: C.surfaceHigh,
    padding: 3,
    borderRadius: 99,
  },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 99,
  },
  methodBtnActive: {
    backgroundColor: C.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  methodBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.onSurfaceVar,
  },
  methodBtnTextActive: {
    color: C.primary,
    fontWeight: '700',
  },

  // Card general
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: C.onSurface,
  },
  cardLabelGu: {
    fontSize: 12,
    fontWeight: '400',
    color: C.onSurfaceVar,
  },
  verifiedMemberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${C.primary}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  verifiedMemberText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.primary,
  },

  // Input Wrap
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceLow,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 12,
    position: 'relative',
  },
  inputPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 6,
  },
  prefixText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.onSurface,
  },
  prefixDivider: {
    width: 1,
    height: 18,
    backgroundColor: C.outlineVar,
  },
  inputLeftIcon: {
    marginRight: 8,
  },
  inputRightIcon: {
    position: 'absolute',
    right: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: C.onSurface,
    paddingVertical: 0,
  },

  // Contact Footer
  contactFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  unitTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  unitText: {
    fontSize: 11,
    color: C.onSurfaceVar,
    flexShrink: 1,
  },
  changeLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.primary,
  },
  sendOtpBtn: {
    backgroundColor: C.surfaceHigh,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sendOtpBtnActive: {
    backgroundColor: C.primary,
  },
  sendOtpBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },

  // Step Header
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.onSurface,
    lineHeight: 16,
  },
  stepTitleGu: {
    fontSize: 11,
    color: C.onSurfaceVar,
    lineHeight: 13,
  },
  stepPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  stepPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.secondary,
  },
  otpSubtitle: {
    fontSize: 12,
    color: C.onSurfaceVar,
  },

  // 6-Box OTP
  otpBoxesRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  otpBox: {
    flex: 1,
    height: 52,
    borderRadius: 10,
    backgroundColor: C.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  otpBoxFilled: {
    borderColor: C.primary,
    backgroundColor: C.white,
  },
  otpInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: C.primary,
  },
  otpCursorDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.outlineVar,
  },

  // Timer Row
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  timerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    fontSize: 12,
    color: C.onSurfaceVar,
  },
  timerHighlight: {
    fontWeight: '700',
    color: C.onSurface,
  },
  resendLink: {
    fontSize: 12,
    fontWeight: '500',
  },

  // WhatsApp Button
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.surfaceHigh,
    height: 42,
    borderRadius: 10,
    marginTop: 2,
  },
  whatsappBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.primary,
  },

  // Credential Field
  credentialField: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.onSurfaceVar,
  },
  infoCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.surfaceLow,
    padding: 10,
    borderRadius: 10,
    marginTop: 2,
  },
  infoCalloutText: {
    flex: 1,
    fontSize: 11,
    color: C.onSurfaceVar,
    lineHeight: 15,
  },

  // Support Banner
  supportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surfaceCont,
    padding: 12,
    borderRadius: 14,
  },
  supportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  supportAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTextWrap: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.onSurface,
  },
  supportSub: {
    fontSize: 11,
    color: C.onSurfaceVar,
    marginTop: 1,
  },
  supportCallBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },

  // Submit Section
  actionSection: {
    gap: 10,
    paddingTop: 4,
  },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    elevation: 3,
    shadowColor: C.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  submitBtnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  submitBtnSub: {
    fontSize: 13,
    color: '#ffffffcc',
  },
  backToLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  backToLoginText: {
    fontSize: 13,
    color: C.onSurfaceVar,
    fontWeight: '600',
  },

  // Footer
  footerBranding: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
    opacity: 0.85,
  },
  shieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shieldText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.primary,
    letterSpacing: 0.6,
  },
  copyrightText: {
    fontSize: 9,
    color: C.muted,
  },
});
