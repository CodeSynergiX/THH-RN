import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  badgeText?: string;
  isDarkMode?: boolean;
  showLanguageToggle?: boolean;
  showThemeToggle?: boolean;
  onBackPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showLanguageToggle = true,
  showThemeToggle = true,
  onBackPress,
}) => {
  const { theme, isDark, toggleDarkMode } = useAppTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const { locale, switchLanguage, t } = useTranslation();

  const handleLanguageToggle = () => {
    switchLanguage(locale === 'gu' ? 'en' : 'gu');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          {onBackPress ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onBackPress}
              style={[
                styles.backBtn,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Text style={[styles.backText, { color: colors.text }]}>←</Text>
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.logoBadge,
                {
                  backgroundColor: colors.primary,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Text style={[styles.logoText, { color: colors.textInverse }]}>
                THH
              </Text>
            </View>
          )}

          <View style={styles.titleWrapper}>
            <Text
              style={[
                styles.mainTitle,
                { color: colors.text, fontSize: typography.fontSizeBase },
              ]}
            >
              {title || t('app.name', 'Tribal Helping Hand')}
            </Text>
            <Text
              style={[
                styles.subTitle,
                { color: colors.textMuted, fontSize: typography.fontSizeXs },
              ]}
            >
              {subtitle || t('app.ngo', 'GGVT Portal')}
            </Text>
          </View>
        </View>

        {/* Right Actions: Lang Switcher & Dark Mode Toggle */}
        <View style={styles.actionRow}>
          {showLanguageToggle && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleLanguageToggle}
              style={[
                styles.iconBtn,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.sm,
                },
              ]}
            >
              <Text
                style={[
                  styles.langText,
                  { color: colors.primary, fontSize: typography.fontSizeXs },
                ]}
              >
                {locale === 'gu' ? 'EN' : 'ગુ'}
              </Text>
            </TouchableOpacity>
          )}

          {showThemeToggle && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={toggleDarkMode}
              style={[
                styles.iconBtn,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: spacing.sm,
                },
              ]}
            >
              <Text
                style={[styles.themeIcon, { fontSize: typography.fontSizeSm }]}
              >
                {isDark ? '☀️' : '🌙'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  backText: {
    fontSize: 20,
    fontWeight: '800',
  },
  logoBadge: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoText: {
    fontWeight: '900',
    fontSize: 14,
  },
  titleWrapper: {
    flex: 1,
  },
  mainTitle: {
    fontWeight: '800',
    lineHeight: 20,
  },
  subTitle: {
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    height: 34,
    minWidth: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  langText: {
    fontWeight: '800',
  },
  themeIcon: {},
});
