import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { Header } from '../components/Header';
import { ApplicationCard } from '../components/ApplicationCard';
import { applicationService } from '../../services/applicationService';
import {
  Application,
  ApplicationUrgency,
} from '../../models/application.model';

interface Props {
  onOpenCase: (caseNo: string) => void;
}

const FILTERS: Array<{ key: 'all' | ApplicationUrgency; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
];

export const StaffQueueScreen: React.FC<Props> = ({ onOpenCase }) => {
  const { theme } = useAppTheme();
  const { colors, typography } = theme;
  const { t } = useTranslation();
  const [urgency, setUrgency] = useState<'all' | ApplicationUrgency>('all');
  const [rows, setRows] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await applicationService.getQueue({
        urgency: urgency === 'all' ? undefined : urgency,
      });
      setRows(data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [urgency]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <Header />
      <Text
        style={[
          styles.title,
          { color: colors.text, fontSize: typography.fontSizeLg },
        ]}
      >
        {t('nav.queue', 'Queue')}
      </Text>
      <View style={styles.filters}>
        {FILTERS.map(filter => {
          const active = urgency === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setUrgency(filter.key)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.secondary : colors.surface,
                  borderColor: active ? colors.secondary : colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: active ? '#fff' : colors.text,
                  fontWeight: '700',
                  fontSize: 14,
                }}
              >
                {t(`urgency.${filter.key}`, filter.label)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
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
          ListEmptyComponent={
            <Text style={{ color: colors.textMuted, textAlign: 'center' }}>
              {t('queue.empty', 'No cases in this urgency.')}
            </Text>
          }
          renderItem={({ item }) => (
            <ApplicationCard
              application={item}
              onPress={() => onOpenCase(item.case_no)}
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  title: { fontWeight: '800', paddingHorizontal: 16, marginTop: 8 },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
