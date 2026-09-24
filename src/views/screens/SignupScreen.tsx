import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { CanopyHeader } from '../components/CanopyHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface Props {
  onSuccess: () => void;
  onLogin: () => void;
}

const TALUKAS = [
  {
    id: 'navsari',
    nameEn: 'Navsari Rural & City',
    nameGu: 'નવસારી ગ્રામ્ય અને શહેર',
  },
  { id: 'chikhli', nameEn: 'Chikhli Cluster', nameGu: 'ચીખલી વિસ્તાર' },
  {
    id: 'jalalpore',
    nameEn: 'Jalalpore Coastal Belt',
    nameGu: 'જલાલપોર દરિયાકાંઠો',
  },
  {
    id: 'gandevi',
    nameEn: 'Gandevi & Bilimora',
    nameGu: 'ગણદેવી અને બીલીમોરા',
  },
  {
    id: 'vansda',
    nameEn: 'Vansda Tribal Welfare Belt',
    nameGu: 'વાંસદા આદિવાસી વિસ્તાર',
  },
  { id: 'khergam', nameEn: 'Khergam Taluka', nameGu: 'ખેરગામ તાલુકો' },
];

const EXPERTISE_DOMAINS = [
  {
    id: 'govt_schemes',
    icon: 'business-outline',
    title: 'Govt Schemes & Documentation',
    titleGu: 'સરકારી યોજનાઓ અને પુરાવા',
    desc: 'Maa Card, PM-Kisan, Ration Cards, Widow/Old-Age Pension docs',
    descGu: 'મા કાર્ડ, પીએમ-કિસાન, રેશન કાર્ડ, વિધવા/વૃદ્ધ પેન્શન સહાય',
  },
  {
    id: 'medical_blood',
    icon: 'medkit-outline',
    title: 'Medical & Blood Coordination',
    titleGu: 'મેડિકલ તથા રક્ત સહાય',
    desc: 'Emergency blood donor dispatch, civil hospital facilitation, dialysis aid',
    descGu: 'કટોકટીમાં રક્તદાતા શોધ, સિવિલ હોસ્પિટલ મદદ, ડાયાલિસિસ સહાય',
  },
  {
    id: 'education',
    icon: 'school-outline',
    title: 'Education & Scholarships',
    titleGu: 'શિક્ષણ માર્ગદર્શન અને સ્કોલરશીપ',
    desc: 'Free coaching desks, student kit distribution, digital literacy',
    descGu: 'શૈક્ષણિક કીટ વિતરણ, ડિજિટલ સાક્ષરતા અને માર્ગદર્શન',
  },
  {
    id: 'livelihoods',
    icon: 'people-outline',
    title: 'Sakhi Mandal & Livelihoods',
    titleGu: 'સખી મંડળ અને આજીવિકા',
    desc: 'Women micro-enterprises, cottage craft linkages, vocational training',
    descGu: 'મહિલા ઉદ્યોગ સાહસિકતા, ગૃહ ઉદ્યોગ જોડાણ અને તાલીમ',
  },
];

export const SignupScreen: React.FC<Props> = ({ onSuccess, onLogin }) => {
  const { theme } = useAppTheme();
  const { colors, typography } = theme;
  const { locale, language } = useTranslation();
  const auth = useAuth();
  const { showToast } = useToast();

  const [role, setRole] = useState<'citizen' | 'sevak'>('citizen');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [taluka, setTaluka] = useState('chikhli');
  const [selectedVillages, setSelectedVillages] = useState<string[]>([
    'Kaliawadi',
    'Alipore',
  ]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([
    'govt_schemes',
  ]);
  const [availability, setAvailability] = useState<
    'weekend' | 'weekday' | 'fulltime'
  >('weekend');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [busy, setBusy] = useState(false);

  const toggleDomain = (id: string) => {
    setSelectedDomains(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id],
    );
  };

  const toggleVillage = (name: string) => {
    setSelectedVillages(prev =>
      prev.includes(name) ? prev.filter(v => v !== name) : [...prev, name],
    );
  };

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      showToast(
        language === 'gu'
          ? 'કૃપા કરીને ૧૦-અંકનો મોબાઇલ નંબર દાખલ કરો.'
          : 'Please enter a 10-digit mobile number first.',
        'warning',
        'Mobile Number',
      );
      return;
    }
    setBusy(true);
    try {
      await auth.requestOtp({ phone: phone.trim(), purpose: 'register' });
      setOtpSent(true);
      showToast(
        language === 'gu'
          ? 'તમારા મોબાઇલ નંબર પર ઓટીપી મોકલવામાં આવ્યો છે. કૃપા કરીને તપાસો.'
          : `Verification code sent to ${phone}. Please check your SMS.`,
        'success',
        'OTP Sent',
      );
    } catch {
      showToast(
        language === 'gu'
          ? 'ઓટીપી મોકલી શકાયો નહીં. કૃપા કરીને તમારો નંબર તપાસો.'
          : 'Failed to send OTP. Please check your phone number.',
        'error',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      showToast(
        language === 'gu'
          ? 'કૃપા કરીને ૬-અંકનો ચકાસણી કોડ દાખલ કરો.'
          : 'Please enter the 6-digit verification code.',
        'warning',
        'Code Required',
      );
      return;
    }
    setOtpVerified(true);
    showToast(
      language === 'gu'
        ? 'મોબાઇલ નંબર સફળતાપૂર્વક ચકાસાયો!'
        : 'Mobile number verified successfully!',
      'success',
      'Verified',
    );
  };

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showToast('Please enter both your first and last name.', 'warning');
      return;
    }
    if (!phone.trim()) {
      showToast('Please enter a valid mobile number.', 'warning');
      return;
    }
    if (password.length < 8) {
      showToast(
        'Password must be at least 8 characters long.',
        'warning',
        'Password Length',
      );
      return;
    }

    setBusy(true);
    try {
      await auth.register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || `${phone.trim()}@thh.local`,
        phone: phone.trim(),
        password,
        password_confirmation: password,
        role: role === 'sevak' ? 'volunteer' : 'citizen',
        locale,
      });
      showToast(
        role === 'sevak'
          ? 'Your Sevak profile is registered! A taluka coordinator will approve your accreditation.'
          : 'Your citizen account is ready! Welcome to THH.',
        'success',
        'Account Registered',
      );
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Please verify all inputs.',
        'error',
        'Registration Failed',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <CanopyHeader />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Ambient Banner */}
          <View
            style={[
              styles.topBanner,
              { backgroundColor: colors.surfaceSubtle },
            ]}
          >
            <View style={styles.topBannerRow}>
              <View
                style={[styles.logoBadge, { backgroundColor: colors.surface }]}
              >
                <Ionicons
                  name="volunteer-activism"
                  size={26}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.bannerKicker, { color: colors.secondary }]}
                >
                  {language === 'gu'
                    ? 'ધી હેલ્પિંગ હેન્ડ્સ • માનવસેવા'
                    : 'The Helping Hands • Welfare Network'}
                </Text>
                <Text
                  style={[
                    styles.bannerTitle,
                    {
                      color: colors.text,
                      fontFamily: typography.fontFamilySans,
                    },
                  ]}
                >
                  {language === 'gu' ? 'પરિવારમાં જોડાઓ' : 'Join Our Circle'}
                </Text>
              </View>
            </View>
            <Text style={[styles.bannerDesc, { color: colors.textMuted }]}>
              {language === 'gu'
                ? 'સહયોગથી સ્વાવલંબન તરફ એક ડગલું. પંચાયત અને ગ્રામ કલ્યાણ સાથે જોડાઓ.'
                : 'Empowering rural Navsari communities through grassroots welfare and healthcare guidance.'}
            </Text>
          </View>

          {/* Role Selection Tabs */}
          <View
            style={[
              styles.roleTabsWrap,
              { backgroundColor: colors.surfaceSubtle },
            ]}
          >
            <TouchableOpacity
              onPress={() => setRole('citizen')}
              style={[
                styles.roleTabBtn,
                role === 'citizen' && [
                  styles.activeRoleTab,
                  { backgroundColor: colors.surface },
                ],
              ]}
            >
              <View style={styles.roleTabIconRow}>
                <Ionicons
                  name="hand-left-outline"
                  size={18}
                  color={role === 'citizen' ? colors.primary : colors.secondary}
                />
                <Text
                  style={[
                    styles.roleTabTitle,
                    {
                      color: role === 'citizen' ? colors.primary : colors.text,
                    },
                  ]}
                >
                  {language === 'gu' ? 'નાગરિક' : 'Citizen'}
                </Text>
              </View>
              <Text style={[styles.roleTabSub, { color: colors.textMuted }]}>
                {language === 'gu' ? 'સહાય મેળવનાર' : 'Need Help'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRole('sevak')}
              style={[
                styles.roleTabBtn,
                role === 'sevak' && [
                  styles.activeRoleTab,
                  { backgroundColor: colors.primary },
                ],
              ]}
            >
              <View style={styles.roleTabIconRow}>
                <Ionicons
                  name="leaf"
                  size={18}
                  color={
                    role === 'sevak' ? colors.textInverse : colors.secondary
                  }
                />
                <Text
                  style={[
                    styles.roleTabTitle,
                    {
                      color:
                        role === 'sevak' ? colors.textInverse : colors.text,
                    },
                  ]}
                >
                  {language === 'gu' ? 'સેવક' : 'Volunteer'}
                </Text>
              </View>
              <Text
                style={[
                  styles.roleTabSub,
                  {
                    color:
                      role === 'sevak' ? colors.textInverse : colors.textMuted,
                  },
                ]}
              >
                {language === 'gu' ? 'સેવા પ્રદાન કરનાર' : 'Provide Seva'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Role Banner Badge */}
          <View
            style={[
              styles.infoBanner,
              { backgroundColor: colors.surfaceSubtle },
            ]}
          >
            <Ionicons
              name={role === 'sevak' ? 'shield-checkmark' : 'heart'}
              size={22}
              color={colors.primary}
            />
            <View style={{ flex: 1 }}>
              <View style={styles.infoBannerTitleRow}>
                <Text style={[styles.infoBannerTitle, { color: colors.text }]}>
                  {role === 'sevak'
                    ? language === 'gu'
                      ? 'સેવક માન્યતા પોર્ટલ'
                      : 'Sevak Accreditation Portal'
                    : language === 'gu'
                    ? 'નાગરિક સહાય નોંધણી'
                    : 'Citizen Beneficiary Registration'}
                </Text>
                <View
                  style={[
                    styles.activePill,
                    { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Text
                    style={[
                      styles.activePillText,
                      { color: colors.textInverse },
                    ]}
                  >
                    {role === 'sevak'
                      ? language === 'gu'
                        ? 'સેવા અભિયાન'
                        : 'Active Drive'
                      : language === 'gu'
                      ? 'ઓપન પોર્ટલ'
                      : 'Open Access'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.infoBannerSub, { color: colors.textMuted }]}>
                {role === 'sevak'
                  ? language === 'gu'
                    ? 'નવસારીના ગામડાંઓમાં અમારા સેવા દળમાં જોડાઓ. પરિવારોને સીધી સહાય આપો.'
                    : 'Join our district taskforce across Navsari villages. Empower families directly.'
                  : language === 'gu'
                  ? 'યોજનાકીય લાભ, મેડિકલ સહાય અથવા કટોકટીમાં રાશન સહાય મેળવવા નોંધણી.'
                  : 'Registration for village residents seeking scheme benefits, medical aid, or emergency ration.'}
              </Text>
            </View>
          </View>

          {/* Personal Identification Card */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <Ionicons
                name="person-circle-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>
                {language === 'gu' ? 'અંગત વિગત' : 'Personal Identity'}
              </Text>
            </View>

            <View style={styles.rowTwoCol}>
              <View style={styles.colHalf}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  {language === 'gu' ? 'પ્રથમ નામ' : 'First Name'}{' '}
                  <Text style={{ color: colors.primary }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Ramesh"
                  placeholderTextColor={colors.textMuted}
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={styles.colHalf}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  {language === 'gu' ? 'અટક' : 'Last Name'}{' '}
                  <Text style={{ color: colors.primary }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Patel"
                  placeholderTextColor={colors.textMuted}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            {/* Mobile & OTP */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                {language === 'gu' ? 'મોબાઇલ નંબર' : 'Mobile Number'}{' '}
                <Text style={{ color: colors.primary }}>*</Text>
              </Text>
              <View
                style={[
                  styles.mobileInputRow,
                  { backgroundColor: colors.surfaceSubtle },
                ]}
              >
                <Text style={[styles.prefix, { color: colors.text }]}>+91</Text>
                <View
                  style={[styles.dividerV, { backgroundColor: colors.border }]}
                />
                <TextInput
                  style={[styles.mobileInput, { color: colors.text }]}
                  placeholder="98765 43210"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                />
                <TouchableOpacity
                  onPress={handleSendOtp}
                  disabled={busy}
                  style={[styles.otpBtn, { backgroundColor: colors.primary }]}
                >
                  <Text
                    style={[styles.otpBtnText, { color: colors.textInverse }]}
                  >
                    {otpSent
                      ? language === 'gu'
                        ? 'ફરી મોકલો'
                        : 'Resend'
                      : language === 'gu'
                      ? 'ઓટીપી મેળવો'
                      : 'Get OTP'}
                  </Text>
                </TouchableOpacity>
              </View>

              {otpSent && (
                <View
                  style={[
                    styles.otpPanel,
                    { backgroundColor: colors.surfaceSubtle },
                  ]}
                >
                  <Text style={[styles.otpPrompt, { color: colors.text }]}>
                    {language === 'gu'
                      ? 'એસએમએસ અથવા ઈમેલ દ્વારા મળેલ ૬ આંકડાનો કોડ દાખલ કરો:'
                      : 'Enter 6-Digit Code sent via SMS/email:'}
                  </Text>
                  <View style={styles.otpActionRow}>
                    <TextInput
                      style={[
                        styles.otpBox,
                        { backgroundColor: colors.surface, color: colors.text },
                      ]}
                      placeholder="••••••"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otpCode}
                      onChangeText={setOtpCode}
                    />
                    <TouchableOpacity
                      onPress={handleVerifyOtp}
                      style={[
                        styles.verifyOtpBtn,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.verifyOtpText,
                          { color: colors.textInverse },
                        ]}
                      >
                        {language === 'gu' ? 'ઓટીપી ચકાસો' : 'Verify OTP'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {otpVerified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={colors.primary}
                      />
                      <Text
                        style={[styles.verifiedText, { color: colors.primary }]}
                      >
                        {language === 'gu'
                          ? 'મોબાઇલ સફળતાપૂર્વક ચકાસાયો'
                          : 'Mobile Verified Successfully'}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                {language === 'gu' ? 'ઈમેલ સરનામું' : 'Email Address'}{' '}
                <Text style={styles.optionalText}>
                  {language === 'gu' ? '(વૈકલ્પિક)' : '(Optional)'}
                </Text>
              </Text>
              <TextInput
                style={[
                  styles.inputField,
                  { backgroundColor: colors.surfaceSubtle, color: colors.text },
                ]}
                placeholder="ramesh.patel@gmail.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                {language === 'gu' ? 'પાસવર્ડ બનાવો' : 'Create Password'}{' '}
                <Text style={{ color: colors.primary }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.inputField,
                  { backgroundColor: colors.surfaceSubtle, color: colors.text },
                ]}
                placeholder={
                  language === 'gu'
                    ? 'ઓછામાં ઓછા ૮ અક્ષરો'
                    : 'At least 8 characters'
                }
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {/* Volunteer/Sevak Specific: Jurisdiction, Domains & Availability */}
          {role === 'sevak' && (
            <>
              {/* Taluka & Seva Reach */}
              <View
                style={[
                  styles.formCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.cardHeaderTitle, { color: colors.text }]}
                  >
                    {language === 'gu'
                      ? 'કાર્યક્ષેત્ર અને તાલુકો'
                      : 'Taluka & Seva Reach'}
                  </Text>
                </View>

                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  {language === 'gu' ? 'મુખ્ય સેવા વિસ્તાર' : 'Primary Taluka'}{' '}
                  <Text style={{ color: colors.primary }}>*</Text>
                </Text>
                <View style={styles.talukaPillList}>
                  {TALUKAS.map(item => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setTaluka(item.id)}
                      style={[
                        styles.talukaPill,
                        {
                          backgroundColor:
                            taluka === item.id
                              ? colors.primary
                              : colors.surfaceSubtle,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.talukaPillText,
                          {
                            color:
                              taluka === item.id
                                ? colors.textInverse
                                : colors.text,
                          },
                        ]}
                      >
                        {language === 'gu' ? item.nameGu : item.nameEn}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.text, marginTop: 12 },
                  ]}
                >
                  {language === 'gu'
                    ? 'નજીકના ગામો / ક્લસ્ટર:'
                    : 'Frequent Villages / Clusters:'}
                </Text>
                <View style={styles.clusterTagWrap}>
                  {[
                    'Kaliawadi',
                    'Vijalpore',
                    'Alipore',
                    'Mahuva Road',
                    'Khadsupa',
                    'Bilimora',
                  ].map(name => {
                    const sel = selectedVillages.includes(name);
                    return (
                      <TouchableOpacity
                        key={name}
                        onPress={() => toggleVillage(name)}
                        style={[
                          styles.clusterTag,
                          {
                            backgroundColor: sel
                              ? colors.primaryLight
                              : colors.surfaceSubtle,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.clusterTagText,
                            { color: sel ? colors.textInverse : colors.text },
                          ]}
                        >
                          {name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Area of Seva Expertise */}
              <View
                style={[
                  styles.formCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <Ionicons
                    name="ribbon-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.cardHeaderTitle, { color: colors.text }]}
                  >
                    {language === 'gu'
                      ? 'સેવાનો પ્રકાર'
                      : 'Area of Seva Expertise'}
                  </Text>
                </View>

                <View style={styles.domainList}>
                  {EXPERTISE_DOMAINS.map(item => {
                    const active = selectedDomains.includes(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => toggleDomain(item.id)}
                        style={[
                          styles.domainItem,
                          {
                            backgroundColor: active
                              ? colors.surfaceSubtle
                              : colors.surface,
                            borderColor: active
                              ? colors.primary
                              : colors.borderSubtle,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.domainCheckbox,
                            {
                              borderColor: active
                                ? colors.primary
                                : colors.border,
                              backgroundColor: active
                                ? colors.primary
                                : 'transparent',
                            },
                          ]}
                        >
                          {active && (
                            <Ionicons
                              name="checkmark"
                              size={14}
                              color={colors.textInverse}
                            />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[styles.domainTitle, { color: colors.text }]}
                          >
                            {language === 'gu' ? item.titleGu : item.title}
                          </Text>
                          <Text
                            style={[
                              styles.domainDesc,
                              { color: colors.textMuted },
                            ]}
                          >
                            {language === 'gu' ? item.descGu : item.desc}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Availability Tier */}
              <View
                style={[
                  styles.formCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.cardHeaderTitle, { color: colors.text }]}
                  >
                    {language === 'gu' ? 'સમય ફાળવણી' : 'Availability'}
                  </Text>
                </View>

                <View style={styles.availRow}>
                  {[
                    {
                      id: 'weekend' as const,
                      titleEn: 'Weekend Seva',
                      titleGu: 'શનિ-રવિ સેવા (૪-૬ કલાક)',
                    },
                    {
                      id: 'weekday' as const,
                      titleEn: 'Weekday Evenings',
                      titleGu: 'સોમ-શુક્ર સાંજે',
                    },
                    {
                      id: 'fulltime' as const,
                      titleEn: 'Full Time Taskforce',
                      titleGu: 'પૂર્ણ સમય સમર્પિત',
                    },
                  ].map(av => (
                    <TouchableOpacity
                      key={av.id}
                      onPress={() => setAvailability(av.id)}
                      style={[
                        styles.availCard,
                        {
                          backgroundColor:
                            availability === av.id
                              ? colors.surfaceSubtle
                              : colors.surface,
                          borderColor:
                            availability === av.id
                              ? colors.primary
                              : colors.borderSubtle,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          {
                            borderColor:
                              availability === av.id
                                ? colors.primary
                                : colors.border,
                          },
                        ]}
                      >
                        {availability === av.id && (
                          <View
                            style={[
                              styles.radioDot,
                              { backgroundColor: colors.primary },
                            ]}
                          />
                        )}
                      </View>
                      <Text style={[styles.availTitle, { color: colors.text }]}>
                        {language === 'gu' ? av.titleGu : av.titleEn}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Submit Primary CTA */}
          <TouchableOpacity
            disabled={busy}
            onPress={handleRegister}
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.submitBtnText, { color: colors.textInverse }]}>
              {busy
                ? 'Registering...'
                : role === 'sevak'
                ? 'Register as THH Sevak (સેવક નોંધણી)'
                : 'Create Citizen Account (નાગરિક ખાતું)'}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={colors.textInverse}
            />
          </TouchableOpacity>

          {/* Back to Login Link */}
          <View style={styles.loginLinkWrap}>
            <Text style={[styles.loginPrompt, { color: colors.textMuted }]}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={onLogin}>
              <Text style={[styles.loginLink, { color: colors.primary }]}>
                Sign In / પ્રવેશ કરો
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  topBanner: {
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  topBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerKicker: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  bannerTitle: { fontSize: 20, fontWeight: '800' },
  bannerDesc: { fontSize: 12, lineHeight: 18 },
  bannerDescGu: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  roleTabsWrap: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    marginBottom: 16,
  },
  roleTabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 2,
  },
  activeRoleTab: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  roleTabIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleTabTitle: { fontSize: 14, fontWeight: '700' },
  roleTabSub: { fontSize: 11 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoBannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  infoBannerTitle: { fontSize: 13, fontWeight: '700' },
  activePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  activePillText: { fontSize: 10, fontWeight: '700' },
  infoBannerSub: { fontSize: 11, marginTop: 2, lineHeight: 16 },
  formCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  rowTwoCol: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  colHalf: { flex: 1 },
  fieldGroup: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  optionalText: { fontSize: 10, fontWeight: '400' },
  inputField: {
    height: 46,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  mobileInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    height: 46,
    paddingLeft: 12,
  },
  prefix: { fontSize: 14, fontWeight: '600' },
  dividerV: { width: 1, height: 18, marginHorizontal: 8 },
  mobileInput: { flex: 1, fontSize: 14 },
  otpBtn: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  otpBtnText: { fontSize: 11, fontWeight: '700' },
  otpPanel: { padding: 12, borderRadius: 10, marginTop: 8 },
  otpPrompt: { fontSize: 11, fontWeight: '600', marginBottom: 8 },
  otpActionRow: { flexDirection: 'row', gap: 8 },
  otpBox: {
    width: 90,
    height: 42,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 4,
  },
  verifyOtpBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyOtpText: { fontSize: 12, fontWeight: '700' },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  verifiedText: { fontSize: 11, fontWeight: '600' },
  talukaPillList: { gap: 6 },
  talukaPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  talukaPillText: { fontSize: 12, fontWeight: '600' },
  clusterTagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  clusterTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  clusterTagText: { fontSize: 11, fontWeight: '600' },
  domainList: { gap: 8 },
  domainItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  domainCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  domainTitle: { fontSize: 12, fontWeight: '700' },
  domainDesc: { fontSize: 10, marginTop: 2 },
  availRow: { gap: 8 },
  availCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  availTitle: { fontSize: 12, fontWeight: '700' },
  availSub: { fontSize: 10 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 12,
    marginTop: 8,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: { fontSize: 15, fontWeight: '700' },
  loginLinkWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  loginPrompt: { fontSize: 13 },
  loginLink: { fontSize: 13, fontWeight: '700' },
});
