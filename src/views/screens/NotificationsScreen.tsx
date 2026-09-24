import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import {
  notificationService,
  NotificationItem,
} from '../../services/notificationService';

interface NotificationsScreenProps {
  onBack?: () => void;
  onNavigateToCase?: (caseNo: string) => void;
  isLoggedIn?: boolean;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onBack,
  onNavigateToCase,
  isLoggedIn = false,
}) => {
  const { theme } = useAppTheme();
  const { colors, typography } = theme;
  const { t } = useTranslation();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getNotifications(1);
      if (res && res.data) {
        setNotifications(res.data.data || []);
        if (typeof res.unread_count === 'number') {
          setUnreadCount(res.unread_count);
        }
      }
    } catch {
      if (isLoggedIn) {
        setNotifications([]);
        setUnreadCount(0);
      } else {
        setNotifications(prev =>
          prev.length > 0
            ? prev
            : [
                {
                  id: 1,
                  type: 'case_status_change',
                  title: 'Case Status Updated',
                  body: 'Your case THH-2026-00001 has been moved to Verification stage.',
                  data: { case_no: 'THH-2026-00001' },
                  status: 'delivered',
                  read_at: null,
                  created_at: new Date().toISOString(),
                },
                {
                  id: 2,
                  type: 'assignment',
                  title: 'Officer Assigned',
                  body: 'Field Officer Ramesh Patel has been assigned to your request.',
                  data: { case_no: 'THH-2026-00001' },
                  status: 'sent',
                  read_at: null,
                  created_at: new Date(Date.now() - 3600000).toISOString(),
                },
                {
                  id: 3,
                  type: 'general',
                  title: 'Welcome to Tribal Helping Hand',
                  body: 'Empowering tribal communities with fast government scheme access.',
                  data: null,
                  status: 'opened',
                  read_at: new Date(Date.now() - 86400000).toISOString(),
                  created_at: new Date(Date.now() - 86400000).toISOString(),
                },
              ],
        );
        setUnreadCount(2);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkRead = async (item: NotificationItem) => {
    if (item.read_at) return;
    try {
      await notificationService.markRead(item.id);
    } catch {
      // Optimistic local update
    }
    setNotifications(prev =>
      prev.map(n =>
        n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n,
      ),
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    if (
      item.data &&
      typeof item.data.case_no === 'string' &&
      onNavigateToCase
    ) {
      onNavigateToCase(item.data.case_no);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
    } catch {
      // Optimistic local update
    }
    setNotifications(prev =>
      prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })),
    );
    setUnreadCount(0);
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read_at;
    return true;
  });

  const getIconForType = (type: string) => {
    switch (type) {
      case 'case_status_change':
        return { name: 'file-document-edit-outline', color: colors.primary };
      case 'assignment':
        return { name: 'account-check-outline', color: colors.secondary };
      case 'follow_up_due':
        return { name: 'clock-alert-outline', color: colors.accent };
      case 'sla_breach':
        return { name: 'alert-circle-outline', color: colors.statusRejected };
      case 'case_resolved':
        return { name: 'check-circle-outline', color: colors.statusResolved };
      default:
        return { name: 'bell-outline', color: colors.primary };
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      if (diffMinutes < 1) return t('notifications.just_now', 'Just now');
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return dateStr;
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={22} color={colors.text} />
            </TouchableOpacity>
          )}
          <Text
            style={[
              styles.headerTitle,
              { color: colors.text, fontSize: typography.fontSizeLg },
            ]}
          >
            {t('notifications.title', 'Notifications')}
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            activeOpacity={0.7}
            style={styles.markAllBtn}
          >
            <Text
              style={[
                styles.markAllText,
                { color: colors.primary, fontSize: typography.fontSizeSm },
              ]}
            >
              {t('notifications.mark_all_read', 'Mark all read')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View
        style={[styles.filterBar, { borderBottomColor: colors.borderSubtle }]}
      >
        <TouchableOpacity
          onPress={() => setFilter('all')}
          style={[
            styles.filterTab,
            filter === 'all' && [
              styles.filterTabActive,
              { borderBottomColor: colors.primary },
            ],
          ]}
        >
          <Text
            style={[
              styles.filterText,
              {
                color: filter === 'all' ? colors.primary : colors.textMuted,
                fontSize: typography.fontSizeSm,
              },
            ]}
          >
            {t('notifications.filter_all', 'All')} ({notifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFilter('unread')}
          style={[
            styles.filterTab,
            filter === 'unread' && [
              styles.filterTabActive,
              { borderBottomColor: colors.primary },
            ],
          ]}
        >
          <Text
            style={[
              styles.filterText,
              {
                color: filter === 'unread' ? colors.primary : colors.textMuted,
                fontSize: typography.fontSizeSm,
              },
            ]}
          >
            {t('notifications.filter_unread', 'Unread')} ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={item => String(item.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            filteredNotifications.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="notifications-off-outline"
                size={54}
                color={colors.textMuted}
              />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: colors.text, fontSize: typography.fontSizeBase },
                ]}
              >
                {t('notifications.empty_title', 'No notifications yet')}
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: colors.textMuted, fontSize: typography.fontSizeSm },
                ]}
              >
                {t(
                  'notifications.empty_subtitle',
                  "You're all caught up! Updates about your requests will appear here.",
                )}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isUnread = !item.read_at;
            const iconConfig = getIconForType(item.type);

            return (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleMarkRead(item)}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isUnread
                      ? colors.primary + '50'
                      : colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: iconConfig.color + '15' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={iconConfig.name}
                    size={22}
                    color={iconConfig.color}
                  />
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.cardHeaderRow}>
                    <Text
                      style={[
                        styles.itemTitle,
                        {
                          color: colors.text,
                          fontSize: typography.fontSizeBase,
                          fontWeight: isUnread ? '700' : '500',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[
                        styles.timestamp,
                        {
                          color: colors.textMuted,
                          fontSize: typography.fontSizeXs,
                        },
                      ]}
                    >
                      {formatTimestamp(item.created_at)}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.itemBody,
                      {
                        color: colors.textMuted,
                        fontSize: typography.fontSizeSm,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {item.body}
                  </Text>
                </View>

                {isUnread && (
                  <View
                    style={[
                      styles.unreadDot,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 10,
    padding: 2,
  },
  headerTitle: {
    fontWeight: '700',
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  markAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontWeight: '600',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  filterTab: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 12,
  },
  filterTabActive: {},
  filterText: {
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemTitle: {
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontWeight: '400',
  },
  itemBody: {
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 4,
  },
});
