/**
 * iOS-style settings section container.
 * Renders a header label above a grouped card of SettingsRow children.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';

interface SettingsSectionProps {
  /** Section title shown above the card */
  title?: string;
  /** Optional footer description shown below the card */
  footer?: string;
  children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  footer,
  children,
}) => {
  const { theme } = useAppTheme();
  const { colors, typography } = theme;

  return (
    <View style={styles.container}>
      {title && (
        <Text
          style={[
            styles.header,
            {
              color: colors.textMuted,
              fontSize: typography.fontSizeXs,
            },
          ]}
        >
          {title.toUpperCase()}
        </Text>
      )}

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        {children}
      </View>

      {footer && (
        <Text
          style={[
            styles.footer,
            {
              color: colors.textMuted,
              fontSize: typography.fontSizeXs,
            },
          ]}
        >
          {footer}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  footer: {
    marginTop: 6,
    paddingHorizontal: 16,
    lineHeight: 16,
  },
});
