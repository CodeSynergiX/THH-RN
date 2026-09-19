import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTrackerViewModel } from '../../viewmodels/useTrackerViewModel';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
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
            {/* Case Overview Card */}
            <View
              style={[
                styles.caseCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: borderRadius.lg,
                  padding: spacing.md,
                  marginBottom: spacing.md,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Text
                  style={[
                    styles.caseNo,
                    {
                      color: colors.primary,
                      fontSize: typography.fontSizeBase,
                    },
                  ]}
                >
                  {trackedApplication.case_no}
                </Text>
                <StatusBadge status={trackedApplication.status} />
              </View>

              <Text
                style={[
                  styles.title,
                  { color: colors.text, fontSize: typography.fontSizeLg },
                ]}
              >
                {trackedApplication.title}
              </Text>

              {trackedApplication.description ? (
                <Text
                  style={[
                    styles.desc,
                    {
                      color: colors.textMuted,
                      fontSize: typography.fontSizeSm,
                      marginVertical: spacing.xs,
                    },
                  ]}
                >
                  {trackedApplication.description}
                </Text>
              ) : null}

              <View
                style={[
                  styles.metaRow,
                  {
                    borderTopColor: colors.borderSubtle,
                    paddingTop: spacing.xs,
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
                            { color: colors.textMuted, fontSize: 10 },
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
              <Text
                style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}
              >
                🔍
              </Text>
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
    lineHeight: 18,
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
    lineHeight: 16,
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
    lineHeight: 20,
  },
});
