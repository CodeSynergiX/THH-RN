import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../theme';

interface StatusCardProps {
  title: string;
  status: 'connected' | 'disconnected' | 'checking';
  subtitle: string;
  detail?: string;
  isDarkMode?: boolean;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  status,
  subtitle,
  detail,
  isDarkMode = false,
}) => {
  const statusColor =
    status === 'connected'
      ? colors.success
      : status === 'checking'
      ? colors.warning
      : colors.danger;

  const statusLabel =
    status === 'connected'
      ? 'ONLINE'
      : status === 'checking'
      ? 'CHECKING'
      : 'OFFLINE';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDarkMode
            ? colors.surfaceDark
            : colors.surfaceLight,
          borderColor: isDarkMode ? colors.borderDark : colors.borderLight,
        },
      ]}
    >
      <View style={styles.topRow}>
        <Text
          style={[
            styles.title,
            {
              color: isDarkMode
                ? colors.textPrimaryDark
                : colors.textPrimaryLight,
            },
          ]}
        >
          {title}
        </Text>
        <View style={[styles.badge, { backgroundColor: `${statusColor}20` }]}>
          <View
            style={[styles.indicatorDot, { backgroundColor: statusColor }]}
          />
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.subtitle,
          {
            color: isDarkMode
              ? colors.textSecondaryDark
              : colors.textSecondaryLight,
          },
        ]}
      >
        {subtitle}
      </Text>

      {detail ? (
        <Text
          style={[
            styles.detail,
            {
              color: isDarkMode
                ? colors.textSecondaryDark
                : colors.textSecondaryLight,
            },
          ]}
        >
          {detail}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    marginVertical: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs - 1,
    borderRadius: 999,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  detail: {
    fontSize: 11,
    marginTop: spacing.xs,
  },
});
