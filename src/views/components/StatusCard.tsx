import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';

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
}) => {
  const { theme } = useAppTheme();
  const { colors, spacing, typography, borderRadius } = theme;

  const statusColor =
    status === 'connected'
      ? colors.statusResolved
      : status === 'checking'
      ? colors.statusAssistance
      : colors.statusRejected;

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
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
        },
      ]}
    >
      <View style={styles.topRow}>
        <Text
          style={[
            styles.title,
            { color: colors.text, fontSize: typography.fontSizeBase },
          ]}
        >
          {title}
        </Text>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: `${statusColor}20`,
              borderColor: `${statusColor}40`,
              borderRadius: borderRadius.full,
            },
          ]}
        >
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text
            style={[
              styles.badgeText,
              { color: statusColor, fontSize: typography.fontSizeXs },
            ]}
          >
            {statusLabel}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.subtitle,
          { color: colors.textMuted, fontSize: typography.fontSizeXs },
        ]}
      >
        {subtitle}
      </Text>

      {detail ? (
        <View
          style={[
            styles.detailBox,
            {
              backgroundColor: colors.surfaceSubtle,
              borderRadius: borderRadius.sm,
            },
          ]}
        >
          <Text
            style={[
              styles.detailText,
              { color: colors.text, fontSize: typography.fontSizeXs },
            ]}
          >
            {detail}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontWeight: '700',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  badgeText: {
    fontWeight: '800',
  },
  subtitle: {
    lineHeight: 16,
  },
  detailBox: {
    marginTop: 8,
    padding: 6,
  },
  detailText: {
    fontFamily: 'monospace',
  },
});
