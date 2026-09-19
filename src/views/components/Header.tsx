import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
              activeOpacity={0.85}
              onPress={handleLanguageToggle}
              style={[
                styles.langTogglePill,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                  borderRadius: borderRadius.full,
                },
              ]}
            >
              <View
                style={[
                  styles.langOption,
                  locale === 'en' && [
                    styles.langOptionActive,
                    { backgroundColor: colors.primary },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.langOptionText,
                    {
                      color: locale === 'en' ? '#FFFFFF' : colors.textMuted,
                      fontSize: typography.fontSizeXs,
                      fontWeight: locale === 'en' ? '800' : '600',
                    },
                  ]}
                >
                  EN
                </Text>
              </View>
              <View
                style={[
                  styles.langOption,
                  locale === 'gu' && [
                    styles.langOptionActive,
                    { backgroundColor: colors.primary },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.langOptionText,
                    {
                      color: locale === 'gu' ? '#FFFFFF' : colors.textMuted,
                      fontSize: typography.fontSizeXs,
                      fontWeight: locale === 'gu' ? '800' : '600',
                    },
                  ]}
                >
                  ગુજ
                </Text>
              </View>
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
                  borderRadius: borderRadius.full,
                },
              ]}
            >
              <Ionicons
                name={isDark ? 'sunny' : 'moon'}
                size={16}
                color={colors.primary}
              />
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
    gap: 8,
  },
  langTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 2,
    height: 32,
  },
  langOption: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  langOptionActive: {},
  langOptionText: {},
  iconBtn: {
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  langText: {
    fontWeight: '800',
  },
  themeIcon: {},
});
