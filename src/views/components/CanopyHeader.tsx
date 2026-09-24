import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';

export interface CanopyHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  avatarLetter?: string;
  hideLanguageSwitch?: boolean;
}

export const CanopyHeader: React.FC<CanopyHeaderProps> = ({
  title,
  subtitle,
  showBack,
  onBack,
  right,
  avatarLetter,
  hideLanguageSwitch = false,
}) => {
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const topInset = Math.max(insets.top, statusBarHeight);

  const { theme, logoUrl, brandName, brandShortName } = useAppTheme();
  const { colors, typography } = theme;
  const { locale, switchLanguage } = useTranslation();

  const isBack = Boolean(showBack || onBack);
  const displayTitle = title || brandShortName || 'THH';
  const displaySubtitle = subtitle || (!title ? brandName : undefined);

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: topInset + 8,
          backgroundColor: colors.surface,
          borderBottomColor: colors.borderSubtle,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.left}>
          {isBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={styles.iconBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
              accessibilityLabel="Back"
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
          ) : logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.mark, { backgroundColor: colors.primary }]}>
              <Ionicons name="leaf" size={16} color={colors.textInverse} />
            </View>
          )}

          <View style={styles.titleWrap}>
            <Text
              style={[
                isBack ? styles.backTitle : styles.brand,
                {
                  color: isBack
                    ? colors.text
                    : title
                    ? colors.text
                    : colors.primary,
                  fontFamily: typography.fontFamilySans,
                },
              ]}
              numberOfLines={1}
            >
              {displayTitle}
            </Text>
            {displaySubtitle ? (
              <Text
                style={[styles.sub, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                {displaySubtitle}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.right}>
          {!hideLanguageSwitch && (
            <View
              style={[styles.lang, { backgroundColor: colors.surfaceSubtle }]}
            >
              <TouchableOpacity
                onPress={() => switchLanguage('en')}
                style={[
                  styles.langBtn,
                  locale === 'en' && {
                    backgroundColor: colors.surface,
                    elevation: 1,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    color: locale === 'en' ? colors.primary : colors.textMuted,
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  EN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => switchLanguage('gu')}
                style={[
                  styles.langBtn,
                  locale === 'gu' && {
                    backgroundColor: colors.surface,
                    elevation: 1,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    color: locale === 'gu' ? colors.primary : colors.textMuted,
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  ગુજ
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {avatarLetter ? (
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: colors.primaryContainer },
              ]}
            >
              <Text
                style={[
                  styles.avatarText,
                  { color: colors.onPrimaryContainer || colors.primary },
                ]}
              >
                {avatarLetter.toUpperCase()}
              </Text>
            </View>
          ) : null}

          {right}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  titleWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -4,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  mark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    fontSize: 14,
    fontWeight: '700',
  },
  backTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sub: {
    fontSize: 10.5,
    marginTop: 1,
  },
  lang: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 2,
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
