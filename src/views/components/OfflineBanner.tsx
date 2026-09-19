import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';

interface OfflineBannerProps {
  count: number;
  onSyncPress?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  count,
  onSyncPress,
}) => {
  const { theme } = useAppTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const { t } = useTranslation();

  if (count <= 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.statusAssistance + '20',
          borderColor: colors.statusAssistance + '50',
          borderRadius: borderRadius.md,
          marginHorizontal: spacing.md,
          marginBottom: spacing.sm,
          padding: spacing.sm,
        },
      ]}
    >
      <View style={styles.content}>
        <Text
          style={[
            styles.text,
            { color: colors.statusAssistance, fontSize: typography.fontSizeXs },
          ]}
        >
          ⚠️{' '}
          {t('offline.banner', `${count} requests pending offline sync`, {
            count,
          })}
        </Text>
        {onSyncPress && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onSyncPress}
            style={[
              styles.syncBtn,
              {
                backgroundColor: colors.statusAssistance,
                borderRadius: borderRadius.sm,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
              },
            ]}
          >
            <Text
              style={[
                styles.syncText,
                { color: colors.textInverse, fontSize: typography.fontSizeXs },
              ]}
            >
              {t('action.sync_now', 'Sync Now')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  syncBtn: {
    alignSelf: 'center',
  },
  syncText: {
    fontWeight: '800',
  },
});
