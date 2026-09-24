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
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [busy, setBusy] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  // const [rememberMe, setRememberMe] = useState(true);

  const handleSendOtp = async () => {
    const trimmed = identifier.trim();
    const isEmailInput = trimmed.includes('@');
    if (!trimmed || !isEmailInput) {
      showToast(
        language === 'gu'
          ? 'ઓટીપી ફક્ત ઈમેલ સરનામા પર મોકલી શકાય છે. કૃપા કરીને માન્ય ઈમેલ દાખલ કરો.'
          : 'OTP is only supported for email addresses. Please enter a valid email address.',
        'warning',
        language === 'gu' ? 'ઈમેલ જરૂરી છે' : 'Email Required',
      );
      return;
    }
    setBusy(true);
    try {
      if (requestOtp) {
        await requestOtp({
          email: trimmed,
          identifier: trimmed,
          purpose: 'login',
        });
        setOtpSent(true);
        showToast(
          language === 'gu'
            ? 'તમારા ઈમેલ પર ઓટીપી મોકલાયો છે. કૃપા કરીને તમારું ઇનબોક્સ તપાસો.'
            : 'Verification code sent to your email. Please check your inbox.',
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
    const trimmedId = identifier.trim();
    const trimmedSecret = secret.trim();

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
    if (method === 'otp' && !trimmedId.includes('@')) {
      showToast(
        language === 'gu'
          ? 'ઓટીપી લોગિન ફક્ત ઈમેલ માટે ઉપલબ્ધ છે. મોબાઇલ નંબર સાથે લોગિન કરવા કૃપા કરીને પાસવર્ડ વિકલ્પ વાપરો.'
          : 'OTP login is currently only available for email. Please switch to Password tab to sign in with your mobile number.',
        'warning',
        language === 'gu' ? 'ઈમેલ જરૂરી છે' : 'Email Required for OTP',
      );
      return;
    }
    if (!trimmedSecret) {
      showToast(
        method === 'otp'
          ? language === 'gu'
            ? 'કૃપા કરીને ઈમેલ પર મળેલો ૬-અંકનો ઓટીપી દાખલ કરો.'
            : 'Please enter the 6-digit OTP received on email.'
          : language === 'gu'
          ? 'કૃપા કરીને પાસવર્ડ દાખલ કરો.'
          : 'Please enter your password.',
        'warning',
        language === 'gu'
          ? method === 'otp'
            ? 'ઓટીપી જરૂરી છે'
            : 'પાસવર્ડ જરૂરી છે'
          : method === 'otp'
          ? 'OTP Required'
          : 'Password Required',
      );
      return;
    }

    setBusy(true);
    try {
      if (method === 'otp' && verifyOtp) {
        await verifyOtp({
          email: trimmedId,
          identifier: trimmedId,
          code: trimmedSecret,
          purpose: 'login',
        });
      } else {
        await login(trimmedId, trimmedSecret);
      }
      showToast(language === 'gu' ? 'સ્વાગત છે!' : 'Welcome back!', 'success');
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
                onPress={() => setMethod('otp')}
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
                  {language === 'gu' ? 'ઈમેલ ઓટીપી' : 'Email OTP'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMethod('pwd')}
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

            {/* Identifier Input */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {method === 'otp'
                    ? language === 'gu'
                      ? 'ઈમેલ સરનામું (ઓટીપી માટે)'
                      : 'Email Address (for OTP)'
                    : language === 'gu'
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
                      identifier.includes('@') ||
                      /[a-zA-Z]/.test(identifier) ||
                      method === 'otp'
                        ? 'mail-outline'
                        : 'phone-portrait-outline'
                    }
                    size={18}
                    color={colors.primary}
                  />
                  {!(
                    identifier.includes('@') ||
                    /[a-zA-Z]/.test(identifier) ||
                    method === 'otp'
                  ) && (
                    <Text style={[styles.prefixText, { color: colors.text }]}>
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
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder={
                    method === 'otp'
                      ? language === 'gu'
                        ? 'તમારું ઈમેલ સરનામું દાખલ કરો'
                        : 'Enter your email address'
                      : language === 'gu'
                      ? '૯૮૭૬૫ ૪૩૨૧૦ અથવા ઈમેલ'
                      : '98765 43210 or email'
                  }
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  keyboardType={method === 'otp' ? 'email-address' : 'default'}
                  value={identifier}
                  onChangeText={setIdentifier}
                />
                {/* Only show Send OTP button when an email address is detected/written */}
                {method === 'otp' && identifier.trim().includes('@') && (
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

              {/* Auto-detection hint: If user entered mobile number while in OTP mode */}
              {method === 'otp' &&
                !identifier.trim().includes('@') &&
                identifier.trim().length > 0 &&
                /^[0-9+\s-]{1,15}$/.test(identifier.trim()) && (
                  <TouchableOpacity
                    onPress={() => setMethod('pwd')}
                    style={{
                      marginTop: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 2,
                    }}
                  >
                    <Ionicons
                      name="information-circle"
                      size={15}
                      color={colors.primary}
                    />
                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.primary,
                        fontWeight: '700',
                      }}
                    >
                      {language === 'gu'
                        ? 'મોબાઇલ નંબર ડિટેક્ટ થયો — પાસવર્ડ વડે લોગિન કરવા અહીં ટેપ કરો'
                        : 'Mobile number detected — tap to log in with Password'}
                    </Text>
                  </TouchableOpacity>
                )}

              {method === 'otp' && identifier.trim().includes('@') && (
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.secondary,
                    marginTop: 4,
                    paddingHorizontal: 2,
                  }}
                >
                  {language === 'gu'
                    ? 'ℹ નોંધાયેલ ઈમેલ પર ૬ અંકનો ઓટીપી મોકલવામાં આવશે'
                    : 'ℹ 6-digit OTP will be sent to this email address'}
                </Text>
              )}

              {method === 'otp' && !identifier.trim() && (
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.textMuted,
                    marginTop: 4,
                    paddingHorizontal: 2,
                  }}
                >
                  {language === 'gu'
                    ? 'ℹ ઓટીપી ફક્ત ઈમેલ પર ઉપલબ્ધ છે'
                    : 'ℹ OTP is only available for email addresses'}
                </Text>
              )}
            </View>

            {/* Security PIN / Password Field */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {method === 'otp'
                    ? language === 'gu'
                      ? 'ઓટીપી કોડ'
                      : 'Security PIN / OTP'
                    : language === 'gu'
                    ? 'પાસવર્ડ'
                    : 'Password'}
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
                  style={[
                    styles.textInput,
                    { color: colors.text, paddingLeft: 8 },
                  ]}
                  placeholder={
                    method === 'otp'
                      ? language === 'gu'
                        ? '૬ આંકડાનો ઓટીપી'
                        : 'Enter 6-digit OTP'
                      : language === 'gu'
                      ? 'પાસવર્ડ દાખલ કરો'
                      : 'Enter password'
                  }
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showSecret}
                  keyboardType={method === 'otp' ? 'number-pad' : 'default'}
                  value={secret}
                  onChangeText={setSecret}
                />
                <TouchableOpacity
                  onPress={() => setShowSecret(!showSecret)}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showSecret ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember me & Forgot Password Row */}
            <View style={styles.metaRow}>
              {/*<TouchableOpacity
                onPress={() => setRememberMe(!rememberMe)}
                style={styles.rememberWrap}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: rememberMe ? colors.primary : colors.border,
                      backgroundColor: rememberMe
                        ? colors.primary
                        : 'transparent',
                    },
                  ]}
                >
                  {rememberMe && (
                    <Ionicons
                      name="checkmark"
                      size={12}
                      color={colors.textInverse}
                    />
                  )}
                </View>
                <Text
                  style={[styles.rememberText, { color: colors.textMuted }]}
                >
                  {language === 'gu' ? 'મને યાદ રાખો' : 'Remember me'}
                </Text>
              </TouchableOpacity> */}

              <TouchableOpacity onPress={onForgot}>
                <Text style={[styles.forgotText, { color: colors.primary }]}>
                  {language === 'gu' ? 'પાસવર્ડ ભૂલી ગયા?' : 'Forgot Password?'}
                </Text>
              </TouchableOpacity>
            </View>

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
  heroSub: { fontSize: 13, textAlign: 'center', marginTop: 4 },
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
    flexDirection: 'row-reverse',
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
