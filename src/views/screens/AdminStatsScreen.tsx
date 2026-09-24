import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { Header } from '../components/Header';
import { helperService, DeskMetrics } from '../../services/helperService';

export const AdminStatsScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const { colors, typography } = theme;
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<DeskMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await helperService.dashboard();
      setMetrics(res.data);
    } catch {
      setMetrics(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cards = [
    [
      t('dashboard.stats.total', 'Open cases'),
      metrics?.assigned_active_cases ?? 0,
    ],
    [t('dashboard.stats.resolved', 'Resolved'), metrics?.resolved_cases ?? 0],
    [
      t('status.awaiting_confirmation', 'Awaiting confirm'),
      metrics?.awaiting_confirmation ?? 0,
    ],
    [t('urgency.urgent', 'Urgent'), metrics?.urgency?.urgent ?? 0],
    [
      t('appointments.today', 'Follow-ups today'),
      metrics?.follow_ups_due_today ?? 0,
    ],
    [
      t('dashboard.stats.sla', 'SLA breached'),
      metrics?.sla_breached_cases ?? 0,
    ],
  ] as const;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <Header />
      <Text
        style={[
          styles.title,
          { color: colors.text, fontSize: typography.fontSizeLg },
        ]}
      >
        {t('nav.stats', 'Desk stats')}
      </Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.grid}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              colors={[colors.primary]}
            />
          }
        >
          {cards.map(([label, value]) => (
            <View
              key={label}
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 11,
                  fontWeight: '700',
                }}
              >
                {label.toUpperCase()}
              </Text>
              <Text
                style={{
                  color: colors.secondary,
                  fontSize: 28,
                  fontWeight: '800',
                }}
              >
                {value}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  title: { fontWeight: '800', paddingHorizontal: 16, marginTop: 8 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 10,
  },
  card: {
    width: '47%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
});
