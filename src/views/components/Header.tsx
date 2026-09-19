import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../theme';

interface HeaderProps {
  title: string;
  subtitle: string;
  badgeText?: string;
  isDarkMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  badgeText,
  isDarkMode = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
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
        {badgeText ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
        ) : null}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  badgeText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
});
