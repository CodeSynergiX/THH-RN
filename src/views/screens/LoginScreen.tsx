import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { CanopyHeader } from '../components/CanopyHeader';
import { THHTreeSVG } from './SplashScreen';

interface Props {
  onSuccess: () => void;
  onSignup: () => void;
  onForgot: () => void;
  login: (email: string, password: string) => Promise<unknown>;
  verifyOtp?: (payload: {
    email?: string;
    phone?: string;
    identifier?: string;
    code: string;
    purpose?: string;
  }) => Promise<unknown>;
  requestOtp?: (payload: {
    email?: string;
    phone?: string;
    identifier?: string;
    purpose?: string;
  }) => Promise<unknown>;
}

export const LoginScreen: React.FC<Props> = ({
  onSuccess,
  onSignup,
  onForgot,
  login,
  verifyOtp,
  requestOtp,
}) => {
  const { theme } = useAppTheme();
  const { colors, typography } = theme;
  const { language } = useTranslation();
  const { showToast } = useToast();

  const [method, setMethod] = useState<'otp' | 'pwd'>('otp');

  // Dedicated state for Password Login
  const [pwdIdentifier, setPwdIdentifier] = useState('');
  const [pwdPassword, setPwdPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // ALWAYS hidden by default!

  // Dedicated state for OTP Login
  const [otpIdentifier, setOtpIdentifier] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const [busy, setBusy] = useState(false);

  const handleSwitchTab = (newMethod: 'otp' | 'pwd') => {
    setMethod(newMethod);
    if (newMethod === 'pwd') {
      setShowPassword(false); // Always guarantee password is hidden by default when switching
    }
  };

  const handleSendOtp = async () => {
    const trimmed = otpIdentifier.trim();
    if (!trimmed) {
      showToast(
        language === 'gu'
          ? 'કૃપા કરીને મોબાઇલ નંબર અથવા ઈમેલ દાખલ કરો.'
          : 'Please enter your mobile number or email address.',
        'warning',
        language === 'gu' ? 'માહિતી જરૂરી છે' : 'Identifier Required',
      );
      return;
    }
    const isEmail = trimmed.includes('@');
    setBusy(true);
    try {
      if (requestOtp) {
        await requestOtp({
          email: isEmail ? trimmed : undefined,
          phone: !isEmail ? trimmed : undefined,
          identifier: trimmed,
          purpose: 'login',
        });
        setOtpSent(true);
        showToast(
          isEmail
            ? language === 'gu'
              ? 'તમારા ઈમેલ પર ઓટીપી મોકલાયો છે. કૃપા કરીને તમારું ઇનબોક્સ તપાસો.'
              : 'Verification code sent to your email. Please check your inbox.'
            : language === 'gu'
            ? 'તમારા મોબાઇલ પર ઓટીપી મોકલાયો છે.'
            : 'Verification code sent to your mobile phone.',
          'success',
          language === 'gu' ? 'ઓટીપી મોકલ્યો' : 'OTP Sent',
        );
      }
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : language === 'gu'
          ? 'ઓટીપી મોકલી શકાયો નહીં.'
          : 'Failed to send OTP.',
        'error',
        language === 'gu' ? 'ઓટીપી નિષ્ફળ' : 'OTP Failed',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSignIn = async () => {
    if (method === 'pwd') {
      const trimmedId = pwdIdentifier.trim();
      const trimmedPwd = pwdPassword.trim();

      if (!trimmedId) {
        showToast(
          language === 'gu'
            ? 'કૃપા કરીને મોબાઇલ નંબર અથવા ઈમેલ દાખલ કરો.'
            : 'Please enter your phone number or email address.',
          'warning',
          language === 'gu' ? 'માહિતી ખૂટે છે' : 'Identifier Required',
        );
        return;
      }
      if (!trimmedPwd) {
        showToast(
          language === 'gu'
            ? 'કૃપા કરીને પાસવર્ડ દાખલ કરો.'
            : 'Please enter your password.',
          'warning',
          language === 'gu' ? 'પાસવર્ડ જરૂરી છે' : 'Password Required',
        );
        return;
      }

      setBusy(true);
      try {
        await login(trimmedId, trimmedPwd);
        showToast(
          language === 'gu' ? 'સ્વાગત છે!' : 'Welcome back!',
          'success',
        );
        onSuccess();
      } catch (err) {
        showToast(
          err instanceof Error
            ? err.message
            : language === 'gu'
            ? 'કૃપા કરીને વિગતો તપાસો.'
            : 'Invalid credentials. Please verify and retry.',
          'error',
          language === 'gu' ? 'લોગિન નિષ્ફળ' : 'Login Failed',
        );
      } finally {
        setBusy(false);
      }
    } else {
      // OTP Method
      const trimmedId = otpIdentifier.trim();
      const trimmedOtp = otpCode.trim();

      if (!trimmedId) {
        showToast(
          language === 'gu'
            ? 'કૃપા કરીને મોબાઇલ નંબર અથવા ઈમેલ દાખલ કરો.'
            : 'Please enter your phone number or email address.',
          'warning',
          language === 'gu' ? 'માહિતી ખૂટે છે' : 'Identifier Required',
        );
        return;
      }
      if (!trimmedOtp) {
        showToast(
          language === 'gu'
            ? 'કૃપા કરીને ઓટીપી કોડ દાખલ કરો.'
            : 'Please enter the OTP verification code.',
          'warning',
          language === 'gu' ? 'ઓટીપી જરૂરી છે' : 'OTP Required',
        );
        return;
      }

      const isEmail = trimmedId.includes('@');
      setBusy(true);
      try {
        if (verifyOtp) {
          await verifyOtp({
            email: isEmail ? trimmedId : undefined,
            phone: !isEmail ? trimmedId : undefined,
            identifier: trimmedId,
            code: trimmedOtp,
            purpose: 'login',
          });
        }
        showToast(
          language === 'gu' ? 'સ્વાગત છે!' : 'Welcome back!',
          'success',
        );
        onSuccess();
      } catch (err) {
        showToast(
          err instanceof Error
            ? err.message
            : language === 'gu'
            ? 'અમાન્ય ઓટીપી કોડ. કૃપા કરીને ફરી પ્રયાસ કરો.'
            : 'Invalid or expired OTP code. Please retry.',
          'error',
          language === 'gu' ? 'લોગિન નિષ્ફળ' : 'Login Failed',
        );
      } finally {
        setBusy(false);
      }
    }
  };
  const swayAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  // Crown sway
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
  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <CanopyHeader />
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
          {/* Brand Emblem & Warm Welcome Header */}
          <View style={styles.headerHero}>
            {/* <View
              style={[
                styles.emblemWrap,
                { backgroundColor: colors.surfaceSubtle },
              ]}
            > */}
            {/* <Ionicons
                name="hand-left-outline"
                size={36}
                color={colors.primary}
              /> */}
            <View
              style={[
                styles.treeCircle,
                { backgroundColor: colors.surface, width: 200, height: 200 },
              ]}
            >
              <THHTreeSVG swayAnim={swayAnim} floatAnim={floatAnim} />
            </View>
            {/* </View> */}
            <View
              style={[
                styles.kickerPill,
                { backgroundColor: colors.surfaceSubtle },
              ]}
            >
              <Ionicons name="leaf" size={14} color={colors.primary} />
              <Text style={[styles.kickerText, { color: colors.secondary }]}>
                {language === 'gu'
                  ? 'માનવસેવા નેટવર્ક'
                  : 'COMMUNITY WELFARE NETWORK'}
              </Text>
            </View>
            <Text
              style={[
                styles.heroTitle,
                { color: colors.text, fontFamily: typography.fontFamilySans },
              ]}
            >
              {language === 'gu' ? 'સ્વાગત છે' : 'Welcome Back'}
            </Text>
            <Text style={[styles.heroSub, { color: colors.textMuted }]}>
              {language === 'gu'
                ? 'તમારી સહાય અરજીઓ તપાસવા અને સેવાઓ મેળવવા લોગિન કરો'
                : 'Sign in to track your welfare applications and access community services'}
            </Text>
          </View>

          {/* Primary Container Card */}
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
            {/* Method Selector Pill Switch */}
            <View
              style={[styles.tabBar, { backgroundColor: colors.surfaceSubtle }]}
            >
              <TouchableOpacity
                onPress={() => handleSwitchTab('otp')}
                style={[
                  styles.tabBtn,
                  method === 'otp' && [
                    styles.activeTabBtn,
                    { backgroundColor: colors.surface },
                  ],
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={16}
                  color={method === 'otp' ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    {
                      color:
                        method === 'otp' ? colors.primary : colors.textMuted,
                    },
                  ]}
                >
                  {language === 'gu' ? 'ઓટીપી લોગિન' : 'OTP Login'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSwitchTab('pwd')}
                style={[
                  styles.tabBtn,
                  method === 'pwd' && [
                    styles.activeTabBtn,
                    { backgroundColor: colors.surface },
                  ],
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={16}
                  color={method === 'pwd' ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabBtnText,
                    {
                      color:
                        method === 'pwd' ? colors.primary : colors.textMuted,
                    },
                  ]}
                >
                  {language === 'gu' ? 'પાસવર્ડ' : 'Password'}
                </Text>
              </TouchableOpacity>
            </View>

            {method === 'pwd' ? (
              <>
                {/* Password Tab: Mobile / Email Input */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      {language === 'gu'
                        ? 'મોબાઇલ નંબર અથવા ઈમેલ'
                        : 'Mobile Number / Email'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.inputRow,
                      { backgroundColor: colors.surfaceSubtle },
                    ]}
                  >
                    <View style={styles.prefixWrap}>
                      <Ionicons
                        name={
                          pwdIdentifier.includes('@') ||
                          /[a-zA-Z]/.test(pwdIdentifier)
                            ? 'mail-outline'
                            : 'phone-portrait-outline'
                        }
                        size={18}
                        color={colors.primary}
                      />
                      {!(
                        pwdIdentifier.includes('@') ||
                        /[a-zA-Z]/.test(pwdIdentifier)
                      ) && (
                        <Text
                          style={[styles.prefixText, { color: colors.text }]}
                        >
                          +91
                        </Text>
                      )}
                      <View
                        style={[
                          styles.dividerV,
                          { backgroundColor: colors.border },
                        ]}
                      />
                    </View>
                    <TextInput
                      key="pwd-id-field"
                      style={[styles.textInput, { color: colors.text }]}
                      placeholder={
                        language === 'gu'
                          ? '૯૮૭૬૫ ૪૩૨૧૦ અથવા ઈમેલ'
                          : '98765 43210 or email'
                      }
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType={
                        pwdIdentifier.includes('@')
                          ? 'email-address'
                          : 'default'
                      }
                      value={pwdIdentifier}
                      onChangeText={setPwdIdentifier}
                    />
                  </View>
                </View>

                {/* Password Tab: Password Field (HIDDEN BY DEFAULT) */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      {language === 'gu' ? 'પાસવર્ડ' : 'Password'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.inputRow,
                      { backgroundColor: colors.surfaceSubtle },
                    ]}
                  >
                    <Ionicons
                      name="key-outline"
                      size={18}
                      color={colors.secondary}
                      style={{ marginLeft: 12 }}
                    />
                    <TextInput
                      key="pwd-password-field"
                      style={[
                        styles.textInput,
                        { color: colors.text, paddingLeft: 8 },
                      ]}
                      placeholder={
                        language === 'gu'
                          ? 'પાસવર્ડ દાખલ કરો'
                          : 'Enter password'
                      }
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showPassword}
                      textContentType="password"
                      autoComplete="password"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={pwdPassword}
                      onChangeText={setPwdPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(prev => !prev)}
                      style={styles.eyeBtn}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Forgot Password Row */}
                <View style={styles.metaRow}>
                  <View style={{ flex: 1 }} />
                  <TouchableOpacity onPress={onForgot}>
                    <Text
                      style={[styles.forgotText, { color: colors.primary }]}
                    >
                      {language === 'gu'
                        ? 'પાસવર્ડ ભૂલી ગયા?'
                        : 'Forgot Password?'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* OTP Tab: Mobile / Email Input */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      {language === 'gu'
                        ? 'મોબાઇલ નંબર અથવા ઈમેલ (ઓટીપી માટે)'
                        : 'Mobile Number / Email (for OTP)'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.inputRow,
                      { backgroundColor: colors.surfaceSubtle },
                    ]}
                  >
                    <View style={styles.prefixWrap}>
                      <Ionicons
                        name={
                          otpIdentifier.includes('@') ||
                          /[a-zA-Z]/.test(otpIdentifier)
                            ? 'mail-outline'
                            : 'phone-portrait-outline'
                        }
                        size={18}
                        color={colors.primary}
                      />
                      {!(
                        otpIdentifier.includes('@') ||
                        /[a-zA-Z]/.test(otpIdentifier)
                      ) && (
                        <Text
                          style={[styles.prefixText, { color: colors.text }]}
                        >
                          +91
                        </Text>
                      )}
                      <View
                        style={[
                          styles.dividerV,
                          { backgroundColor: colors.border },
                        ]}
                      />
                    </View>
                    <TextInput
                      key="otp-id-field"
                      style={[styles.textInput, { color: colors.text }]}
                      placeholder={
                        language === 'gu'
                          ? '૯૮૭૬૫ ૪૩૨૧૦ અથવા ઈમેલ'
                          : '98765 43210 or email'
                      }
                      placeholderTextColor={colors.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType={
                        otpIdentifier.includes('@')
                          ? 'email-address'
                          : 'default'
                      }
                      value={otpIdentifier}
                      onChangeText={setOtpIdentifier}
                    />
                    {otpIdentifier.trim().length >= 4 && (
                      <TouchableOpacity
                        onPress={handleSendOtp}
                        disabled={busy}
                        style={[
                          styles.sendOtpChip,
                          { backgroundColor: colors.primaryLight },
                        ]}
                      >
                        <Text
                          style={[
                            styles.sendOtpText,
                            { color: colors.textInverse },
                          ]}
                        >
                          {otpSent
                            ? language === 'gu'
                              ? 'ફરી મોકલો'
                              : 'Resend'
                            : language === 'gu'
                            ? 'ઓટીપી મોકલો'
                            : 'Send OTP'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {otpSent && (
                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.primary,
                        marginTop: 4,
                        fontWeight: '600',
                        paddingHorizontal: 2,
                      }}
                    >
                      {language === 'gu'
                        ? '✓ ઓટીપી સફળતાપૂર્વક મોકલવામાં આવ્યો છે'
                        : '✓ OTP code sent successfully'}
                    </Text>
                  )}
                </View>

                {/* OTP Tab: OTP Code Field */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: colors.text }]}>
                      {language === 'gu' ? 'ઓટીપી કોડ' : 'Security PIN / OTP'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.inputRow,
                      { backgroundColor: colors.surfaceSubtle },
                    ]}
                  >
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={18}
                      color={colors.secondary}
                      style={{ marginLeft: 12 }}
                    />
                    <TextInput
                      key="otp-code-field"
                      style={[
                        styles.textInput,
                        {
                          color: colors.text,
                          paddingLeft: 8,
                          letterSpacing: 3,
                        },
                      ]}
                      placeholder={
                        language === 'gu'
                          ? '૬ આંકડાનો ઓટીપી'
                          : 'Enter 6-digit OTP'
                      }
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otpCode}
                      onChangeText={setOtpCode}
                    />
                    <TouchableOpacity
                      onPress={() => setShowOtp(prev => !prev)}
                      style={styles.eyeBtn}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name={showOtp ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Spacing for OTP tab */}
                <View style={{ height: 12 }} />
              </>
            )}

            {/* Sign In CTA */}
            <TouchableOpacity
              disabled={busy}
              onPress={handleSignIn}
              style={[styles.signInBtn, { backgroundColor: colors.primary }]}
            >
              <Text
                style={[styles.signInBtnText, { color: colors.textInverse }]}
              >
                {busy
                  ? language === 'gu'
                    ? 'પ્રક્રિયા ચાલુ...'
                    : 'Processing...'
                  : language === 'gu'
                  ? 'પ્રવેશ કરો'
                  : 'Sign In'}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={colors.textInverse}
              />
            </TouchableOpacity>

            {/* Natural Divider */}
            {/* <View style={styles.dividerRow}>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: colors.borderSubtle },
                ]}
              />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                {language === 'gu' ? 'અથવા અન્ય વિકલ્પ' : 'OR CONTINUE WITH'}
              </Text>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: colors.borderSubtle },
                ]}
              />
            </View> */}

            {/* Alternative Auth Methods */}
            {/* <View style={styles.altAuthCol}>
              <TouchableOpacity
                onPress={() =>
                  showToast(
                    language === 'gu'
                      ? 'તમારા નોંધાયેલ વોટ્સએપ પર પિન મોકલવામાં આવશે.'
                      : 'Instant verification PIN will be sent on your registered WhatsApp.',
                    'info',
                    language === 'gu' ? 'વોટ્સએપ પ્રમાણીકરણ' : 'WhatsApp Auth',
                  )
                }
                style={[
                  styles.altBtn,
                  { backgroundColor: colors.surfaceSubtle },
                ]}
              >
                <View style={styles.altBtnLeft}>
                  <View
                    style={[styles.altIconWrap, { backgroundColor: '#dcfce7' }]}
                  >
                    <Ionicons name="logo-whatsapp" size={18} color="#16a34a" />
                  </View>
                  <View>
                    <Text style={[styles.altBtnTitle, { color: colors.text }]}>
                      {language === 'gu' ? 'વોટ્સએપ ઓટીપી' : 'WhatsApp OTP'}
                    </Text>
                    <Text
                      style={[styles.altBtnSub, { color: colors.textMuted }]}
                    >
                      {language === 'gu'
                        ? 'વોટ્સએપ પર પિન મેળવો'
                        : 'One-click verification PIN'}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View> */}
          </View>

          {/* Grassroots Registration Prompt */}
          <View style={styles.signupPrompt}>
            <Text style={[styles.signupPromptText, { color: colors.text }]}>
              {language === 'gu' ? 'નવા સભ્ય છો?' : 'New to THH Community?'}
            </Text>
            <TouchableOpacity onPress={onSignup} style={styles.signupLinkBtn}>
              <Ionicons
                name="person-add-outline"
                size={16}
                color={colors.primary}
              />
              <Text style={[styles.signupLinkText, { color: colors.primary }]}>
                {language === 'gu' ? 'નોંધણી કરો' : 'Sign Up for Seva'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Civic Trust Badge */}
          <View style={styles.trustBadgeWrap}>
            {/* <View
              style={[
                styles.trustPill,
                { backgroundColor: colors.surfaceSubtle },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={colors.primary}
              />
              <Text style={[styles.trustText, { color: colors.textMuted }]}>
                {language === 'gu'
                  ? '૧૦૦% મફત અને સુરક્ષિત જાહેર સેવા'
                  : '100% Free & Secure Public Welfare Service'}
              </Text>
            </View> */}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  headerHero: { alignItems: 'center', paddingTop: 16, paddingBottom: 20 },
  emblemWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  treeCircle: {
    alignItems: 'center',
    justifyContent: 'center',
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
  kickerText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  heroTitle: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  heroSub: {
    paddingHorizontal: 5,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
  },
  heroSubGu: { fontSize: 11, textAlign: 'center', marginTop: 2 },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 999,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 999,
  },
  activeTabBtn: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: { fontSize: 12, fontWeight: '600' },
  inputGroup: { marginBottom: 14 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: { fontSize: 13, fontWeight: '600' },
  labelSub: { fontSize: 11, fontWeight: '500' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    minHeight: 48,
  },
  prefixWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    gap: 4,
  },
  prefixText: { fontSize: 14, fontWeight: '600' },
  dividerV: { width: 1, height: 20, marginHorizontal: 8 },
  textInput: { flex: 1, fontSize: 14, height: 48, paddingRight: 8 },
  sendOtpChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  sendOtpText: { fontSize: 11, fontWeight: '700' },
  eyeBtn: { padding: 12 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rememberWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberText: { fontSize: 12 },
  rememberTextGu: { fontSize: 10 },
  forgotText: { fontSize: 12, fontWeight: '700', textAlign: 'right' },
  forgotTextGu: { fontSize: 10, textAlign: 'right' },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  signInBtnText: { fontSize: 15, fontWeight: '700' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: {
    paddingHorizontal: 8,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  altAuthCol: { gap: 10 },
  altBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
  },
  altBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  altIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  altBtnTitle: { fontSize: 13, fontWeight: '600' },
  altBtnSub: { fontSize: 10 },
  signupPrompt: { alignItems: 'center', marginTop: 24, gap: 6 },
  signupPromptText: { fontSize: 13 },
  signupLinkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  signupLinkText: { fontSize: 14, fontWeight: '700' },
  trustBadgeWrap: { alignItems: 'center', marginTop: 20 },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  trustText: { fontSize: 10, fontWeight: '600' },
});
