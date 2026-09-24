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
  Image,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { defaultApiClient } from '../../services/apiClient';

export interface HomeScreenProps {
  onSelectModule: (moduleKey: string) => void;
  onNavigateToWizard: (category?: string) => void;
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
  const { theme, helpline, brandName, logoUrl } = useAppTheme();
  const { colors, typography, borderRadius } = theme;
  const { locale, t } = useTranslation();
  const [howOpen, setHowOpen] = useState(1);

  const [searchCaseNo, setSearchCaseNo] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [tiles, setTiles] = useState<ServiceTile[]>(SERVICE_TILES);
  const [dbStats, setDbStats] = useState({
    total: 0,
    schemes: 0,
    resolved: 0,
  });

  const loadStats = useCallback(async () => {
    try {
      const [statsRes, tilesRes] = await Promise.all([
        defaultApiClient.get<any>('/config/stats'),
        defaultApiClient.get<any>(`/config/home-tiles?locale=${locale}`),
      ]);
      if (statsRes?.data) {
        setDbStats({
          total: statsRes.data.citizens_helped ?? 0,
          schemes: statsRes.data.villages_covered ?? 0,
          resolved: statsRes.data.resolved_cases ?? 0,
        });
      }
      if (Array.isArray(tilesRes?.data) && tilesRes.data.length > 0) {
        setTiles([
          SERVICE_TILES[0],
          ...tilesRes.data.map((row: any) => ({
            key: row.slug || row.key,
            titleEn: row.title_en || row.title,
            titleGu: row.title_gu || row.title,
            subtitleEn: row.subtitle_en || row.subtitle || '',
            subtitleGu: row.subtitle_gu || row.subtitle || '',
            icon: 'view-grid-outline',
            bgColor: (row.accent_color || '#B45309') + '22',
            iconColor: row.accent_color || '#B45309',
          })),
        ]);
      }
    } catch {
      // offline defaults preserved
    }
  }, [locale]);

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
    const digits = (helpline || '18002335500').replace(/[^\d]/g, '');
    Linking.openURL(`tel:${digits}`).catch(() => {});
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
      <View style={[styles.ngoHeader, { backgroundColor: colors.secondary }]}>
        <View
          style={[
            styles.blob,
            { backgroundColor: 'rgba(255,255,255,0.12)', top: -28, right: -20 },
          ]}
        />
        <View
          style={[
            styles.blob,
            { backgroundColor: 'rgba(0,0,0,0.08)', bottom: -36, left: -16 },
          ]}
        />
        <View style={styles.ngoBadgeRow}>
          <View
            style={[
              styles.trustTag,
              { backgroundColor: 'rgba(255,255,255,0.18)' },
            ]}
          >
            <Text style={styles.trustTagText}>
              {t('home.field_desk', 'Village field desk')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.helplineBadge}
            activeOpacity={0.8}
            onPress={handleCallHelpline}
          >
            <Ionicons name="call" size={13} color="#DC2626" />
            <Text style={styles.helplineText}>{helpline}</Text>
          </TouchableOpacity>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginBottom: 8,
          }}
        >
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.brandLogo} />
          ) : (
            <View
              style={[
                styles.brandLogoFallback,
                { backgroundColor: colors.primary },
              ]}
            />
          )}
          <Text
            style={[
              styles.ngoTitle,
              {
                color: '#FFFFFF',
                fontSize: typography.fontSizeLg,
                fontFamily: typography.fontFamilySerif,
                flex: 1,
              },
            ]}
          >
            {brandName ||
              (isGu ? 'Tribal Helping Hand' : 'Tribal Helping Hand')}
          </Text>
        </View>
        <Text
          style={[
            styles.ngoSubtitle,
            {
              color: 'rgba(255,255,255,0.88)',
              fontSize: typography.fontSizeSm,
            },
          ]}
        >
          {t(
            'home.hero_long',
            'Sit with a coordinator, apply from a phone, and keep the same case number from the first visit to the last follow-up.',
          )}
        </Text>
      </View>

      <View style={styles.heroSection}>
        <Text
          style={[
            styles.heroMainTitle,
            { color: colors.text, fontSize: typography.fontSizeXl },
          ]}
        >
          {t('home.need_help_q', 'What do you need help with?')}
        </Text>
        <Text
          style={[
            styles.heroSubTitle,
            { color: colors.textMuted, fontSize: typography.fontSizeSm },
          ]}
        >
          {t(
            'home.services_intro',
            'These are live desks, not brochure tiles. Open a card to read who it is for, which papers help, and to send an application.',
          )}
        </Text>

        {/* Quick Action Banners: Village Problem Pin & Direct Help */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onSelectModule('village_reports')}
            style={{
              flex: 1,
              backgroundColor: '#EA580C',
              borderRadius: borderRadius.lg,
              padding: 14,
              shadowColor: '#EA580C',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}
            >
              <Ionicons name="location" size={20} color="#FFFFFF" />
              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800' }}
                >
                  GPS PIN
                </Text>
              </View>
            </View>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: typography.fontSizeBase,
                fontWeight: '800',
              }}
            >
              ગામ પ્રશ્ન Pin
            </Text>
            <Text
              style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: 11,
                marginTop: 2,
              }}
            >
              Report Village Issue with Live Location Pin
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onNavigateToWizard()}
            style={{
              flex: 1,
              backgroundColor: colors.primary,
              borderRadius: borderRadius.lg,
              padding: 14,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}
            >
              <MaterialCommunityIcons
                name="hand-heart"
                size={20}
                color="#FFFFFF"
              />
              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800' }}
                >
                  ASSIST
                </Text>
              </View>
            </View>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: typography.fontSizeBase,
                fontWeight: '800',
              }}
            >
              મદદ મેળવો
            </Text>
            <Text
              style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: 11,
                marginTop: 2,
              }}
            >
              Apply for Emergency Citizen Aid
            </Text>
          </TouchableOpacity>
        </View>

        {/* LIVE GPS LOCATION & VILLAGE PIN CARD (From Stitch Design) */}
        <View
          style={{
            marginTop: 16,
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <View
                style={{
                  backgroundColor: 'rgba(217,119,6,0.15)',
                  padding: 6,
                  borderRadius: 10,
                }}
              >
                <Ionicons name="location" size={18} color={colors.primary} />
              </View>
              <Text
                style={{
                  fontSize: typography.fontSizeBase,
                  fontWeight: '800',
                  color: colors.text,
                }}
              >
                {t('home.live_gps_pin', 'Live GPS Village Pin')}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: '#DCFCE7',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 999,
              }}
            >
              <Text
                style={{ color: '#166534', fontSize: 10, fontWeight: '800' }}
              >
                ● ACTIVE GPS
              </Text>
            </View>
          </View>

          {/* Category Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, marginBottom: 12 }}
          >
            {[
              {
                key: 'water',
                label: '💧 Water',
                color: '#0284C7',
                bg: '#E0F2FE',
              },
              {
                key: 'road',
                label: '🛣️ Road',
                color: '#D97706',
                bg: '#FEF3C7',
              },
              {
                key: 'electric',
                label: '⚡ Power',
                color: '#EAB308',
                bg: '#FEF9C3',
              },
              {
                key: 'health',
                label: '🏥 Health',
                color: '#DC2626',
                bg: '#FEE2E2',
              },
              {
                key: 'school',
                label: '🏫 School',
                color: '#7C3AED',
                bg: '#EDE9FE',
              },
            ].map(cat => (
              <TouchableOpacity
                key={cat.key}
                activeOpacity={0.7}
                onPress={() => onSelectModule('village_reports')}
                style={{
                  backgroundColor: cat.bg,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: cat.color + '40',
                }}
              >
                <Text
                  style={{ color: cat.color, fontSize: 11, fontWeight: '700' }}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Map Preview Box */}
          <View
            style={{
              backgroundColor: '#0F291E',
              borderRadius: 14,
              padding: 14,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text
                  style={{
                    color: '#FCD34D',
                    fontSize: 10,
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Dang District Center
                </Text>
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: '800',
                    fontFamily: 'monospace',
                    marginTop: 2,
                  }}
                >
                  📍 20.7532° N, 73.6841° E
                </Text>
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 11,
                    marginTop: 2,
                  }}
                >
                  Ahwa, South Gujarat Tribal Belt
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  Linking.openURL(
                    'https://www.google.com/maps?q=20.7532,73.6841',
                  )
                }
                style={{
                  backgroundColor: '#16A34A',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 10,
                  shadowColor: '#16A34A',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text
                  style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}
                >
                  🗺️ View Map
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* CTA Link to Report */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onSelectModule('village_reports')}
            style={{
              marginTop: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 6,
              gap: 4,
            }}
          >
            <Text
              style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}
            >
              {t(
                'home.open_village_desk',
                'Report Village Problem at Current Coordinates',
              )}{' '}
              →
            </Text>
          </TouchableOpacity>
        </View>

        {/* ACTIVE CASE TRACKER STEPPER CARD */}
        <View
          style={{
            marginTop: 14,
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <MaterialCommunityIcons
                name="timeline-clock"
                size={18}
                color={colors.primary}
              />
              <Text
                style={{
                  fontSize: typography.fontSizeBase,
                  fontWeight: '800',
                  color: colors.text,
                }}
              >
                {t('home.active_tracker_title', 'Application Progress Tracker')}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: 'rgba(217,119,6,0.12)',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 999,
              }}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 10,
                  fontWeight: '800',
                }}
              >
                SLA 48H
              </Text>
            </View>
          </View>

          {/* 4-Stage Stepper */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginVertical: 8,
            }}
          >
            {[
              { num: '1', title: 'Submitted', done: true },
              { num: '2', title: 'Verified', done: true },
              { num: '3', title: 'Action', active: true },
              { num: '4', title: 'Resolved', done: false },
            ].map((step, idx) => (
              <React.Fragment key={step.num}>
                <View style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: step.done
                        ? '#16A34A'
                        : step.active
                        ? '#D97706'
                        : colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {step.done ? (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    ) : (
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontSize: 11,
                          fontWeight: '800',
                        }}
                      >
                        {step.num}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: step.active ? '800' : '600',
                      color: step.active ? colors.primary : colors.textMuted,
                      marginTop: 4,
                    }}
                  >
                    {step.title}
                  </Text>
                </View>
                {idx < 3 && (
                  <View
                    style={{
                      flex: 1,
                      height: 2,
                      backgroundColor:
                        idx === 0
                          ? '#16A34A'
                          : idx === 1
                          ? '#D97706'
                          : colors.border,
                      marginHorizontal: 4,
                      marginBottom: 14,
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* Search box for tracking specific case */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <TextInput
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                fontSize: 12,
                fontFamily: 'monospace',
                color: colors.text,
                backgroundColor: colors.background,
              }}
              placeholder="e.g. THH-2026-00001"
              placeholderTextColor={colors.textMuted}
              value={searchCaseNo}
              onChangeText={setSearchCaseNo}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleTrackSearch}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 8,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '800' }}
              >
                {t('home.track_btn', 'Track')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            color: colors.primary,
            fontSize: 11,
            fontWeight: '800',
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          {t('home.how_kicker', 'How the desk works')}
        </Text>
        {[
          {
            n: 1,
            title: t('home.how_1_title', 'Choose the desk'),
            body: t(
              'home.how_1_body',
              'Open the service that matches the village need.',
            ),
          },
          {
            n: 2,
            title: t('home.how_2_title', 'Tell us who to call'),
            body: t(
              'home.how_2_body',
              'Give a name, mobile and email so the same case can be followed.',
            ),
          },
          {
            n: 3,
            title: t('home.how_3_title', 'Follow the same case'),
            body: t(
              'home.how_3_body',
              'Keep the case number. Track it with login or an email OTP.',
            ),
          },
        ].map(step => {
          const open = howOpen === step.n;
          return (
            <TouchableOpacity
              key={step.n}
              activeOpacity={0.85}
              onPress={() => setHowOpen(step.n)}
              style={{
                backgroundColor: open ? colors.secondary : colors.surface,
                borderColor: open ? colors.secondary : colors.border,
                borderWidth: 1,
                borderRadius: 22,
                padding: 14,
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  color: open ? '#FFFFFF' : colors.text,
                  fontWeight: '800',
                  fontSize: typography.fontSizeBase,
                }}
              >
                {step.n}. {step.title}
              </Text>
              <Text
                style={{
                  color: open ? 'rgba(255,255,255,0.88)' : colors.textMuted,
                  marginTop: 6,
                  lineHeight: 20,
                  fontSize: typography.fontSizeSm,
                }}
              >
                {step.body}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 12 Services Grid - PDF Page 7 */}
      <View style={styles.gridContainer}>
        {tiles.map(tile => {
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
                numberOfLines={2}
              >
                {title}
              </Text>

              <Text
                style={[
                  styles.tileSubtitle,
                  { color: colors.textMuted, fontSize: typography.fontSizeXs },
                ]}
                numberOfLines={4}
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
          {t(
            'home.track_guest_long',
            'Enter your case number. Log in, or send an OTP to the application email.',
          )}
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
    padding: 16,
    marginBottom: 16,
    position: 'relative',
  },
  blob: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  brandLogoFallback: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
    marginBottom: 16,
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
    marginTop: 8,
    lineHeight: 22,
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
    padding: 14,
    minHeight: 178,
    justifyContent: 'space-between',
    borderRadius: 22,
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
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
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
    borderRadius: 24,
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
