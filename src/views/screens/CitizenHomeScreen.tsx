import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { CanopyHeader } from '../components/CanopyHeader';
import { applicationService } from '../../services/applicationService';
import { configService } from '../../services/configService';
import { Application } from '../../models/application.model';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { ArchedTimelineDial } from '../components/ArchedTimelineDial';

interface SectorItem {
  key?: string;
  slug: string;
  title: string;
  title_en?: string;
  title_gu?: string;
  subtitle?: string;
  subtitle_en?: string;
  subtitle_gu?: string;
  icon?: string;
  accent_color?: string;
  count?: number;
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
  smile: 'happy-outline',
  coins: 'cash-outline',
  bike: 'bicycle-outline',
  ambulance: 'medkit-outline',
  navigation: 'navigate-outline',
  lightbulb: 'bulb-outline',
  award: 'shield-checkmark-outline',
  search: 'search-outline',
  shield: 'shield-outline',
  book: 'book-outline',
  trees: 'leaf-outline',
};

const SLUG_COLORS: Array<{ keywords: string[]; color: string }> = [
  { keywords: ['scheme', 'yojana', 'government'], color: '#059669' },
  { keywords: ['scholarship', 'vidhyarthi'], color: '#4F46E5' },
  { keywords: ['job', 'employment', 'rojgar', 'livelihood'], color: '#0284C7' },
  {
    keywords: ['education', 'shikshan', 'library', 'mock', 'book'],
    color: '#D97706',
  },
  { keywords: ['blood', 'raktdan', 'emergency'], color: '#DC2626' },
  { keywords: ['health', 'aarogya', 'camp', 'medical'], color: '#E11D48' },
  {
    keywords: ['forest', 'kisan', 'krushi', 'agri', 'tree', 'sprout'],
    color: '#16A34A',
  },
  { keywords: ['legal', 'justice', 'scale', 'law'], color: '#7C3AED' },
  {
    keywords: ['infra', 'building', 'water', 'road', 'sanitation'],
    color: '#0369A1',
  },
  { keywords: ['sakhi', 'women'], color: '#DB2777' },
];

const resolveIconName = (backendIcon?: string): string => {
  if (!backendIcon) return 'grid-outline';
  if (LUCIDE_TO_IONICONS[backendIcon]) return LUCIDE_TO_IONICONS[backendIcon];
  if (backendIcon.includes('-')) return backendIcon;
  return 'grid-outline';
};

const resolveColor = (slug: string, backendAccent?: string): string => {
  if (
    backendAccent &&
    backendAccent !== '#000000' &&
    backendAccent !== '#ffffff'
  ) {
    return backendAccent;
  }
  const s = slug.toLowerCase();
  for (const entry of SLUG_COLORS) {
    if (entry.keywords.some(k => s.includes(k))) return entry.color;
  }
  return '#2D6A4F';
};

const DEFAULT_SECTOR_CARDS: SectorItem[] = [
  {
    slug: 'schemes',
    title: 'Government Schemes',
    title_gu: 'આવાસ અને સરકારી યોજના',
    icon: 'building-2',
  },
  {
    slug: 'health',
    title: 'Health & Medical Aid',
    title_gu: 'આરોગ્ય સારવાર અને કેમ્પ',
    icon: 'heart-pulse',
  },
  {
    slug: 'education',
    title: 'Education & Kits',
    title_gu: 'શિક્ષણ અને સ્કોલરશીપ',
    icon: 'graduation-cap',
  },
  {
    slug: 'farmers',
    title: 'Farmer & Krishi Seva',
    title_gu: 'ખેડૂત સાધન અને બિયારણ',
    icon: 'sprout',
  },
  {
    slug: 'village_problem',
    title: 'Village Problem GPS Pin',
    title_gu: 'ગામ પ્રશ્ન લાઇવ પીન',
    icon: 'map-pin',
  },
  {
    slug: 'livelihood',
    title: 'Women Sakhi Mandal',
    title_gu: 'સખી મંડળ સ્વરોજગાર',
    icon: 'users',
  },
];

export const CitizenHomeScreen: React.FC<{
  onOpenRequest: (app: Application) => void;
  onOpenSector: (slug: string, title: string) => void;
  onOpenSectors: () => void;
}> = ({ onOpenRequest, onOpenSector, onOpenSectors }) => {
  const { theme } = useAppTheme();
  const { colors, typography } = theme;
  const { locale, language } = useTranslation();
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [sectors, setSectors] = useState<SectorItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [list, tiles] = await Promise.all([
      applicationService.getMyApplications(),
      configService.getModules(locale),
    ]);
    setApps(list);
    if (Array.isArray(tiles) && tiles.length > 0) {
      setSectors(tiles as SectorItem[]);
    }
  }, [locale]);

  useEffect(() => {
    applicationService.getCachedApplications().then(cached => {
      if (cached && cached.length > 0) {
        setApps(cached);
      }
    });
    load();
  }, [load]);

  const latest = apps[0];
  const others = apps.slice(1, 4);

  // const handleSosRakt = () => {
  //   Alert.alert(
  //     language === 'gu' ? '🚨 તાત્કાલિક રક્ત સહાય' : '🚨 Emergency Blood SOS',
  //     language === 'gu'
  //       ? 'તાત્કાલિક રક્તની જરૂર છે? અમારી ૨૪/૭ નવસારી રક્ત સહાય હેલ્પલાઇન કાર્યરત છે.'
  //       : 'Need emergency blood? Our 24/7 blood coordination helpline is active.',
  //     [
  //       { text: language === 'gu' ? 'રદ કરો' : 'Cancel', style: 'cancel' },
  //       {
  //         text: language === 'gu' ? 'હેલ્પલાઇન કોલ કરો' : 'Call Helpline',
  //         onPress: () => Linking.openURL(`tel:${helpline || '18002335500'}`),
  //       },
  //     ],
  //   );
  // };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <CanopyHeader />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            colors={[colors.primary]}
          />
        }
      >
        {/* Top Greeting & Emergency Quick Banner */}
        <View style={styles.topGreetingRow}>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.greetingMain,
                { color: colors.text, fontFamily: typography.fontFamilySans },
              ]}
            >
              {language === 'gu'
                ? `નમસ્તે, ${user?.first_name || user?.name || 'નાગરિક'} 🙏`
                : `Namaste, ${user?.first_name || user?.name || 'Citizen'} 🙏`}
            </Text>
            <View style={styles.greetingSubRow}>
              <Ionicons name="location" size={13} color={colors.primary} />
              <Text style={[styles.greetingLoc, { color: colors.secondary }]}>
                {language === 'gu' ? 'નવસારી, ગુજરાત' : 'Navsari, Gujarat'}
              </Text>
            </View>
          </View>
        </View>

        {/* Community Tree Canopy Philosophy Card */}
        <View
          style={[styles.canopyCard, { backgroundColor: colors.surfaceSubtle }]}
        >
          <View
            style={[styles.canopyIconWrap, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="leaf" size={20} color={colors.textInverse} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.canopyTitle, { color: colors.text }]}>
              {language === 'gu'
                ? 'સહયોગ અને સેવા ભાવ'
                : 'Living Canopy Community Seva'}
            </Text>
            <Text style={[styles.canopyDesc, { color: colors.textMuted }]}>
              {language === 'gu'
                ? 'આ મહિને THH છત્રછાયા હેઠળ ૪૨ ગ્રામીણ કલ્યાણ પ્રોજેક્ટ કાર્યરત છે.'
                : '42 village welfare projects active this month under the THH canopy.'}
            </Text>
          </View>
        </View>

        {/* Prominent Active Request Timeline Card */}
        {latest ? (
          <View
            style={[
              styles.activeCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
                shadowColor: colors.primary,
              },
            ]}
          >
            {/* Card Header */}
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.kickerRow}>
                  <View
                    style={[
                      styles.activeDot,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                  <Text style={[styles.kickerText, { color: colors.primary }]}>
                    {language === 'gu'
                      ? 'તાજેતરની સક્રિય અરજી'
                      : 'LATEST ACTIVE REQUEST'}
                  </Text>
                </View>
                <Text
                  style={[styles.caseTitle, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {latest.title}
                </Text>
                <Text style={[styles.caseNo, { color: colors.secondary }]}>
                  {latest.category?.name_en || 'Welfare'} • #{latest.case_no}
                </Text>
              </View>
              <StatusBadge status={latest.status} />
            </View>

            {/* Dynamic Slidable Timeline Stepper */}
            <ArchedTimelineDial
              status={latest.status}
              stages={latest.workflow_stages}
              language={language}
              assigneeName={latest.current_assignee?.name}
            />

            {/* Field Officer Contact Strip (Dynamic: shown if assigned) */}
            {latest.current_assignee ? (
              <View
                style={[
                  styles.officerStrip,
                  { backgroundColor: colors.surfaceSubtle },
                ]}
              >
                <View
                  style={[
                    styles.officerIconWrap,
                    { backgroundColor: colors.primaryContainer },
                  ]}
                >
                  <Ionicons name="person" size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.officerName, { color: colors.text }]}>
                    {latest.current_assignee.name}
                  </Text>
                  <Text
                    style={[styles.officerHint, { color: colors.textMuted }]}
                  >
                    {latest.current_assignee.role ||
                      (language === 'gu'
                        ? 'ક્ષેત્ર સેવક • સહાય કામગીરી'
                        : 'Field Mentor • Assigned')}
                  </Text>
                </View>
                {latest.current_assignee.phone ? (
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(`tel:${latest.current_assignee?.phone}`)
                    }
                    style={[
                      styles.callBtn,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <Ionicons name="call" size={16} color={colors.primary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            {/* Deep Action Link */}
            <TouchableOpacity
              onPress={() => onOpenRequest(latest)}
              style={[
                styles.deepActionBtn,
                { backgroundColor: colors.surfaceSubtle },
              ]}
            >
              <Text style={[styles.deepActionText, { color: colors.primary }]}>
                {language === 'gu'
                  ? 'વિગતવાર સમયરેખા અને નોંધ જુઓ'
                  : 'View Detailed Timeline & Notes'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Ionicons
              name="document-text-outline"
              size={32}
              color={colors.primary}
            />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              {language === 'gu'
                ? 'કોઈ સક્રિય અરજી નથી'
                : 'No Active Applications'}
            </Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              {language === 'gu'
                ? 'તાત્કાલિક સહાય મેળવવા માટે નીચે આપેલ કોઈપણ યોજના અથવા સેવા પસંદ કરો.'
                : 'Tap any welfare scheme or service below to apply for immediate assistance.'}
            </Text>
          </View>
        )}

        {/* Welfare Sectors Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {language === 'gu'
              ? 'સહાય ક્ષેત્રો અને સરકારી યોજનાઓ'
              : 'Welfare Sectors & Schemes'}
          </Text>
          <TouchableOpacity onPress={onOpenSectors}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>
              {language === 'gu' ? 'બધા જુઓ' : 'See All'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sectors 2-Column Grid */}
        <View style={styles.sectorsGrid}>
          {(sectors.length > 0 ? sectors : DEFAULT_SECTOR_CARDS).map(
            (sec, idx) => {
              const cardTitle =
                language === 'gu'
                  ? sec.title_gu || sec.title
                  : sec.title_en || sec.title;
              const iconName = resolveIconName(sec.icon);
              const accentColor = resolveColor(sec.slug, sec.accent_color);

              return (
                <TouchableOpacity
                  key={sec.slug || idx}
                  onPress={() => onOpenSector(sec.slug, cardTitle)}
                  style={[
                    styles.sectorCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.sectorIconWrap,
                      { backgroundColor: colors.surfaceSubtle },
                    ]}
                  >
                    <Ionicons
                      name={iconName as any}
                      size={22}
                      color={accentColor}
                    />
                  </View>
                  <Text
                    style={[styles.sectorCardTitle, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {cardTitle}
                  </Text>
                  {sec.count !== undefined && sec.count > 0 ? (
                    <Text
                      style={[
                        styles.sectorCountText,
                        { color: colors.textMuted },
                      ]}
                    >
                      {sec.count} {language === 'gu' ? 'સેવાઓ' : 'Services'}
                    </Text>
                  ) : null}
                  <View style={styles.sectorApplyLink}>
                    <Text
                      style={[styles.sectorApplyText, { color: accentColor }]}
                    >
                      {language === 'gu' ? 'અરજી કરો' : 'Apply'}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={12}
                      color={accentColor}
                    />
                  </View>
                </TouchableOpacity>
              );
            },
          )}
        </View>

        {/* Other Requests Feed */}
        {others.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {language === 'gu' ? 'અન્ય અરજીઓ' : 'Other Requests'}
            </Text>
            {others.map(app => (
              <TouchableOpacity
                key={app.id}
                onPress={() => onOpenRequest(app)}
                style={[
                  styles.otherRequestCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.otherReqCase, { color: colors.text }]}>
                    #{app.case_no}
                  </Text>
                  <Text
                    style={[styles.otherReqTitle, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    {app.title}
                  </Text>
                </View>
                <StatusBadge status={app.status} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 40, gap: 14 },
  topGreetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  greetingMain: { fontSize: 20, fontWeight: '800' },
  greetingSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  greetingLoc: { fontSize: 12, fontWeight: '600', marginLeft: 3 },
  sosRaktBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#dc2626' },
  sosRaktText: { fontSize: 12, fontWeight: '700', color: '#dc2626' },
  canopyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
  },
  canopyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canopyTitle: { fontSize: 13, fontWeight: '700' },
  canopyDesc: { fontSize: 11, marginTop: 2 },
  activeCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  kickerText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  caseTitle: { fontSize: 16, fontWeight: '700' },
  caseNo: { fontSize: 12, marginTop: 2, fontWeight: '600' },
  stepperContainer: { marginTop: 16, marginBottom: 12 },
  stepperTrackBg: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 12,
    height: 3,
    borderRadius: 2,
  },
  stepperTrackActive: {
    position: 'absolute',
    left: 14,
    top: 12,
    height: 3,
    borderRadius: 2,
  },
  stepperDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleInner: { width: 8, height: 8, borderRadius: 4 },
  stepCirclePending: { width: 8, height: 8, borderRadius: 4 },
  stepperLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stepCol: { alignItems: 'center', width: 65 },
  stepLabel: { fontSize: 11, fontWeight: '600' },
  stepSub: { fontSize: 9, marginTop: 1 },
  officerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  officerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  officerName: { fontSize: 12, fontWeight: '700' },
  officerHint: { fontSize: 10 },
  callBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deepActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  deepActionText: { fontSize: 12, fontWeight: '700' },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 16,
    gap: 8,
  },
  emptyText: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  emptySub: { fontSize: 12, textAlign: 'center' },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  seeAllText: { fontSize: 12, fontWeight: '700' },
  sectorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sectorCard: {
    width: '48%',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 4,
  },
  sectorIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  sectorCardTitle: { fontSize: 13, fontWeight: '700' },
  sectorCountText: { fontSize: 10.5, marginTop: 1 },
  sectorApplyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  sectorApplyText: { fontSize: 11, fontWeight: '700' },
  otherRequestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  otherReqCase: { fontSize: 13, fontWeight: '700' },
  otherReqTitle: { fontSize: 12 },
});
