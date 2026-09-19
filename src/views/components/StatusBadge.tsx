import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ApplicationStatus } from '../../models/application.model';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';

interface StatusBadgeProps {
  status: ApplicationStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { theme } = useAppTheme();
  const { colors, typography, borderRadius } = theme;
  const { t } = useTranslation();

  const getBadgeColors = (): { bg: string; text: string } => {
    switch (status) {
      case 'received':
        return {
          bg: colors.statusReceived + '20',
          text: colors.statusReceived,
        };
      case 'verification':
        return {
          bg: colors.statusVerification + '20',
          text: colors.statusVerification,
        };
      case 'categorised':
        return {
          bg: colors.statusCategorised + '20',
          text: colors.statusCategorised,
        };
      case 'assigned':
      case 'assistance':
        return {
          bg: colors.statusAssistance + '20',
          text: colors.statusAssistance,
        };
      case 'resolved':
        return {
          bg: colors.statusResolved + '20',
          text: colors.statusResolved,
        };
      case 'rejected':
        return {
          bg: colors.statusRejected + '20',
          text: colors.statusRejected,
        };
      default:
        return { bg: colors.statusOnHold + '20', text: colors.statusOnHold };
    }
  };

  const badgeColors = getBadgeColors();
  const statusLabel = t(`status.${status}`, status.toUpperCase());

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeColors.bg,
          borderColor: badgeColors.text + '40',
          borderRadius: borderRadius.full,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: badgeColors.text }]} />
      <Text
        style={[
          styles.text,
          { color: badgeColors.text, fontSize: typography.fontSizeXs },
        ]}
      >
        {statusLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  text: {
    fontWeight: '700',
  },
});
