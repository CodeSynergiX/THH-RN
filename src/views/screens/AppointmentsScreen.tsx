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
import {
  applicationService,
  AppointmentRow,
} from '../../services/applicationService';
import { unwrapList } from '../../services/helperService';

interface Props {
  onOpenCase: (caseNo: string) => void;
}

export const AppointmentsScreen: React.FC<Props> = ({ onOpenCase }) => {
  const { theme } = useAppTheme();
  const { colors, typography } = theme;
  const { t } = useTranslation();
  const [rows, setRows] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await applicationService.getAppointments();
      setRows(unwrapList<AppointmentRow>(res.data));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
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
        {t('nav.appointments', 'Appointments')}
      </Text>
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
              {t('appointments.empty', 'No visits scheduled.')}
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                item.application?.case_no &&
                onOpenCase(item.application.case_no)
              }
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.caseNo, { color: colors.primary }]}>
                {item.application?.case_no}
              </Text>
              <Text style={[styles.caseTitle, { color: colors.text }]}>
                {item.application?.title}
              </Text>
              <Text
                style={{ color: colors.textMuted, marginTop: 6, fontSize: 13 }}
              >
                {item.scheduled_for
                  ? new Date(item.scheduled_for).toLocaleString()
                  : ''}
                {item.assignee?.name ? ` · ${item.assignee.name}` : ''} ·{' '}
                {item.status}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  title: {
    fontWeight: '800',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  caseNo: { fontWeight: '800', fontFamily: 'monospace' },
  caseTitle: { fontWeight: '700', marginTop: 4 },
});
