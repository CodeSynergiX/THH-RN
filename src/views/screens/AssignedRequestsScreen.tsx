import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  TextInput,
  Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { helperService, unwrapList } from '../../services/helperService';
import { Application } from '../../models/application.model';
import { useFocusEffect } from '@react-navigation/native';
import { CanopyHeader } from '../components/CanopyHeader';

interface Props {
  onOpen: (app: Application) => void;
  onBack?: () => void;
}

type FilterType = 'all' | 'urgent' | 'in_progress' | 'closed';

const SECTOR_OPTIONS = [
  { key: 'All', en: 'All Sectors', gu: 'બધા ક્ષેત્ર' },
  { key: 'Health', en: 'Health', gu: 'આરોગ્ય' },
  { key: 'Govt Schemes', en: 'Govt Schemes', gu: 'સરકારી યોજના' },
  { key: 'Scholarships', en: 'Scholarships', gu: 'શિષ્યવૃત્તિ' },
];

export const AssignedRequestsScreen: React.FC<Props> = ({ onOpen, onBack }) => {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const { language } = useTranslation();
  const { showToast } = useToast();

  const [cases, setCases] = useState<Application[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');

  const load = useCallback(async () => {
    try {
      const res = await helperService.cases(1);
      setCases(unwrapList<Application>(res.data));
    } catch {
      // offline / network fallback
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filteredCases = cases.filter(app => {
    // Filter type
    if (activeFilter === 'urgent' && app.urgency !== 'urgent') return false;
    if (
      activeFilter === 'in_progress' &&
      (app.status === 'resolved' || app.status === 'closed')
    )
      return false;
    if (
      activeFilter === 'closed' &&
      app.status !== 'resolved' &&
      app.status !== 'closed'
    )
      return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNo = app.case_no?.toLowerCase().includes(q);
      const matchTitle = app.title?.toLowerCase().includes(q);
      const matchName =
        app.user?.name?.toLowerCase().includes(q) ||
        app.contact_name?.toLowerCase().includes(q);
      if (!matchNo && !matchTitle && !matchName) return false;
    }

    return true;
  });

  const urgentCount = cases.filter(c => c.urgency === 'urgent').length;
  const inProgressCount = cases.filter(
    c => c.status !== 'resolved' && c.status !== 'closed',
  ).length;
  const closedCount = cases.filter(
    c => c.status === 'resolved' || c.status === 'closed',
  ).length;

  const handleCall = (phone?: string | null) => {
    const target = phone || '+919825144320';
    Linking.openURL(`tel:${target}`).catch(() => {
      showToast(
        language === 'gu'
          ? `કોલ કરી શકાતો નથી: ${target}`
          : `Cannot dial ${target}`,
        'error',
        language === 'gu' ? 'ભૂલ' : 'Error',
      );
    });
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      {/* Reusable Canopy Header */}
      <CanopyHeader
        subtitle={language === 'gu' ? 'સોંપાયેલ અરજીઓ' : 'Assigned Requests'}
        showBack={Boolean(onBack)}
        onBack={onBack}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
        {/* Sub-banner */}
        <View style={styles.subBannerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.subBannerTitle, { color: colors.text }]}>
              {language === 'gu'
                ? `સોંપાયેલ અરજીઓ (${cases.length} કેસ)`
                : `Assigned Requests (${cases.length} Tasks)`}
            </Text>
            <Text style={[styles.subBannerDesc, { color: colors.textMuted }]}>
              {urgentCount > 0
                ? language === 'gu'
                  ? `${urgentCount} તાકીદની અરજીઓમાં તાત્કાલિક સ્થળ ચકાસણી જરૂરી છે`
                  : `${urgentCount} critical tasks require immediate field verification`
                : language === 'gu'
                ? 'બધી સોંપાયેલ અરજીઓ અદ્યતન છે'
                : 'All assigned tasks up to date'}
            </Text>
          </View>
          <View
            style={[
              styles.dutyTag,
              { backgroundColor: colors.primaryContainer },
            ]}
          >
            <Ionicons
              name="shield-checkmark"
              size={14}
              color={colors.primary}
            />
            <Text style={[styles.dutyTagText, { color: colors.primary }]}>
              {language === 'gu' ? 'સેવક ફરજ' : 'Sevak Duty'}
            </Text>
          </View>
        </View>

        {/* Scrollable Status Segment Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsStrip}
        >
          {/* Pill 1: All */}
          <TouchableOpacity
            onPress={() => setActiveFilter('all')}
            style={[
              styles.filterPill,
              activeFilter === 'all'
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.surfaceSubtle },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                { color: activeFilter === 'all' ? '#ffffff' : colors.text },
              ]}
            >
              {language === 'gu' ? 'બધી અરજીઓ' : 'All Requests'}
            </Text>
            <View
              style={[
                styles.filterCountBadge,
                {
                  backgroundColor:
                    activeFilter === 'all'
                      ? colors.primaryContainer
                      : colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterCountText,
                  {
                    color:
                      activeFilter === 'all'
                        ? colors.onPrimaryContainer
                        : colors.text,
                  },
                ]}
              >
                {cases.length}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Pill 2: Urgent */}
          <TouchableOpacity
            onPress={() => setActiveFilter('urgent')}
            style={[
              styles.filterPill,
              activeFilter === 'urgent'
                ? { backgroundColor: colors.error }
                : { backgroundColor: colors.errorContainer },
            ]}
          >
            {urgentCount > 0 && (
              <View
                style={[styles.pulseDotRed, { backgroundColor: colors.error }]}
              />
            )}
            <Text
              style={[
                styles.filterPillText,
                { color: activeFilter === 'urgent' ? '#ffffff' : colors.error },
              ]}
            >
              {language === 'gu' ? 'તાત્કાલિક' : 'Urgent'}
            </Text>
            <View
              style={[
                styles.filterCountBadge,
                {
                  backgroundColor:
                    activeFilter === 'urgent'
                      ? 'rgba(0,0,0,0.2)'
                      : colors.error,
                },
              ]}
            >
              <Text style={[styles.filterCountText, { color: '#ffffff' }]}>
                {urgentCount}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Pill 3: In Progress */}
          <TouchableOpacity
            onPress={() => setActiveFilter('in_progress')}
            style={[
              styles.filterPill,
              activeFilter === 'in_progress'
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.surfaceSubtle },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                {
                  color:
                    activeFilter === 'in_progress' ? '#ffffff' : colors.text,
                },
              ]}
            >
              {language === 'gu' ? 'ચાલુ' : 'In Progress'}
            </Text>
            <View
              style={[
                styles.filterCountBadge,
                {
                  backgroundColor:
                    activeFilter === 'in_progress'
                      ? colors.primaryContainer
                      : colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterCountText,
                  {
                    color:
                      activeFilter === 'in_progress'
                        ? colors.onPrimaryContainer
                        : colors.text,
                  },
                ]}
              >
                {inProgressCount}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Pill 4: Closed */}
          <TouchableOpacity
            onPress={() => setActiveFilter('closed')}
            style={[
              styles.filterPill,
              activeFilter === 'closed'
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.surfaceSubtle },
            ]}
          >
            <Text
              style={[
                styles.filterPillText,
                {
                  color: activeFilter === 'closed' ? '#ffffff' : colors.text,
                },
              ]}
            >
              {language === 'gu' ? 'ઉકેલાયેલ' : 'Closed'}
            </Text>
            <View
              style={[
                styles.filterCountBadge,
                {
                  backgroundColor:
                    activeFilter === 'closed'
                      ? colors.primaryContainer
                      : colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterCountText,
                  {
                    color:
                      activeFilter === 'closed'
                        ? colors.onPrimaryContainer
                        : colors.text,
                  },
                ]}
              >
                {closedCount}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Search Input Bar */}
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              language === 'gu'
                ? 'નામ, ID અથવા ગામ શોધો...'
                : 'Search citizen name, ID, or village...'
            }
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          ) : (
            <Ionicons name="mic-outline" size={18} color={colors.primary} />
          )}
        </View>

        {/* Sector Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectorChipsRow}
        >
          {SECTOR_OPTIONS.map(sec => {
            const label = language === 'gu' ? sec.gu : sec.en;
            return (
              <TouchableOpacity
                key={sec.key}
                onPress={() => setSelectedSector(sec.key)}
                style={[
                  styles.sectorChip,
                  selectedSector === sec.key
                    ? { backgroundColor: colors.primaryContainer }
                    : { backgroundColor: colors.surfaceSubtle },
                ]}
              >
                <Text
                  style={[
                    styles.sectorChipText,
                    {
                      color:
                        selectedSector === sec.key
                          ? colors.onPrimaryContainer
                          : colors.textMuted,
                    },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Task Cards Feed */}
        <View style={styles.cardFeed}>
          {filteredCases.length === 0 ? (
            <View
              style={[styles.emptyCard, { backgroundColor: colors.surface }]}
            >
              <Ionicons
                name="checkmark-done-circle"
                size={44}
                color={colors.primary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {language === 'gu'
                  ? 'કોઈ મેળ ખાતી અરજી નથી'
                  : 'No matching tasks'}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                {language === 'gu'
                  ? 'બધી સોંપાયેલ અરજીઓ પૂર્ણ થઈ ગઈ છે.'
                  : 'All assigned requests have been processed.'}
              </Text>
            </View>
          ) : null}

          {filteredCases.map((app, idx) => {
            const isAppUrgent = app.urgency === 'urgent';
            return (
              <View
                key={app.id || idx}
                style={[styles.taskCard, { backgroundColor: colors.surface }]}
              >
                {/* Status Top Ribbon */}
                <View
                  style={[
                    styles.taskRibbon,
                    {
                      backgroundColor: isAppUrgent
                        ? colors.error
                        : colors.primary,
                    },
                  ]}
                />

                {/* Header: ID + Critical Pill + Sector Icon */}
                <View style={styles.taskHeaderRow}>
                  <View style={styles.taskBadgeGroup}>
                    <View
                      style={[
                        styles.caseCodeBadge,
                        { backgroundColor: colors.surfaceSubtle },
                      ]}
                    >
                      <Text
                        style={[styles.caseCodeText, { color: colors.text }]}
                      >
                        #{app.case_no}
                      </Text>
                    </View>
                    {isAppUrgent ? (
                      <View
                        style={[
                          styles.criticalPill,
                          { backgroundColor: colors.errorContainer },
                        ]}
                      >
                        <View
                          style={[
                            styles.pulseDotSmall,
                            { backgroundColor: colors.error },
                          ]}
                        />
                        <Text
                          style={[
                            styles.criticalPillText,
                            { color: colors.error },
                          ]}
                        >
                          {language === 'gu' ? 'તાકીદનું' : 'URGENT'}
                        </Text>
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.criticalPill,
                          { backgroundColor: colors.primaryContainer },
                        ]}
                      >
                        <Text
                          style={[
                            styles.criticalPillText,
                            { color: colors.primary },
                          ]}
                        >
                          {language === 'gu' ? 'આજે પૂર્ણ' : 'DUE TODAY'}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View
                    style={[
                      styles.sectorIconBox,
                      {
                        backgroundColor: isAppUrgent
                          ? colors.errorContainer
                          : colors.primaryContainer,
                      },
                    ]}
                  >
                    <Ionicons
                      name={isAppUrgent ? 'water' : 'business'}
                      size={18}
                      color={isAppUrgent ? colors.error : colors.primary}
                    />
                  </View>
                </View>

                {/* Title & Category subtitle */}
                <View>
                  <Text style={[styles.taskTitle, { color: colors.text }]}>
                    {app.title}
                  </Text>
                  <Text style={[styles.taskSubGu, { color: colors.textMuted }]}>
                    {app.module ||
                      (language === 'gu'
                        ? 'આવાસ તથા સરકારી સહાય'
                        : 'Housing & Welfare Scheme')}
                  </Text>
                </View>

                {/* Citizen Identity Box */}
                <View
                  style={[
                    styles.citizenBox,
                    { backgroundColor: colors.surfaceSubtle },
                  ]}
                >
                  <View
                    style={[
                      styles.citizenAvatar,
                      { backgroundColor: colors.secondaryContainer },
                    ]}
                  >
                    <Text
                      style={[
                        styles.citizenAvatarText,
                        { color: colors.onSecondaryContainer },
                      ]}
                    >
                      {(app.user?.name || app.contact_name || 'C')
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.citizenName, { color: colors.text }]}>
                      {app.user?.name || app.contact_name || 'Citizen'}
                    </Text>
                    <View style={styles.citizenLocationRow}>
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color={colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.citizenLocText,
                          { color: colors.textMuted },
                        ]}
                        numberOfLines={1}
                      >
                        {app.village?.name_gu ||
                          app.village?.name_en ||
                          (language === 'gu'
                            ? 'નવસારી ગ્રામ્ય'
                            : 'Navsari Rural')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.actionIconGroup}>
                    <TouchableOpacity
                      onPress={() =>
                        handleCall(app.user?.phone || app.contact_phone)
                      }
                      style={[
                        styles.circleActionBtn,
                        { backgroundColor: colors.surface },
                      ]}
                    >
                      <Ionicons name="call" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        showToast(
                          language === 'gu'
                            ? `#${app.case_no} ના GPS સ્થળ તરફ માર્ગદર્શન શરૂ થઈ રહ્યું છે.`
                            : `Navigating to GPS coordinates for #${app.case_no}`,
                          'info',
                          language === 'gu' ? 'દિશા નિર્દેશ' : 'Directions',
                        )
                      }
                      style={[
                        styles.circleActionBtn,
                        { backgroundColor: colors.surface },
                      ]}
                    >
                      <Ionicons
                        name="navigate"
                        size={16}
                        color={colors.secondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Meta info row: Status */}
                <View style={styles.metaRow}>
                  <View
                    style={[
                      styles.metaBox,
                      { backgroundColor: colors.surfaceSubtle },
                    ]}
                  >
                    <Ionicons
                      name="time-outline"
                      size={15}
                      color={colors.secondary}
                    />
                    <Text style={[styles.metaText, { color: colors.text }]}>
                      {language === 'gu' ? 'સ્થિતિ: ' : 'Status: '}
                      <Text style={{ fontWeight: '700' }}>{app.status}</Text>
                    </Text>
                  </View>
                </View>

                {/* Primary CTA: View Details & Timeline if resolved/rejected, else Update Status */}
                {(() => {
                  const isClosed =
                    app.status === 'resolved' ||
                    app.status === 'rejected' ||
                    app.status === 'closed';
                  return (
                    <TouchableOpacity
                      onPress={() => onOpen(app)}
                      style={[
                        styles.updateCtaBtn,
                        isClosed
                          ? {
                              backgroundColor: colors.surfaceSubtle,
                              borderColor: colors.border,
                              borderWidth: 1,
                            }
                          : { backgroundColor: colors.primary },
                      ]}
                    >
                      <Ionicons
                        name={isClosed ? 'eye-outline' : 'create-outline'}
                        size={16}
                        color={isClosed ? colors.primary : '#ffffff'}
                      />
                      <Text
                        style={[
                          styles.updateCtaText,
                          isClosed && {
                            color: colors.primary,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {isClosed
                          ? language === 'gu'
                            ? 'વિગતો અને સમયરેખા જુઓ'
                            : 'View Details & Timeline'
                          : language === 'gu'
                          ? 'સ્થિતિ અપડેટ કરો'
                          : 'Update Status'}
                      </Text>
                      <Ionicons
                        name={isClosed ? 'chevron-forward' : 'arrow-forward'}
                        size={16}
                        color={isClosed ? colors.primary : '#ffffff'}
                      />
                    </TouchableOpacity>
                  );
                })()}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  backBtn: { padding: 4 },
  logoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: { width: '100%', height: '100%' },
  brandTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandTitle: { fontSize: 16, fontWeight: '800' },
  roleBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  roleBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  brandSubtitle: { fontSize: 11 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langPill: { flexDirection: 'row', borderRadius: 999, padding: 2 },
  langTab: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  langText: { fontSize: 11, fontWeight: '700' },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 60 },
  subBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subBannerTitle: { fontSize: 16, fontWeight: '800' },
  subBannerDesc: { fontSize: 11, marginTop: 2 },
  dutyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dutyTagText: { fontSize: 11, fontWeight: '700' },
  filterPillsStrip: { gap: 8, paddingVertical: 2 },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  filterPillText: { fontSize: 12, fontWeight: '700' },
  filterCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    minWidth: 18,
    alignItems: 'center',
  },
  filterCountText: { fontSize: 11, fontWeight: '800' },
  pulseDotRed: { width: 6, height: 6, borderRadius: 3 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 13 },
  sectorChipsRow: { gap: 8 },
  sectorChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  sectorChipText: { fontSize: 12, fontWeight: '600' },
  cardFeed: { gap: 12 },
  emptyCard: {
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptySub: { fontSize: 12, textAlign: 'center' },
  taskCard: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  taskRibbon: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  taskHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskBadgeGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  caseCodeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  caseCodeText: { fontSize: 12, fontWeight: '800', fontFamily: 'monospace' },
  criticalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pulseDotSmall: { width: 6, height: 6, borderRadius: 3 },
  criticalPillText: { fontSize: 10, fontWeight: '800' },
  sectorIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: { fontSize: 14, fontWeight: '800' },
  taskSubGu: { fontSize: 11, marginTop: 1 },
  citizenBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
  },
  citizenAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  citizenAvatarText: { fontSize: 14, fontWeight: '800' },
  citizenName: { fontSize: 13, fontWeight: '700' },
  citizenLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  citizenLocText: { fontSize: 11 },
  actionIconGroup: { flexDirection: 'row', gap: 6 },
  circleActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: { flexDirection: 'row', gap: 8 },
  metaBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  metaText: { fontSize: 11 },
  updateCtaBtn: {
    height: 42,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  updateCtaText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
});
