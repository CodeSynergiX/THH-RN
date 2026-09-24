/**
 * Settings — guest vs logged-in menus. No admin notification toggles.
 */
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsSection } from '../components/SettingsSection';
import { useAuth } from '../../context/AuthContext';

export const SettingsScreen: React.FC<{
  onLogin?: () => void;
  onLegal: (slug: string) => void;
  onMyApplications: () => void;
  onOpenDesk?: () => void;
  onBack?: () => void;
}> = ({ onLogin, onLegal, onMyApplications, onOpenDesk, onBack }) => {
  const { theme, toggleDarkMode, isDark } = useAppTheme();
  const { colors, typography } = theme;
  const { t, locale, supportedLocales, switchLanguage } = useTranslation();
  const { user, isLoggedIn, logout } = useAuth();
  const { showToast } = useToast();

  const currentLocaleLabel =
    supportedLocales.find(l => l.code === locale)?.nativeLabel ?? locale;
  const themeLabel = isDark
    ? t('settings.theme_dark', 'Dark')
    : t('settings.theme_light', 'Light');

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
            logout();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={{ marginRight: 8 }}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
        ) : null}
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
        {isLoggedIn ? (
          <SettingsSection title={t('settings.section_account', 'Account')}>
            <SettingsRow
              icon="account-circle"
              iconBg={colors.primary + '15'}
              iconColor={colors.primary}
              label={user?.name || t('settings.profile', 'Profile')}
              value={user?.email || user?.phone || ''}
              showArrow={false}
            />
            <SettingsRow
              icon="shield-account"
              iconBg="#0F766E20"
              iconColor="#0F766E"
              label={t('settings.my_applications', 'My Applications')}
              onPress={onMyApplications}
            />
            {onOpenDesk && (
              <SettingsRow
                icon="web"
                iconBg="#2D5A3D20"
                iconColor="#2D5A3D"
                label={t('settings.open_desk', 'Open desk on web')}
                onPress={onOpenDesk}
              />
            )}
          </SettingsSection>
        ) : (
          <SettingsSection title={t('settings.section_account', 'Account')}>
            <SettingsRow
              icon="login"
              iconBg={colors.primary + '15'}
              iconColor={colors.primary}
              label={t('settings.login', 'Login')}
              value={t('settings.login_hint', 'Password or email OTP')}
              onPress={() => onLogin?.()}
            />
          </SettingsSection>
        )}

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

        <SettingsSection title={t('settings.section_about', 'About')}>
          <SettingsRow
            icon="information-outline"
            iconBg="#0284C720"
            iconColor="#0284C7"
            label={t('settings.about', 'About')}
            onPress={() => onLegal('about-us')}
          />
          <SettingsRow
            icon="shield-check-outline"
            iconBg="#15803D20"
            iconColor="#15803D"
            label={t('settings.privacy_policy', 'Privacy Policy')}
            onPress={() => onLegal('privacy-policy')}
          />
          <SettingsRow
            icon="file-document-outline"
            iconBg="#64748B20"
            iconColor="#64748B"
            label={t('settings.terms', 'Terms & Conditions')}
            onPress={() => onLegal('terms-conditions')}
          />
          <SettingsRow
            icon="headset"
            iconBg="#B4530920"
            iconColor={colors.primary}
            label={t('settings.contact_support', 'Contact Support')}
            onPress={() =>
              showToast('Helpline: 1800-233-5500', 'info', 'Support')
            }
          />
        </SettingsSection>

        {isLoggedIn && (
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
          </SettingsSection>
        )}

        <View style={styles.brandFooter}>
          <Ionicons name="heart" size={14} color={colors.primary} />
          <Text
            style={[
              styles.brandText,
              { color: colors.textMuted, fontSize: typography.fontSizeSm },
            ]}
          >
            {' '}
            Global Gramin Vikas Trust (GGVT)
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
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
