import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useTrackerViewModel } from '../../viewmodels/useTrackerViewModel';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { UrgencyBadge } from '../components/UrgencyBadge';

interface CaseTrackerScreenProps {
  initialCaseNo?: string | null;
  onBack?: () => void;
}

export const CaseTrackerScreen: React.FC<CaseTrackerScreenProps> = ({
  initialCaseNo,
  onBack,
}) => {
  const { theme } = useAppTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const { t } = useTranslation();

  const {
    caseNoQuery,
    setCaseNoQuery,
    trackedApplication,
    isSearching,
    hasSearched,
    errorMessage,
    searchCase,
    otp,
    setOtp,
    requestOtp,
  } = useTrackerViewModel();

  useEffect(() => {
    if (initialCaseNo) {
      setCaseNoQuery(initialCaseNo);
      searchCase(initialCaseNo);
    }
  }, [initialCaseNo, searchCase, setCaseNoQuery]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title={t('tracker.title', 'Case Tracker')} onBackPress={onBack} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing.md }]}
      >
        {/* Search Bar */}
        <View
          style={[
            styles.searchCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.lg,
              padding: spacing.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          <Text
            style={[
              styles.inputLabel,
              { color: colors.textMuted, fontSize: typography.fontSizeXs },
            ]}
          >
            {t('tracker.placeholder', 'Enter Case ID (e.g. THH-2026-00001)')}
          </Text>

          <View style={styles.searchRow}>
            <TextInput
              value={caseNoQuery}
              onChangeText={setCaseNoQuery}
              placeholder="THH-2026-00001"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              style={[
                styles.searchInput,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                  color: colors.text,
                  borderRadius: borderRadius.md,
                  padding: spacing.sm,
                  fontSize: typography.fontSizeBase,
                },
              ]}
            />
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => searchCase()}
              disabled={isSearching}
              style={[
                styles.searchBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.lg,
                },
              ]}
            >
              {isSearching ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <Text
                  style={[
                    styles.searchBtnText,
                    {
                      color: colors.textInverse,
                      fontSize: typography.fontSizeSm,
                    },
                  ]}
                >
                  {t('action.track', 'Track')}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <TextInput
            value={otp}
            onChangeText={setOtp}
            placeholder={t('tracker.otp', 'Email OTP (if not logged in)')}
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            style={[
              styles.searchInput,
              {
                backgroundColor: colors.surfaceSubtle,
                borderColor: colors.border,
                color: colors.text,
                borderRadius: borderRadius.md,
                padding: spacing.sm,
                fontSize: typography.fontSizeBase,
                marginTop: spacing.sm,
              },
            ]}
          />
          <TouchableOpacity
            onPress={requestOtp}
            style={{ marginTop: spacing.sm }}
          >
            <Text
              style={{ color: colors.primary, fontSize: typography.fontSizeSm }}
            >
              {t('tracker.sendOtp', 'Send OTP to application email')}
            </Text>
          </TouchableOpacity>

          {errorMessage && (
            <Text
              style={[
                styles.errorText,
                {
                  color: colors.statusRejected,
                  fontSize: typography.fontSizeXs,
                  marginTop: spacing.sm,
                },
              ]}
            >
              {errorMessage}
            </Text>
          )}
        </View>

        {/* Search Result */}
        {trackedApplication && (
          <View style={styles.resultContainer}>
            <View
              style={[
                styles.caseCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: borderRadius.lg,
                  padding: spacing.md,
                  marginBottom: spacing.md,
                  shadowColor: colors.cardShadow,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.12,
                  shadowRadius: 6,
                  elevation: 3,
                },
              ]}
            >
              {/* Header Case ID and Badges */}
              <View style={styles.cardHeader}>
                <View>
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 12,
                      textTransform: 'uppercase',
                      fontWeight: '700',
                    }}
                  >
                    Application ID
                  </Text>
                  <Text
                    style={[
                      styles.caseNo,
                      {
                        color: colors.primary,
                        fontSize: typography.fontSizeLg,
                        fontWeight: '900',
                        fontFamily: 'monospace',
                      },
                    ]}
                  >
                    {trackedApplication.case_no}
                  </Text>
                </View>
                <StatusBadge status={trackedApplication.status} />
              </View>

              {/* SLA Deadline Notice if applicable */}
              {trackedApplication.sla_due_at ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.primary + '12',
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 4,
                    borderRadius: borderRadius.sm,
                    marginVertical: spacing.xs,
                    alignSelf: 'flex-start',
                  }}
                >
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={colors.primary}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 13,
                      fontWeight: '700',
                    }}
                  >
                    Target SLA Resolution:{' '}
                    {new Date(
                      trackedApplication.sla_due_at,
                    ).toLocaleDateString()}
                  </Text>
                </View>
              ) : null}

              {/* Title & Category */}
              <View style={{ marginVertical: spacing.xs }}>
                <Text
                  style={[
                    styles.title,
                    {
                      color: colors.text,
                      fontSize: typography.fontSizeLg,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {trackedApplication.title}
                </Text>
                {trackedApplication.category?.slug ? (
                  <View
                    style={{
                      backgroundColor: colors.surfaceSubtle,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: borderRadius.sm,
                      alignSelf: 'flex-start',
                      marginTop: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: 13,
                        fontWeight: '600',
                      }}
                    >
                      📁{' '}
                      {trackedApplication.category.name_gu ||
                        trackedApplication.category.slug.toUpperCase()}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Problem Description */}
              {trackedApplication.description ? (
                <View
                  style={{
                    backgroundColor: colors.surfaceSubtle,
                    padding: spacing.sm,
                    borderRadius: borderRadius.md,
                    marginVertical: spacing.xs,
                  }}
                >
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 12,
                      textTransform: 'uppercase',
                      fontWeight: '700',
                      marginBottom: 2,
                    }}
                  >
                    Requirement Details / વિગત
                  </Text>
                  <Text
                    style={[
                      styles.desc,
                      {
                        color: colors.text,
                        fontSize: typography.fontSizeSm,
                        lineHeight: 22,
                      },
                    ]}
                  >
                    {trackedApplication.description}
                  </Text>
                </View>
              ) : null}

              {/* Citizen / Beneficiary Info (if available) */}
              {(trackedApplication.user?.name ||
                trackedApplication.beneficiary_name) && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surfaceSubtle,
                    padding: spacing.sm,
                    borderRadius: borderRadius.md,
                    marginVertical: spacing.xs,
                  }}
                >
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={colors.primary}
                    style={{ marginRight: 6 }}
                  />
                  <View>
                    <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                      Applicant / Beneficiary
                    </Text>
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: typography.fontSizeXs,
                        fontWeight: '700',
                      }}
                    >
                      {trackedApplication.user?.name ||
                        trackedApplication.beneficiary_name}
                      {trackedApplication.user?.phone ||
                      trackedApplication.beneficiary_phone
                        ? ` · ${
                            trackedApplication.user?.phone ||
                            trackedApplication.beneficiary_phone
                          }`
                        : ''}
                    </Text>
                  </View>
                </View>
              )}

              {/* 📍 Location & Live Location Pin Card */}
              <View
                style={{
                  backgroundColor: trackedApplication.lat
                    ? colors.secondary + '10'
                    : colors.surfaceSubtle,
                  borderColor: trackedApplication.lat
                    ? colors.secondary
                    : colors.border,
                  borderWidth: 1,
                  borderRadius: borderRadius.md,
                  padding: spacing.sm,
                  marginVertical: spacing.xs,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons
                      name="location"
                      size={18}
                      color={
                        trackedApplication.lat
                          ? colors.secondary
                          : colors.primary
                      }
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 14,
                        fontWeight: '700',
                      }}
                    >
                      📍 {t('wizard.village', 'Location & Village')}
                    </Text>
                  </View>
                  {trackedApplication.lat ? (
                    <View
                      style={{
                        backgroundColor: colors.secondary + '20',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 999,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.secondary,
                          fontSize: 12,
                          fontWeight: '700',
                        }}
                      >
                        ● GPS PINNED
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Text
                  style={{
                    color: colors.text,
                    fontSize: typography.fontSizeSm,
                    fontWeight: '600',
                    marginTop: 4,
                  }}
                >
                  {trackedApplication.village?.name_gu ||
                    trackedApplication.village?.name_en ||
                    'Dang Region'}
                  {trackedApplication.taluka?.name_gu ||
                  trackedApplication.taluka?.name_en
                    ? `, ${
                        trackedApplication.taluka?.name_gu ||
                        trackedApplication.taluka?.name_en
                      }`
                    : ''}
                  {trackedApplication.district?.name_gu ||
                  trackedApplication.district?.name_en
                    ? `, ${
                        trackedApplication.district?.name_gu ||
                        trackedApplication.district?.name_en
                      }`
                    : ''}
                </Text>

                {trackedApplication.lat && trackedApplication.lng ? (
                  <View
                    style={{
                      marginTop: 6,
                      paddingTop: 6,
                      borderTopColor: colors.border,
                      borderTopWidth: 1,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 13,
                        fontFamily: 'monospace',
                        fontWeight: '700',
                      }}
                    >
                      Coordinates: {Number(trackedApplication.lat).toFixed(5)}°
                      N, {Number(trackedApplication.lng).toFixed(5)}° E
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() =>
                        Linking.openURL(
                          `https://www.google.com/maps?q=${trackedApplication.lat},${trackedApplication.lng}`,
                        )
                      }
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: colors.secondary,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 5,
                        borderRadius: borderRadius.sm,
                        marginTop: 6,
                        alignSelf: 'flex-start',
                      }}
                    >
                      <Ionicons
                        name="map"
                        size={13}
                        color="#ffffff"
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={{
                          color: '#ffffff',
                          fontSize: 13,
                          fontWeight: '700',
                        }}
                      >
                        Open Pin in Google Maps / Directions →
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              {/* Urgency and Submission Date Footer */}
              <View
                style={[
                  styles.metaRow,
                  {
                    borderTopColor: colors.borderSubtle,
                    paddingTop: spacing.xs,
                    marginTop: spacing.xs,
                  },
                ]}
              >
                <UrgencyBadge urgency={trackedApplication.urgency} />
                <Text
                  style={[
                    styles.dateText,
                    {
                      color: colors.textMuted,
                      fontSize: typography.fontSizeXs,
                    },
                  ]}
                >
                  Submitted:{' '}
                  {trackedApplication.created_at
                    ? new Date(
                        trackedApplication.created_at,
                      ).toLocaleDateString()
                    : '-'}
                </Text>
              </View>
            </View>

            {/* Timeline Progress */}
            <View
              style={[
                styles.timelineCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: borderRadius.lg,
                  padding: spacing.md,
                },
              ]}
            >
              <Text
                style={[
                  styles.timelineTitle,
                  { color: colors.text, fontSize: typography.fontSizeBase },
                ]}
              >
                ⏳ {t('tracker.timeline_title', 'Audit & Progress Timeline')}
              </Text>

              {trackedApplication.timeline_events &&
              trackedApplication.timeline_events.length > 0 ? (
                <View style={{ marginTop: spacing.md }}>
                  {trackedApplication.timeline_events.map((ev, index) => (
                    <View key={ev.id || index} style={styles.timelineRow}>
                      <View style={styles.timelineIconCol}>
                        <View
                          style={[
                            styles.timelineDot,
                            {
                              backgroundColor:
                                index === 0 ? colors.primary : colors.secondary,
                              borderColor: colors.border,
                            },
                          ]}
                        />
                        {index <
                          trackedApplication.timeline_events!.length - 1 && (
                          <View
                            style={[
                              styles.timelineLine,
                              { backgroundColor: colors.border },
                            ]}
                          />
                        )}
                      </View>

                      <View
                        style={[
                          styles.timelineContent,
                          { marginBottom: spacing.md },
                        ]}
                      >
                        <Text
                          style={[
                            styles.timelineEventTitle,
                            {
                              color: colors.text,
                              fontSize: typography.fontSizeSm,
                            },
                          ]}
                        >
                          {ev.title_key
                            ? t(ev.title_key, ev.event_type)
                            : ev.event_type}
                        </Text>
                        {ev.body ? (
                          <Text
                            style={[
                              styles.timelineEventBody,
                              {
                                color: colors.textMuted,
                                fontSize: typography.fontSizeXs,
                              },
                            ]}
                          >
                            {ev.body}
                          </Text>
                        ) : null}
                        <Text
                          style={[
                            styles.timelineEventDate,
                            { color: colors.textMuted, fontSize: 12 },
                          ]}
                        >
                          {ev.created_at
                            ? new Date(ev.created_at).toLocaleString()
                            : '-'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text
                  style={[
                    styles.noTimeline,
                    {
                      color: colors.textMuted,
                      fontSize: typography.fontSizeXs,
                      marginTop: spacing.sm,
                    },
                  ]}
                >
                  અરજી સફળતાપૂર્વક સિસ્ટમમાં નોંધાઈ છે. આગળની કાર્યવાહી
                  પ્રગતિમાં છે.
                </Text>
              )}
            </View>
          </View>
        )}

        {hasSearched &&
          !trackedApplication &&
          !isSearching &&
          !errorMessage && (
            <View
              style={[
                styles.notFoundCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: borderRadius.lg,
                  padding: spacing.xl,
                },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={40}
                color={colors.textMuted}
                style={{ textAlign: 'center', marginBottom: 8 }}
              />
              <Text
                style={[
                  styles.notFoundText,
                  { color: colors.textMuted, fontSize: typography.fontSizeSm },
                ]}
              >
                {t(
                  'tracker.not_found',
                  'No application found with this Case ID. Please check the number.',
                )}
              </Text>
            </View>
          )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  searchCard: {
    borderWidth: 1,
  },
  inputLabel: {
    fontWeight: '700',
    marginBottom: 6,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  searchBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    fontWeight: '800',
  },
  errorText: {
    fontWeight: '600',
  },
  resultContainer: {},
  caseCard: {
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  caseNo: {
    fontFamily: 'monospace',
    fontWeight: '900',
  },
  title: {
    fontWeight: '800',
  },
  desc: {
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    marginTop: 8,
  },
  dateText: {
    fontWeight: '500',
  },
  timelineCard: {
    borderWidth: 1,
  },
  timelineTitle: {
    fontWeight: '800',
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineIconCol: {
    alignItems: 'center',
    width: 20,
    marginRight: 10,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
  },
  timelineEventTitle: {
    fontWeight: '700',
  },
  timelineEventBody: {
    marginTop: 2,
    lineHeight: 18,
  },
  timelineEventDate: {
    marginTop: 4,
  },
  noTimeline: {
    fontStyle: 'italic',
  },
  notFoundCard: {
    borderWidth: 1,
    alignItems: 'center',
  },
  notFoundText: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
