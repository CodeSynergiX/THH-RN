import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ApplicationUrgency } from '../../models/application.model';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';

interface UrgencyBadgeProps {
  urgency: ApplicationUrgency | string;
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ urgency }) => {
  const { theme } = useAppTheme();
  const { colors, typography, borderRadius } = theme;
  const { t } = useTranslation();

  const isCritical = urgency === 'critical';
  const isUrgent = urgency === 'urgent';

  const badgeColor = isCritical
    ? colors.statusRejected
    : isUrgent
    ? colors.accent
    : colors.secondary;
  const label = t(`urgency.${urgency}`, urgency);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeColor + '15',
          borderColor: badgeColor + '30',
          borderRadius: borderRadius.sm,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: badgeColor, fontSize: typography.fontSizeXs },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
  },
  text: {
    fontWeight: '600',
  },
});
