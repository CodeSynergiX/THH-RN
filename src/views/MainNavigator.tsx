import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/ThemeContext';
import { useTranslation } from '../i18n/LanguageContext';
import { DashboardScreen } from './screens/DashboardScreen';
import { WizardScreen } from './screens/WizardScreen';
import { CaseTrackerScreen } from './screens/CaseTrackerScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { Application } from '../models/application.model';

type TabRoute = 'home' | 'wizard' | 'track' | 'settings';

export const MainNavigator: React.FC = () => {
  const { theme } = useAppTheme();
  const { colors, typography } = theme;
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabRoute>('home');
  const [selectedCaseNo, setSelectedCaseNo] = useState<string | null>(null);

  const navigateToCaseTracker = (caseNo: string) => {
    setSelectedCaseNo(caseNo);
    setActiveTab('track');
  };

  const navigateToWizard = () => {
    setActiveTab('wizard');
  };

  const navTabs = [
    {
      key: 'home' as const,
      labelKey: 'nav.home',
      defaultLabel: 'Home',
      icon: '🏠',
    },
    {
      key: 'wizard' as const,
      labelKey: 'nav.wizard',
      defaultLabel: 'New Help',
      icon: '➕',
    },
    {
      key: 'track' as const,
      labelKey: 'nav.track',
      defaultLabel: 'Track',
      icon: '🔍',
    },
    {
      key: 'settings' as const,
      labelKey: 'nav.settings',
      defaultLabel: 'Settings',
      icon: '⚙️',
    },
  ];

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.surface }]}
      edges={['top', 'bottom']}
    >
      <View
        style={[
          styles.contentContainer,
          { backgroundColor: colors.background },
        ]}
      >
        {activeTab === 'home' && (
          <DashboardScreen
            onNavigateToWizard={navigateToWizard}
            onNavigateToCase={(app: Application) =>
              navigateToCaseTracker(app.case_no)
            }
          />
        )}

        {activeTab === 'wizard' && (
          <WizardScreen
            onCancel={() => setActiveTab('home')}
            onTrackCase={caseNo => navigateToCaseTracker(caseNo)}
          />
        )}

        {activeTab === 'track' && (
          <CaseTrackerScreen
            initialCaseNo={selectedCaseNo}
            onBack={() => {
              setSelectedCaseNo(null);
              setActiveTab('home');
            }}
          />
        )}

        {activeTab === 'settings' && <SettingsScreen />}
      </View>

      {/* Bottom Tab Bar */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}
      >
        {navTabs.map(tab => {
          const isActive = activeTab === tab.key;
          const color = isActive ? colors.primary : colors.textMuted;

          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => {
                if (tab.key !== 'track') {
                  setSelectedCaseNo(null);
                }
                setActiveTab(tab.key);
              }}
              style={styles.tabItem}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text
                style={[
                  styles.tabLabel,
                  { color, fontSize: typography.fontSizeXs },
                ]}
              >
                {t(tab.labelKey, tab.defaultLabel)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 56,
    borderTopWidth: 1,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabLabel: {
    fontWeight: '700',
  },
});
