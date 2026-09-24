import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Application } from '../../models/application.model';
import { StatusBadge } from './StatusBadge';
import { UrgencyBadge } from './UrgencyBadge';
import { useAppTheme } from '../../theme/ThemeContext';

interface ApplicationCardProps {
  application: Application;
  onPress?: () => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onPress,
}) => {
  const { theme } = useAppTheme();
  const { colors, spacing, typography, borderRadius } = theme;

  const formattedDate = application.created_at
    ? new Date(application.created_at).toLocaleDateString()
    : '-';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
        },
      ]}
    >
      <View style={styles.topRow}>
        <Text
          style={[
            styles.caseNo,
            { color: colors.primary, fontSize: typography.fontSizeSm },
          ]}
        >
          {application.case_no}
        </Text>
        <StatusBadge status={application.status} />
      </View>

      <Text
        style={[
          styles.title,
          { color: colors.text, fontSize: typography.fontSizeBase },
        ]}
        numberOfLines={1}
      >
        {application.title}
      </Text>

      {application.description ? (
        <Text
          style={[
            styles.description,
            { color: colors.textMuted, fontSize: typography.fontSizeXs },
          ]}
          numberOfLines={2}
        >
          {application.description}
        </Text>
      ) : null}

      <View
        style={[
          styles.bottomRow,
          { borderTopColor: colors.borderSubtle, paddingTop: spacing.xs },
        ]}
      >
        <View style={styles.metaLeft}>
          <UrgencyBadge urgency={application.urgency} />
          {application.district?.name_gu || application.district?.name_en ? (
            <Text
              style={[
                styles.district,
                { color: colors.textMuted, fontSize: typography.fontSizeXs },
              ]}
            >
              • {application.district?.name_gu || application.district?.name_en}
            </Text>
          ) : null}
        </View>
        <Text
          style={[
            styles.date,
            { color: colors.textMuted, fontSize: typography.fontSizeXs },
          ]}
        >
          {formattedDate}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  caseNo: {
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  title: {
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    lineHeight: 20,
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: 4,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  district: {
    fontWeight: '500',
  },
  date: {
    fontWeight: '500',
  },
});
