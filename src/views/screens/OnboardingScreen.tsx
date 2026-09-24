/**
 * OnboardingScreen — translated from Stitch "Feature Onboarding Walkthrough" design.
 * Features:
 *  - 3-pillar card carousel (Govt Schemes / Blood SOS / Field Seva & Tracking)
 *  - Animated step progress bars
 *  - Pillar tab list below the hero card
 *  - Smooth slide transition between pillars
 *  - EN / GU language toggle
 *  - Get Started + Join as Sevak + Blood SOS buttons
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import Svg, { Path, Ellipse, Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from '../../i18n/LanguageContext';

// const { width: W } = Dimensions.get('window');

// ── Colours (matching Stitch design system) ────────────────────────────────────
const C = {
  primary: '#006026',
  secondary: '#79573c',
  surface: '#fff8f5',
  surfLow: '#fff1ea',
  surfCont: '#ffeadf',
  surfHigh: '#ffe3d4',
  surfHiest: '#ffdbc8',
  white: '#ffffff',
  error: '#ba1a1a',
  errCont: '#ffdad6',
  secCont: '#ffd1af',
  muted: '#6f7a6e',
  onSurf: '#2a170b',
};

// ── Pillar data ────────────────────────────────────────────────────────────────
const PILLARS = [
  {
    id: 1,
    iconName: 'document-text-outline' as const,
    iconBg: `${C.primary}18`,
    iconColor: C.primary,
    dotColor: C.primary,
    pillarLabel: 'Core Pillar 1 of 3',
    pillarLabelGu: 'મુખ્ય સ્તંભ ૧ / ૩',
    titleEn: 'Doorstep Government Schemes',
    titleGu: 'સરકારી યોજનાઓ સહાય સેવા',
    tabTitleEn: 'Government Schemes • સરકારી સહાય',
    descEn:
      'Doorstep assistance for rural citizens applying to housing grants, Ayushman cards, farmer subsidies, and widow aid. Complete guidance from verification to sanction without middleman fees.',
    descGu:
      'PM Awas, Ayushman, Kisan Sahay વગેરે સરકારી યોજનાઓ માટે ઘર બેઠા સહાય. કોઈ દલાલ વગર.',
    statEn: '28,500+ Families Assisted',
    statSub: 'Across Navsari, Valsad & Surat Gram Panchayats',
    tabSubEn: 'Zero-fee doorstep form filing and taluka verification',
    badges: [
      { icon: 'home-outline' as const, label: 'PM Awas', color: C.primary },
      { icon: 'medical-outline' as const, label: 'Ayushman', color: C.error },
      {
        icon: 'leaf-outline' as const,
        label: 'Kisan Sahay',
        color: C.secondary,
      },
    ],
  },
  {
    id: 2,
    iconName: 'heart-outline' as const,
    iconBg: C.errCont,
    iconColor: C.error,
    dotColor: C.error,
    pillarLabel: 'Core Pillar 2 of 3',
    pillarLabelGu: 'મુખ્ય સ્તંભ ૨ / ૩',
    titleEn: 'Emergency Blood Donor Grid',
    titleGu: 'ઇમરજન્સી રક્તદાતા નેટવર્ક',
    tabTitleEn: 'Emergency Blood SOS • રક્ત સહાય',
    descEn:
      '24/7 verified blood donor dispatch connecting local volunteers directly to Navsari Civil Hospital and community clinics. Zero replacement delay during trauma and maternity emergencies.',
    descGu:
      '24/7 ઇમરજન્સી રક્ત સહાય — Navsari Civil Hospital સીધા સ્વૈચ્છિક દાતાઓ સાથે. 18 મિનિટ સ્પ્રોક્સ.',
    statEn: '1,420+ Lives Supported',
    statSub: 'Average response time: under 18 minutes in South Gujarat',
    tabSubEn: 'Direct dispatch grid for Navsari Civil & local ICUs',
    badges: [
      { icon: 'water-outline' as const, label: 'A+ / B+ / O-', color: C.error },
      {
        icon: 'notifications-outline' as const,
        label: 'Live SOS',
        color: C.error,
      },
      {
        icon: 'business-outline' as const,
        label: 'Civil Hospital',
        color: C.primary,
      },
    ],
  },
  {
    id: 3,
    iconName: 'people-outline' as const,
    iconBg: C.secCont,
    iconColor: C.secondary,
    dotColor: C.secondary,
    pillarLabel: 'Core Pillar 3 of 3',
    pillarLabelGu: 'મુખ્ય સ્તંભ ૩ / ૩',
    titleEn: 'Field Seva & Application Tracking',
    titleGu: 'અરજી ટ્રેકિંગ અને સ્થળ સેવા',
    tabTitleEn: 'Field Seva & Tracking • અરજી ટ્રેકિંગ',
    descEn:
      'Transparent grievance and application resolution. Local Sevak coordinators conduct physical inspections, document uploading, and provide live status alerts straight to your smartphone.',
    descGu:
      'ગ્રામ-સ્તરે Sevak ક્ષેત્ર નિરીક્ષણ, દસ્તાવેજ અપલોડ, અને Live status alerts — 98% resolution.',
    statEn: '410+ Active Sevaks',
    statSub: 'Serving 86 village clusters with 98% resolution satisfaction',
    tabSubEn: 'Live updates by village coordinators & volunteers',
    badges: [
      {
        icon: 'navigate-outline' as const,
        label: 'GPS Track',
        color: C.secondary,
      },
      {
        icon: 'checkmark-circle-outline' as const,
        label: 'Verified',
        color: C.primary,
      },
      {
        icon: 'chatbubbles-outline' as const,
        label: 'Local Sevak',
        color: C.secondary,
      },
    ],
  },
];

// ── Mini THH Logo SVG ─────────────────────────────────────────────────────────
const THHMiniLogo = () => (
  <Svg width={28} height={28} viewBox="0 0 100 100">
    <Path
      d="M48 68 C48 54 44 48 34 38 M52 68 C52 54 56 48 66 38 M50 68 L50 34"
      stroke="#79573c"
      strokeLinecap="round"
      strokeWidth={6}
    />
    <Path
      d="M50 78 C38 78 20 86 14 90 C34 84 66 84 86 90 C80 86 62 78 50 78 Z"
      fill="#006026"
    />
    <Ellipse cx={50} cy={20} rx={9} ry={14} fill="#006026" />
    <Circle cx={50} cy={11} r={3.5} fill="#fff8f5" />
    <Ellipse
      cx={32}
      cy={28}
      rx={8}
      ry={12}
      fill="#1b7a38"
      transform="rotate(-30, 32, 28)"
    />
    <Ellipse
      cx={68}
      cy={28}
      rx={8}
      ry={12}
      fill="#1b7a38"
      transform="rotate(30, 68, 28)"
    />
    <Ellipse
      cx={20}
      cy={45}
      rx={8}
      ry={11}
      fill="#006026"
      transform="rotate(-55, 20, 45)"
    />
    <Ellipse
      cx={80}
      cy={45}
      rx={8}
      ry={11}
      fill="#006026"
      transform="rotate(55, 80, 45)"
    />
    <Ellipse
      cx={36}
      cy={48}
      rx={7}
      ry={10}
      fill="#7fda8c"
      transform="rotate(-20, 36, 48)"
    />
    <Ellipse
      cx={64}
      cy={48}
      rx={7}
      ry={10}
      fill="#7fda8c"
      transform="rotate(20, 64, 48)"
    />
  </Svg>
);

// ── Main Component ─────────────────────────────────────────────────────────────
export const OnboardingScreen: React.FC<{ onDone: () => void }> = ({
  onDone,
}) => {
  // const { theme } = useAppTheme();
  const { locale } = useTranslation();
  const [activePillar, setActivePillar] = useState(0);
  const [lang, setLang] = useState<'en' | 'gu'>(locale === 'gu' ? 'gu' : 'en');

  const pillar = PILLARS[activePillar];
  const gu = lang === 'gu';

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: C.surface }]}
      edges={['top', 'bottom']}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.brandMini}>
            <View
              style={[
                styles.brandLogoWrap,
                { backgroundColor: `${C.primary}18` },
              ]}
            >
              <THHMiniLogo />
            </View>
            <View>
              <Text style={[styles.brandName, { color: C.primary }]}>THH</Text>
              <Text style={[styles.brandSub, { color: C.secondary }]}>
                The Helping Hands
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {/* Language toggle */}
            <View style={[styles.langPill, { backgroundColor: C.surfHigh }]}>
              <TouchableOpacity
                style={[
                  styles.langBtn,
                  lang === 'en' && { backgroundColor: C.white, elevation: 1 },
                ]}
                onPress={() => setLang('en')}
              >
                <Text
                  style={[
                    styles.langTxt,
                    {
                      color: lang === 'en' ? C.primary : C.muted,
                      fontWeight: lang === 'en' ? '700' : '400',
                    },
                  ]}
                >
                  EN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.langBtn,
                  lang === 'gu' && { backgroundColor: C.white, elevation: 1 },
                ]}
                onPress={() => setLang('gu')}
              >
                <Text
                  style={[
                    styles.langTxt,
                    {
                      color: lang === 'gu' ? C.primary : C.muted,
                      fontWeight: lang === 'gu' ? '700' : '400',
                    },
                  ]}
                >
                  ગુ
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={onDone}>
              <Text style={[styles.skipText, { color: C.secondary }]}>
                {gu ? 'છોડો' : 'Skip'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Step progress bars ── */}
        <View style={styles.stepBars}>
          {PILLARS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.stepBar,
                {
                  backgroundColor: i === activePillar ? C.primary : C.surfHiest,
                },
              ]}
            />
          ))}
        </View>

        {/* ── Hero feature card ── */}
        <View style={[styles.heroCard, { backgroundColor: C.white }]}>
          {/* Top row */}
          <View style={styles.heroCardTop}>
            <View
              style={[
                styles.pillarBadge,
                { backgroundColor: `${C.primary}22` },
              ]}
            >
              <View
                style={[styles.pillarDot, { backgroundColor: C.primary }]}
              />
              <Text style={[styles.pillarBadgeText, { color: C.primary }]}>
                {gu ? pillar.pillarLabelGu : pillar.pillarLabel}
              </Text>
            </View>
            <View
              style={[styles.verifiedBadge, { backgroundColor: C.surfLow }]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={13}
                color={C.primary}
              />
              <Text style={[styles.verifiedText, { color: C.secondary }]}>
                {gu ? 'મામલતદાર માન્ય' : 'Talati & Mamlatdar Verified'}
              </Text>
            </View>
          </View>

          {/* Visual hero */}
          <View style={[styles.heroVisual, { backgroundColor: C.surfLow }]}>
            {/* Scheme icon grid */}
            <View
              style={[styles.heroIconMain, { backgroundColor: pillar.iconBg }]}
            >
              <Ionicons
                name={pillar.iconName}
                size={52}
                color={pillar.iconColor}
              />
            </View>

            {/* Bottom badges */}
            <View style={styles.heroBadgeRow}>
              {pillar.badges.map((b, bi) => (
                <View
                  key={bi}
                  style={[
                    styles.heroBadge,
                    { backgroundColor: `${C.white}f0` },
                  ]}
                >
                  <Ionicons name={b.icon} size={13} color={b.color} />
                  <Text style={[styles.heroBadgeText, { color: C.onSurf }]}>
                    {b.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Text content */}
          <View style={styles.heroText}>
            <View style={styles.heroTitleRow}>
              <Text
                style={[styles.heroTitleEn, { color: C.onSurf }]}
                numberOfLines={2}
              >
                {gu ? pillar.titleGu : pillar.titleEn}
              </Text>
              <View style={[styles.titleDot, { backgroundColor: C.primary }]} />
            </View>
            <Text style={[styles.heroDesc, { color: C.muted }]}>
              {gu ? pillar.descGu : pillar.descEn}
            </Text>

            {/* Stat chip */}
            <View style={[styles.statChip, { backgroundColor: C.surfCont }]}>
              <View style={[styles.statIcon, { backgroundColor: C.primary }]}>
                <Ionicons name="heart" size={14} color="#fff" />
              </View>
              <View>
                <Text style={[styles.statMain, { color: C.primary }]}>
                  {pillar.statEn}
                </Text>
                <Text style={[styles.statSub, { color: C.secondary }]}>
                  {pillar.statSub}
                </Text>
              </View>
            </View>
          </View>

          {/* Nav dots */}
          <View style={styles.navDots}>
            {PILLARS.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setActivePillar(i)}
                style={[
                  styles.navDot,
                  {
                    backgroundColor:
                      i === activePillar ? C.primary : C.surfHiest,
                    width: i === activePillar ? 28 : 10,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* ── Pillar tab list ── */}
        <Text style={[styles.pillarsLabel, { color: C.secondary }]}>
          {gu ? 'મુખ્ય સ્તંભો' : 'Explore Core Pillars'}
          <Text style={[styles.pillarsLabelSub, { color: C.muted }]}>
            {gu ? '' : '  •  Tap to preview'}
          </Text>
        </Text>

        <View style={styles.tabList}>
          {PILLARS.map((p, i) => {
            const active = i === activePillar;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => setActivePillar(i)}
                style={[
                  styles.tabItem,
                  {
                    backgroundColor: active ? C.white : `${C.white}99`,
                    elevation: active ? 3 : 1,
                  },
                ]}
                activeOpacity={0.8}
              >
                <View style={[styles.tabIcon, { backgroundColor: p.iconBg }]}>
                  <Ionicons name={p.iconName} size={22} color={p.iconColor} />
                </View>
                <View style={styles.tabTextWrap}>
                  <View style={styles.tabTitleRow}>
                    <Text
                      style={[styles.tabTitle, { color: C.onSurf }]}
                      numberOfLines={1}
                    >
                      {p.tabTitleEn}
                    </Text>
                    <View
                      style={[styles.tabDot, { backgroundColor: p.dotColor }]}
                    />
                  </View>
                  <Text
                    style={[styles.tabSub, { color: C.muted }]}
                    numberOfLines={1}
                  >
                    {p.tabSubEn}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={C.secondary}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Bottom actions ── */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: C.primary }]}
            onPress={onDone}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>
              {gu ? 'પ્રારંભ કરો' : 'Get Started / શરૂ કરો'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>

          <View style={styles.secondaryRow}>
            <TouchableOpacity
              style={[styles.secondaryBtn, { backgroundColor: C.surfCont }]}
            >
              <Ionicons name="people-outline" size={16} color={C.primary} />
              <Text style={[styles.secondaryBtnText, { color: C.onSurf }]}>
                {gu ? 'સેવક તરીકે જોડાઓ' : 'Join as Sevak'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, { backgroundColor: C.error }]}
            >
              <Ionicons name="alert-circle-outline" size={16} color="#fff" />
              <Text style={[styles.secondaryBtnText, { color: '#fff' }]}>
                {gu ? 'રક્ત SOS' : 'Blood SOS Call'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.trustRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={13}
              color={C.primary}
            />
            <Text style={[styles.trustText, { color: C.muted }]}>
              Regd. Public Charitable Trust • 256-Bit Encrypted Data Privacy
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 24, gap: 14 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  brandMini: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandLogoWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 18,
  },
  brandSub: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  langPill: { flexDirection: 'row', borderRadius: 99, padding: 2 },
  langBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  langTxt: { fontSize: 11 },
  skipText: { fontSize: 13, fontWeight: '600' },

  // Step bars
  stepBars: { flexDirection: 'row', gap: 6, height: 6 },
  stepBar: { flex: 1, borderRadius: 3 },

  // Hero card
  heroCard: {
    borderRadius: 16,
    padding: 14,
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  heroCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  pillarDot: { width: 8, height: 8, borderRadius: 4 },
  pillarBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  verifiedText: { fontSize: 10, fontWeight: '500' },

  // Hero visual
  heroVisual: {
    height: 160,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  heroIconMain: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeRow: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  heroBadgeText: { fontSize: 10, fontWeight: '600' },

  // Hero text
  heroText: { gap: 6 },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitleEn: { fontSize: 17, fontWeight: '700', flex: 1, lineHeight: 22 },
  titleDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 6 },
  heroDesc: { fontSize: 13, lineHeight: 18 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statMain: { fontSize: 13, fontWeight: '700' },
  statSub: { fontSize: 10, fontWeight: '500', marginTop: 1 },

  // Nav dots
  navDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 2,
  },
  navDot: { height: 8, borderRadius: 4 },

  // Tab list
  pillarsLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillarsLabelSub: { fontSize: 11, fontWeight: '400' },
  tabList: { gap: 8 },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  tabIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabTextWrap: { flex: 1 },
  tabTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabTitle: { fontSize: 13, fontWeight: '700', flex: 1 },
  tabDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 4 },
  tabSub: { fontSize: 11, marginTop: 2 },

  // Actions
  actions: { gap: 10, marginTop: 4 },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
  },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  secondaryRow: { flexDirection: 'row', gap: 8 },
  secondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    elevation: 1,
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '600' },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  trustText: { fontSize: 11, textAlign: 'center', flex: 1 },
});
