import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast } from '../../context/ToastContext';
import {
  helperService,
  DeskMetrics,
  EmergencySosItem,
  unwrapList,
} from '../../services/helperService';
import { Application } from '../../models/application.model';
import { useAuth } from '../../context/AuthContext';
import { CanopyHeader } from '../components/CanopyHeader';

interface Props {
  onOpen: (app: Application) => void;
  onOpenList: () => void;
  onOpenBloodSos?: () => void;
}

export const MentorDashboardScreen: React.FC<Props> = ({
  onOpen,
  onOpenList,
}) => {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const { language } = useTranslation();
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [metrics, setMetrics] = useState<DeskMetrics | null>(null);
  const [cases, setCases] = useState<Application[]>([]);
  const [, setSosList] = useState<EmergencySosItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dutyLoading, setDutyLoading] = useState(false);

  const pending = user?.helper_status === 'pending';
  const isOnDuty = !!user?.on_duty;

  const load = useCallback(async () => {
    try {
      const [dash, list] = await Promise.all([
        helperService.dashboard(),
        helperService.cases(1),
      ]);
      setMetrics(dash.data);
      setCases(unwrapList<Application>(list.data));
      setSosList([]);
    } catch {
      // offline / network fallback
    }
    await refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleDuty = async () => {
    setDutyLoading(true);
    try {
      await helperService.setOnDuty(!isOnDuty);
      await refreshUser();
    } catch {
      showToast(
        language === 'gu'
          ? 'ફરજ સ્થિતિ બદલી શકાઈ નથી.'
          : 'Could not toggle duty status.',
        'error',
        language === 'gu' ? 'ભૂલ' : 'Error',
      );
    } finally {
      setDutyLoading(false);
    }
  };

  // const handleCall = (phone?: string) => {
  //   const target = phone || '+919825144320';
  //   Linking.openURL(`tel:${target}`).catch(() => {
  //     showToast(
  //       language === 'gu'
  //         ? `કોલ કરી શકાતો નથી: ${target}`
  //         : `Cannot dial ${target}`,
  //       'error',
  //       language === 'gu' ? 'ભૂલ' : 'Error',
  //     );
  //   });
  // };

  // const handleResolveSos = (item: EmergencySosItem) => {
  //   Alert.alert(
  //     language === 'gu' ? 'કટોકટી પૂર્ણ કરો' : 'Resolve Emergency SOS',
  //     language === 'gu'
  //       ? `શું ${item.patient_name} માટે રક્તની વ્યવસ્થા થઈ ગઈ છે? આ કટોકટી પૂર્ણ ગણાશે.`
  //       : `Has blood been arranged for ${item.patient_name}? This will mark the SOS as fulfilled.`,
  //     [
  //       { text: language === 'gu' ? 'રદ કરો' : 'Cancel', style: 'cancel' },
  //       {
  //         text: language === 'gu' ? 'હા, પૂર્ણ કરો' : 'Yes, Mark Fulfilled',
  //         onPress: async () => {
  //           try {
  //             await helperService.updateEmergencySosStatus(
  //               item.id,
  //               'fulfilled',
  //             );
  //             await load();
  //             showToast(
  //               language === 'gu'
  //                 ? 'બ્લડ વિનંતી પૂર્ણ થઈ ગઈ છે.'
  //                 : 'Blood SOS request marked as fulfilled.',
  //               'success',
  //               language === 'gu' ? 'સફળતા' : 'Success',
  //             );
  //           } catch {
  //             showToast(
  //               language === 'gu'
  //                 ? 'સ્થિતિ બદલવામાં નિષ્ફળતા.'
  //                 : 'Failed to update SOS status.',
  //               'error',
  //               language === 'gu' ? 'ભૂલ' : 'Error',
  //             );
  //           }
  //         },
  //       },
  //     ],
  //   );
  // };

  // const handleBroadcastSos = () => {
  //   if (onOpenBloodSos) {
  //     onOpenBloodSos();
  //     return;
  //   }
  //   Alert.alert(
  //     language === 'gu' ? 'બ્લડ SOS પ્રસારણ' : 'Blood SOS Broadcast',
  //     language === 'gu'
  //       ? 'શું તમે વિસ્તારના તમામ રક્તદાતાઓને તાત્કાલિક SOS સૂચના મોકલવા માંગો છો?'
  //       : 'Do you want to broadcast an urgent emergency blood SOS to all registered donors?',
  //     [
  //       { text: language === 'gu' ? 'રદ કરો' : 'Cancel', style: 'cancel' },
  //       {
  //         text: language === 'gu' ? 'પ્રસારિત કરો' : 'Broadcast Now',
  //         onPress: async () => {
  //           try {
  //             await helperService.createEmergencySos({
  //               patient_name:
  //                 language === 'gu' ? 'તાત્કાલિક દર્દી' : 'Emergency Patient',
  //               blood_group: 'O+',
  //               units_required: 2,
  //               urgency: 'urgent',
  //               contact_phone: user?.phone || '9825000015',
  //             });
  //             await load();
  //             showToast(
  //               language === 'gu'
  //                 ? 'વિસ્તારના તમામ રક્તદાતાઓને તાત્કાલિક સૂચના મોકલવામાં આવી છે.'
  //                 : 'Emergency blood broadcast sent to all registered donors.',
  //               'success',
  //               language === 'gu' ? 'પ્રસારણ સફળ' : 'Broadcast Sent',
  //             );
  //           } catch {
  //             showToast(
  //               language === 'gu'
  //                 ? 'પ્રસારણમાં નિષ્ફળતા.'
  //                 : 'Failed to dispatch SOS broadcast.',
  //               'error',
  //               language === 'gu' ? 'ભૂલ' : 'Error',
  //             );
  //           }
  //         },
  //       },
  //     ],
  //   );
  // };

  // Accurate dynamic KPI calculations
  const assignedActiveCount = metrics?.assigned_active_cases ?? cases.length;
  const urgentCount =
    metrics?.urgency?.urgent ??
    cases.filter(c => c.urgency === 'urgent').length;
  const inProgressCount =
    metrics?.in_progress_cases ??
    cases.filter(c => c.status !== 'resolved' && c.status !== 'closed').length;
  const resolvedCount =
    metrics?.resolved_cases ??
    cases.filter(c => c.status === 'resolved' || c.status === 'closed').length;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      {/* Top Reusable Canopy Header */}
      <CanopyHeader
        subtitle={
          language === 'gu'
            ? 'માર્ગદર્શક અને સ્વયંસેવક ડેસ્ક'
            : 'Mentor & Volunteer Desk'
        }
        avatarLetter={(user?.name || 'S').charAt(0)}
        right={
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() =>
              showToast(
                language === 'gu'
                  ? 'કોઈ નવી ચેતવણી નથી.'
                  : 'No pending emergency alerts.',
                'info',
                language === 'gu' ? 'સૂચનાઓ' : 'Notifications',
              )
            }
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.text}
            />
          </TouchableOpacity>
        }
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
        {/* Pending Approval Notice */}
        {pending && (
          <View
            style={[
              styles.pendingNotice,
              { backgroundColor: colors.errorContainer },
            ]}
          >
            <Ionicons name="time" size={20} color={colors.error} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.pendingTitle, { color: colors.error }]}>
                {language === 'gu'
                  ? 'સંયોજક મંજૂરી બાકી છે'
                  : 'Awaiting coordinator approval'}
              </Text>
              <Text
                style={[
                  styles.pendingSub,
                  { color: colors.onSecondaryContainer },
                ]}
              >
                {language === 'gu'
                  ? 'તમારી પ્રોફાઇલ તાલુકા ડેસ્ક દ્વારા ચકાસણી હેઠળ છે.'
                  : 'Your profile is under verification by Taluka Desk.'}
              </Text>
            </View>
          </View>
        )}

        {/* 1. Greeting & Status Hero Unit */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface }]}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroProfileRow}>
              <View style={styles.heroAvatarWrap}>
                <View
                  style={[
                    styles.heroAvatar,
                    { backgroundColor: colors.primaryContainer },
                  ]}
                >
                  <Text
                    style={[
                      styles.heroAvatarText,
                      { color: colors.onPrimaryContainer },
                    ]}
                  >
                    {(user?.name || 'Ramesh').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.verifiedBadge,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Ionicons name="checkmark" size={10} color="#ffffff" />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.greetingTitle, { color: colors.text }]}>
                  {language === 'gu'
                    ? `નમસ્તે, ${user?.name || 'કાંતિભાઈ ડિંડોર'}`
                    : `Namaste, ${user?.name || 'Kantibhai Dindor'}`}
                </Text>
                <Text style={[styles.greetingRole, { color: colors.primary }]}>
                  {language === 'gu'
                    ? 'મુખ્ય સંયોજક • THH સેવક'
                    : 'Senior Coordinator • THH Sevak'}
                </Text>
              </View>
            </View>

            {/* On-Duty / Off-Duty Toggle Pill */}
            <TouchableOpacity
              disabled={dutyLoading}
              onPress={toggleDuty}
              style={[
                styles.dutyPill,
                {
                  backgroundColor: isOnDuty
                    ? colors.primaryContainer
                    : colors.surfaceSubtle,
                },
              ]}
            >
              <View
                style={[
                  styles.dutyDot,
                  {
                    backgroundColor: isOnDuty
                      ? colors.primary
                      : colors.textMuted,
                  },
                ]}
              />
              <Text
                style={[
                  styles.dutyPillText,
                  {
                    color: isOnDuty
                      ? colors.onPrimaryContainer
                      : colors.textMuted,
                  },
                ]}
              >
                {isOnDuty
                  ? language === 'gu'
                    ? 'ફરજ પર'
                    : 'On-Duty'
                  : language === 'gu'
                  ? 'ફરજ મુક્ત'
                  : 'Off-Duty'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Region & Verification Badges */}
          <View style={styles.heroBottomRow}>
            <View
              style={[
                styles.regionPill,
                { backgroundColor: colors.surfaceSubtle },
              ]}
            >
              <Ionicons name="location" size={14} color={colors.primary} />
              <Text style={[styles.regionText, { color: colors.textMuted }]}>
                {language === 'gu'
                  ? user?.taluka?.name_gu
                    ? `${user.taluka.name_gu} ગ્રામ્ય વિસ્તાર`
                    : 'ચીખલી અને નવસારી ગ્રામ્ય વિસ્તાર'
                  : user?.taluka?.name_en
                  ? `${user.taluka.name_en} Rural Region`
                  : 'Chikhli & Navsari Rural Region'}
              </Text>
            </View>
            <View
              style={[
                styles.talukaLeadBadge,
                { backgroundColor: colors.primaryContainer },
              ]}
            >
              <Ionicons
                name="shield-checkmark"
                size={13}
                color={colors.primary}
              />
              <Text style={[styles.talukaLeadText, { color: colors.primary }]}>
                {language === 'gu' ? 'તાલુકા પ્રમુખ' : 'Taluka Lead'}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Key Metrics 4-Box Matrix (Real Dynamic Data, Zero Static Numbers) */}
        <View style={styles.metricsGrid}>
          {/* Box 1: Assigned */}
          <View
            style={[
              styles.metricCard,
              { backgroundColor: colors.surfaceSubtle },
            ]}
          >
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {assignedActiveCount}
            </Text>
            <Text style={[styles.metricLabelSingle, { color: colors.text }]}>
              {language === 'gu' ? 'સોંપેલ કેસ' : 'Assigned'}
            </Text>
          </View>

          {/* Box 2: Urgent SOS */}
          <View
            style={[
              styles.metricCard,
              { backgroundColor: colors.errorContainer },
            ]}
          >
            {urgentCount > 0 && (
              <View
                style={[
                  styles.urgentIndicatorDot,
                  { backgroundColor: colors.error },
                ]}
              />
            )}
            <Text style={[styles.metricValue, { color: colors.error }]}>
              {urgentCount}
            </Text>
            <Text style={[styles.metricLabelSingle, { color: colors.error }]}>
              {language === 'gu' ? 'તાકીદના' : 'Urgent'}
            </Text>
          </View>

          {/* Box 3: In Progress */}
          <View
            style={[
              styles.metricCard,
              { backgroundColor: colors.secondaryContainer },
            ]}
          >
            <Text
              style={[
                styles.metricValue,
                { color: colors.onSecondaryContainer },
              ]}
            >
              {inProgressCount}
            </Text>
            <Text
              style={[
                styles.metricLabelSingle,
                { color: colors.onSecondaryContainer },
              ]}
            >
              {language === 'gu' ? 'ચાલુ તપાસ' : 'In Progress'}
            </Text>
          </View>

          {/* Box 4: Resolved */}
          <View
            style={[
              styles.metricCard,
              { backgroundColor: colors.primaryContainer },
            ]}
          >
            <Text
              style={[styles.metricValue, { color: colors.onPrimaryContainer }]}
            >
              {resolvedCount}
            </Text>
            <Text
              style={[
                styles.metricLabelSingle,
                { color: colors.onPrimaryContainer },
              ]}
            >
              {language === 'gu' ? 'ઉકેલાયેલ' : 'Resolved'}
            </Text>
          </View>
        </View>

        {/* 3. Field Utility Quick Actions Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionStrip}
        >
          {/* Action 1: Add Field Visit Note */}
          <TouchableOpacity
            onPress={onOpenList}
            style={[
              styles.utilityBtn,
              { backgroundColor: colors.surfaceSubtle },
            ]}
          >
            <View
              style={[
                styles.utilityIcon,
                { backgroundColor: colors.primaryContainer },
              ]}
            >
              <Ionicons
                name="location-outline"
                size={16}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.utilityBtnText, { color: colors.text }]}>
              {language === 'gu' ? 'સ્થળ મુલાકાત નોંધ' : 'Field Visit Note'}
            </Text>
          </TouchableOpacity>

          {/* Action 2: View Assigned Requests */}
          <TouchableOpacity
            onPress={onOpenList}
            style={[
              styles.utilityBtn,
              { backgroundColor: colors.surfaceSubtle },
            ]}
          >
            <View
              style={[
                styles.utilityIcon,
                { backgroundColor: colors.secondaryContainer },
              ]}
            >
              <Ionicons name="clipboard" size={16} color={colors.primary} />
            </View>
            <Text
              style={[
                styles.utilityBtnText,
                { color: colors.text, fontWeight: '700' },
              ]}
            >
              {language === 'gu' ? 'સોંપાયેલ અરજીઓ' : 'Assigned Requests'}
            </Text>
          </TouchableOpacity>

          {/* Action 3: Offline Sync */}
          <View
            style={[
              styles.utilityBtn,
              { backgroundColor: colors.surfaceSubtle },
            ]}
          >
            <Ionicons name="cloud-done" size={16} color={colors.primary} />
            <Text style={[styles.utilityBtnText, { color: colors.textMuted }]}>
              {language === 'gu' ? 'લાઇવ સિંક સક્રિય' : 'Live Sync Active'}
            </Text>
          </View>
        </ScrollView>

        {/* 4. Priority Alert Section Header */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <View
              style={[styles.pingPulseDot, { backgroundColor: colors.error }]}
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {language === 'gu' ? 'અતિ મહત્વપૂર્ણ કામગીરી' : 'Urgent Tasks'}
            </Text>
          </View>
          <TouchableOpacity onPress={onOpenList}>
            <Text style={[styles.sectionSubtitle, { color: colors.primary }]}>
              {language === 'gu' ? 'બધા જુઓ' : 'View All'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 6. Dynamic Cases Feed from Backend */}
        <View style={styles.feedContainer}>
          {cases.slice(0, 3).map((app, idx) => (
            <TouchableOpacity
              key={app.id || idx}
              activeOpacity={0.9}
              onPress={() => onOpen(app)}
              style={[styles.feedCard, { backgroundColor: colors.surface }]}
            >
              <View
                style={[
                  styles.cardRibbon,
                  {
                    backgroundColor:
                      app.urgency === 'urgent' ? colors.error : colors.primary,
                  },
                ]}
              />
              <View style={styles.feedCardTop}>
                <View style={styles.badgeGroup}>
                  <View
                    style={[
                      styles.pillBadge,
                      {
                        backgroundColor:
                          app.urgency === 'urgent'
                            ? colors.errorContainer
                            : colors.primaryContainer,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillBadgeText,
                        {
                          color:
                            app.urgency === 'urgent'
                              ? colors.error
                              : colors.primary,
                        },
                      ]}
                    >
                      {app.urgency === 'urgent'
                        ? language === 'gu'
                          ? 'તાકીદનું'
                          : 'Urgent'
                        : language === 'gu'
                        ? 'સામાન્ય'
                        : 'Normal'}
                    </Text>
                  </View>
                  <Text style={[styles.caseCode, { color: colors.secondary }]}>
                    #{app.case_no}
                  </Text>
                </View>
                <View style={styles.timerRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={colors.textMuted}
                  />
                  <Text style={[styles.timerText, { color: colors.textMuted }]}>
                    {app.status}
                  </Text>
                </View>
              </View>

              <View style={styles.feedCardBody}>
                <View
                  style={[
                    styles.bloodTypeBox,
                    { backgroundColor: colors.surfaceSubtle },
                  ]}
                >
                  <Ionicons name="briefcase" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.feedCardTitle, { color: colors.text }]}>
                    {app.title}
                  </Text>
                  <Text
                    style={[styles.feedCardCitizen, { color: colors.text }]}
                  >
                    {app.user?.name || app.contact_name || 'Citizen'}
                  </Text>
                  <Text
                    style={[styles.feedCardLoc, { color: colors.textMuted }]}
                    numberOfLines={2}
                  >
                    {app.description}
                  </Text>
                </View>
              </View>

              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  onPress={() => onOpen(app)}
                  style={[
                    styles.callBtn,
                    { backgroundColor: colors.primary, flex: 1 },
                  ]}
                >
                  <Ionicons name="arrow-forward" size={16} color="#ffffff" />
                  <Text style={styles.callBtnText}>
                    {language === 'gu' ? 'વિગતો જુઓ' : 'Review Case'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* 7. Motivational Impact Footer Banner */}
        <View
          style={[styles.impactCard, { backgroundColor: colors.surfaceSubtle }]}
        >
          <View
            style={[styles.impactIconBox, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="sparkles" size={20} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.impactTitle, { color: colors.primary }]}>
              {language === 'gu'
                ? 'માનવસેવા એ જ પ્રભુસેવા'
                : 'Service to Humanity is Service to God'}
            </Text>
            <Text style={[styles.impactSub, { color: colors.textMuted }]}>
              {language === 'gu'
                ? 'તમારી સેવા થી આ મહિને ૪૫ પરિવારોને સીધો સહાય લાભ મળ્યો છે.'
                : 'Through your service, 45 families received direct support this month.'}
            </Text>
          </View>
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
  brandTitle: { fontSize: 18, fontWeight: '800' },
  roleBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  roleBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  brandSubtitle: { fontSize: 13 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langPill: { flexDirection: 'row', borderRadius: 999, padding: 2 },
  langTab: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  langText: { fontSize: 13, fontWeight: '700' },
  notifBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    position: 'absolute',
    top: 6,
    right: 6,
  },
  avatarBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '800' },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 60 },
  pendingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
  },
  pendingTitle: { fontSize: 15, fontWeight: '700' },
  pendingSub: { fontSize: 13 },
  heroCard: {
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  heroAvatarWrap: { position: 'relative' },
  heroAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarText: { fontSize: 20, fontWeight: '800' },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingTitle: { fontSize: 18, fontWeight: '800' },
  greetingRole: { fontSize: 13, fontWeight: '700' },
  dutyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  dutyDot: { width: 8, height: 8, borderRadius: 4 },
  dutyPillText: { fontSize: 13, fontWeight: '700' },
  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  regionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    flex: 1,
  },
  regionText: { fontSize: 13, fontWeight: '600' },
  talukaLeadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  talukaLeadText: { fontSize: 13, fontWeight: '700' },
  metricsGrid: { flexDirection: 'row', gap: 6 },
  metricCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  urgentIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 6,
    right: 6,
  },
  metricValue: { fontSize: 22, fontWeight: '800', lineHeight: 26 },
  metricLabelSingle: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  actionStrip: { gap: 8, paddingVertical: 4 },
  utilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  utilityIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilityBtnText: { fontSize: 14, fontWeight: '600' },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pingPulseDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  sectionSubtitle: { fontSize: 13, fontWeight: '700' },
  feedContainer: { gap: 12 },
  feedCard: {
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
  cardRibbon: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  feedCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pillBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  pillBadgeText: { fontSize: 12, fontWeight: '700' },
  caseCode: { fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timerText: { fontSize: 13, fontWeight: '600' },
  feedCardBody: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bloodTypeBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloodTypeLetter: { fontSize: 16, fontWeight: '800' },
  feedCardTitle: { fontSize: 16, fontWeight: '700', lineHeight: 20 },
  feedCardCitizen: { fontSize: 15, fontWeight: '600', marginTop: 2 },
  feedCardLoc: { fontSize: 13, marginTop: 2 },
  feedCardAlertDesc: { fontSize: 13, fontWeight: '600', marginTop: 3 },
  citizenContactStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
  },
  contactName: { fontSize: 14, fontWeight: '700' },
  contactPhone: { fontSize: 13 },
  tagPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tagPillText: { fontSize: 12, fontWeight: '600' },
  cardActionsRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  callBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  callBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  statusUpdateBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statusUpdateText: { fontSize: 15, fontWeight: '700' },
  impactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  impactIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  impactTitle: { fontSize: 15, fontWeight: '800' },
  impactSub: { fontSize: 13, marginTop: 1 },
});
