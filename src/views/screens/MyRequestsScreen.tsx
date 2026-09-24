import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { applicationService } from '../../services/applicationService';
import { Application } from '../../models/application.model';
import { ArchedTimelineDial } from '../components';
import { CanopyHeader } from '../components/CanopyHeader';

interface Props {
  onOpen: (app: Application) => void;
  onNewHelp?: () => void;
}

type FilterTab = 'all' | 'active' | 'resolved';

interface StatusMeta {
  label: string;
  textColor: string;
  bgColor: string;
  dotColor: string;
  stepState: [
    'done' | 'active' | 'pending',
    'done' | 'active' | 'pending',
    'done' | 'active' | 'pending',
    'done' | 'active' | 'pending',
  ];
  nextStepText: string;
}

const getStatusMeta = (
  status: string,
  language: string,
  assigneeName?: string,
): StatusMeta => {
  const isGu = language === 'gu';

  switch (status) {
    case 'received':
      return {
        label: isGu ? 'પ્રાપ્ત થયેલ' : 'Received',
        textColor: '#0284C7',
        bgColor: '#E0F2FE',
        dotColor: '#0284C7',
        stepState: ['done', 'active', 'pending', 'pending'],
        nextStepText: isGu
          ? 'અરજી સફળતાપૂર્વક નોંધાઈ છે અને પ્રાથમિક ચકાસણી માટે કતારમાં છે.'
          : 'Application registered and queued for desk verification.',
      };

    case 'verification':
      return {
        label: isGu ? 'ચકાસણી હેઠળ' : 'In Verification',
        textColor: '#D97706',
        bgColor: '#FEF3C7',
        dotColor: '#D97706',
        stepState: ['done', 'active', 'pending', 'pending'],
        nextStepText: isGu
          ? 'દસ્તાવેજો અને પાત્રતા વિગતોની ચકાસણી પ્રક્રિયા ચાલુ છે.'
          : 'Document cross-check and eligibility verification in progress.',
      };

    case 'categorised':
      return {
        label: isGu ? 'વર્ગીકૃત' : 'Categorised',
        textColor: '#6366F1',
        bgColor: '#EEF2FF',
        dotColor: '#6366F1',
        stepState: ['done', 'active', 'pending', 'pending'],
        nextStepText: isGu
          ? 'અરજી સંબંધિત કલ્યાણ વિભાગમાં વર્ગીકૃત કરવામાં આવી છે.'
          : 'Application categorised and routed to the welfare department.',
      };

    case 'assigned':
      return {
        label: isGu ? 'સેવક સોંપેલ' : 'Mentor Assigned',
        textColor: '#7C3AED',
        bgColor: '#EDE9FE',
        dotColor: '#7C3AED',
        stepState: ['done', 'done', 'active', 'pending'],
        nextStepText: assigneeName
          ? isGu
            ? `સેવક ${assigneeName} ને સ્થળ મુલાકાત માટે સોંપેલ છે.`
            : `Assigned to ${assigneeName} for field assistance.`
          : isGu
          ? 'સ્થાનિક સેવકને સ્થળ તપાસ અને સહાય માટે સોંપવામાં આવી છે.'
          : 'Assigned to local field mentor for on-ground assistance.',
      };

    case 'assistance':
      return {
        label: isGu ? 'સહાય પ્રગતિમાં' : 'Assistance Active',
        textColor: '#2563EB',
        bgColor: '#DBEAFE',
        dotColor: '#2563EB',
        stepState: ['done', 'done', 'active', 'pending'],
        nextStepText: assigneeName
          ? isGu
            ? `${assigneeName} દ્વારા સહાય પૂરી પાડવાની કામગીરી ચાલુ છે.`
            : `${assigneeName} is actively facilitating your welfare assistance.`
          : isGu
          ? 'સેવા/સહાય આપવાની કામગીરી પ્રગતિ હેઠળ છે.'
          : 'Field assistance and relief facilitation in progress.',
      };

    case 'followUp':
    case 'follow_up':
      return {
        label: isGu ? 'ફોલો-અપ' : 'Follow-Up',
        textColor: '#0D9488',
        bgColor: '#CCFBF1',
        dotColor: '#0D9488',
        stepState: ['done', 'done', 'active', 'pending'],
        nextStepText: isGu
          ? 'સ્થિતિ ચકાસણી માટે ફોલો-અપ શેડ્યૂલ કરેલ છે.'
          : 'Follow-up review and progress consultation scheduled.',
      };

    case 'awaiting_confirmation':
      return {
        label: isGu ? 'પુષ્ટિ બાકી' : 'Awaiting Confirmation',
        textColor: '#D97706',
        bgColor: '#FEF3C7',
        dotColor: '#D97706',
        stepState: ['done', 'done', 'done', 'active'],
        nextStepText: isGu
          ? 'સેવા પૂરી પાડવામાં આવી છે. કૃપા કરીને અરજી વિગતોમાં પુષ્ટિ કરો.'
          : 'Assistance delivered. Please review and confirm resolution.',
      };

    case 'resolved':
    case 'closed':
    case 'solved':
      return {
        label: isGu ? 'સફળતાપૂર્વક પૂર્ણ' : 'Resolved',
        textColor: '#16A34A',
        bgColor: '#DCFCE7',
        dotColor: '#16A34A',
        stepState: ['done', 'done', 'done', 'done'],
        nextStepText: isGu
          ? 'અરજી સફળતાપૂર્વક પૂર્ણ કરવામાં આવી છે.'
          : 'Application has been successfully resolved and closed.',
      };

    case 'needMoreInfo':
      return {
        label: isGu ? 'વિગત જરૂરી' : 'Need More Info',
        textColor: '#EA580C',
        bgColor: '#FFEDD5',
        dotColor: '#EA580C',
        stepState: ['done', 'active', 'pending', 'pending'],
        nextStepText: isGu
          ? 'અરજી પ્રક્રિયા આગળ વધારવા માટે વધુ વિગત અથવા દસ્તાવેજ જરૂરી છે.'
          : 'Additional details or documents required to proceed.',
      };

    case 'onHold':
    case 'on_hold':
      return {
        label: isGu ? 'મોકૂફ રાખેલ' : 'On Hold',
        textColor: '#6B7280',
        bgColor: '#F3F4F6',
        dotColor: '#6B7280',
        stepState: ['done', 'active', 'pending', 'pending'],
        nextStepText: isGu
          ? 'વિભાગીય સમીક્ષા માટે અરજી હાલ મોકૂફ રાખવામાં આવી છે.'
          : 'Application is currently on hold pending departmental review.',
      };

    case 'rejected':
      return {
        label: isGu ? 'અસ્વીકાર' : 'Rejected',
        textColor: '#DC2626',
        bgColor: '#FEE2E2',
        dotColor: '#DC2626',
        stepState: ['done', 'active', 'pending', 'pending'],
        nextStepText: isGu
          ? 'નિયમો અને માપદંડ અનુસાર આ અરજી મંજૂર થઈ શકી નથી.'
          : 'Application could not be approved based on eligibility guidelines.',
      };

    default:
      return {
        label: status,
        textColor: '#4B5563',
        bgColor: '#F3F4F6',
        dotColor: '#4B5563',
        stepState: ['done', 'active', 'pending', 'pending'],
        nextStepText: isGu
          ? 'અરજી પ્રક્રિયા હેઠળ છે.'
          : 'Application is currently under processing.',
      };
  }
};

export const MyRequestsScreen: React.FC<Props> = ({ onOpen, onNewHelp }) => {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const { language } = useTranslation();
  const { showToast } = useToast();

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const appsCountRef = useRef(apps.length);
  appsCountRef.current = apps.length;

  const load = useCallback(
    async (isRefresh = false) => {
      try {
        if (!isRefresh) {
          setLoading(prev => (appsCountRef.current === 0 ? true : prev));
        }
        setError(null);
        const list = await applicationService.getMyApplications();
        setApps(list);
      } catch (err) {
        console.warn('Failed to load applications:', err);
        if (appsCountRef.current === 0) {
          setError(
            language === 'gu'
              ? 'અરજીઓ લોડ કરવામાં સમસ્યા આવી. ફરી પ્રયાસ કરો.'
              : 'Could not load requests. Please try again.',
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [language],
  );

  useEffect(() => {
    // 1. Instantly show cached items if available so screen never appears empty
    applicationService.getCachedApplications().then(cached => {
      if (cached && cached.length > 0) {
        setApps(cached);
        setLoading(false);
      }
    });
    // 2. Fresh background network fetch
    load();
  }, [load]);

  const filtered = apps.filter(a => {
    if (activeTab === 'active')
      return a.status !== 'resolved' && a.status !== 'closed';
    if (activeTab === 'resolved')
      return a.status === 'resolved' || a.status === 'closed';
    return true;
  });

  const activeCount = apps.filter(
    a => a.status !== 'resolved' && a.status !== 'closed',
  ).length;
  const resolvedCount = apps.filter(
    a => a.status === 'resolved' || a.status === 'closed',
  ).length;

  const handleCallOfficer = (name?: string, phone?: string | null) => {
    if (!phone) {
      showToast(
        language === 'gu'
          ? 'સેવક ફાળવણી પ્રક્રિયામાં છે. સામાન્ય સહાય માટે 1800-233-5500 પર સંપર્ક કરો.'
          : 'Mentor assignment in progress. Contact helpline 1800-233-5500 for assistance.',
        'info',
        language === 'gu' ? 'સેવક સંપર્ક' : 'Mentor Contact',
      );
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      showToast(
        `${name || 'Field Officer'}: ${phone}`,
        'info',
        language === 'gu' ? 'અધિકારી સંપર્ક' : 'Contact Officer',
      );
    });
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      {/* Top Reusable Canopy Header */}
      <CanopyHeader
        subtitle={language === 'gu' ? 'મારી અરજીઓ' : 'My Help Requests'}
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
        {/* Content Header & Overview */}
        <View style={styles.overviewSection}>
          <View style={styles.overviewTitleRow}>
            <View style={styles.overviewTitleLeft}>
              <View
                style={[
                  styles.overviewIconCircle,
                  { backgroundColor: colors.primaryContainer },
                ]}
              >
                <Ionicons
                  name="checkmark-done"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View>
                <Text style={[styles.overviewH1, { color: colors.text }]}>
                  {language === 'gu' ? 'મારી સહાય અરજીઓ' : 'My Help Requests'}
                </Text>
              </View>
            </View>

            {onNewHelp && (
              <TouchableOpacity
                onPress={onNewHelp}
                style={[
                  styles.newReqBtn,
                  { backgroundColor: colors.primaryContainer },
                ]}
              >
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text style={[styles.newReqBtnText, { color: colors.primary }]}>
                  {language === 'gu' ? 'નવી અરજી' : 'New Request'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.overviewDesc, { color: colors.textMuted }]}>
            {language === 'gu'
              ? 'તમારી તમામ સહાય અરજીઓની સ્થિતિ, સેવક ફાળવણી અને પ્રગતિ અહીં જુઓ.'
              : 'Track real-time progress, field verifications, and approvals across community welfare desks.'}
          </Text>

          {/* Segmented Status Tabs */}
          <View
            style={[
              styles.segmentedTabs,
              { backgroundColor: colors.surfaceSubtle },
            ]}
          >
            <TouchableOpacity
              onPress={() => setActiveTab('all')}
              style={[
                styles.segmentTab,
                activeTab === 'all' && [
                  styles.segmentTabActive,
                  { backgroundColor: colors.surface },
                ],
              ]}
            >
              <Text
                style={[
                  styles.segmentTabText,
                  {
                    color:
                      activeTab === 'all' ? colors.primary : colors.textMuted,
                  },
                ]}
              >
                {language === 'gu'
                  ? `બધી (${apps.length})`
                  : `All (${apps.length})`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('active')}
              style={[
                styles.segmentTab,
                activeTab === 'active' && [
                  styles.segmentTabActive,
                  { backgroundColor: colors.surface },
                ],
              ]}
            >
              <Text
                style={[
                  styles.segmentTabText,
                  {
                    color:
                      activeTab === 'active'
                        ? colors.primary
                        : colors.textMuted,
                  },
                ]}
              >
                {language === 'gu'
                  ? `ચાલુ (${activeCount})`
                  : `In Progress (${activeCount})`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('resolved')}
              style={[
                styles.segmentTab,
                activeTab === 'resolved' && [
                  styles.segmentTabActive,
                  { backgroundColor: colors.surface },
                ],
              ]}
            >
              <Text
                style={[
                  styles.segmentTabText,
                  {
                    color:
                      activeTab === 'resolved'
                        ? colors.primary
                        : colors.textMuted,
                  },
                ]}
              >
                {language === 'gu'
                  ? `ઉકેલાયેલ (${resolvedCount})`
                  : `Resolved (${resolvedCount})`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Requests Card List */}
        <View style={styles.cardList}>
          {loading && apps.length === 0 ? (
            <View
              style={[styles.loadingBox, { backgroundColor: colors.surface }]}
            >
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                {language === 'gu'
                  ? 'અરજીઓ લોડ થઈ રહી છે...'
                  : 'Loading your requests...'}
              </Text>
            </View>
          ) : error && apps.length === 0 ? (
            <View
              style={[styles.emptyCard, { backgroundColor: colors.surface }]}
            >
              <Ionicons
                name="cloud-offline-outline"
                size={44}
                color="#DC2626"
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {language === 'gu' ? 'કનેક્શન સમસ્યા' : 'Connection Problem'}
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                {error}
              </Text>
              <TouchableOpacity
                onPress={() => load()}
                style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.retryBtnText}>
                  {language === 'gu' ? 'ફરી પ્રયાસ કરો' : 'Try Again'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : filtered.length === 0 ? (
            <View
              style={[styles.emptyCard, { backgroundColor: colors.surface }]}
            >
              <Ionicons
                name="file-tray-outline"
                size={44}
                color={colors.primary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {language === 'gu' ? 'કોઈ અરજી મળી નથી' : 'No requests found'}
              </Text>
              <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                {activeTab === 'all'
                  ? language === 'gu'
                    ? 'તમે હજુ સુધી કોઈ સહાય અરજી સબમિટ કરી નથી.'
                    : 'You have not submitted any aid applications yet.'
                  : activeTab === 'active'
                  ? language === 'gu'
                    ? 'હાલમાં કોઈ સક્રિય કે પ્રગતિ હેઠળની અરજી નથી.'
                    : 'No active or in-progress requests right now.'
                  : language === 'gu'
                  ? 'હજુ સુધી કોઈ પૂર્ણ થયેલ અરજી નથી.'
                  : 'No resolved requests yet.'}
              </Text>
              {onNewHelp && activeTab === 'all' && (
                <TouchableOpacity
                  onPress={onNewHelp}
                  style={[
                    styles.emptyActionBtn,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={18}
                    color="#ffffff"
                  />
                  <Text style={styles.emptyActionText}>
                    {language === 'gu' ? 'નવી સહાય અરજી કરો' : 'Apply for Aid'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {filtered.map((app, idx) => {
            const isResolved =
              app.status === 'resolved' || app.status === 'closed';
            const statusMeta = getStatusMeta(
              app.status,
              language,
              app.current_assignee?.name,
            );

            const sectorName =
              language === 'gu'
                ? app.category?.name_gu || app.module || 'સમાજ કલ્યાણ'
                : app.category?.name_en || app.module || 'Community Aid';

            const locationName =
              language === 'gu'
                ? app.village?.name_gu ||
                  app.taluka?.name_gu ||
                  app.district?.name_gu
                : app.village?.name_en ||
                  app.taluka?.name_en ||
                  app.district?.name_en;

            const formattedDate = app.created_at
              ? new Date(app.created_at).toLocaleDateString()
              : '';

            return (
              <View
                key={app.id || idx}
                style={[
                  styles.requestCard,
                  { backgroundColor: colors.surface },
                ]}
              >
                {/* Header Meta */}
                <View style={styles.cardMetaRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardTagRow}>
                      <View
                        style={[
                          styles.sectorTag,
                          { backgroundColor: colors.primaryContainer },
                        ]}
                      >
                        <Text
                          style={[
                            styles.sectorTagText,
                            { color: colors.onPrimaryContainer },
                          ]}
                        >
                          {sectorName}
                        </Text>
                      </View>
                      <Text
                        style={[styles.caseNoText, { color: colors.textMuted }]}
                      >
                        #{app.case_no}
                      </Text>
                    </View>
                    <Text
                      style={[styles.appTitle, { color: colors.text }]}
                      numberOfLines={2}
                    >
                      {app.title}
                    </Text>
                  </View>

                  {/* Dynamic Status Badge */}
                  <View
                    style={[
                      styles.statusPulsingBadge,
                      { backgroundColor: statusMeta.bgColor },
                    ]}
                  >
                    {!isResolved && (
                      <View
                        style={[
                          styles.statusDotPulse,
                          { backgroundColor: statusMeta.dotColor },
                        ]}
                      />
                    )}
                    <Text
                      style={[
                        styles.statusPulsingText,
                        { color: statusMeta.textColor },
                      ]}
                    >
                      {statusMeta.label}
                    </Text>
                  </View>
                </View>

                {/* Sector & Location Sub-details (only if real data present) */}
                {(locationName || formattedDate) && (
                  <View
                    style={[
                      styles.subDetailsRow,
                      { backgroundColor: colors.surfaceSubtle },
                    ]}
                  >
                    {locationName ? (
                      <View style={styles.subDetailItem}>
                        <Ionicons
                          name="location"
                          size={14}
                          color={colors.primary}
                        />
                        <Text
                          style={[
                            styles.subDetailText,
                            { color: colors.textMuted },
                          ]}
                        >
                          {locationName}
                        </Text>
                      </View>
                    ) : null}
                    {locationName && formattedDate ? (
                      <View
                        style={[
                          styles.vertDivider,
                          { backgroundColor: colors.border },
                        ]}
                      />
                    ) : null}
                    {formattedDate ? (
                      <View style={styles.subDetailItem}>
                        <Ionicons
                          name="calendar"
                          size={14}
                          color={colors.secondary}
                        />
                        <Text
                          style={[
                            styles.subDetailText,
                            { color: colors.textMuted },
                          ]}
                        >
                          {formattedDate}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                )}

                {/* Dynamic Slidable Timeline Stepper */}
                <ArchedTimelineDial
                  status={app.status}
                  stages={app.workflow_stages}
                  language={language}
                  assigneeName={app.current_assignee?.name}
                />

                {/* Action Row */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => onOpen(app)}
                    style={[
                      styles.viewTimelineBtn,
                      { backgroundColor: colors.primaryContainer },
                    ]}
                  >
                    <Text
                      style={[
                        styles.viewTimelineText,
                        { color: colors.onPrimaryContainer },
                      ]}
                    >
                      {language === 'gu'
                        ? 'વિગતો અને સમયરેખા'
                        : 'View Details & Timeline'}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={14}
                      color={colors.onPrimaryContainer}
                    />
                  </TouchableOpacity>

                  {/* Contact Officer: ONLY shown if mentor is assigned */}
                  {app.current_assignee ? (
                    <TouchableOpacity
                      onPress={() =>
                        handleCallOfficer(
                          app.current_assignee?.name,
                          app.current_assignee?.phone,
                        )
                      }
                      style={[
                        styles.contactOfficerBtn,
                        { backgroundColor: colors.surfaceSubtle },
                      ]}
                    >
                      <Ionicons
                        name="call"
                        size={14}
                        color={colors.secondary}
                      />
                      <Text
                        style={[
                          styles.contactOfficerText,
                          { color: colors.secondary },
                        ]}
                      >
                        {language === 'gu' ? 'સેવક સંપર્ક' : 'Contact Mentor'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 13, fontWeight: '800' },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  headerSub: { fontSize: 11, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  langPill: { flexDirection: 'row', borderRadius: 999, padding: 2 },
  langTab: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  langText: { fontSize: 11, fontWeight: '700' },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 60 },
  overviewSection: { gap: 8 },
  overviewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overviewTitleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  overviewIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewH1: { fontSize: 18, fontWeight: '800' },
  newReqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  newReqBtnText: { fontSize: 12, fontWeight: '700' },
  overviewDesc: { fontSize: 12, lineHeight: 16 },
  segmentedTabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginTop: 4,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTabActive: { elevation: 1 },
  segmentTabText: { fontSize: 11, fontWeight: '700' },
  cardList: { gap: 14 },
  loadingBox: {
    borderRadius: 16,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 13, fontWeight: '600' },
  emptyCard: { borderRadius: 16, padding: 30, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyDesc: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  emptyActionText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  retryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  retryBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  requestCard: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectorTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  sectorTagText: { fontSize: 10, fontWeight: '700' },
  caseNoText: { fontSize: 11, fontWeight: '600', fontFamily: 'monospace' },
  appTitle: { fontSize: 15, fontWeight: '700' },
  statusPulsingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusDotPulse: { width: 6, height: 6, borderRadius: 3 },
  statusPulsingText: { fontSize: 11, fontWeight: '700' },
  subDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 10,
  },
  subDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  subDetailText: { fontSize: 11 },
  vertDivider: { width: 1, height: 12 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  viewTimelineBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  viewTimelineText: { fontSize: 12, fontWeight: '700' },
  contactOfficerBtn: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  contactOfficerText: { fontSize: 12, fontWeight: '700' },
});
