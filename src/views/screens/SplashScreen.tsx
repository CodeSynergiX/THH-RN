/**
 * SplashScreen — translated from Stitch "THH Animated Splash Screen" design.
 * Features:
 *  - Animated SVG-style tree with pulsing glow (drawn in RN primitives + SVG)
 *  - Animated progress bar with cycling status messages (EN / GU)
 *  - Animated ambient glow circles
 *  - Trust badge, motto, village count pill
 *  - Language switcher pill
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import Svg, {
  Circle,
  Path,
  Defs,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';

const { width: W } = Dimensions.get('window');

const STATUS_MESSAGES = {
  en: [
    'Initializing Gram Seva Network...',
    'Syncing Village Medical Desks...',
    'Verifying Seva Volunteer Rosters...',
    'Connecting 140+ Tribal Centres...',
    'Ready for Seva & Welfare',
  ],
  gu: [
    'ગ્રામસેવા નેટવર્ક જોડાણ થઈ રહ્યું છે...',
    'ગામડાઓની સ્વાસ્થ્ય સેવા શરૂ થાય છે...',
    'સેવાભાવી કાર્યકર્તાઓની યાદી ચકાસી રહ્યાં છીએ...',
    '૧૪૦+ આદિવાસી ગામડાઓ જોડાઈ ગયા...',
    'સેવાકાર્ય માટે એપ્લિકેશન તૈયાર છે',
  ],
};

interface Props {
  onReady: () => void;
}

// ── Animated Tree SVG Component ───────────────────────────────────────────────
const THHTreeSVG: React.FC<{
  swayAnim: Animated.Value;
  floatAnim: Animated.Value;
}> = ({ swayAnim, floatAnim }) => {
  // interpolate sway -3 → 3 degrees for the crown
  const crownRotate = swayAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-3deg', '3deg'],
  });
  const peopleY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <View style={styles.svgWrap}>
      <Svg width={208} height={208} viewBox="0 0 400 400">
        <Defs>
          <RadialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
            <Stop offset="60%" stopColor="#1b7a38" stopOpacity={0.1} />
            <Stop offset="100%" stopColor="#1b7a38" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Ambient background glow */}
        <Circle cx={200} cy={200} r={160} fill="url(#sunGlow)" />

        {/* Dashed orbit ring */}
        <Circle
          cx={200}
          cy={200}
          r={170}
          fill="none"
          stroke="#22c55e"
          strokeWidth={1.5}
          strokeDasharray="8 8"
          opacity={0.4}
        />

        {/* Ground curve */}
        <Path
          d="M 40 330 Q 200 270 360 330"
          stroke="#1b7a38"
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          opacity={0.9}
        />
        <Path
          d="M 70 334 Q 200 286 330 334"
          stroke="#4ade80"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          opacity={0.6}
        />

        {/* Tree trunk */}
        <Path
          d="M 178 300 Q 185 240 160 210 Q 185 220 200 240 Q 215 220 240 210 Q 215 240 222 300 Z"
          fill="#45220a"
        />
        <Path d="M 195 240 L 205 240 L 200 170 Z" fill="#45220a" />

        {/* Root dots */}
        <Circle cx={150} cy={318} r={4} fill="#16a34a" />
        <Circle cx={200} cy={308} r={5} fill="#22c55e" />
        <Circle cx={250} cy={318} r={4} fill="#16a34a" />
      </Svg>

      {/* Animated crown (sways) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ rotate: crownRotate }] },
        ]}
      >
        <Svg
          width={208}
          height={208}
          viewBox="0 0 400 400"
          style={StyleSheet.absoluteFill}
        >
          <Path
            d="M 200 90 C 185 110 185 135 200 155 C 215 135 215 110 200 90 Z"
            fill="#15803d"
          />
          <Path
            d="M 200 90 L 200 155"
            stroke="#86efac"
            strokeWidth={1.5}
            opacity={0.6}
          />
          <Path
            d="M 160 115 C 140 128 135 152 152 170 C 170 155 174 132 160 115 Z"
            fill="#16a34a"
          />
          <Path
            d="M 125 155 C 105 170 105 195 125 210 C 142 195 142 170 125 155 Z"
            fill="#22c55e"
          />
          <Path
            d="M 240 115 C 260 128 265 152 248 170 C 230 155 226 132 240 115 Z"
            fill="#16a34a"
          />
          <Path
            d="M 275 155 C 295 170 295 195 275 210 C 258 195 258 170 275 155 Z"
            fill="#22c55e"
          />
          <Path
            d="M 105 215 C 90 232 95 255 118 262 C 130 242 125 222 105 215 Z"
            fill="#15803d"
          />
          <Path
            d="M 295 215 C 310 232 305 255 282 262 C 270 242 275 222 295 215 Z"
            fill="#15803d"
          />
          <Circle cx={200} cy={180} r={14} fill="#166534" />
          <Circle cx={160} cy={195} r={12} fill="#15803d" />
          <Circle cx={240} cy={195} r={12} fill="#15803d" />
        </Svg>
      </Animated.View>

      {/* Animated floating people */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateY: peopleY }] },
        ]}
      >
        <Svg
          width={208}
          height={208}
          viewBox="0 0 400 400"
          style={StyleSheet.absoluteFill}
        >
          {/* Center Person */}
          <Circle cx={200} cy={172} r={7} fill="#ffffff" />
          <Path
            d="M 193 186 C 193 181 207 181 207 186 L 206 198 C 206 201 194 201 194 198 Z"
            fill="#ffffff"
          />
          {/* Top */}
          <Circle cx={200} cy={74} r={6} fill="#1b7a38" />
          <Path
            d="M 194 86 C 194 82 206 82 206 86 L 205 96 L 195 96 Z"
            fill="#1b7a38"
          />
          {/* Left */}
          <Circle cx={150} cy={95} r={6} fill="#1b7a38" />
          <Path
            d="M 144 107 C 144 103 156 103 156 107 L 155 117 L 145 117 Z"
            fill="#1b7a38"
          />
          <Circle cx={105} cy={138} r={6} fill="#1b7a38" />
          <Path
            d="M 99 150 C 99 146 111 146 111 150 L 110 160 L 100 160 Z"
            fill="#1b7a38"
          />
          {/* Right */}
          <Circle cx={250} cy={95} r={6} fill="#1b7a38" />
          <Path
            d="M 244 107 C 244 103 256 103 256 107 L 255 117 L 245 117 Z"
            fill="#1b7a38"
          />
          <Circle cx={295} cy={138} r={6} fill="#1b7a38" />
          <Path
            d="M 289 150 C 289 146 301 146 301 150 L 300 160 L 290 160 Z"
            fill="#1b7a38"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

// ── Main SplashScreen ──────────────────────────────────────────────────────────
export const SplashScreen: React.FC<Props> = ({ onReady }) => {
  const { theme, syncThemeFromServer } = useAppTheme();
  const { colors } = theme;
  const { syncTranslationsFromServer } = useTranslation();
  const [lang, setLang] = useState<'en' | 'gu'>('en');
  const [statusIdx, setStatusIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  // Animations
  const pulseAnim = useRef(new Animated.Value(0.85)).current;
  const swayAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const progressAV = useRef(new Animated.Value(0)).current;

  // Pulse ring
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  // Crown sway
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(swayAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [swayAnim]);

  // Float people
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [floatAnim]);

  // Bootstrap + fake progress
  useEffect(() => {
    let cancelled = false;

    const bootAsync = async () => {
      try {
        // Fast sync: attempt theme and translations sync during splash boot
        await Promise.race([
          Promise.all([syncThemeFromServer(), syncTranslationsFromServer()]),
          new Promise(r => setTimeout(() => r(null), 2500)),
        ]);
      } catch {
        // Continue gracefully even if network is offline
      }

      if (!cancelled) {
        setStatusIdx(4);
        setProgress(100);
        Animated.timing(progressAV, {
          toValue: 100,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: false,
        }).start(() => {
          if (!cancelled) {
            setTimeout(onReady, 350);
          }
        });
      }
    };

    // Failsafe timer: guarantees splash screen will transition within 3.5s max
    const failsafe = setTimeout(() => {
      if (!cancelled) {
        onReady();
      }
    }, 3500);

    // Simulate progress increments
    let p = 15;
    const tick = setInterval(() => {
      p += Math.floor(Math.random() * 12) + 6;
      if (p >= 90) {
        clearInterval(tick);
        p = 90;
      }
      setProgress(p);
      setStatusIdx(p > 85 ? 3 : p > 60 ? 2 : p > 30 ? 1 : 0);
      Animated.timing(progressAV, {
        toValue: p,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    }, 200);

    bootAsync();
    return () => {
      cancelled = true;
      clearInterval(tick);
      clearTimeout(failsafe);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progressWidth = progressAV.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const PRIMARY = colors.primary || '#006026';
  const SURFACE = colors.background || '#fff8f5';
  const SURFACE_LOW = colors.surfaceSubtle || colors.surface || '#fff1ea';
  const SURFACE_CONTAINER = colors.borderSubtle || '#ffeadf';
  const SECONDARY = colors.secondary || '#79573c';
  const MUTED = colors.textMuted || '#6f7a6e';

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: SURFACE }]}
      edges={['top', 'bottom']}
    >
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        {/* Ambient glows */}
        <View style={[styles.glow1, { backgroundColor: `${PRIMARY}18` }]} />
        <View style={[styles.glow2, { backgroundColor: '#ffd1af66' }]} />
        <View style={[styles.glow3, { backgroundColor: '#187a3718' }]} />

        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={[styles.trustBadge, { backgroundColor: SURFACE_LOW }]}>
            <View style={[styles.pulseDot, { backgroundColor: PRIMARY }]} />
            <Text style={[styles.trustText, { color: MUTED }]}>
              Regd. Trust 12A / 80G
            </Text>
          </View>

          <View style={[styles.langPill, { backgroundColor: '#ffe3d4' }]}>
            <TouchableOpacity
              style={[
                styles.langBtn,
                lang === 'en' && { backgroundColor: '#fff', elevation: 1 },
              ]}
              onPress={() => setLang('en')}
            >
              <Text
                style={[
                  styles.langBtnText,
                  {
                    color: lang === 'en' ? PRIMARY : MUTED,
                    fontWeight: lang === 'en' ? '700' : '500',
                  },
                ]}
              >
                EN
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.langBtn,
                lang === 'gu' && { backgroundColor: '#fff', elevation: 1 },
              ]}
              onPress={() => setLang('gu')}
            >
              <Text
                style={[
                  styles.langBtnText,
                  {
                    color: lang === 'gu' ? PRIMARY : MUTED,
                    fontWeight: lang === 'gu' ? '700' : '500',
                  },
                ]}
              >
                ગુ
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero center */}
        <View style={styles.hero}>
          {/* Pulsing outer ring */}
          <Animated.View
            style={[
              styles.pulseRing,
              {
                backgroundColor: `${PRIMARY}22`,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />

          {/* Tree circle */}
          <View style={[styles.treeCircle, { backgroundColor: '#ffffff' }]}>
            <THHTreeSVG swayAnim={swayAnim} floatAnim={floatAnim} />
          </View>

          {/* Brand */}
          <View style={styles.brandRow}>
            <Text style={[styles.brandInitials, { color: SECONDARY }]}>
              THH
            </Text>
            <View style={styles.brandCenter}>
              <Ionicons name="leaf" size={20} color={PRIMARY} />
              <Text style={[styles.regMark, { color: MUTED }]}>®</Text>
            </View>
          </View>

          <Text style={[styles.brandTitle, { color: PRIMARY }]}>
            THE HELPING HANDS
          </Text>

          {/* Motto pill */}
          <View
            style={[styles.mottoPill, { backgroundColor: SURFACE_CONTAINER }]}
          >
            <Ionicons name="heart" size={14} color={PRIMARY} />
            <Text style={[styles.mottoText, { color: PRIMARY }]}>
              {lang === 'gu'
                ? 'માનવસેવા એ જ પ્રભુસેવા'
                : 'Humanity is the Highest Worship'}
            </Text>
            <Text
              style={{
                color: '#bfcabb',
                fontWeight: '700',
                marginHorizontal: 4,
              }}
            >
              •
            </Text>
            <Text style={[styles.mottoSub, { color: MUTED }]}>
              Service to Life
            </Text>
          </View>

          {/* Slogan */}
          <Text style={[styles.slogan, { color: MUTED }]}>
            {lang === 'gu'
              ? 'સહયોગથી સ્વાવલંબન તરફ: લોકકલ્યાણ, શિક્ષણ અને સ્વાસ્થ્ય.'
              : 'Empowering communities, nurturing grassroots resilience, and sustaining hope hand-in-hand.'}
          </Text>

          {/* Village count pill */}
          <View style={[styles.villagePill, { backgroundColor: '#ffffff' }]}>
            <View style={styles.pingWrap}>
              <View
                style={[styles.pingOuter, { backgroundColor: `${PRIMARY}55` }]}
              />
              <View style={[styles.pingInner, { backgroundColor: PRIMARY }]} />
            </View>
            <Text style={[styles.villageText, { color: '#2a170b' }]}>
              Connecting{' '}
              <Text style={{ color: PRIMARY, fontWeight: '700' }}>
                140+ Tribal & Rural Villages
              </Text>{' '}
              across Navsari & Dang
            </Text>
          </View>
        </View>

        {/* Progress card */}
        <View style={[styles.progressCard, { backgroundColor: '#ffffff' }]}>
          <View style={styles.progressHeader}>
            <View style={styles.progressLeft}>
              <Ionicons name="git-network-outline" size={16} color={PRIMARY} />
              <Text
                style={[styles.progressLabel, { color: MUTED }]}
                numberOfLines={1}
              >
                {STATUS_MESSAGES[lang][statusIdx]}
              </Text>
            </View>
            <Text style={[styles.progressPct, { color: PRIMARY }]}>
              {Math.round(progress)}%
            </Text>
          </View>

          <View
            style={[
              styles.progressTrack,
              { backgroundColor: SURFACE_CONTAINER },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: PRIMARY, width: progressWidth },
              ]}
            />
          </View>

          <View style={styles.progressFooter}>
            <View style={styles.footerItem}>
              <Ionicons name="checkmark-circle" size={12} color={PRIMARY} />
              <Text style={[styles.footerText, { color: MUTED }]}>
                100% Free Public Welfare
              </Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="people-outline" size={12} color={SECONDARY} />
              <Text style={[styles.footerText, { color: MUTED }]}>
                Govt. Registered NGO
              </Text>
            </View>
          </View>
        </View>

        {/* Skip button */}
        <TouchableOpacity
          style={[styles.skipBtn, { backgroundColor: PRIMARY }]}
          onPress={onReady}
          activeOpacity={0.85}
        >
          <Text style={styles.skipText}>
            {lang === 'gu' ? 'સીધા મુખ્ય પૃષ્ઠ પર જાઓ' : 'Enter App / આગળ વધો'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>

        <Text style={[styles.footer, { color: MUTED }]}>
          Rooted in Compassion • Powered by Community
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16, paddingBottom: 12 },

  // Ambient glows
  glow1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    top: -80,
    alignSelf: 'center',
    opacity: 0.6,
  },
  glow2: {
    position: 'absolute',
    width: 256,
    height: 256,
    borderRadius: 128,
    top: '33%',
    left: -80,
    opacity: 0.4,
  },
  glow3: {
    position: 'absolute',
    width: 288,
    height: 288,
    borderRadius: 144,
    bottom: 40,
    right: -80,
    opacity: 0.3,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 4,
    zIndex: 10,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  trustText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  langPill: { flexDirection: 'row', borderRadius: 99, padding: 2, gap: 2 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  langBtnText: { fontSize: 11 },

  // Hero
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 10,
  },
  pulseRing: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  treeCircle: {
    width: 224,
    height: 224,
    borderRadius: 112,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  svgWrap: { width: 208, height: 208, position: 'relative' },

  // Brand
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  brandInitials: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  brandCenter: { alignItems: 'center' },
  regMark: { fontSize: 10, fontWeight: '700', lineHeight: 12 },
  brandTitle: { fontSize: 18, fontWeight: '800', letterSpacing: 1.5 },

  // Motto
  mottoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  mottoText: { fontSize: 12, fontWeight: '600' },
  mottoSub: { fontSize: 11 },

  // Slogan
  slogan: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: W * 0.82,
  },

  // Village pill
  villagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  pingWrap: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingOuter: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
  pingInner: { width: 10, height: 10, borderRadius: 5 },
  villageText: { fontSize: 11, fontWeight: '500', flex: 1 },

  // Progress card
  progressCard: {
    borderRadius: 14,
    padding: 14,
    gap: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  progressLabel: { fontSize: 12, fontWeight: '500', flex: 1 },
  progressPct: { fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 10, fontWeight: '500' },

  // Skip
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    marginTop: 10,
    elevation: 3,
  },
  skipText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  footer: { textAlign: 'center', fontSize: 11, marginTop: 8, opacity: 0.7 },
});
