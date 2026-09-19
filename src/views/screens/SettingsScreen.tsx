import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSettingsViewModel } from '../../viewmodels/useSettingsViewModel';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { Header } from '../components/Header';

export const SettingsScreen: React.FC = () => {
  const { theme, isDark, toggleDarkMode } = useAppTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const { locale, switchLanguage, supportedLocales, t } = useTranslation();

  const { queuedItems, isSyncing, syncStatusMessage, syncQueue, clearQueue } =
    useSettingsViewModel();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={t('settings.title', 'Settings & Preferences')}
        showLanguageToggle={false}
        showThemeToggle={false}
      />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing.md }]}
      >
        {/* Language Selection */}
        <View
          style={[
            styles.card,
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
              styles.cardTitle,
              { color: colors.text, fontSize: typography.fontSizeBase },
            ]}
          >
            🌐 {t('settings.language', 'Application Language')}
          </Text>

          <View
            style={[
              styles.optionsRow,
              { marginTop: spacing.sm, gap: spacing.sm },
            ]}
          >
            {supportedLocales.map(loc => {
              const isSelected = locale === loc.code;
              return (
                <TouchableOpacity
                  key={loc.code}
                  activeOpacity={0.8}
                  onPress={() => switchLanguage(loc.code)}
                  style={[
                    styles.optionBtn,
                    {
                      backgroundColor: isSelected
                        ? colors.primary
                        : colors.surfaceSubtle,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderRadius: borderRadius.md,
                      paddingVertical: spacing.sm,
                      paddingHorizontal: spacing.md,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: isSelected ? colors.textInverse : colors.text,
                        fontSize: typography.fontSizeSm,
                      },
                    ]}
                  >
                    {loc.nativeLabel} ({loc.label})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Appearance & Dark Mode */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.lg,
              padding: spacing.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <Text
              style={[
                styles.cardTitle,
                { color: colors.text, fontSize: typography.fontSizeBase },
              ]}
            >
              🎨 {t('settings.appearance', 'Appearance & Theme')}
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={toggleDarkMode}
              style={[
                styles.themeToggleBtn,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                  borderRadius: borderRadius.full,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.text,
                  fontSize: typography.fontSizeXs,
                  fontWeight: '700',
                }}
              >
                {isDark
                  ? `☀️ ${t('settings.light_mode', 'Light')}`
                  : `🌙 ${t('settings.dark_mode', 'Dark')}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Offline Sync Queue Card */}
        <View
          style={[
            styles.card,
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
              styles.cardTitle,
              { color: colors.text, fontSize: typography.fontSizeBase },
            ]}
          >
            💾 {t('settings.offline_queue', 'Offline Sync Queue')}
          </Text>

          <Text
            style={[
              styles.queueCountText,
              {
                color: colors.textMuted,
                fontSize: typography.fontSizeSm,
                marginVertical: spacing.xs,
              },
            ]}
          >
            બાકી રહેલી અરજીઓ (Pending items): {queuedItems.length}
          </Text>

          {syncStatusMessage && (
            <Text
              style={[
                styles.syncMessage,
                {
                  color: colors.primary,
                  fontSize: typography.fontSizeXs,
                  marginBottom: spacing.xs,
                },
              ]}
            >
              {syncStatusMessage}
            </Text>
          )}

          <View
            style={[
              styles.actionsRow,
              { marginTop: spacing.sm, gap: spacing.sm },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={syncQueue}
              disabled={isSyncing || queuedItems.length === 0}
              style={[
                styles.syncBtn,
                {
                  backgroundColor:
                    queuedItems.length > 0 ? colors.primary : colors.border,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                },
              ]}
            >
              {isSyncing ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <Text
                  style={[
                    styles.syncBtnText,
                    {
                      color: colors.textInverse,
                      fontSize: typography.fontSizeSm,
                    },
                  ]}
                >
                  {t('action.sync_now', 'Sync Now')}
                </Text>
              )}
            </TouchableOpacity>

            {queuedItems.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={clearQueue}
                style={[
                  styles.clearBtn,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.clearBtnText,
                    {
                      color: colors.statusRejected,
                      fontSize: typography.fontSizeSm,
                    },
                  ]}
                >
                  {t('action.cancel', 'Clear')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* About GGVT */}
        <View
          style={[
            styles.card,
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
              styles.cardTitle,
              { color: colors.text, fontSize: typography.fontSizeBase },
            ]}
          >
            🏛️ {t('settings.about', 'About GGVT')}
          </Text>

          <Text
            style={[
              styles.aboutDesc,
              {
                color: colors.textMuted,
                fontSize: typography.fontSizeXs,
                marginTop: spacing.xs,
              },
            ]}
          >
            {t(
              'settings.about_desc',
              'Global Gramin Vikas Trust is dedicated to the empowerment and welfare of tribal communities through transparent, accountable grassroots support.',
            )}
          </Text>

          <View
            style={[
              styles.appVersionRow,
              { marginTop: spacing.md, borderTopColor: colors.borderSubtle },
            ]}
          >
            <Text
              style={[
                styles.versionText,
                { color: colors.textMuted, fontSize: 11 },
              ]}
            >
              Tribal Helping Hand v1.0.0 • Mobile Client
            </Text>
          </View>
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
    paddingBottom: 40,
  },
  card: {
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontWeight: '800',
  },
  optionsRow: {
    flexDirection: 'row',
  },
  optionBtn: {
    borderWidth: 1,
  },
  optionText: {
    fontWeight: '700',
  },
  themeToggleBtn: {
    borderWidth: 1,
  },
  queueCountText: {
    fontWeight: '500',
  },
  syncMessage: {
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncBtnText: {
    fontWeight: '800',
  },
  clearBtn: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontWeight: '700',
  },
  aboutDesc: {
    lineHeight: 18,
  },
  appVersionRow: {
    borderTopWidth: 1,
    paddingTop: 8,
  },
  versionText: {
    fontFamily: 'monospace',
  },
});
