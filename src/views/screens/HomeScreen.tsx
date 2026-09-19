import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Linking,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { defaultApiClient } from '../../services/apiClient';

export interface HomeScreenProps {
  onSelectModule: (moduleKey: string) => void;
  onNavigateToWizard: () => void;
  onNavigateToCase?: (caseNo: string) => void;
}

interface ServiceTile {
  key: string;
  titleEn: string;
  titleGu: string;
  subtitleEn: string;
  subtitleGu: string;
  icon: string;
  bgColor: string;
  iconColor: string;
  badge?: string;
  badgeGu?: string;
  isHelpWizard?: boolean;
}

const SERVICE_TILES: ServiceTile[] = [
  {
    key: 'wizard',
    titleEn: 'I Need Help',
    titleGu: 'મદદ જોઈએ છે',
    subtitleEn: 'Submit an emergency assistance request',
    subtitleGu: 'ત્વરિત મદદ માટે અરજી કરો',
    icon: 'hand-heart',
    bgColor: '#FFE4E6',
    iconColor: '#E11D48',
    badge: 'Direct Aid',
    badgeGu: 'મુખ્ય સહાય',
    isHelpWizard: true,
  },
  {
    key: 'education',
    titleEn: 'Education',
    titleGu: 'શિક્ષણ સહાય',
    subtitleEn: 'Libraries, coaching & study guidance',
    subtitleGu: 'પુસ્તકાલયો, કોચિંગ અને પુસ્તકો',
    icon: 'school',
    bgColor: '#DBEAFE',
    iconColor: '#2563EB',
    badge: 'Books & Tests',
    badgeGu: 'પુસ્તકો/પરીક્ષા',
  },
  {
    key: 'jobs',
    titleEn: 'Job Opportunities',
    titleGu: 'નોકરી અને રોજગાર',
    subtitleEn: 'Verified tribal vacancies & training',
    subtitleGu: 'સરકારી અને ખાનગી ભરતી માર્ગદર્શન',
    icon: 'briefcase-outline',
    bgColor: '#D1FAE5',
    iconColor: '#059669',
    badge: 'Openings',
    badgeGu: 'નવી ભરતી',
  },
  {
    key: 'scholarships',
    titleEn: 'Scholarships',
    titleGu: 'શિષ્યવૃત્તિ યોજના',
    subtitleEn: 'Post-Matric, ITI & college grants',
    subtitleGu: 'પોસ્ટ-મેટ્રિક અને ઉચ્ચ શિક્ષણ સહાય',
    icon: 'cash-multiple',
    bgColor: '#FEF3C7',
    iconColor: '#D97706',
    badge: 'Grants',
    badgeGu: 'સહાય ગ્રાન્ટ',
  },
  {
    key: 'schemes',
    titleEn: 'Govt. Schemes',
    titleGu: 'સરકારી યોજનાઓ',
    subtitleEn: 'Awas, Solar pump & Forest Rights',
    subtitleGu: 'આવાસ, સોલાર પંપ અને જંગલ હક્ક',
    icon: 'bank',
    bgColor: '#EDE9FE',
    iconColor: '#7C3AED',
    badge: 'Welfare',
    badgeGu: 'જનકલ્યાણ',
  },
  {
    key: 'health',
    titleEn: 'Health & Blood',
    titleGu: 'આરોગ્ય અને રક્તદાન',
    subtitleEn: 'Free medical camps & blood donor bank',
    subtitleGu: 'મફત નિદાન કેમ્પ અને રક્ત સહાય',
    icon: 'heart-pulse',
    bgColor: '#FEE2E2',
    iconColor: '#DC2626',
    badge: '24x7 SOS',
    badgeGu: 'ઇમરજન્સી',
  },
  {
    key: 'sakhi',
    titleEn: 'Women Support',
    titleGu: 'સખી મંડળ સહાય',
    subtitleEn: 'Self-Help Groups & micro-enterprise',
    subtitleGu: 'મહિલા સશક્તિકરણ અને ગૃહઉદ્યોગ',
    icon: 'account-group-outline',
    bgColor: '#FCE7F3',
    iconColor: '#DB2777',
    badge: 'Sakhi Circles',
    badgeGu: 'સખી મંડળ',
  },
  {
    key: 'entrepreneurship',
    titleEn: 'Tribal Business',
    titleGu: 'આદિવાસી વ્યવસાય',
    subtitleEn: 'TribePreneur grants & agri subsidies',
    subtitleGu: 'ઉદ્યોગસાહસિક અને કૃષિ લોન',
    icon: 'storefront-outline',
    bgColor: '#CCFBF1',
    iconColor: '#0D9488',
    badge: 'TribePreneur',
    badgeGu: 'સ્ટાર્ટઅપ',
  },
  {
    key: 'legal',
    titleEn: 'Legal Guidance',
    titleGu: 'કાનૂની માર્ગદર્શન',
    subtitleEn: 'Forest land rights & rights education',
    subtitleGu: 'જમીન અધિકાર અને કાનૂની સલાહ',
    icon: 'scale-balance',
    bgColor: '#F1F5F9',
    iconColor: '#475569',
    badge: 'Rights',
    badgeGu: 'અધિકાર રક્ષણ',
  },
  {
    key: 'competitive_exams',
    titleEn: 'Exam Preparation',
    titleGu: 'સ્પર્ધાત્મક પરીક્ષા',
    subtitleEn: 'GPSC, Talati & Police mock tests',
    subtitleGu: 'જીપીએસસી અને પોલીસ કોન્સ્ટેબલ તૈયારી',
    icon: 'notebook-check-outline',
    bgColor: '#E0E7FF',
    iconColor: '#4F46E5',
    badge: 'Mock Tests',
    badgeGu: 'મોક ટેસ્ટ',
  },
  {
    key: 'village_reports',
    titleEn: 'Village Problem',
    titleGu: 'ગામ પ્રશ્નો અને ફરિયાદ',
    subtitleEn: 'Report water, road & power faults',
    subtitleGu: 'પીવાનું પાણી, રસ્તા અને વીજળી ફરિયાદ',
    icon: 'home-alert-outline',
    bgColor: '#FFEDD5',
    iconColor: '#EA580C',
    badge: 'Report Issue',
    badgeGu: 'ફરિયાદ નોંધાવો',
  },
  {
    key: 'volunteer',
    titleEn: 'Volunteer Network',
    titleGu: 'સ્વયંસેવક જોડાઓ',
    subtitleEn: 'Join GGVT Helping Hand grassroots team',
    subtitleGu: 'ગ્લોબલ ગ્રામીણ વિકાસ ટ્રસ્ટ સાથે જોડાઓ',
    icon: 'hand-heart-outline',
    bgColor: '#E0F2FE',
    iconColor: '#0284C7',
    badge: 'Join Us',
    badgeGu: 'સાથે મળીએ',
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectModule,
  onNavigateToWizard,
  onNavigateToCase,
}) => {
  const { theme } = useAppTheme();
  const { colors, typography, borderRadius } = theme;
  const { locale } = useTranslation();

  const [searchCaseNo, setSearchCaseNo] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [dbStats, setDbStats] = useState({
    total: 35,
    schemes: 18,
    resolved: 14,
  });

  const loadStats = useCallback(async () => {
    try {
      const res = await defaultApiClient.get<any>('/dashboard');
      if (res?.data?.stats) {
        setDbStats({
          total: res.data.stats.total ?? 35,
          schemes: res.data.stats.schemes ?? 18,
          resolved: res.data.stats.resolved ?? 14,
        });
      }
    } catch {
      // offline defaults preserved
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const handleTrackSearch = () => {
    if (searchCaseNo.trim() && onNavigateToCase) {
      onNavigateToCase(searchCaseNo.trim());
    }
  };

  const handleCallHelpline = () => {
    Linking.openURL('tel:18002335500').catch(() => {});
  };

  const isGu = locale === 'gu';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* Top NGO Trust Header */}
      <View
        style={[
          styles.ngoHeader,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: borderRadius.lg,
          },
        ]}
      >
        <View style={styles.ngoBadgeRow}>
          <View style={[styles.trustTag, { backgroundColor: colors.primary }]}>
            <Text style={styles.trustTagText}>GGVT TRUST</Text>
          </View>
          <TouchableOpacity
            style={styles.helplineBadge}
            activeOpacity={0.8}
            onPress={handleCallHelpline}
          >
            <Ionicons name="call" size={13} color="#DC2626" />
            <Text style={styles.helplineText}>1800-233-5500 (Toll Free)</Text>
          </TouchableOpacity>
        </View>

        <Text
          style={[
            styles.ngoTitle,
            { color: colors.text, fontSize: typography.fontSizeLg },
          ]}
        >
          {isGu
            ? 'ગ્લોબલ ગ્રામીણ વિકાસ ટ્રસ્ટ (GGVT)'
            : 'Global Gramin Vikas Trust (GGVT)'}
        </Text>
        <Text
          style={[
            styles.ngoSubtitle,
            { color: colors.textMuted, fontSize: typography.fontSizeXs },
          ]}
        >
          {isGu
            ? 'આદિવાસી વિસ્તાર ઉત્થાન, શિક્ષણ અને સરકારી યોજના સહાય મંચ'
            : 'Dedicated tribal empowerment, welfare schemes and direct grassroots assistance.'}
        </Text>
      </View>

      {/* Hero "What do you need help with?" Title - As per PDF Page 7 */}
      <View style={styles.heroSection}>
        <View style={styles.heroTitleRow}>
          <View
            style={[
              styles.accentIndicator,
              { backgroundColor: colors.primary },
            ]}
          />
          <View>
            <Text
              style={[
                styles.heroMainTitle,
                { color: colors.text, fontSize: typography.fontSizeXl },
              ]}
            >
              {isGu ? 'તમને શેમાં મદદ જોઈએ છે?' : 'What do you need help with?'}
            </Text>
            <Text
              style={[
                styles.heroSubTitle,
                { color: colors.textMuted, fontSize: typography.fontSizeSm },
              ]}
            >
              {isGu
                ? 'નીચેની ૧૨ મુખ્ય સેવાઓમાંથી યોગ્ય કેટેગરી પસંદ કરો'
                : 'Select from 12 dedicated tribal support categories'}
            </Text>
          </View>
        </View>
      </View>

      {/* 12 Services Grid - PDF Page 7 */}
      <View style={styles.gridContainer}>
        {SERVICE_TILES.map(tile => {
          const title = isGu ? tile.titleGu : tile.titleEn;
          const subtitle = isGu ? tile.subtitleGu : tile.subtitleEn;
          const badge = isGu ? tile.badgeGu : tile.badge;

          return (
            <TouchableOpacity
              key={tile.key}
              activeOpacity={0.7}
              onPress={() => {
                if (tile.isHelpWizard) {
                  onNavigateToWizard();
                } else {
                  onSelectModule(tile.key);
                }
              }}
              style={[
                styles.tileCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                },
                tile.isHelpWizard && {
                  borderColor: '#E11D48',
                  borderWidth: 1.5,
                },
              ]}
            >
              <View style={styles.tileHeader}>
                <View
                  style={[styles.iconCircle, { backgroundColor: tile.bgColor }]}
                >
                  <MaterialCommunityIcons
                    name={tile.icon}
                    size={26}
                    color={tile.iconColor}
                  />
                </View>
                {badge && (
                  <View
                    style={[
                      styles.tileBadge,
                      {
                        backgroundColor: tile.isHelpWizard
                          ? '#E11D48'
                          : colors.surfaceSubtle,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tileBadgeText,
                        {
                          color: tile.isHelpWizard
                            ? '#FFFFFF'
                            : colors.textMuted,
                        },
                      ]}
                    >
                      {badge}
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={[
                  styles.tileTitle,
                  { color: colors.text, fontSize: typography.fontSizeBase },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>

              <Text
                style={[
                  styles.tileSubtitle,
                  { color: colors.textMuted, fontSize: typography.fontSizeXs },
                ]}
                numberOfLines={2}
              >
                {subtitle}
              </Text>

              <View style={styles.tileFooter}>
                <Text
                  style={[
                    styles.viewMoreText,
                    { color: tile.iconColor, fontSize: typography.fontSizeXs },
                  ]}
                >
                  {isGu ? 'વિગતો જુઓ' : 'Explore'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={tile.iconColor}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Case Tracker Search Box */}
      <View
        style={[
          styles.trackCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: borderRadius.lg,
          },
        ]}
      >
        <View style={styles.trackHeader}>
          <MaterialCommunityIcons
            name="file-search-outline"
            size={22}
            color={colors.primary}
          />
          <Text
            style={[
              styles.trackTitle,
              { color: colors.text, fontSize: typography.fontSizeBase },
            ]}
          >
            {isGu ? 'તમારી અરજીનું સ્ટેટસ તપાસો' : 'Track Application Status'}
          </Text>
        </View>
        <Text
          style={[
            styles.trackDesc,
            { color: colors.textMuted, fontSize: typography.fontSizeXs },
          ]}
        >
          {isGu
            ? 'કેસ નંબર દાખલ કરો (દા.ત. THH-2026-0001)'
            : 'Enter your THH Case Number to verify live progress'}
        </Text>

        <View style={styles.trackInputRow}>
          <TextInput
            style={[
              styles.trackInput,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
                borderRadius: borderRadius.sm,
              },
            ]}
            placeholder={
              isGu
                ? 'કેસ નંબર (દા.ત. THH-2026-0001)'
                : 'Case No. (e.g. THH-2026-0001)'
            }
            placeholderTextColor={colors.textMuted}
            value={searchCaseNo}
            onChangeText={setSearchCaseNo}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={[
              styles.trackBtn,
              {
                backgroundColor: colors.primary,
                borderRadius: borderRadius.sm,
              },
            ]}
            activeOpacity={0.8}
            onPress={handleTrackSearch}
          >
            <Text style={styles.trackBtnText}>{isGu ? 'શોધો' : 'Track'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Live Impact Stats Summary */}
      <View
        style={[
          styles.statsBanner,
          {
            backgroundColor: colors.surfaceSubtle,
            borderColor: colors.border,
            borderRadius: borderRadius.md,
          },
        ]}
      >
        <View style={styles.statCol}>
          <Text
            style={[
              styles.statNum,
              { color: colors.primary, fontSize: typography.fontSizeLg },
            ]}
          >
            {dbStats.total}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>
            {isGu ? 'કુલ કેસો' : 'Total Cases'}
          </Text>
        </View>
        <View
          style={[styles.statDivider, { backgroundColor: colors.border }]}
        />
        <View style={styles.statCol}>
          <Text
            style={[
              styles.statNum,
              { color: '#16A34A', fontSize: typography.fontSizeLg },
            ]}
          >
            {dbStats.schemes}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>
            {isGu ? 'સક્રિય યોજનાઓ' : 'Active Schemes'}
          </Text>
        </View>
        <View
          style={[styles.statDivider, { backgroundColor: colors.border }]}
        />
        <View style={styles.statCol}>
          <Text
            style={[
              styles.statNum,
              { color: '#2563EB', fontSize: typography.fontSizeLg },
            ]}
          >
            {dbStats.resolved}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>
            {isGu ? 'સફળ સહાય' : 'Resolved'}
          </Text>
        </View>
      </View>

      {/* Emergency Hotline Quick Strip */}
      <View style={styles.emergencyStrip}>
        <Text style={[styles.emergencyHeading, { color: colors.textMuted }]}>
          {isGu ? 'ઇમરજન્સી હેલ્પલાઇન નંબર્સ' : 'Emergency Assistance Helpline'}
        </Text>
        <View style={styles.emergencyRow}>
          <TouchableOpacity
            style={[styles.emergencyPill, { backgroundColor: '#FEE2E2' }]}
            onPress={() => Linking.openURL('tel:108')}
          >
            <Ionicons name="medical" size={13} color="#DC2626" />
            <Text style={[styles.emergencyText, { color: '#DC2626' }]}>
              108 Ambulance
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.emergencyPill, { backgroundColor: '#DBEAFE' }]}
            onPress={() => Linking.openURL('tel:100')}
          >
            <Ionicons name="shield" size={13} color="#2563EB" />
            <Text style={[styles.emergencyText, { color: '#2563EB' }]}>
              100 Police
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.emergencyPill, { backgroundColor: '#FEF3C7' }]}
            onPress={() => Linking.openURL('tel:181')}
          >
            <Ionicons name="woman" size={13} color="#D97706" />
            <Text style={[styles.emergencyText, { color: '#D97706' }]}>
              181 Abhayam
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 14,
    paddingBottom: 32,
  },
  ngoHeader: {
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  ngoBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trustTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  trustTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  helplineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  helplineText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '700',
  },
  ngoTitle: {
    fontWeight: '800',
    marginBottom: 3,
  },
  ngoSubtitle: {
    lineHeight: 17,
  },
  heroSection: {
    marginBottom: 14,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accentIndicator: {
    width: 4,
    height: 38,
    borderRadius: 2,
  },
  heroMainTitle: {
    fontWeight: '900',
  },
  heroSubTitle: {
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  tileCard: {
    width: '48.5%',
    borderWidth: 1,
    padding: 12,
    minHeight: 145,
    justifyContent: 'space-between',
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tileBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  tileTitle: {
    fontWeight: '800',
    marginBottom: 2,
  },
  tileSubtitle: {
    lineHeight: 15,
    marginBottom: 8,
  },
  tileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  viewMoreText: {
    fontWeight: '700',
  },
  trackCard: {
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  trackTitle: {
    fontWeight: '800',
  },
  trackDesc: {
    marginBottom: 10,
  },
  trackInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  trackInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  trackBtn: {
    paddingHorizontal: 18,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  statsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statNum: {
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 26,
  },
  emergencyStrip: {
    marginBottom: 12,
  },
  emergencyHeading: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  emergencyRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  emergencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  emergencyText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
