import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '../theme/ThemeContext';
import { useTranslation } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { defaultApiClient } from '../services/apiClient';
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { LoginScreen } from './screens/LoginScreen';
import { SignupScreen } from './screens/SignupScreen';
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen';
import { CitizenHomeScreen } from './screens/CitizenHomeScreen';
import { SectorsScreen } from './screens/SectorsScreen';
import { NeedHelpFormScreen } from './screens/NeedHelpFormScreen';
import { MyRequestsScreen } from './screens/MyRequestsScreen';
import { RequestTimelineScreen } from './screens/RequestTimelineScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { MentorDashboardScreen } from './screens/MentorDashboardScreen';
import { AssignedRequestsScreen } from './screens/AssignedRequestsScreen';
import { UpdateRequestStatusScreen } from './screens/UpdateRequestStatusScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { LegalScreen } from './screens/LegalScreen';
import { StaffQueueScreen } from './screens/StaffQueueScreen';
import { AppointmentsScreen } from './screens/AppointmentsScreen';
import { AdminStatsScreen } from './screens/AdminStatsScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { CaseTrackerScreen } from './screens/CaseTrackerScreen';
import { Application } from '../models/application.model';

// ─── Types ───────────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Tabs: undefined;
  NeedHelpForm: { moduleSlug?: string; moduleTitle?: string } | undefined;
  RequestTimeline: { applicationId: number };
  UpdateStatus: { applicationId: number };
  Settings: undefined;
  Legal: { slug: string };
  CaseTracker: { initialCaseNo?: string } | undefined;
};

export type RootNavProp = NativeStackNavigationProp<RootStackParamList>;

const Stack = createNativeStackNavigator<RootStackParamList>();

const ONBOARD_KEY = '@thh_onboarded';

type DeskRole = 'guest' | 'citizen' | 'staff' | 'helper' | 'admin';
type AuthView = 'login' | 'signup' | 'forgot';

function deskRole(roles?: string[] | null): DeskRole {
  const list = roles ?? [];
  if (list.includes('super_admin') || list.includes('admin')) return 'admin';
  if (list.includes('staff') || list.includes('collector')) return 'staff';
  if (list.includes('mentor') || list.includes('volunteer')) return 'helper';
  if (list.length === 0) return 'guest';
  return 'citizen';
}

function deskUrl(): string {
  return defaultApiClient.getBaseUrl().replace(/\/api\/v1\/?$/, '');
}

// ─── Tab Navigator (custom bottom tabs) ──────────────────────────────────────

interface TabsScreenProps {
  role: DeskRole;
}

function TabsScreen({ role }: TabsScreenProps) {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const navigation = useNavigation<RootNavProp>();
  const [tab, setTab] = useState('home');

  const navTabs = useMemo(() => {
    if (role === 'admin') {
      return [
        { key: 'stats', label: t('nav.stats', 'Stats'), icon: 'stats-chart' },
        { key: 'queue', label: t('nav.queue', 'Queue'), icon: 'list' },
        {
          key: 'alerts',
          label: t('nav.notifications', 'Alerts'),
          icon: 'notifications',
        },
        {
          key: 'profile',
          label: t('nav.settings', 'Settings'),
          icon: 'settings',
        },
      ];
    }
    if (role === 'staff') {
      return [
        { key: 'queue', label: t('nav.queue', 'Queue'), icon: 'list' },
        { key: 'track', label: t('nav.track', 'Case'), icon: 'folder-open' },
        {
          key: 'appointments',
          label: t('nav.appointments', 'Appointments'),
          icon: 'calendar',
        },
        {
          key: 'profile',
          label: t('nav.settings', 'Settings'),
          icon: 'settings',
        },
      ];
    }
    if (role === 'helper') {
      return [
        { key: 'home', label: t('nav.home', 'Dashboard'), icon: 'grid' },
        {
          key: 'requests',
          label: t('nav.assigned', 'Requests'),
          icon: 'clipboard',
        },
        { key: 'profile', label: t('nav.profile', 'Profile'), icon: 'person' },
      ];
    }
    return [
      { key: 'home', label: t('nav.home', 'Home'), icon: 'leaf' },
      {
        key: 'requests',
        label: t('nav.cases', 'My Cases'),
        icon: 'document-text',
      },
      {
        key: 'apply',
        label: t('nav.wizard', 'New Request'),
        icon: 'add-circle',
      },
      { key: 'sectors', label: t('nav.sectors', 'Sectors'), icon: 'apps' },
      { key: 'profile', label: t('nav.profile', 'Profile'), icon: 'person' },
    ];
  }, [role, t]);

  // Reset to first tab when role changes
  useEffect(() => {
    if (!navTabs.find(item => item.key === tab)) {
      setTab(navTabs[0].key);
    }
  }, [navTabs, tab]);

  const openRequest = (app: Application) => {
    if (role === 'helper') {
      navigation.navigate('UpdateStatus', { applicationId: app.id });
    } else {
      navigation.navigate('RequestTimeline', { applicationId: app.id });
    }
  };

  const openApply = (slug?: string, title?: string) => {
    navigation.navigate('NeedHelpForm', {
      moduleSlug: slug,
      moduleTitle: title,
    });
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.surface }]}
      edges={['bottom']}
    >
      <View style={[styles.content, { backgroundColor: colors.background }]}>
        {/* ── Citizen tabs ── */}
        {role === 'citizen' && tab === 'home' && (
          <CitizenHomeScreen
            onOpenRequest={openRequest}
            onOpenSector={(slug, title) => openApply(slug, title)}
            onOpenSectors={() => setTab('sectors')}
          />
        )}
        {role === 'citizen' && tab === 'requests' && (
          <MyRequestsScreen onOpen={openRequest} />
        )}
        {role === 'citizen' && tab === 'sectors' && (
          <SectorsScreen onSelect={(slug, title) => openApply(slug, title)} />
        )}

        {/* ── Helper tabs ── */}
        {role === 'helper' && tab === 'home' && (
          <MentorDashboardScreen
            onOpen={openRequest}
            onOpenList={() => setTab('requests')}
          />
        )}
        {role === 'helper' && tab === 'requests' && (
          <AssignedRequestsScreen onOpen={openRequest} />
        )}

        {/* ── Shared tabs ── */}
        {tab === 'profile' && (
          <ProfileScreen onSettings={() => navigation.navigate('Settings')} />
        )}
        {tab === 'queue' && (
          <StaffQueueScreen
            onOpenCase={caseNo =>
              navigation.navigate('CaseTracker', { initialCaseNo: caseNo })
            }
          />
        )}
        {tab === 'appointments' && (
          <AppointmentsScreen
            onOpenCase={caseNo =>
              navigation.navigate('CaseTracker', { initialCaseNo: caseNo })
            }
          />
        )}
        {tab === 'stats' && <AdminStatsScreen />}
        {tab === 'alerts' && (
          <NotificationsScreen
            onBack={() => setTab(navTabs[0].key)}
            onNavigateToCase={caseNo =>
              navigation.navigate('CaseTracker', { initialCaseNo: caseNo })
            }
            isLoggedIn
          />
        )}
        {tab === 'track' && (
          <CaseTrackerScreen onBack={() => setTab(navTabs[0].key)} />
        )}
      </View>

      {/* ── Bottom Tab Bar ── */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
      >
        {navTabs.map(item => {
          const active = item.key === 'apply' ? false : tab === item.key;
          const color = active ? colors.primary : colors.textMuted;

          if (item.key === 'apply') {
            // "New Request" — big centre FAB-style button, navigates to real screen
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.tabItem}
                onPress={() => openApply()}
                activeOpacity={0.8}
              >
                <View
                  style={[styles.applyBtn, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="add" size={26} color="#fff" />
                </View>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{
                    color: colors.textMuted,
                    fontSize: 10.5,
                    fontWeight: '600',
                    marginTop: 2,
                    textAlign: 'center',
                    maxWidth: '100%',
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={item.key}
              style={styles.tabItem}
              onPress={() => setTab(item.key)}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon as never} size={22} color={color} />
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{
                  color,
                  fontSize: 10.5,
                  fontWeight: active ? '700' : '500',
                  textAlign: 'center',
                  maxWidth: '100%',
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// ─── NeedHelpForm screen wrapper ─────────────────────────────────────────────

// function NeedHelpFormStackScreen() {
//   const navigation = useNavigation<RootNavProp>();
//   const route = useNavigation()
//     .getState()
//     ?.routes.find(r => r.name === 'NeedHelpForm');
//   const params = (route?.params ?? {}) as {
//     moduleSlug?: string;
//     moduleTitle?: string;
//   };

//   return (
//     <NeedHelpFormScreen
//       moduleSlug={params.moduleSlug ?? null}
//       moduleTitle={params.moduleTitle ?? null}
//       onCancel={() => navigation.goBack()}
//       onChangeSector={() => {
//         navigation.goBack();
//         // The tabs screen will handle showing sectors
//       }}
//       onSubmitted={() => {
//         navigation.goBack();
//       }}
//     />
//   );
// }

// ─── Root Stack ───────────────────────────────────────────────────────────────

function AppStack() {
  const auth = useAuth();
  const { theme } = useAppTheme();
  const { colors } = theme;
  const role = deskRole(auth.user?.roles);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Tabs">
        {() => <TabsScreen role={role} />}
      </Stack.Screen>

      <Stack.Screen
        name="NeedHelpForm"
        component={NeedHelpFormWrapper}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'card',
        }}
      />

      <Stack.Screen
        name="RequestTimeline"
        options={{ animation: 'slide_from_right' }}
      >
        {({ route, navigation }) => (
          <RequestTimelineScreen
            applicationId={route.params.applicationId}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen
        name="UpdateStatus"
        options={{ animation: 'slide_from_right' }}
      >
        {({ route, navigation }) => (
          <UpdateRequestStatusScreen
            applicationId={route.params.applicationId}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Settings" options={{ animation: 'slide_from_right' }}>
        {() => <SettingsWrapper />}
      </Stack.Screen>

      <Stack.Screen name="Legal" options={{ animation: 'slide_from_right' }}>
        {({ route }) => (
          <LegalScreen
            slug={route.params.slug}
            onBack={() => {
              /* handled by back gesture */
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen
        name="CaseTracker"
        options={{ animation: 'slide_from_right' }}
      >
        {({ route }) => (
          <CaseTrackerScreen
            initialCaseNo={route.params?.initialCaseNo}
            onBack={() => {
              /* handled by back gesture */
            }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// Proper wrappers that use useNavigation inside stack context
function NeedHelpFormWrapper({ route }: any) {
  const navigation = useNavigation<RootNavProp>();
  const params = route?.params ?? {};
  return (
    <NeedHelpFormScreen
      moduleSlug={params.moduleSlug ?? null}
      moduleTitle={params.moduleTitle ?? null}
      onCancel={() => navigation.goBack()}
      onChangeSector={() => navigation.goBack()}
      onSubmitted={() => {
        navigation.goBack();
      }}
    />
  );
}

function SettingsWrapper() {
  const navigation = useNavigation<RootNavProp>();
  const auth = useAuth();
  const role = deskRole(auth.user?.roles);
  return (
    <SettingsScreen
      onBack={() => navigation.goBack()}
      onLegal={slug => navigation.navigate('Legal', { slug })}
      onMyApplications={() => navigation.goBack()}
      onOpenDesk={
        role === 'admin' || role === 'staff' || role === 'helper'
          ? () => Linking.openURL(deskUrl()).catch(() => {})
          : undefined
      }
    />
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export const MainNavigator: React.FC = () => {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const auth = useAuth();

  const [boot, setBoot] = useState<'splash' | 'onboarding' | 'app'>('splash');
  const [authView, setAuthView] = useState<AuthView>('login');

  const finishSplash = useCallback(() => {
    // Skip onboarding for now: directly proceed to login/app
    setBoot('app');
  }, []);

  const finishOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARD_KEY, '1');
    setBoot('app');
  }, []);

  if (!auth.ready || boot === 'splash') {
    return <SplashScreen onReady={finishSplash} />;
  }

  if (boot === 'onboarding') {
    return <OnboardingScreen onDone={finishOnboarding} />;
  }

  if (!auth.isLoggedIn) {
    if (authView === 'signup') {
      return (
        <SignupScreen
          onSuccess={() => setAuthView('login')}
          onLogin={() => setAuthView('login')}
        />
      );
    }
    if (authView === 'forgot') {
      return <ForgotPasswordScreen onBack={() => setAuthView('login')} />;
    }
    return (
      <LoginScreen
        onSuccess={() => setAuthView('login')}
        onSignup={() => setAuthView('signup')}
        onForgot={() => setAuthView('forgot')}
        login={auth.login}
        requestOtp={auth.requestOtp}
        verifyOtp={auth.verifyOtp}
      />
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '900' },
        },
      }}
    >
      <AppStack />
    </NavigationContainer>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    height: 62,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    paddingBottom: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    gap: 1,
  },
  applyBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 5,
  },
});
