import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing } from '../../theme';

interface ActionButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  title,
  onPress,
  isLoading = false,
  variant = 'primary',
  disabled = false,
}) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || isLoading}
      style={[
        styles.button,
        isPrimary && styles.primaryButton,
        isOutline && styles.outlineButton,
        disabled && styles.disabledButton,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={isPrimary ? '#ffffff' : colors.primary}
        />
      ) : (
        <Text
          style={[
            styles.text,
            isPrimary && styles.primaryText,
            isOutline && styles.outlineText,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  disabledButton: {
    opacity: 0.6,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryText: {
    color: '#ffffff',
  },
  outlineText: {
    color: colors.primary,
  },
});
