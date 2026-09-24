import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { applicationService } from '../../services/applicationService';
import { Application, TimelineEvent } from '../../models/application.model';
import { ArchedTimelineDial } from '../components/ArchedTimelineDial';
import { CanopyHeader } from '../components/CanopyHeader';

interface Props {
  applicationId: number;
  onBack: () => void;
}

const getStatusBadge = (status?: string, language?: string) => {
  const isGu = language === 'gu';
  switch (status) {
    case 'received':
      return {
        label: isGu ? 'પ્રાપ્ત થયેલ' : 'Received',
        bg: '#E0F2FE',
        text: '#0284C7',
      };
    case 'verification':
      return {
        label: isGu ? 'ચકાસણી હેઠળ' : 'In Verification',
        bg: '#FEF3C7',
        text: '#D97706',
      };
    case 'categorised':
      return {
        label: isGu ? 'વર્ગીકૃત' : 'Categorised',
        bg: '#EEF2FF',
        text: '#6366F1',
      };
    case 'assigned':
      return {
        label: isGu ? 'સેવક સોંપેલ' : 'Mentor Assigned',
        bg: '#EDE9FE',
        text: '#7C3AED',
      };
    case 'assistance':
      return {
        label: isGu ? 'સહાય પ્રગતિમાં' : 'Assistance Active',
        bg: '#DBEAFE',
        text: '#2563EB',
      };
    case 'followUp':
    case 'follow_up':
      return {
        label: isGu ? 'ફોલો-અપ' : 'Follow-Up',
        bg: '#CCFBF1',
        text: '#0D9488',
      };
    case 'awaiting_confirmation':
      return {
        label: isGu ? 'પુષ્ટિ બાકી' : 'Awaiting Confirmation',
        bg: '#FEF3C7',
        text: '#D97706',
      };
    case 'resolved':
    case 'closed':
    case 'solved':
      return {
        label: isGu ? 'સફળતાપૂર્વક પૂર્ણ' : 'Resolved',
        bg: '#DCFCE7',
        text: '#16A34A',
      };
    case 'needMoreInfo':
      return {
        label: isGu ? 'વિગત જરૂરી' : 'Need More Info',
        bg: '#FFEDD5',
        text: '#EA580C',
      };
    case 'onHold':
    case 'on_hold':
      return {
        label: isGu ? 'મોકૂફ રાખેલ' : 'On Hold',
        bg: '#F3F4F6',
        text: '#6B7280',
      };
    case 'rejected':
      return {
        label: isGu ? 'અસ્વીકાર' : 'Rejected',
        bg: '#FEE2E2',
        text: '#DC2626',
      };
    default:
      return {
        label: status || (isGu ? 'પ્રક્રિયામાં' : 'In Progress'),
        bg: '#F3F4F6',
        text: '#4B5563',
      };
  }
};

const formatEventTitle = (eventType: string, language: string) => {
  const isGu = language === 'gu';
  if (eventType.includes('received') || eventType.includes('submitted')) {
    return isGu ? 'અરજી સફળતાપૂર્વક નોંધાઈ' : 'Application Registered';
  }
  if (eventType.includes('verification')) {
    return isGu ? 'દસ્તાવેજ અને સ્થળ ચકાસણી' : 'Document Verification';
  }
  if (eventType.includes('categorised')) {
    return isGu ? 'વિભાગીય વર્ગીકરણ' : 'Categorised by Welfare Desk';
  }
  if (eventType.includes('assigned')) {
    return isGu ? 'ક્ષેત્ર સેવક ફાળવવામાં આવ્યા' : 'Assigned to Field Mentor';
  }
  if (eventType.includes('assistance')) {
    return isGu ? 'સહાય સેવા પ્રગતિમાં' : 'Assistance in Progress';
  }
  if (eventType.includes('followUp') || eventType.includes('follow_up')) {
    return isGu ? 'ફોલો-અપ શેડ્યૂલ કરાયું' : 'Follow-Up Scheduled';
  }
  if (eventType.includes('awaiting_confirmation')) {
    return isGu ? 'સેવા પૂર્ણતા પુષ્ટિ અર્થે' : 'Awaiting Citizen Confirmation';
  }
  if (
    eventType.includes('resolved') ||
    eventType.includes('closed') ||
    eventType.includes('solved')
  ) {
    return isGu ? 'સહાય કાર્ય પૂર્ણ' : 'Case Resolved & Completed';
  }
  if (eventType.includes('rejected')) {
    return isGu ? 'અરજી અસ્વીકાર' : 'Application Rejected';
  }
  if (eventType.includes('document_uploaded')) {
    return isGu ? 'દસ્તાવેજ અપલોડ કરાયો' : 'Document Uploaded';
  }
  return eventType.replace(/_/g, ' ');
};

export const RequestTimelineScreen: React.FC<Props> = ({
  applicationId,
  onBack,
}) => {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const { language } = useTranslation();
  const { showToast } = useToast();

  const [app, setApp] = useState<Application | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const detail = await applicationService.getApplicationById(applicationId);
      setApp(detail);

      const tl = await applicationService.getTimeline(applicationId);
      const rawEvents =
        (tl?.data as TimelineEvent[]) ||
        detail?.timeline_events ||
        detail?.timeline ||
        [];
      // Sort chronologically ascending
      const sorted = [...rawEvents].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      setEvents(sorted);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const confirmResolution = async () => {
    try {
      await applicationService.confirm(applicationId);
      showToast(
        language === 'gu'
          ? 'સહાય પૂર્ણતા પુષ્ટિ બદલ આભાર.'
          : 'Thank you for confirming the welfare resolution.',
        'success',
        language === 'gu' ? 'પુષ્ટિ સફળ' : 'Resolution Confirmed',
      );
      loadData();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : '',
        'error',
        language === 'gu' ? 'ભૂલ આવી' : 'Could not confirm',
      );
    }
  };

  const handleCall = () => {
    const phone = app?.current_assignee?.phone;
    if (!phone) {
      showToast(
        language === 'gu'
          ? 'હેલ્પલાઇન 1800-233-5500 પર સંપર્ક કરો.'
          : 'Please contact helpline 1800-233-5500.',
        'warning',
        language === 'gu' ? 'સંપર્ક નંબર ઉપલબ્ધ નથી' : 'No Phone Number',
      );
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      showToast(
        `${app?.current_assignee?.name}: ${phone}`,
        'info',
        language === 'gu' ? 'અધિકારી સંપર્ક' : 'Contact Officer',
      );
    });
  };

  const handleWhatsApp = () => {
    const phone = app?.current_assignee?.phone;
    if (!phone) {
      showToast(
        language === 'gu'
          ? 'હેલ્પલાઇન 1800-233-5500 પર સંપર્ક કરો.'
          : 'Please contact helpline 1800-233-5500.',
        'warning',
        language === 'gu' ? 'સંપર્ક નંબર ઉપલબ્ધ નથી' : 'No Phone Number',
      );
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const waNumber = cleanPhone.startsWith('91')
      ? cleanPhone
      : `91${cleanPhone}`;
    Linking.openURL(`https://wa.me/${waNumber}`).catch(() => {
      showToast(`${app?.current_assignee?.name}: ${phone}`, 'info', 'WhatsApp');
    });
  };

  const statusBadge = getStatusBadge(app?.status, language);

  const sectorName =
    language === 'gu'
      ? app?.category?.name_gu || app?.module || 'સમાજ કલ્યાણ સહાય'
      : app?.category?.name_en || app?.module || 'Community Welfare Aid';

  const locationName =
    language === 'gu'
      ? app?.village?.name_gu || app?.taluka?.name_gu || app?.district?.name_gu
      : app?.village?.name_en || app?.taluka?.name_en || app?.district?.name_en;

  const appliedDate = app?.created_at
    ? new Date(app.created_at).toLocaleDateString()
    : '';

  // Calculate active stages
  const isResolved =
    app?.status === 'resolved' ||
    app?.status === 'closed' ||
    app?.status === 'solved';

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      {/* Top Reusable Canopy Header */}
      <CanopyHeader
        title={language === 'gu' ? 'અરજી વિગતો' : 'Request Details'}
        showBack={true}
        onBack={onBack}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            {language === 'gu'
              ? 'વિગતો લોડ થઈ રહી છે...'
              : 'Loading request details...'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Header Summary Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.summaryTopRow}>
              <View style={{ flex: 1 }}>
                <View
                  style={[
                    styles.caseCodePill,
                    { backgroundColor: colors.surfaceSubtle },
                  ]}
                >
                  <Ionicons
                    name="bookmark-outline"
                    size={13}
                    color={colors.secondary}
                  />
                  <Text
                    style={[styles.caseCodeText, { color: colors.secondary }]}
                  >
                    #{app?.case_no}
                  </Text>
                </View>
                <Text style={[styles.caseTitle, { color: colors.text }]}>
                  {app?.title}
                </Text>
                <Text style={[styles.caseSubGu, { color: colors.textMuted }]}>
                  {sectorName}
                </Text>
              </View>

              <View
                style={[
                  styles.statusLivePill,
                  { backgroundColor: statusBadge.bg },
                ]}
              >
                {!isResolved && (
                  <View
                    style={[
                      styles.pulseDotGreen,
                      { backgroundColor: statusBadge.text },
                    ]}
                  />
                )}
                <Text
                  style={[styles.statusLiveText, { color: statusBadge.text }]}
                >
                  {statusBadge.label}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.applicantMetaRow,
                { borderTopColor: colors.border },
              ]}
            >
              <View style={styles.applicantMetaItem}>
                <Ionicons name="person" size={14} color={colors.primary} />
                <Text style={[styles.applicantName, { color: colors.text }]}>
                  {app?.user?.name ||
                    app?.contact_name ||
                    app?.beneficiary_name ||
                    'Citizen'}
                </Text>
              </View>
              {appliedDate ? (
                <View style={styles.applicantMetaItem}>
                  <Ionicons
                    name="calendar"
                    size={14}
                    color={colors.secondary}
                  />
                  <Text
                    style={[styles.applicantDate, { color: colors.textMuted }]}
                  >
                    {language === 'gu' ? 'અરજી તારીખ: ' : 'Applied: '}
                    {appliedDate}
                  </Text>
                </View>
              ) : null}
            </View>

            {locationName ? (
              <View style={styles.locationMetaRow}>
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text
                  style={[styles.locationMetaText, { color: colors.textMuted }]}
                >
                  {locationName}
                </Text>
              </View>
            ) : null}

            {app?.description ? (
              <View
                style={[
                  styles.descBox,
                  { backgroundColor: colors.surfaceSubtle },
                ]}
              >
                <Text style={[styles.descTitle, { color: colors.textMuted }]}>
                  {language === 'gu' ? 'અરજી વર્ણન' : 'Description'}
                </Text>
                <Text style={[styles.descContent, { color: colors.text }]}>
                  {app.description}
                </Text>
              </View>
            ) : null}
          </View>

          {/* 2. Assigned Field Officer Card (DYNAMIC: ONLY rendered if mentor is assigned) */}
          {app?.current_assignee ? (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.officerHeaderRow}>
                <Text
                  style={[styles.officerLabel, { color: colors.textMuted }]}
                >
                  {language === 'gu'
                    ? 'નિમણૂક થયેલ ક્ષેત્ર સેવક'
                    : 'Assigned Field Mentor'}
                </Text>
                <View style={[styles.dutyPill, { backgroundColor: '#DCFCE7' }]}>
                  <View
                    style={[
                      styles.dutyDotSmall,
                      { backgroundColor: '#16A34A' },
                    ]}
                  />
                  <Text style={[styles.dutyTextSmall, { color: '#16A34A' }]}>
                    {language === 'gu' ? 'હાજર' : 'Active'}
                  </Text>
                </View>
              </View>

              <View style={styles.officerBodyRow}>
                <View
                  style={[
                    styles.officerAvatarBox,
                    { backgroundColor: colors.primaryContainer },
                  ]}
                >
                  <Text
                    style={[
                      styles.officerAvatarText,
                      { color: colors.onPrimaryContainer },
                    ]}
                  >
                    {app.current_assignee.name.charAt(0).toUpperCase()}
                  </Text>
                  <View
                    style={[
                      styles.officerVerifiedBadge,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Ionicons name="checkmark" size={9} color="#ffffff" />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.officerName, { color: colors.text }]}>
                    {app.current_assignee.name}
                  </Text>
                  <Text
                    style={[styles.officerRole, { color: colors.textMuted }]}
                  >
                    {app.current_assignee.role ||
                      (language === 'gu'
                        ? 'ક્ષેત્ર સંયોજક'
                        : 'Field Coordinator')}
                  </Text>
                </View>

                <View style={styles.officerActions}>
                  {app.current_assignee.phone ? (
                    <>
                      <TouchableOpacity
                        onPress={handleCall}
                        style={[
                          styles.officerActionCircle,
                          { backgroundColor: colors.surfaceSubtle },
                        ]}
                      >
                        <Ionicons
                          name="call"
                          size={18}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleWhatsApp}
                        style={[
                          styles.officerActionCircle,
                          { backgroundColor: colors.primaryContainer },
                        ]}
                      >
                        <Ionicons
                          name="chatbubbles"
                          size={18}
                          color={colors.onPrimaryContainer}
                        />
                      </TouchableOpacity>
                    </>
                  ) : null}
                </View>
              </View>
            </View>
          ) : (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.pendingOfficerRow}>
                <View
                  style={[
                    styles.pendingIconBox,
                    { backgroundColor: colors.surfaceSubtle },
                  ]}
                >
                  <Ionicons
                    name="time-outline"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.pendingOfficerTitle, { color: colors.text }]}
                  >
                    {language === 'gu'
                      ? 'સેવક ફાળવણી પ્રક્રિયામાં છે'
                      : 'Field Mentor Assignment in Progress'}
                  </Text>
                  <Text
                    style={[
                      styles.pendingOfficerSub,
                      { color: colors.textMuted },
                    ]}
                  >
                    {language === 'gu'
                      ? 'પ્રાથમિક સમીક્ષા બાદ તમારા વિસ્તારના ક્ષેત્ર સેવકને આ કેસ સોંપવામાં આવશે.'
                      : 'A local coordinator will be assigned to assist you following desk verification.'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* 3. Dynamic Application Timeline Events */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.progressHeaderRow}>
              <View style={styles.progressTitleLeft}>
                <Ionicons
                  name="git-network-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.progressTitle, { color: colors.text }]}>
                  {language === 'gu'
                    ? 'અરજી પ્રગતિ સમયરેખા'
                    : 'Application Progress Timeline'}
                </Text>
              </View>
              <View
                style={[
                  styles.stepsCountBadge,
                  { backgroundColor: colors.primaryContainer },
                ]}
              >
                <Text
                  style={[
                    styles.stepsCountText,
                    { color: colors.onPrimaryContainer },
                  ]}
                >
                  {events.length > 0
                    ? `${events.length} ${
                        language === 'gu' ? 'નોંધ' : 'Records'
                      }`
                    : language === 'gu'
                    ? 'ચાલુ'
                    : 'Active'}
                </Text>
              </View>
            </View>

            {/* Dynamic Slidable Timeline Stepper */}
            <ArchedTimelineDial
              status={app?.status || 'received'}
              stages={app?.workflow_stages}
              language={language}
              assigneeName={app?.current_assignee?.name}
            />

            {/* Render real events if any exist */}
            {events.length > 0 ? (
              <View style={styles.verticalTrailContainer}>
                {events.map((ev, index) => {
                  const isLast = index === events.length - 1;
                  const eventDate = ev.created_at
                    ? new Date(ev.created_at).toLocaleString()
                    : '';

                  return (
                    <View key={ev.id || index} style={styles.eventTimelineWrap}>
                      <View style={styles.timelineStepItem}>
                        <View
                          style={[
                            styles.stepIconCircle,
                            {
                              backgroundColor: isLast
                                ? colors.primary
                                : colors.primaryContainer,
                              borderColor: colors.primary,
                            },
                          ]}
                        >
                          <Ionicons
                            name={isLast ? 'radio-button-on' : 'checkmark'}
                            size={14}
                            color={isLast ? '#ffffff' : colors.primary}
                          />
                        </View>

                        <View style={styles.stepContentWrap}>
                          <View style={styles.stepHeaderRow}>
                            <Text
                              style={[
                                styles.stepTitleText,
                                { color: colors.text },
                              ]}
                            >
                              {formatEventTitle(ev.event_type, language)}
                            </Text>
                            {eventDate ? (
                              <Text
                                style={[
                                  styles.stepTimeText,
                                  { color: colors.textMuted },
                                ]}
                              >
                                {eventDate}
                              </Text>
                            ) : null}
                          </View>

                          {ev.body ? (
                            <Text
                              style={[
                                styles.stepDescText,
                                { color: colors.text },
                              ]}
                            >
                              {ev.body}
                            </Text>
                          ) : null}

                          {ev.actor_name && (
                            <View style={styles.systemVerifiedRow}>
                              <Ionicons
                                name="person-outline"
                                size={12}
                                color={colors.primary}
                              />
                              <Text
                                style={[
                                  styles.systemVerifiedText,
                                  { color: colors.primary },
                                ]}
                              >
                                {ev.actor_name} ({ev.actor_role || 'Staff'})
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {!isLast && (
                        <View
                          style={[
                            styles.verticalTrailLine,
                            { backgroundColor: colors.border },
                          ]}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            ) : (
              /* Fallback Initial Submission Milestone */
              <View style={styles.verticalTrailContainer}>
                <View style={styles.timelineStepItem}>
                  <View
                    style={[
                      styles.stepIconCircle,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Ionicons name="checkmark" size={14} color="#ffffff" />
                  </View>
                  <View style={styles.stepContentWrap}>
                    <View style={styles.stepHeaderRow}>
                      <Text
                        style={[styles.stepTitleText, { color: colors.text }]}
                      >
                        {language === 'gu'
                          ? 'અરજી પ્રાપ્ત થઈ'
                          : 'Application Registered'}
                      </Text>
                      <Text
                        style={[
                          styles.stepTimeText,
                          { color: colors.textMuted },
                        ]}
                      >
                        {appliedDate}
                      </Text>
                    </View>
                    <Text
                      style={[styles.stepDescText, { color: colors.textMuted }]}
                    >
                      {language === 'gu'
                        ? 'મોબાઈલ પોર્ટલ મારફતે અરજી સફળતાપૂર્વક નોંધાઈ છે.'
                        : 'Application received via mobile portal and logged into the system.'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* 4. Confirm Resolution Action (if status is solved / awaiting confirmation) */}
          {(app?.status === 'solved' ||
            app?.status === 'awaiting_confirmation') && (
            <TouchableOpacity
              onPress={confirmResolution}
              style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              <Text style={styles.confirmBtnText}>
                {language === 'gu'
                  ? 'સહાય સેવા પુષ્ટિ કરો'
                  : 'Confirm Seva Resolution'}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
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
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  langPill: { flexDirection: 'row', borderRadius: 999, padding: 2 },
  langTab: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  langText: { fontSize: 11, fontWeight: '700' },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 60 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  caseCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  caseCodeText: { fontSize: 11, fontWeight: '700', fontFamily: 'monospace' },
  caseTitle: { fontSize: 17, fontWeight: '800', lineHeight: 24 },
  caseSubGu: { fontSize: 12, marginTop: 2 },
  statusLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pulseDotGreen: { width: 6, height: 6, borderRadius: 3 },
  statusLiveText: { fontSize: 11, fontWeight: '700' },
  applicantMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  applicantMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  applicantName: { fontSize: 13, fontWeight: '700' },
  applicantDate: { fontSize: 12 },
  locationMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationMetaText: { fontSize: 12 },
  descBox: { padding: 10, borderRadius: 10, gap: 4 },
  descTitle: { fontSize: 11, fontWeight: '700' },
  descContent: { fontSize: 13, lineHeight: 18 },
  officerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  officerLabel: { fontSize: 12, fontWeight: '700' },
  dutyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  dutyDotSmall: { width: 5, height: 5, borderRadius: 2.5 },
  dutyTextSmall: { fontSize: 10, fontWeight: '700' },
  officerBodyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  officerAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  officerAvatarText: { fontSize: 18, fontWeight: '800' },
  officerVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  officerName: { fontSize: 15, fontWeight: '800' },
  officerRole: { fontSize: 12 },
  officerActions: { flexDirection: 'row', gap: 8 },
  officerActionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingOfficerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pendingIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingOfficerTitle: { fontSize: 14, fontWeight: '700' },
  pendingOfficerSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTitle: { fontSize: 15, fontWeight: '800' },
  stepsCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  stepsCountText: { fontSize: 11, fontWeight: '700' },
  verticalTrailContainer: { paddingLeft: 4, gap: 0, marginTop: 6 },
  eventTimelineWrap: { position: 'relative' },
  timelineStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
  },
  stepIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    borderWidth: 1,
  },
  stepContentWrap: { flex: 1, gap: 4 },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepTitleText: { fontSize: 13, fontWeight: '700', flex: 1 },
  stepTimeText: { fontSize: 11 },
  stepDescText: { fontSize: 12, lineHeight: 17 },
  systemVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  systemVerifiedText: { fontSize: 11, fontWeight: '600' },
  verticalTrailLine: { width: 2, height: 18, marginLeft: 11 },
  confirmBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  confirmBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});
