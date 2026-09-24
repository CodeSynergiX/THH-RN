import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  ToastAndroid,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastConfig {
  message: string;
  type?: ToastType;
  title?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (
    optionsOrMessage: ToastConfig | string,
    type?: ToastType,
    title?: string,
  ) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  hideToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
    title?: string;
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<any>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(prev => ({ ...prev, visible: false }));
    });
  }, [translateY, opacity]);

  const showToast = useCallback(
    (
      optionsOrMessage: ToastConfig | string,
      type: ToastType = 'info',
      title?: string,
    ) => {
      let config: ToastConfig;
      if (typeof optionsOrMessage === 'string') {
        config = { message: optionsOrMessage, type, title };
      } else {
        config = optionsOrMessage;
      }

      const toastType = config.type || 'info';
      const toastMessage = config.message || '';
      const toastTitle = config.title;
      const duration = config.duration ?? 3500;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      setToast({
        visible: true,
        message: toastMessage,
        type: toastType,
        title: toastTitle,
      });

      // Show native Android toast as well
      if (Platform.OS === 'android') {
        try {
          ToastAndroid.show(toastMessage, ToastAndroid.SHORT);
        } catch {
          // ignore if native toast fails
        }
      }

      // Animate In
      translateY.setValue(-120);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      // Schedule Auto-dismiss
      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [translateY, opacity, hideToast],
  );

  const getThemeProps = (t: ToastType) => {
    switch (t) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          iconColor: '#16a34a',
          badgeBg: '#dcfce7',
          borderColor: '#86efac',
          bg: '#ffffff',
          defaultTitle: 'Success',
        };
      case 'error':
        return {
          icon: 'alert-circle' as const,
          iconColor: '#dc2626',
          badgeBg: '#fee2e2',
          borderColor: '#fca5a5',
          bg: '#ffffff',
          defaultTitle: 'Error',
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          iconColor: '#d97706',
          badgeBg: '#fef3c7',
          borderColor: '#fcd34d',
          bg: '#ffffff',
          defaultTitle: 'Warning',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          iconColor: '#0284c7',
          badgeBg: '#e0f2fe',
          borderColor: '#7dd3fc',
          bg: '#ffffff',
          defaultTitle: 'Notice',
        };
    }
  };

  const currentTheme = getThemeProps(toast.type);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast.visible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              top: Math.max(insets.top, 14) + 6,
              transform: [{ translateY }],
              opacity,
            },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={hideToast}
            style={[
              styles.toastCard,
              {
                backgroundColor: currentTheme.bg,
                borderColor: currentTheme.borderColor,
              },
            ]}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: currentTheme.badgeBg },
              ]}
            >
              <Ionicons
                name={currentTheme.icon}
                size={22}
                color={currentTheme.iconColor}
              />
            </View>
            <View style={styles.contentWrap}>
              <Text style={styles.titleText}>
                {toast.title || currentTheme.defaultTitle}
              </Text>
              <Text style={styles.messageText} numberOfLines={3}>
                {toast.message}
              </Text>
            </View>
            <TouchableOpacity
              onPress={hideToast}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={16} color="#94a3b8" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 99999,
    elevation: 99999,
    alignItems: 'center',
  },
  toastCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    flex: 1,
    gap: 2,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  messageText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#334155',
    lineHeight: 16,
  },
  closeBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
