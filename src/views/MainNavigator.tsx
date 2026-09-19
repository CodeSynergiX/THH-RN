import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../theme/ThemeContext';
import { useTranslation } from '../i18n/LanguageContext';
import { HomeScreen } from './screens/HomeScreen';
import { CommunityModuleScreen } from './screens/CommunityModuleScreen';
import { WizardScreen } from './screens/WizardScreen';
import { CaseTrackerScreen } from './screens/CaseTrackerScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { notificationService } from '../services/notificationService';

type TabRoute = 'home' | 'wizard' | 'track' | 'notifications' | 'settings';

export const MainNavigator: React.FC = () => {
  const { theme } = useAppTheme();
  const { colors, typography } = theme;
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabRoute>('home');
  const [selectedCaseNo, setSelectedCaseNo] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.getNotifications(1);
      if (typeof res?.unread_count === 'number') {
        setUnreadCount(res.unread_count);
      }
    } catch {
      // Offline default
      setUnreadCount(2);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

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
      iconActive: 'home',
      iconInactive: 'home-outline',
    },
    {
      key: 'wizard' as const,
      labelKey: 'nav.wizard',
      defaultLabel: 'New Help',
      iconActive: 'add-circle',
      iconInactive: 'add-circle-outline',
    },
    {
      key: 'track' as const,
      labelKey: 'nav.track',
      defaultLabel: 'Track',
      iconActive: 'search',
      iconInactive: 'search-outline',
    },
    {
      key: 'notifications' as const,
      labelKey: 'nav.notifications',
      defaultLabel: 'Alerts',
      iconActive: 'notifications',
      iconInactive: 'notifications-outline',
      badge: unreadCount,
    },
    {
      key: 'settings' as const,
      labelKey: 'nav.settings',
      defaultLabel: 'Settings',
      iconActive: 'settings',
      iconInactive: 'settings-outline',
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
        {activeTab === 'home' &&
          (selectedModule ? (
            <CommunityModuleScreen
              moduleKey={selectedModule}
              onBack={() => setSelectedModule(null)}
              onNavigateToWizard={() => {
                setSelectedModule(null);
                navigateToWizard();
              }}
            />
          ) : (
            <HomeScreen
              onSelectModule={key => setSelectedModule(key)}
              onNavigateToWizard={navigateToWizard}
              onNavigateToCase={caseNo => navigateToCaseTracker(caseNo)}
            />
          ))}

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

        {activeTab === 'notifications' && (
          <NotificationsScreen
            onBack={() => setActiveTab('home')}
            onNavigateToCase={caseNo => navigateToCaseTracker(caseNo)}
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
          const iconName = isActive ? tab.iconActive : tab.iconInactive;
          const color = isActive ? colors.primary : colors.textMuted;
          const badgeCount = tab.badge || 0;

          return (
            <TouchableOpacity
              key={tab.key}
              activeOpacity={0.7}
              onPress={() => {
                if (tab.key !== 'track') {
                  setSelectedCaseNo(null);
                }
                if (tab.key !== 'home') {
                  setSelectedModule(null);
                }
                setActiveTab(tab.key);
                if (tab.key === 'notifications') {
                  setUnreadCount(0);
                }
              }}
              style={styles.tabItem}
            >
              <View style={styles.iconWrapper}>
                <Ionicons name={iconName} size={22} color={color} />
                {badgeCount > 0 && (
                  <View
                    style={[styles.badge, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.badgeText}>
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color,
                    fontSize: typography.fontSizeXs,
                    fontWeight: isActive ? '700' : '500',
                  },
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
    height: 60,
    borderTopWidth: 1,
    paddingHorizontal: 4,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 6,
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 3,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  tabLabel: {
    textAlign: 'center',
  },
});
