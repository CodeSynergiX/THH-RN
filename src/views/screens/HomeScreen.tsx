import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { colors, spacing } from '../../theme';
import {
  FeatureCategoryFilter,
  useHomeViewModel,
} from '../../viewmodels/useHomeViewModel';
import { ActionButton, Header, StatusCard } from '../components';

const categories: Array<{ key: FeatureCategoryFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'architecture', label: 'MVVM' },
  { key: 'linter', label: 'Quality' },
  { key: 'backend', label: 'Backend' },
];

export const HomeScreen: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const vm = useHomeViewModel();

  return (
    <ScrollView
      style={[
        styles.container,
        isDarkMode ? styles.containerDark : styles.containerLight,
      ]}
      contentContainerStyle={styles.contentContainer}
    >
      <Header
        title="THH Mobile"
        subtitle="MVVM Architecture & Code Quality Initialized"
        badgeText={`${vm.totalConfiguredCount} Ready`}
        isDarkMode={isDarkMode}
      />

      <StatusCard
        title="Backend Link"
        status={vm.backendHealth.status}
        subtitle={vm.backendHealth.message}
        detail={`Target: ${vm.backendHealth.backendUrl} • Last Checked: ${
          vm.backendHealth.lastCheckedAt ?? 'N/A'
        }`}
        isDarkMode={isDarkMode}
      />

      <View style={styles.sectionHeader}>
        <Text
          style={[
            styles.sectionTitle,
            isDarkMode ? styles.sectionTitleDark : styles.sectionTitleLight,
          ]}
        >
          Setup Checklist
        </Text>
      </View>

      <View style={styles.tabsRow}>
        {categories.map(tab => {
          const isSelected = vm.selectedCategory === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => vm.handleCategoryChange(tab.key)}
              style={[
                styles.tabPill,
                isDarkMode ? styles.tabPillDark : styles.tabPillLight,
                isSelected && styles.tabPillActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  isDarkMode ? styles.tabTextDark : styles.tabTextLight,
                  isSelected && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.featureList}>
        {vm.filteredFeatures.map(item => (
          <View
            key={item.id}
            style={[
              styles.featureCard,
              isDarkMode ? styles.featureCardDark : styles.featureCardLight,
            ]}
          >
            <View style={styles.featureHeader}>
              <Text
                style={[
                  styles.featureTitle,
                  isDarkMode
                    ? styles.featureTitleDark
                    : styles.featureTitleLight,
                ]}
              >
                {item.title}
              </Text>
              <Text style={styles.checkIcon}>✓</Text>
            </View>
            <Text
              style={[
                styles.featureDesc,
                isDarkMode ? styles.featureDescDark : styles.featureDescLight,
              ]}
            >
              {item.description}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.actionsContainer}>
        <ActionButton
          title="Check Backend Connection"
          onPress={vm.handleRefreshHealth}
          isLoading={vm.isCheckingHealth}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerLight: {
    backgroundColor: colors.backgroundLight,
  },
  containerDark: {
    backgroundColor: colors.backgroundDark,
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitleLight: {
    color: colors.textPrimaryLight,
  },
  sectionTitleDark: {
    color: colors.textPrimaryDark,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  tabPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  tabPillLight: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.borderLight,
  },
  tabPillDark: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.borderDark,
  },
  tabPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextLight: {
    color: colors.textSecondaryLight,
  },
  tabTextDark: {
    color: colors.textSecondaryDark,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  featureList: {
    marginTop: spacing.xs,
  },
  featureCard: {
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
  },
  featureCardLight: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.borderLight,
  },
  featureCardDark: {
    backgroundColor: colors.surfaceDark,
    borderColor: colors.borderDark,
  },
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  featureTitleLight: {
    color: colors.textPrimaryLight,
  },
  featureTitleDark: {
    color: colors.textPrimaryDark,
  },
  checkIcon: {
    color: colors.success,
    fontWeight: '800',
    fontSize: 16,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  featureDescLight: {
    color: colors.textSecondaryLight,
  },
  featureDescDark: {
    color: colors.textSecondaryDark,
  },
  actionsContainer: {
    marginTop: spacing.lg,
  },
});
