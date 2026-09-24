import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps = 5,
}) => {
  const { theme } = useAppTheme();
  const { colors, spacing, typography, borderRadius } = theme;

  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <View style={{ marginVertical: spacing.sm }}>
      <View
        style={{
          alignSelf: 'center',
          backgroundColor: colors.primary + '18',
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 4,
          marginBottom: 10,
        }}
      >
        <Text
          style={{
            color: colors.primary,
            fontSize: typography.fontSizeXs,
            fontWeight: '800',
          }}
        >
          Step {currentStep}/{totalSteps}
        </Text>
      </View>
      <View style={styles.container}>
        {steps.map((s, index) => {
          const isCompleted = s < currentStep;
          const isActive = s === currentStep;

          const circleBg = isActive
            ? colors.primary
            : isCompleted
            ? colors.secondary
            : colors.surface;

          const circleBorder = isActive
            ? colors.primary
            : isCompleted
            ? colors.secondary
            : colors.border;

          const textColor =
            isActive || isCompleted ? colors.textInverse : colors.textMuted;

          return (
            <React.Fragment key={s}>
              <View
                style={[
                  styles.circle,
                  {
                    backgroundColor: circleBg,
                    borderColor: circleBorder,
                    borderRadius: borderRadius.full,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.circleText,
                    { color: textColor, fontSize: typography.fontSizeXs },
                  ]}
                >
                  {isCompleted ? '✓' : s}
                </Text>
              </View>

              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.line,
                    {
                      backgroundColor:
                        s < currentStep ? colors.secondary : colors.border,
                    },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  circle: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  circleText: {
    fontWeight: '800',
  },
  line: {
    flex: 1,
    height: 3,
    marginHorizontal: 4,
  },
});
