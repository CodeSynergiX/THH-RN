/**
 * SettingsScreen — iOS Settings-style drawer UI.
 *
 * Sections:
 *  1. Account (profile, role, edit)
 *  2. Preferences (language, theme, text size)
 *  3. Notifications (email, push, per-event toggles)
 *  4. Offline & Sync
 *  5. About
 *  6. Danger Zone (logout, delete account)
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsSection } from '../components/SettingsSection';
import {
  notificationService,
  NotificationPreferences,
} from '../../services/notificationService';

export const SettingsScreen: React.FC = () => {
  const { theme, toggleDarkMode, isDark } = useAppTheme();
  const { colors, typography } = theme;
  const { t, locale, supportedLocales, switchLanguage } = useTranslation();

  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [savingPref, setSavingPref] = useState<string | null>(null);

  // ─── Load notification preferences ───────────────────────────────────────
  const loadPrefs = useCallback(async () => {
    try {
      const res = await notificationService.getPreferences();
      if (res.success) setPrefs(res.data);
    } catch {
      // silently fail — show defaults
    } finally {
      setPrefsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  // ─── Update a single preference key ──────────────────────────────────────
  const updatePref = useCallback(
    async (key: keyof NotificationPreferences, val: boolean) => {
      if (!prefs) return;
      setSavingPref(key as string);
      const optimistic = { ...prefs, [key]: val };
      setPrefs(optimistic);
      try {
        const res = await notificationService.updatePreferences({ [key]: val });
        if (res.success) setPrefs(res.data);
        else setPrefs(prefs); // rollback
      } catch {
        setPrefs(prefs); // rollback
      } finally {
        setSavingPref(null);
      }
    },
    [prefs],
  );

  // ─── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      t('settings.logout_title', 'Log Out'),
      t('settings.logout_confirm', 'Are you sure you want to log out?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('settings.logout', 'Log Out'),
          style: 'destructive',
          onPress: () => {
            // AuthViewModel should handle this — placeholder
            Alert.alert('Logged Out', 'Goodbye!');
          },
        },
      ],
    );
  };

  // ─── Delete Account ───────────────────────────────────────────────────────
  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.delete_account', 'Delete Account'),
      t(
        'settings.delete_account_warn',
        'This will permanently delete your account and all data. This action cannot be undone.',
      ),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('settings.delete_confirm', 'Delete My Account'),
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Request Submitted',
              'Account deletion has been requested.',
            ),
        },
      ],
    );
  };

  const currentLocaleLabel =
    supportedLocales.find(l => l.code === locale)?.nativeLabel ?? locale;
  const themeLabel = isDark
    ? t('settings.theme_dark', 'Dark')
    : t('settings.theme_light', 'Light');

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text, fontSize: typography.fontSizeLg },
          ]}
        >
          {t('nav.settings', 'Settings')}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Section 1: Account ──────────────────────────────── */}
        <SettingsSection title={t('settings.section_account', 'Account')}>
          <SettingsRow
            icon="account-circle"
            iconBg={colors.primary + '15'}
            iconColor={colors.primary}
            label={t('settings.edit_profile', 'Edit Profile')}
            value={t('settings.edit_profile_hint', 'Name, phone, location')}
            onPress={() =>
              Alert.alert('Profile', 'Profile editing coming soon.')
            }
          />
          <SettingsRow
            icon="shield-account"
            iconBg="#0F766E20"
            iconColor="#0F766E"
            label={t('settings.my_applications', 'My Applications')}
            onPress={() =>
              Alert.alert('Applications', 'Navigate to applications.')
            }
          />
        </SettingsSection>

        {/* ─── Section 2: Preferences ─────────────────────────── */}
        <SettingsSection
          title={t('settings.section_preferences', 'Preferences')}
        >
          <SettingsRow
            icon="translate"
            iconBg="#7C3AED20"
            iconColor="#7C3AED"
            label={t('settings.language', 'Language')}
            value={currentLocaleLabel}
            onPress={() =>
              Alert.alert(
                'Language',
                'Select language:',
                supportedLocales.map(l => ({
                  text: l.nativeLabel ?? l.code,
                  onPress: () => switchLanguage(l.code),
                })),
              )
            }
          />
          <SettingsRow
            icon={isDark ? 'weather-night' : 'white-balance-sunny'}
            iconBg="#D9770620"
            iconColor="#D97706"
            label={t('settings.theme', 'Theme')}
            value={themeLabel}
            onPress={toggleDarkMode}
          />
        </SettingsSection>

        {/* ─── Section 3: Notifications ────────────────────────── */}
        <SettingsSection
          title={t('settings.section_notifications', 'Notifications')}
          footer={t(
            'settings.notifications_footer',
            'Per-event controls only apply when the channel is enabled.',
          )}
        >
          {prefsLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                {t('common.loading', 'Loading…')}
              </Text>
            </View>
          ) : (
            <>
              {/* Channel-level */}
              <SettingsRow
                icon="email-outline"
                iconBg="#0284C720"
                iconColor="#0284C7"
                label={t('settings.email_notifications', 'Email Notifications')}
                switchValue={prefs?.email_enabled ?? true}
                onSwitchChange={v => updatePref('email_enabled', v)}
                isLoading={savingPref === 'email_enabled'}
              />
              <SettingsRow
                icon="bell-outline"
                iconBg="#B4530920"
                iconColor={colors.primary}
                label={t('settings.push_notifications', 'Push Notifications')}
                switchValue={prefs?.push_enabled ?? true}
                onSwitchChange={v => updatePref('push_enabled', v)}
                isLoading={savingPref === 'push_enabled'}
              />

              {/* Per-event — Email */}
              {prefs?.email_enabled && (
                <>
                  <SettingsRow
                    icon="refresh"
                    iconBg="#64748B20"
                    iconColor="#64748B"
                    label={t(
                      'settings.email_case_status',
                      'Email: Status Changes',
                    )}
                    switchValue={prefs.email_case_status_change}
                    onSwitchChange={v =>
                      updatePref('email_case_status_change', v)
                    }
                    isLoading={savingPref === 'email_case_status_change'}
                  />
                  <SettingsRow
                    icon="account-arrow-right-outline"
                    iconBg="#0F766E20"
                    iconColor="#0F766E"
                    label={t('settings.email_assignment', 'Email: Assignments')}
                    switchValue={prefs.email_assignment}
                    onSwitchChange={v => updatePref('email_assignment', v)}
                    isLoading={savingPref === 'email_assignment'}
                  />
                  <SettingsRow
                    icon="clock-alert-outline"
                    iconBg="#D9770620"
                    iconColor="#D97706"
                    label={t(
                      'settings.email_follow_up',
                      'Email: Follow-up Reminders',
                    )}
                    switchValue={prefs.email_follow_up_due}
                    onSwitchChange={v => updatePref('email_follow_up_due', v)}
                    isLoading={savingPref === 'email_follow_up_due'}
                  />
                </>
              )}

              {/* Per-event — Push */}
              {prefs?.push_enabled && (
                <>
                  <SettingsRow
                    icon="message-alert-outline"
                    iconBg="#7C3AED20"
                    iconColor="#7C3AED"
                    label={t(
                      'settings.push_case_status',
                      'Push: Status Changes',
                    )}
                    switchValue={prefs.push_case_status_change}
                    onSwitchChange={v =>
                      updatePref('push_case_status_change', v)
                    }
                    isLoading={savingPref === 'push_case_status_change'}
                  />
                  <SettingsRow
                    icon="check-circle-outline"
                    iconBg="#15803D20"
                    iconColor="#15803D"
                    label={t('settings.push_resolved', 'Push: Case Resolved')}
                    switchValue={prefs.push_case_resolved}
                    onSwitchChange={v => updatePref('push_case_resolved', v)}
                    isLoading={savingPref === 'push_case_resolved'}
                  />
                </>
              )}
            </>
          )}
        </SettingsSection>

        {/* ─── Section 4: About ───────────────────────────────────── */}
        <SettingsSection title={t('settings.section_about', 'About')}>
          <SettingsRow
            icon="information-outline"
            iconBg="#0284C720"
            iconColor="#0284C7"
            label={t('settings.app_version', 'App Version')}
            value="1.0.0"
            showArrow={false}
          />
          <SettingsRow
            icon="shield-check-outline"
            iconBg="#15803D20"
            iconColor="#15803D"
            label={t('settings.privacy_policy', 'Privacy Policy')}
            onPress={() =>
              Alert.alert('Privacy Policy', 'Opening privacy policy…')
            }
          />
          <SettingsRow
            icon="file-document-outline"
            iconBg="#64748B20"
            iconColor="#64748B"
            label={t('settings.terms', 'Terms & Conditions')}
            onPress={() => Alert.alert('Terms', 'Opening terms…')}
          />
          <SettingsRow
            icon="headset"
            iconBg="#B4530920"
            iconColor={colors.primary}
            label={t('settings.contact_support', 'Contact Support')}
            onPress={() =>
              Alert.alert('Support', 'Contact GGVT helpline for assistance.')
            }
          />
        </SettingsSection>

        {/* ─── Section 5: Danger Zone ─────────────────────────────── */}
        <SettingsSection
          title={t('settings.section_danger', 'Account Actions')}
        >
          <SettingsRow
            icon="logout"
            iconBg="#DC262620"
            iconColor="#DC2626"
            label={t('settings.logout', 'Log Out')}
            isDestructive
            onPress={handleLogout}
          />
          <SettingsRow
            icon="delete-forever-outline"
            iconBg="#DC262620"
            iconColor="#DC2626"
            label={t('settings.delete_account', 'Delete My Account')}
            isDestructive
            onPress={handleDeleteAccount}
          />
        </SettingsSection>

        {/* Footer branding */}
        <View style={styles.brandFooter}>
          <Ionicons name="heart" size={14} color={colors.primary} />
          <Text
            style={[
              styles.brandText,
              { color: colors.textMuted, fontSize: typography.fontSizeXs },
            ]}
          >
            {' '}
            Global Gramin Vikas Trust (GGVT) — Tribal Helping Hand
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  brandFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  brandText: {
    textAlign: 'center',
  },
});
