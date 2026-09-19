/**
 * Reusable iOS-settings-style row component.
 * Use inside a SettingsSection.
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/ThemeContext';

export interface SettingsRowProps {
  /** Icon name from MaterialCommunityIcons */
  icon: string;
  /** Icon color override — defaults to theme primary */
  iconColor?: string;
  /** Icon background color */
  iconBg?: string;
  /** Row label */
  label: string;
  /** Optional subtitle or current value shown on the right */
  value?: string;
  /** Show trailing chevron arrow (default: true for onPress rows) */
  showArrow?: boolean;
  /** Onpress handler — if provided, the row is tappable */
  onPress?: () => void;
  /** If provided, renders a Switch instead of arrow */
  switchValue?: boolean;
  onSwitchChange?: (val: boolean) => void;
  /** Destructive style (red text) */
  isDestructive?: boolean;
  /** Optional custom right element (replaces arrow) */
  rightElement?: React.ReactNode;
  /** Show loading spinner instead of arrow */
  isLoading?: boolean;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  showArrow = true,
  onPress,
  switchValue,
  onSwitchChange,
  isDestructive = false,
  rightElement,
  isLoading = false,
}) => {
  const { theme } = useAppTheme();
  const { colors, typography } = theme;

  const resolvedIconColor = iconColor ?? colors.primary;
  const resolvedIconBg = iconBg ?? colors.primary + '20';
  const labelColor = isDestructive ? colors.statusRejected : colors.text;
  const hasSwitch = switchValue !== undefined && onSwitchChange;

  const rowContent = (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      {/* Leading icon */}
      <View style={[styles.iconContainer, { backgroundColor: resolvedIconBg }]}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={resolvedIconColor}
        />
      </View>

      {/* Label + value */}
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.label,
            { color: labelColor, fontSize: typography.fontSizeBase },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {value !== undefined && (
          <Text
            style={[
              styles.value,
              { color: colors.textMuted, fontSize: typography.fontSizeSm },
            ]}
            numberOfLines={1}
          >
            {value}
          </Text>
        )}
      </View>

      {/* Right element */}
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#ffffff"
          ios_backgroundColor={colors.border}
        />
      ) : rightElement ? (
        rightElement
      ) : showArrow && onPress ? (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      ) : null}
    </View>
  );

  if (onPress && !hasSwitch) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {rowContent}
      </TouchableOpacity>
    );
  }

  return rowContent;
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 52,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontWeight: '500',
  },
  value: {
    marginTop: 1,
  },
});
