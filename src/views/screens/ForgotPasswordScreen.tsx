/**
 * ForgotPasswordScreen — Clean, minimalist password recovery flow
 * Strictly Email-based with 3 progressive steps:
 *   Step 1: Enter registered email -> Send OTP
 *   Step 2: Enter 6-digit verification code -> Verify OTP (OTP section shown only after OTP is sent)
 *   Step 3: Enter new password & confirm -> Reset password (OTP hidden, password inputs shown only after OTP verified)
 * Dynamic theme colors and seamless bilingual language support.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';
import { CanopyHeader } from '../components/CanopyHeader';
import { THHTreeSVG } from './SplashScreen';

type Step = 'email' | 'otp' | 'password';

export const ForgotPasswordScreen: React.FC<{ onBack: () => void }> = ({
  onBack,
}) => {
  const { theme } = useAppTheme();
  const { colors, typography } = theme;
  const { language, locale } = useTranslation();
  const auth = useAuth();
  const { showToast } = useToast();

  const isGu = (language || locale) === 'gu';

  // Step state: 'email' -> 'otp' -> 'password'
  const [step, setStep] = useState<Step>('email');

  // Form states
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [verifiedToken, setVerifiedToken] = useState<string | undefined>(
    undefined,
  );
  const [verifiedCode, setVerifiedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & timer states
  const [busy, setBusy] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  const otpInputRefs = [
    useRef<any>(null),
    useRef<any>(null),
    useRef<any>(null),
    useRef<any>(null),
    useRef<any>(null),
    useRef<any>(null),
  ];

  const swayAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Crown sway animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(swayAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [swayAnim]);

  // People / leaf float animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [floatAnim]);

  // Timer countdown on OTP step
  useEffect(() => {
    let timer: any;
    if (step === 'otp' && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendTimer]);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const fullCode = otpCode.join('');
  const isOtpComplete = fullCode.length === 6;
  const isPasswordValid = newPassword.length >= 4;
  const passwordsMatch = isPasswordValid && newPassword === confirmPassword;

  // OTP Input Handlers
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

  // Step 1: Send OTP to Email
  const handleSendOtp = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !isEmailValid) {
      showToast(
        isGu
          ? 'કૃપા કરીને માન્ય ઈમેલ સરનામું દાખલ કરો.'
          : 'Please enter a valid email address.',
        'warning',
        isGu ? 'ઈમેલ જરૂરી છે' : 'Email Required',
      );
      return;
    }

    setBusy(true);
    try {
      await auth.requestOtp({
        email: trimmedEmail,
        purpose: 'reset',
      });

      setStep('otp');
      setResendTimer(60);
      setOtpCode(['', '', '', '', '', '']);

      showToast(
        isGu
          ? `${trimmedEmail} પર ઓટીપી મોકલ્યો છે.`
          : `Verification code sent to ${trimmedEmail}.`,
        'success',
        isGu ? 'ઓટીપી મોકલ્યો' : 'OTP Sent',
      );

      setTimeout(() => {
        otpInputRefs[0].current?.focus();
      }, 300);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : isGu
          ? 'ઓટીપી મોકલી શકાયો નહીં. ફરી પ્રયાસ કરો.'
          : 'Could not send verification code. Please try again.',
        'error',
        isGu ? 'ઓટીપી નિષ્ફળ' : 'Failed',
      );
    } finally {
      setBusy(false);
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifyOtp = async () => {
    if (fullCode.length < 6) {
      showToast(
        isGu
          ? 'કૃપા કરીને સંપૂર્ણ ૬-અંકનો ઓટીપી દાખલ કરો.'
          : 'Please enter the complete 6-digit OTP code.',
        'warning',
      );
      return;
    }

    setBusy(true);
    try {
      const res = await authService.verifyOtp({
        email: email.trim().toLowerCase(),
        code: fullCode,
        purpose: 'reset',
      });

      if (res.data?.token) {
        setVerifiedToken(res.data.token);
      }
      setVerifiedCode(fullCode);

      showToast(
        isGu
          ? 'ઓટીપી ચકાસાયો! હવે નવો પાસવર્ડ સેટ કરો.'
          : 'OTP verified! Now set your new password.',
        'success',
        isGu ? 'ચકાસાયેલ' : 'Verified',
      );

      // Hide OTP, advance to password setup
      setStep('password');
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : isGu
          ? 'અમાન્ય અથવા સમાપ્ત થયેલ ઓટીપી.'
          : 'Invalid or expired OTP code.',
        'error',
        isGu ? 'ચકાસણી નિષ્ફળ' : 'Verification Failed',
      );
    } finally {
      setBusy(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 4) {
      showToast(
        isGu
          ? 'નવો પાસવર્ડ ઓછામાં ઓછો ૪ અક્ષરનો હોવો જોઈએ.'
          : 'New password must be at least 4 characters long.',
        'warning',
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast(
        isGu ? 'બંને પાસવર્ડ સરખા નથી.' : 'Passwords do not match.',
        'warning',
      );
      return;
    }

    setBusy(true);
    try {
      await authService.resetPasswordWithOtp({
        email: email.trim().toLowerCase(),
        code: verifiedCode || fullCode,
        token: verifiedToken,
        password: newPassword,
        password_confirmation: confirmPassword,
        purpose: 'reset',
      });

      showToast(
        isGu
          ? 'પાસવર્ડ સફળતાપૂર્વક બદલાઈ ગયો છે! હવે લોગિન કરો.'
          : 'Password reset successfully! Please sign in with your new password.',
        'success',
        isGu ? 'સફળતા!' : 'Success!',
      );

      setTimeout(() => {
        onBack();
      }, 1200);
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : isGu
          ? 'પાસવર્ડ બદલવામાં નિષ્ફળ. કૃપા કરીને ફરી પ્રયાસ કરો.'
          : 'Failed to reset password. Please try again.',
        'error',
        isGu ? 'નિષ્ફળ' : 'Error',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.wrap, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      {/* ── Native Top Canopy Header (Back button, Logo, Language Switch) ── */}
      <CanopyHeader
        showBack
        onBack={onBack}
        title={isGu ? 'પાસવર્ડ પુનઃપ્રાપ્તિ' : 'Reset Password'}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { flexGrow: 1, paddingBottom: 200 },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Minimalist Hero Header ── */}
          <View style={styles.headerHero}>
            <View
              style={[
                styles.treeCircle,
                { backgroundColor: colors.surface, width: 200, height: 200 },
              ]}
            >
              <THHTreeSVG swayAnim={swayAnim} floatAnim={floatAnim} />
            </View>

            <View
              style={[
                styles.kickerPill,
                { backgroundColor: colors.surfaceSubtle },
              ]}
            >
              <Ionicons
                name="shield-checkmark"
                size={13}
                color={colors.primary}
              />
              <Text style={[styles.kickerText, { color: colors.secondary }]}>
                {step === 'email'
                  ? isGu
                    ? 'પગલું ૧: ઈમેલ ચકાસણી'
                    : 'STEP 1: EMAIL VERIFICATION'
                  : step === 'otp'
                  ? isGu
                    ? 'પગલું ૨: ઓટીપી દાખલ કરો'
                    : 'STEP 2: ENTER OTP'
                  : isGu
                  ? 'પગલું ૩: નવો પાસવર્ડ'
                  : 'STEP 3: NEW PASSWORD'}
              </Text>
            </View>

            <Text
              style={[
                styles.heroTitle,
                { color: colors.text, fontFamily: typography.fontFamilySans },
              ]}
            >
              {step === 'email'
                ? isGu
                  ? 'પાસવર્ડ ભૂલી ગયા છો?'
                  : 'Forgot Password?'
                : step === 'otp'
                ? isGu
                  ? 'ઓટીપી દાખલ કરો'
                  : 'Enter Verification Code'
                : isGu
                ? 'નવો પાસવર્ડ સેટ કરો'
                : 'Set New Password'}
            </Text>

            <Text style={[styles.heroSub, { color: colors.textMuted }]}>
              {step === 'email'
                ? isGu
                  ? 'તમારા નોંધાયેલ ઈમેલ પર ૬-અંકનો ઓટીપી મેળવો'
                  : 'Enter your registered email to receive a recovery code'
                : step === 'otp'
                ? isGu
                  ? `${email} પર મોકલેલો ૬-અંકનો ઓટીપી દાખલ કરો`
                  : `Enter the 6-digit code sent to ${email}`
                : isGu
                ? 'તમારા એકાઉન્ટ માટે સુરક્ષિત નવો પાસવર્ડ બનાવો'
                : 'Create a new secure password for your account'}
            </Text>
          </View>

          {/* ── Main Interactive Card ── */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
                shadowColor: colors.primary,
              },
            ]}
          >
            {/* ═══════════════════════════════════════════════════════════ */}
            {/* STEP 1: EMAIL INPUT                                         */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {step === 'email' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {isGu ? 'નોંધાયેલ ઈમેલ' : 'Registered Email Address'}
                  </Text>
                  <View
                    style={[
                      styles.inputRow,
                      {
                        backgroundColor:
                          colors.surfaceSecondary || colors.surfaceSubtle,
                        borderColor: isEmailValid
                          ? colors.primary
                          : colors.borderSubtle,
                      },
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={isEmailValid ? colors.primary : colors.textMuted}
                      style={styles.inputLeftIcon}
                    />
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          color: colors.text,
                          fontFamily: typography.fontFamilySans,
                        },
                      ]}
                      placeholder="name@example.com"
                      placeholderTextColor={colors.textMuted}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!busy}
                    />
                    {isEmailValid && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    {
                      backgroundColor: isEmailValid
                        ? colors.primary
                        : colors.surfaceSecondary || colors.surfaceSubtle,
                    },
                  ]}
                  onPress={handleSendOtp}
                  disabled={!isEmailValid || busy}
                  activeOpacity={0.85}
                >
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text
                        style={[
                          styles.submitBtnText,
                          {
                            color: isEmailValid ? '#ffffff' : colors.textMuted,
                          },
                        ]}
                      >
                        {isGu ? 'ઓટીપી મોકલો' : 'Send Verification Code'}
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={17}
                        color={isEmailValid ? '#ffffff' : colors.textMuted}
                      />
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* STEP 2: 6-DIGIT OTP (Shown ONLY after OTP is sent)          */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {step === 'otp' && (
              <>
                {/* Email Chip with Change Action */}
                <View
                  style={[
                    styles.emailPill,
                    // {
                    //   backgroundColor:
                    //     colors.surfaceSecondary || colors.surfaceSubtle,
                    //   borderColor: colors.borderSubtle,
                    // },
                  ]}
                >
                  <View style={styles.emailPillLeft}>
                    <Ionicons name="mail" size={20} color={colors.primary} />
                    <Text
                      style={[styles.emailPillText, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {email}
                    </Text>
                  </View>
                  {/* <TouchableOpacity
                    onPress={() => setStep('email')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text
                      style={[styles.changeBtnText, { color: colors.primary }]}
                    >
                      {isGu ? 'બદલો' : 'Change'}
                    </Text>
                  </TouchableOpacity> */}
                </View>

                {/* 6 Digit Inputs */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {isGu ? '૬-અંકનો ઓટીપી દાખલ કરો' : '6-Digit OTP Code'}
                  </Text>
                  <View style={styles.otpRow}>
                    {[0, 1, 2, 3, 4, 5].map(index => {
                      const val = otpCode[index];
                      const isFilled = val !== '';
                      return (
                        <View
                          key={index}
                          style={[
                            styles.otpBox,
                            {
                              backgroundColor: isFilled
                                ? colors.surface
                                : colors.surfaceSecondary ||
                                  colors.surfaceSubtle,
                              borderColor: isFilled
                                ? colors.primary
                                : colors.borderSubtle,
                            },
                          ]}
                        >
                          <TextInput
                            ref={otpInputRefs[index]}
                            style={[
                              styles.otpInput,
                              {
                                color: colors.primary,
                                fontFamily: typography.fontFamilySans,
                              },
                            ]}
                            keyboardType="number-pad"
                            maxLength={1}
                            value={val}
                            placeholder="—"
                            placeholderTextColor={colors.textMuted}
                            onChangeText={text => handleOtpChange(text, index)}
                            onKeyPress={e => handleOtpKeyPress(e, index)}
                            selectTextOnFocus
                            editable={!busy}
                          />
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Timer & Resend */}
                <View style={styles.timerRow}>
                  <Text style={[styles.timerText, { color: colors.textMuted }]}>
                    {isGu ? 'ફરી મોકલવા માટે બાકી: ' : 'Resend code in '}
                    <Text style={{ color: colors.text, fontWeight: '700' }}>
                      00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}
                    </Text>
                  </Text>

                  <TouchableOpacity
                    onPress={handleSendOtp}
                    disabled={resendTimer > 0 || busy}
                  >
                    <Text
                      style={[
                        styles.resendBtnText,
                        {
                          color:
                            resendTimer === 0
                              ? colors.primary
                              : colors.textMuted,
                          opacity: resendTimer === 0 ? 1 : 0.6,
                        },
                      ]}
                    >
                      {isGu ? 'ફરીથી ઓટીપી મોકલો' : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    {
                      backgroundColor: isOtpComplete
                        ? colors.primary
                        : colors.surfaceSecondary || colors.surfaceSubtle,
                    },
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={!isOtpComplete || busy}
                  activeOpacity={0.85}
                >
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text
                        style={[
                          styles.submitBtnText,
                          {
                            color: isOtpComplete ? '#ffffff' : colors.textMuted,
                          },
                        ]}
                      >
                        {isGu ? 'ઓટીપી ચકાસો' : 'Verify Code'}
                      </Text>
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={isOtpComplete ? '#ffffff' : colors.textMuted}
                      />
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* STEP 3: NEW PASSWORD (OTP is HIDDEN, password is shown)     */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {step === 'password' && (
              <>
                {/* Verified Confirmation Pill */}
                <View
                  style={[
                    styles.verifiedPill,
                    { backgroundColor: `${colors.primary}15` },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.verifiedPillText, { color: colors.primary }]}
                  >
                    {isGu
                      ? `ઈમેલ ચકાસાયેલ છે (${email})`
                      : `Verified for ${email}`}
                  </Text>
                </View>

                {/* New Password */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {isGu ? 'નવો પાસવર્ડ' : 'New Password'}
                  </Text>
                  <View
                    style={[
                      styles.inputRow,
                      {
                        backgroundColor:
                          colors.surfaceSecondary || colors.surfaceSubtle,
                        borderColor: isPasswordValid
                          ? colors.primary
                          : colors.borderSubtle,
                      },
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={
                        isPasswordValid ? colors.primary : colors.textMuted
                      }
                      style={styles.inputLeftIcon}
                    />
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          color: colors.text,
                          fontFamily: typography.fontFamilySans,
                        },
                      ]}
                      placeholder={
                        isGu ? 'ઓછામાં ઓછા ૪ અક્ષર' : 'At least 4 characters'
                      }
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showPassword}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      autoCapitalize="none"
                      editable={!busy}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={19}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.text }]}>
                    {isGu ? 'પાસવર્ડની પુષ્ટિ કરો' : 'Confirm New Password'}
                  </Text>
                  <View
                    style={[
                      styles.inputRow,
                      {
                        backgroundColor:
                          colors.surfaceSecondary || colors.surfaceSubtle,
                        borderColor: passwordsMatch
                          ? colors.primary
                          : confirmPassword.length > 0 && !passwordsMatch
                          ? colors.error || '#dc2626'
                          : colors.borderSubtle,
                      },
                    ]}
                  >
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={18}
                      color={passwordsMatch ? colors.primary : colors.textMuted}
                      style={styles.inputLeftIcon}
                    />
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          color: colors.text,
                          fontFamily: typography.fontFamilySans,
                        },
                      ]}
                      placeholder={
                        isGu
                          ? 'ફરીથી પાસવર્ડ દાખલ કરો'
                          : 'Re-enter new password'
                      }
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      autoCapitalize="none"
                      editable={!busy}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      style={styles.eyeBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? 'eye-off-outline'
                            : 'eye-outline'
                        }
                        size={19}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    {
                      backgroundColor: passwordsMatch
                        ? colors.primary
                        : colors.surfaceSecondary || colors.surfaceSubtle,
                    },
                  ]}
                  onPress={handleResetPassword}
                  disabled={!passwordsMatch || busy}
                  activeOpacity={0.85}
                >
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text
                        style={[
                          styles.submitBtnText,
                          {
                            color: passwordsMatch
                              ? '#ffffff'
                              : colors.textMuted,
                          },
                        ]}
                      >
                        {isGu
                          ? 'પાસવર્ડ બદલો અને લોગિન કરો'
                          : 'Reset Password & Login'}
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={17}
                        color={passwordsMatch ? '#ffffff' : colors.textMuted}
                      />
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* ── Minimalist Back to Sign In Link ── */}
          {/* <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={16} color={colors.primary} />
            <Text style={[styles.backBtnText, { color: colors.primary }]}>
              {isGu ? 'પાછા લોગિન પર જાઓ' : 'Back to Sign In'}
            </Text>
          </TouchableOpacity> */}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── Minimalist Stylesheet ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
  },

  // Minimalist Hero
  headerHero: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 20,
  },
  treeCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  kickerText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: 20,
  },

  // Main Card
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    gap: 16,
  },

  // Form Fields
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  inputLeftIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    height: 48,
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 8,
  },

  // Primary Action Button
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 10,
    marginTop: 2,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },

  // OTP 6-Digit Row
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 4,
  },
  otpBox: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
  },

  // Timer & Resend
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerText: {
    fontSize: 12,
  },
  resendBtnText: {
    fontSize: 12,
  },

  // Email Pill Summary
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    // borderWidth: 1,
  },
  emailPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  emailPillText: {
    fontSize: 18,
    fontWeight: '600',
  },
  changeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Verified Badge
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  verifiedPillText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Back to Sign In
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
    paddingVertical: 8,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
