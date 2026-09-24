import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { Header } from '../components/Header';
import { ApplicationCard } from '../components/ApplicationCard';
import { helperService, unwrapList } from '../../services/helperService';
import { Application } from '../../models/application.model';

interface Props {
  onOpenCase: (caseNo: string) => void;
}

export const HelperQueueScreen: React.FC<Props> = ({ onOpenCase }) => {
  const { theme } = useAppTheme();
  const { colors, typography } = theme;
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [rows, setRows] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await helperService.cases(1);
      setRows(unwrapList<Application>(res.data));
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

  const accept = async (id: number) => {
    try {
      await helperService.accept(id);
      showToast(t('helper.accepted', 'Case accepted!'), 'success');
      load();
    } catch {
      showToast(
        t('helper.accept_failed', 'Could not accept this case.'),
        'error',
      );
    }
  };

  const requestConfirm = async (id: number) => {
    const resolution =
      note.trim() ||
      t(
        'helper.default_note',
        'Work completed. Waiting for the family to confirm.',
      );
    try {
      await helperService.resolve(id, resolution);
      setNote('');
      showToast(t('helper.resolve_sent', 'Confirmation requested!'), 'success');
      load();
    } catch (e) {
      showToast(
        e instanceof Error
          ? e.message
          : t('helper.resolve_failed', 'Could not request confirmation.'),
        'error',
        t('helper.resolve_failed', 'Could not request confirmation.'),
      );
    }
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <Header />
      <Text
        style={[
          styles.title,
          { color: colors.text, fontSize: typography.fontSizeLg },
        ]}
      >
        {t('nav.assigned', 'Assigned')}
      </Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder={t(
          'helper.note_placeholder',
          'Note when asking the citizen to confirm',
        )}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.note,
          {
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: colors.surface,
          },
        ]}
      />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
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
              {t('helper.empty', 'No cases assigned to you yet.')}
            </Text>
          }
          renderItem={({ item }) => (
            <View style={{ marginBottom: 12 }}>
              <ApplicationCard
                application={item}
                onPress={() => onOpenCase(item.case_no)}
              />
              <View style={styles.actions}>
                {item.status === 'assigned' && (
                  <TouchableOpacity
                    onPress={() => accept(item.id)}
                    style={[styles.btn, { backgroundColor: colors.secondary }]}
                  >
                    <Text style={styles.btnText}>
                      {t('helper.accept', 'Accept')}
                    </Text>
                  </TouchableOpacity>
                )}
                {['assistance', 'follow_up', 'followUp'].includes(
                  item.status,
                ) && (
                  <TouchableOpacity
                    onPress={() => requestConfirm(item.id)}
                    style={[styles.btn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.btnText}>
                      {t('helper.request_confirm', 'Ask user to confirm')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  title: { fontWeight: '800', paddingHorizontal: 16, marginTop: 8 },
  note: {
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  btn: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
