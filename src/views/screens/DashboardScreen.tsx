import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useDashboardViewModel } from '../../viewmodels/useDashboardViewModel';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { ApplicationCard } from '../components/ApplicationCard';
import { OfflineBanner } from '../components/OfflineBanner';
import { Application } from '../../models/application.model';

interface DashboardScreenProps {
  onNavigateToWizard: () => void;
  onNavigateToCase: (app: Application) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToWizard,
  onNavigateToCase,
}) => {
  const { theme } = useAppTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const { t } = useTranslation();

  const {
    stats,
    recentApplications,
    pendingOfflineCount,
    isLoading,
    isRefreshing,
    refreshDashboard,
    syncOfflineQueue,
  } = useDashboardViewModel();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshDashboard}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Offline Banner */}
        <OfflineBanner
          count={pendingOfflineCount}
          onSyncPress={syncOfflineQueue}
        />

        {/* Hero Banner with Quick Action */}
        <View
          style={[
            styles.heroBanner,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.lg,
              marginHorizontal: spacing.md,
              marginBottom: spacing.md,
              padding: spacing.md,
            },
          ]}
        >
          <View style={styles.heroTextWrapper}>
            <Text
              style={[
                styles.heroTitle,
                { color: colors.text, fontSize: typography.fontSizeLg },
              ]}
            >
              {t('dashboard.title', 'Tribal Welfare Portal')}
            </Text>
            <Text
              style={[
                styles.heroSubtitle,
                { color: colors.textMuted, fontSize: typography.fontSizeXs },
              ]}
            >
              {t(
                'app.ngo',
                'Global Gramin Vikas Trust (GGVT) - Dedicated to tribal empowerment and welfare.',
              )}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onNavigateToWizard}
            style={[
              styles.quickActionBtn,
              {
                backgroundColor: colors.primary,
                borderRadius: borderRadius.md,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
              },
            ]}
          >
            <Text
              style={[
                styles.quickActionText,
                { color: colors.textInverse, fontSize: typography.fontSizeSm },
              ]}
            >
              + {t('dashboard.quick_request', 'Request Assistance')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Live DB Stats Cards (2x2 Grid) */}
        <View
          style={[
            styles.statsContainer,
            { paddingHorizontal: spacing.md, marginBottom: spacing.md },
          ]}
        >
          <View style={[styles.statsRow, { marginBottom: spacing.sm }]}>
            <StatCard
              title={t('dashboard.stats.total', 'Total Cases')}
              value={stats.total}
              highlightColor={colors.primary}
            />
            <View style={{ width: spacing.sm }} />
            <StatCard
              title={t('dashboard.stats.verification', 'In Verification')}
              value={stats.verification}
              highlightColor={colors.statusVerification}
            />
          </View>

          <View style={styles.statsRow}>
            <StatCard
              title={t('dashboard.stats.assistance', 'In Assistance')}
              value={stats.assistance}
              highlightColor={colors.statusAssistance}
            />
            <View style={{ width: spacing.sm }} />
            <StatCard
              title={t('dashboard.stats.resolved', 'Resolved')}
              value={stats.resolved}
              highlightColor={colors.statusResolved}
            />
          </View>
        </View>

        {/* Recent Applications Section */}
        <View
          style={[
            styles.sectionHeader,
            { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontSize: typography.fontSizeBase },
            ]}
          >
            {t('dashboard.recent_cases', 'Recent Applications')}
          </Text>
          <Text
            style={[
              styles.sectionCount,
              { color: colors.textMuted, fontSize: typography.fontSizeXs },
            ]}
          >
            ({recentApplications.length})
          </Text>
        </View>

        <View style={{ paddingHorizontal: spacing.md }}>
          {isLoading && !isRefreshing ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={{ marginVertical: 32 }}
            />
          ) : recentApplications.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: borderRadius.lg,
                  padding: spacing.xl,
                },
              ]}
            >
              <Text style={[styles.emptyIcon, { fontSize: 36 }]}>📋</Text>
              <Text
                style={[
                  styles.emptyText,
                  {
                    color: colors.textMuted,
                    fontSize: typography.fontSizeSm,
                    marginTop: spacing.sm,
                  },
                ]}
              >
                {t(
                  'dashboard.empty_cases',
                  'No cases recorded yet. Tap below to submit your first help request.',
                )}
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onNavigateToWizard}
                style={[
                  styles.emptyBtn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.lg,
                    marginTop: spacing.md,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.emptyBtnText,
                    {
                      color: colors.textInverse,
                      fontSize: typography.fontSizeSm,
                    },
                  ]}
                >
                  {t('nav.wizard', 'New Request')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            recentApplications.map(app => (
              <ApplicationCard
                key={app.id || app.case_no}
                application={app}
                onPress={() => onNavigateToCase(app)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 12,
  },
  heroBanner: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  heroTextWrapper: {
    marginBottom: 12,
  },
  heroTitle: {
    fontWeight: '800',
    marginBottom: 4,
  },
  heroSubtitle: {
    lineHeight: 18,
  },
  quickActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontWeight: '800',
  },
  statsContainer: {},
  statsRow: {
    flexDirection: 'row',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontWeight: '800',
  },
  sectionCount: {
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    textAlign: 'center',
  },
  emptyIcon: {
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {},
  emptyBtnText: {
    fontWeight: '800',
  },
});
