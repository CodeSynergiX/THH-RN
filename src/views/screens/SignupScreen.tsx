import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { CanopyHeader } from '../components/CanopyHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { configService } from '../../services/configService';
import { authService } from '../../services/authService';
import { demographicsService } from '../../services/demographicsService';
import { District, Taluka, Village } from '../../models/demographics.model';

interface Props {
  onSuccess: () => void;
  onLogin: () => void;
}

const LUCIDE_TO_IONICONS: Record<string, string> = {
  'graduation-cap': 'school-outline',
  'book-open': 'book-outline',
  'heart-pulse': 'fitness-outline',
  'heart-handshake': 'people-circle-outline',
  'shield-alert': 'shield-outline',
  'shield-check': 'shield-checkmark-outline',
  'file-text': 'document-text-outline',
  'file-check': 'document-outline',
  'file-spreadsheet': 'document-outline',
  'map-pin': 'location-outline',
  'help-circle': 'help-circle-outline',
  'shopping-bag': 'bag-outline',
  'user-plus': 'person-add-outline',
  'user-check': 'person-done-outline',
  'cloud-rain': 'rainy-outline',
  'building-2': 'business-outline',
  'check-circle': 'checkmark-circle-outline',
  'hand-heart': 'hand-left-outline',
  'clipboard-list': 'list-outline',
  sprout: 'leaf-outline',
  landmark: 'business-outline',
  briefcase: 'briefcase-outline',
  activity: 'pulse-outline',
  droplet: 'water-outline',
  droplets: 'water-outline',
  users: 'people-outline',
  scale: 'scale-outline',
  layers: 'layers-outline',
  home: 'home-outline',
  sun: 'sunny-outline',
  zap: 'flash-outline',
  wrench: 'construct-outline',
  package: 'cube-outline',
  sparkles: 'sparkles-outline',
};

function resolveIconName(raw?: string): string {
  if (!raw) return 'ribbon-outline';
  const clean = raw.toLowerCase().trim();
  return LUCIDE_TO_IONICONS[clean] || 'ribbon-outline';
}

interface SevaDomain {
  id: string;
  icon: string;
  title: string;
  titleGu: string;
  desc: string;
  descGu: string;
}

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
  const [taluka, setTaluka] = useState('');
  const [districtsList, setDistrictsList] = useState<District[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [availableTalukas, setAvailableTalukas] = useState<Taluka[]>([]);
  const [selectedTalukaId, setSelectedTalukaId] = useState<number | null>(null);
  const [availableVillages, setAvailableVillages] = useState<Village[]>([]);
  const [selectedVillageIds, setSelectedVillageIds] = useState<number[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  // Legacy string-based taluka for payload compatibility
  const selectedVillages = selectedVillageIds
    .map(vid => availableVillages.find(v => v.id === vid))
    .filter(Boolean)
    .map(v => v!.name_en || v!.name_gu);
  const [domainsList, setDomainsList] = useState<SevaDomain[]>(EXPERTISE_DOMAINS);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [showDomainsModal, setShowDomainsModal] = useState(false);
  const [availability, setAvailability] = useState<'weekend' | 'weekday' | 'fulltime'>('weekend');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [busy, setBusy] = useState(false);

  // Fetch dynamic seva expertise domains from API
  useEffect(() => {
    configService
      .getModules(locale)
      .then(modules => {
        if (modules && modules.length > 0) {
          const mapped: SevaDomain[] = modules.map(m => ({
            id: m.slug,
            icon: resolveIconName(m.icon),
            title: m.title_en || m.title,
            titleGu: m.title_gu || m.title,
            desc: m.subtitle_en || m.subtitle || '',
            descGu: m.subtitle_gu || m.subtitle || '',
          }));
          setDomainsList(mapped);
          setSelectedDomains(prev =>
            prev.length === 0 && mapped.length > 0 ? [mapped[0].id] : prev,
          );
        }
      })
      .catch(() => {});
  }, [locale]);

  // Fetch districts + talukas from API
  useEffect(() => {
    setLocationLoading(true);
    demographicsService
      .getDistricts()
      .then(dists => {
        if (dists && dists.length > 0) {
          setDistrictsList(dists);
          // Auto-select first district and its first taluka
          const first = dists[0];
          setSelectedDistrictId(first.id);
          const talukas = first.talukas || [];
          setAvailableTalukas(talukas);
          if (talukas.length > 0) {
            setSelectedTalukaId(talukas[0].id);
            setTaluka(talukas[0].name_en || talukas[0].name_gu);
            setAvailableVillages(talukas[0].villages || []);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLocationLoading(false));
  }, []);

  const toggleDomain = (id: string) => {
    setSelectedDomains(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id],
    );
  };

  const handleSelectDistrict = (dist: District) => {
    setSelectedDistrictId(dist.id);
    const talukas = dist.talukas || [];
    setAvailableTalukas(talukas);
    setSelectedTalukaId(null);
    setAvailableVillages([]);
    setSelectedVillageIds([]);
    setTaluka('');
  };

  const handleSelectTaluka = (tk: Taluka) => {
    setSelectedTalukaId(tk.id);
    setTaluka(tk.name_en || tk.name_gu);
    const villages = tk.villages || [];
    setAvailableVillages(villages);
    setSelectedVillageIds([]);
  };

  const toggleVillage = (id: number) => {
    setSelectedVillageIds(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id],
    );
  };

  // Send OTP to Email
  const handleSendOtp = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      showToast(
        language === 'gu'
          ? 'ઓટીપી મેળવવા માટે કૃપા કરીને માન્ય ઈમેલ સરનામું દાખલ કરો.'
          : 'Please enter a valid email address to receive an OTP.',
        'warning',
        language === 'gu' ? 'ઈમેલ જરૂરી છે' : 'Email Required',
      );
      return;
    }
    setBusy(true);
    try {
      await auth.requestOtp({ email: trimmedEmail, purpose: 'register' });
      setOtpSent(true);
      showToast(
        language === 'gu'
          ? `${trimmedEmail} પર ઓટીપી મોકલવામાં આવ્યો છે.`
          : `Verification code sent to ${trimmedEmail}.`,
        'success',
        'OTP Sent',
      );
    } catch {
      showToast(
        language === 'gu'
          ? 'ઓટીપી મોકલી શકાયો નહીં. કૃપા કરીને તમારું ઈમેલ તપાસો.'
          : 'Failed to send OTP. Please check your email address.',
        'error',
      );
    } finally {
      setBusy(false);
    }
  };

  // Verify Email OTP
  const handleVerifyOtp = async () => {
    const trimmedEmail = email.trim().toLowerCase();
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
    setBusy(true);
    try {
      await authService.verifyOtp({
        email: trimmedEmail,
        code: otpCode.trim(),
        purpose: 'register',
      });
      setOtpVerified(true);
      showToast(
        language === 'gu'
          ? 'ઈમેલ સફળતાપૂર્વક ચકાસાયો!'
          : 'Email verified successfully!',
        'success',
        'Verified',
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Invalid or expired OTP code.',
        'error',
        'Verification Failed',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showToast('Please enter both your first and last name.', 'warning');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast(
        language === 'gu'
          ? 'કૃપા કરીને ૧૦ અંકનો માન્ય મોબાઇલ નંબર દાખલ કરો.'
          : 'Please enter a valid 10-digit mobile number.',
        'warning',
        language === 'gu' ? 'મોબાઇલ નંબર જરૂરી છે' : 'Mobile Required',
      );
      return;
    }
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      showToast(
        language === 'gu'
          ? 'કૃપા કરીને માન્ય ઈમેલ સરનામું દાખલ કરો.'
          : 'Please enter a valid email address.',
        'warning',
        language === 'gu' ? 'અમાન્ય ઈમેલ' : 'Invalid Email',
      );
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
        email: trimmedEmail.length > 0 ? trimmedEmail : undefined,
        phone: cleanPhone,
        password,
        password_confirmation: password,
        role: role === 'sevak' ? 'volunteer' : 'citizen',
        locale,
        email_verified: otpVerified,
        domains: role === 'sevak' ? selectedDomains : undefined,
        availability: role === 'sevak' ? availability : undefined,
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { flexGrow: 1, paddingBottom: 220 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
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
                  name="people-circle"
                  size={28}
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

            {/* Mobile Number */}
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
                  onChangeText={val => setPhone(val.replace(/[^0-9]/g, ''))}
                />
              </View>
            </View>

            {/* Email Address & Optional OTP Verification */}
            <View style={styles.fieldGroup}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <Text style={[styles.fieldLabel, { color: colors.text, marginBottom: 0 }]}>
                  {language === 'gu' ? 'ઈમેલ સરનામું' : 'Email Address'}{' '}
                  <Text style={styles.optionalText}>
                    {language === 'gu' ? '(વૈકલ્પિક - ઓટીપી ચકાસણી)' : '(Optional - OTP verify)'}
                  </Text>
                </Text>
                {otpVerified && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: colors.primary,
                      }}
                    >
                      {language === 'gu' ? 'ચકાસાયેલ' : 'Verified'}
                    </Text>
                  </View>
                )}
              </View>

              <View
                style={[
                  styles.emailInputRow,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: otpVerified ? colors.primary : colors.borderSubtle,
                  },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={colors.textMuted}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  style={[styles.emailInput, { color: colors.text }]}
                  placeholder="ramesh.patel@gmail.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  editable={!otpVerified}
                  onChangeText={txt => {
                    setEmail(txt);
                    if (otpVerified) setOtpVerified(false);
                  }}
                />
                {!otpVerified && email.trim().length > 0 && (
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
                )}
              </View>

              {otpSent && !otpVerified && (
                <View
                  style={[
                    styles.otpPanel,
                    { backgroundColor: colors.surfaceSubtle },
                  ]}
                >
                  <Text style={[styles.otpPrompt, { color: colors.text }]}>
                    {language === 'gu'
                      ? 'ઈમેલ પર મોકલેલ ૬ આંકડાનો ચકાસણી કોડ દાખલ કરો:'
                      : 'Enter 6-Digit Code sent to your email:'}
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
                      disabled={busy}
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
                        {busy
                          ? '...'
                          : language === 'gu'
                          ? 'ઓટીપી ચકાસો'
                          : 'Verify OTP'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

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
                      ? 'ઈમેલ સફળતાપૂર્વક ચકાસાયો'
                      : 'Email Verified Successfully'}
                  </Text>
                </View>
              )}
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
                {/* Card Header */}
                <View style={styles.cardHeaderRow}>
                  <View
                    style={[
                      styles.locHeaderIconBox,
                      { backgroundColor: `${colors.primary}18` },
                    ]}
                  >
                    <Ionicons name="location" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>
                      {language === 'gu' ? 'કાર્યક્ષેત્ર અને તાલુકો' : 'Taluka & Seva Reach'}
                    </Text>
                    <Text style={[styles.locHeaderSub, { color: colors.textMuted }]}>
                      {language === 'gu'
                        ? 'જિલ્લો → તાલુકો → ગામ ક્રમે પસંદ કરો'
                        : 'Select District → Taluka → Village'}
                    </Text>
                  </View>
                </View>

                {locationLoading ? (
                  <View style={styles.locLoadingBox}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.locLoadingText, { color: colors.textMuted }]}>
                      {language === 'gu' ? 'સ્થાન લોડ થઈ રહ્યું...' : 'Loading locations...'}
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* ── STEP 1: DISTRICT ── */}
                    <View style={[styles.locStepBox, { borderColor: colors.borderSubtle }]}>
                      <View style={styles.locStepHeader}>
                        <View
                          style={[
                            styles.locStepBadge,
                            { backgroundColor: selectedDistrictId ? colors.primary : colors.border },
                          ]}
                        >
                          <Text style={[styles.locStepBadgeText, { color: colors.textInverse }]}>1</Text>
                        </View>
                        <Text style={[styles.locStepTitle, { color: colors.text }]}>
                          {language === 'gu' ? 'જિલ્લો' : 'District'}
                          <Text style={{ color: colors.primary }}> *</Text>
                        </Text>
                        {selectedDistrictId && (
                          <View style={[styles.locSelectedBadge, { backgroundColor: colors.primaryContainer }]}>
                            <Ionicons name="checkmark-circle" size={13} color={colors.onPrimaryContainer} />
                            <Text style={[styles.locSelectedBadgeText, { color: colors.onPrimaryContainer }]}>
                              {language === 'gu' ? 'પસંદ' : 'Selected'}
                            </Text>
                          </View>
                        )}
                      </View>

                      {districtsList.length === 0 ? (
                        <Text style={[styles.locEmptyHint, { color: colors.textMuted }]}>
                          {language === 'gu' ? 'ડેટા ઉપલબ્ધ નથી' : 'No data available'}
                        </Text>
                      ) : (
                        <View style={styles.locCardGrid}>
                          {districtsList.map(dist => {
                            const isSelected = selectedDistrictId === dist.id;
                            return (
                              <TouchableOpacity
                                key={dist.id}
                                onPress={() => handleSelectDistrict(dist)}
                                style={[
                                  styles.locSelCard,
                                  {
                                    backgroundColor: isSelected
                                      ? colors.primaryContainer
                                      : colors.surfaceSubtle,
                                    borderColor: isSelected ? colors.primary : colors.borderSubtle,
                                    borderWidth: isSelected ? 1.5 : 1,
                                  },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.locSelCardRadio,
                                    {
                                      borderColor: isSelected ? colors.primary : colors.border,
                                      backgroundColor: isSelected ? colors.primary : 'transparent',
                                    },
                                  ]}
                                >
                                  {isSelected && (
                                    <Ionicons name="checkmark" size={10} color={colors.onPrimaryContainer} />
                                  )}
                                </View>
                                <Text
                                  style={[
                                    styles.locSelCardText,
                                    {
                                      color: isSelected ? colors.onPrimaryContainer : colors.text,
                                      fontWeight: isSelected ? '700' : '500',
                                    },
                                  ]}
                                  numberOfLines={2}
                                >
                                  {language === 'gu' ? dist.name_gu : dist.name_en || dist.name_gu}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    {/* ── STEP 2: TALUKA ── */}
                    <View
                      style={[
                        styles.locStepBox,
                        {
                          borderColor: colors.borderSubtle,
                          opacity: selectedDistrictId ? 1 : 0.45,
                        },
                      ]}
                    >
                      <View style={styles.locStepHeader}>
                        <View
                          style={[
                            styles.locStepBadge,
                            { backgroundColor: selectedTalukaId ? colors.primary : colors.border },
                          ]}
                        >
                          <Text style={[styles.locStepBadgeText, { color: colors.textInverse }]}>2</Text>
                        </View>
                        <Text style={[styles.locStepTitle, { color: colors.text }]}>
                          {language === 'gu' ? 'તાલુકો' : 'Taluka'}
                          <Text style={{ color: colors.primary }}> *</Text>
                        </Text>
                        {selectedTalukaId && (
                          <View style={[styles.locSelectedBadge, { backgroundColor: colors.primaryContainer }]}>
                            <Ionicons name="checkmark-circle" size={13} color={colors.onPrimaryContainer} />
                            <Text style={[styles.locSelectedBadgeText, { color: colors.onPrimaryContainer }]}>
                              {language === 'gu' ? 'પસંદ' : 'Selected'}
                            </Text>
                          </View>
                        )}
                      </View>

                      {!selectedDistrictId ? (
                        <View style={styles.locLockedHint}>
                          <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
                          <Text style={[styles.locEmptyHint, { color: colors.textMuted }]}>
                            {language === 'gu' ? 'પ્રથમ જિલ્લો પસંદ કરો' : 'Select a district first'}
                          </Text>
                        </View>
                      ) : availableTalukas.length === 0 ? (
                        <Text style={[styles.locEmptyHint, { color: colors.textMuted }]}>
                          {language === 'gu' ? 'તાલુકા ઉપલબ્ધ નથી' : 'No talukas available'}
                        </Text>
                      ) : (
                        <View style={styles.locCardGrid}>
                          {availableTalukas.map(tk => {
                            const isSelected = selectedTalukaId === tk.id;
                            return (
                              <TouchableOpacity
                                key={tk.id}
                                onPress={() => handleSelectTaluka(tk)}
                                style={[
                                  styles.locSelCard,
                                  {
                                    backgroundColor: isSelected
                                      ? colors.primaryContainer
                                      : colors.surfaceSubtle,
                                    borderColor: isSelected ? colors.primary : colors.borderSubtle,
                                    borderWidth: isSelected ? 1.5 : 1,
                                  },
                                ]}
                              >
                                <View
                                  style={[
                                    styles.locSelCardRadio,
                                    {
                                      borderColor: isSelected ? colors.primary : colors.border,
                                      backgroundColor: isSelected ? colors.primary : 'transparent',
                                    },
                                  ]}
                                >
                                  {isSelected && (
                                    <Ionicons name="checkmark" size={10} color={colors.onPrimaryContainer} />
                                  )}
                                </View>
                                <Text
                                  style={[
                                    styles.locSelCardText,
                                    {
                                      color: isSelected ? colors.onPrimaryContainer : colors.text,
                                      fontWeight: isSelected ? '700' : '500',
                                    },
                                  ]}
                                  numberOfLines={2}
                                >
                                  {language === 'gu' ? tk.name_gu : tk.name_en || tk.name_gu}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>

                    {/* ── STEP 3: VILLAGE ── */}
                    <View
                      style={[
                        styles.locStepBox,
                        {
                          borderColor: colors.borderSubtle,
                          borderBottomWidth: 0,
                          marginBottom: 0,
                          opacity: selectedTalukaId ? 1 : 0.45,
                        },
                      ]}
                    >
                      <View style={styles.locStepHeader}>
                        <View
                          style={[
                            styles.locStepBadge,
                            {
                              backgroundColor:
                                selectedVillageIds.length > 0 ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <Text style={[styles.locStepBadgeText, { color: colors.textInverse }]}>3</Text>
                        </View>
                        <Text style={[styles.locStepTitle, { color: colors.text }]}>
                          {language === 'gu' ? 'ગામ (બહુ-પસંદ)' : 'Village (Multi-select)'}
                        </Text>
                        {selectedVillageIds.length > 0 && (
                          <View
                            style={[
                              styles.locSelectedBadge,
                              { backgroundColor: colors.primaryContainer },
                            ]}
                          >
                            <Text style={[styles.locSelectedBadgeText, { color: colors.onPrimaryContainer }]}>
                              {selectedVillageIds.length}{' '}
                              {language === 'gu' ? 'ગામ' : 'selected'}
                            </Text>
                          </View>
                        )}
                        {availableVillages.length > 0 && selectedTalukaId && (
                          <TouchableOpacity
                            onPress={() => {
                              if (selectedVillageIds.length === availableVillages.length) {
                                setSelectedVillageIds([]);
                              } else {
                                setSelectedVillageIds(availableVillages.map(v => v.id));
                              }
                            }}
                            style={{ marginLeft: 'auto', paddingHorizontal: 6, paddingVertical: 2 }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                              {selectedVillageIds.length === availableVillages.length
                                ? (language === 'gu' ? 'બધા હટાવો' : 'Clear All')
                                : (language === 'gu' ? 'બધા પસંદ કરો' : 'Select All')}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {!selectedTalukaId ? (
                        <View style={styles.locLockedHint}>
                          <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
                          <Text style={[styles.locEmptyHint, { color: colors.textMuted }]}>
                            {language === 'gu' ? 'પ્રથમ તાલુકો પસંદ કરો' : 'Select a taluka first'}
                          </Text>
                        </View>
                      ) : availableVillages.length === 0 ? (
                        <Text style={[styles.locEmptyHint, { color: colors.textMuted }]}>
                          {language === 'gu' ? 'ગામ ઉપલબ્ધ નથી' : 'No villages available'}
                        </Text>
                      ) : (
                        <View style={styles.clusterTagWrap}>
                          {availableVillages.map(v => {
                            const sel = selectedVillageIds.includes(v.id);
                            return (
                              <TouchableOpacity
                                key={v.id}
                                onPress={() => toggleVillage(v.id)}
                                style={[
                                  styles.villageChip,
                                  {
                                    backgroundColor: sel
                                      ? colors.primaryContainer
                                      : colors.surfaceSubtle,
                                    borderColor: sel ? colors.primary : colors.borderSubtle,
                                    borderWidth: sel ? 1.5 : 1,
                                  },
                                ]}
                              >
                                {sel ? (
                                  <Ionicons
                                    name="checkmark-circle"
                                    size={13}
                                    color={colors.onPrimaryContainer}
                                  />
                                ) : (
                                  <Ionicons
                                    name="home-outline"
                                    size={13}
                                    color={colors.textMuted}
                                  />
                                )}
                                <Text
                                  style={[
                                    styles.villageChipText,
                                    {
                                      color: sel ? colors.onPrimaryContainer : colors.text,
                                      fontWeight: sel ? '700' : '500',
                                    },
                                  ]}
                                >
                                  {language === 'gu' ? v.name_gu : v.name_en || v.name_gu}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  </>
                )}
              </View>

              {/* Area of Seva Expertise - Dropdown Multiselect */}
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

                {/* Dropdown Trigger Button */}
                <TouchableOpacity
                  onPress={() => setShowDomainsModal(true)}
                  style={[
                    styles.domainDropdownBtn,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor:
                        selectedDomains.length > 0
                          ? colors.primary
                          : colors.borderSubtle,
                    },
                  ]}
                >
                  <Ionicons
                    name="ribbon"
                    size={16}
                    color={colors.primary}
                  />
                  <View style={{ flex: 1 }}>
                    {selectedDomains.length === 0 ? (
                      <Text style={[styles.domainDropdownPlaceholder, { color: colors.textMuted }]}>
                        {language === 'gu'
                          ? 'સેવા ક્ષેત્ર પસંદ કરો...'
                          : 'Select seva domains...'}
                      </Text>
                    ) : (
                      <Text style={[styles.domainDropdownValue, { color: colors.text }]} numberOfLines={2}>
                        {selectedDomains
                          .map(id => {
                            const d = domainsList.find(x => x.id === id);
                            return d ? (language === 'gu' ? d.titleGu : d.title) : id;
                          })
                          .join(', ')}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.domainCountBadge,
                      {
                        backgroundColor:
                          selectedDomains.length > 0
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.domainCountText, { color: colors.onPrimaryContainer }]}>
                      {selectedDomains.length}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </TouchableOpacity>

                {selectedDomains.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {selectedDomains.map(id => {
                      const d = domainsList.find(x => x.id === id);
                      return d ? (
                        <View
                          key={id}
                          style={[
                            styles.domainChip,
                            {
                              backgroundColor: colors.primaryContainer,
                              borderColor: colors.primary,
                              borderWidth: 1,
                            },
                          ]}
                        >
                          <Ionicons name="checkmark-circle" size={12} color={colors.onPrimaryContainer} />
                          <Text style={[styles.domainChipText, { color: colors.onPrimaryContainer }]}>
                            {language === 'gu' ? d.titleGu : d.title}
                          </Text>
                          <TouchableOpacity
                            onPress={() => toggleDomain(id)}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Ionicons name="close" size={13} color={colors.onPrimaryContainer} />
                          </TouchableOpacity>
                        </View>
                      ) : null;
                    })}
                  </View>
                )}
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

      {/* Area of Seva Expertise - Multiselect Modal */}
      <Modal
        visible={showDomainsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDomainsModal(false)}
      >
        <View style={styles.domainModalOverlay}>
          <View
            style={[
              styles.domainModalCard,
              { backgroundColor: colors.surface, borderColor: colors.borderSubtle, borderWidth: 1 },
            ]}
          >
            <View style={[styles.domainModalHandle, { backgroundColor: colors.borderSubtle }]} />

            {/* Modal Header */}
            <View style={styles.domainModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="ribbon" size={20} color={colors.primary} />
                <Text style={[styles.domainModalTitle, { color: colors.text }]}>
                  {language === 'gu' ? 'સેવા ક્ષેત્ર પસંદ કરો' : 'Select Seva Domains'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowDomainsModal(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.domainModalSub, { color: colors.textMuted }]}>
              {language === 'gu'
                ? 'એક કરતા વધુ પસંદ કરી શકાય છે:'
                : 'You can select multiple domains:'}
            </Text>

            <ScrollView
              style={styles.domainModalList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {selectedDomains.length > 0 && (
                <View
                  style={[
                    styles.domainModalSelectedBar,
                    {
                      backgroundColor: colors.primaryContainer,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={14} color={colors.onPrimaryContainer} />
                  <Text style={[styles.domainModalSelectedBarText, { color: colors.onPrimaryContainer }]}>
                    {language === 'gu'
                      ? `${selectedDomains.length} ક્ષેત્ર પસંદ`
                      : `${selectedDomains.length} domain(s) selected`}
                  </Text>
                </View>
              )}
              {domainsList.map(item => {
                const active = selectedDomains.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleDomain(item.id)}
                    style={[
                      styles.domainModalItem,
                      {
                        backgroundColor: active
                          ? colors.primaryContainer
                          : colors.surfaceSubtle,
                        borderColor: active ? colors.primary : colors.borderSubtle,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.domainModalCheckbox,
                        {
                          borderColor: active ? colors.onPrimaryContainer : colors.border,
                          backgroundColor: active ? colors.primary : 'transparent',
                        },
                      ]}
                    >
                      {active && (
                        <Ionicons name="checkmark" size={14} color={colors.onPrimaryContainer} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.domainModalItemTitle,
                          { color: active ? colors.onPrimaryContainer : colors.text },
                        ]}
                      >
                        {language === 'gu' ? item.titleGu : item.title}
                      </Text>
                      <Text
                        style={[
                          styles.domainModalItemDesc,
                          {
                            color: active ? colors.onPrimaryContainer : colors.textMuted,
                            opacity: active ? 0.9 : 1,
                          },
                        ]}
                      >
                        {language === 'gu' ? item.descGu : item.desc}
                      </Text>
                    </View>
                    <Ionicons
                      name={item.icon as any || 'ribbon-outline'}
                      size={20}
                      color={active ? colors.onPrimaryContainer : colors.textMuted}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowDomainsModal(false)}
              style={[styles.domainModalDoneBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.domainModalDoneText, { color: colors.textInverse }]}>
                {language === 'gu'
                  ? `કર્યું (${selectedDomains.length} પસંદ)`
                  : `Done (${selectedDomains.length} selected)`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  // Location Step UI
  locHeaderIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locHeaderSub: { fontSize: 11, marginTop: 2, fontWeight: '500' },
  locLoadingBox: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  locLoadingText: { fontSize: 12, fontWeight: '600' },
  locStepBox: {
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 4,
  },
  locStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  locStepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locStepBadgeText: { fontSize: 11, fontWeight: '900' },
  locStepTitle: { fontSize: 13, fontWeight: '700', flex: 1 },
  locSelectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  locSelectedBadgeText: { fontSize: 11, fontWeight: '700' },
  locCardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locSelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: '47%',
    flex: 1,
  },
  locSelCardRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locSelCardText: { fontSize: 12 },
  locEmptyHint: { fontSize: 12, fontStyle: 'italic', marginTop: 2 },
  locLockedHint: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  villageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  villageChipText: { fontSize: 12 },
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
  emailInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    height: 46,
    paddingLeft: 12,
    borderWidth: 1,
  },
  emailInput: { flex: 1, fontSize: 14 },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  // Domain Dropdown
  domainDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 4,
  },
  domainDropdownPlaceholder: { fontSize: 13 },
  domainDropdownValue: { fontSize: 12, fontWeight: '600' },
  domainCountBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  domainCountText: { fontSize: 11, fontWeight: '800' },
  domainChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  domainChipText: { fontSize: 11, fontWeight: '600' },
  // Domain Modal
  domainModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  domainModalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '80%',
  },
  domainModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  domainModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  domainModalTitle: { fontSize: 16, fontWeight: '800' },
  domainModalSub: { fontSize: 12, marginBottom: 14 },
  domainModalList: { maxHeight: 320 },
  domainModalSelectedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  domainModalSelectedBarText: { fontSize: 12, fontWeight: '700' },
  domainModalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  domainModalCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  domainModalItemTitle: { fontSize: 13, fontWeight: '700' },
  domainModalItemDesc: { fontSize: 11, marginTop: 2, lineHeight: 16 },
  domainModalDoneBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  domainModalDoneText: { fontSize: 15, fontWeight: '800' },
});
