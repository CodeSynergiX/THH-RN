import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { CanopyHeader } from '../components/CanopyHeader';
import { configService } from '../../services/configService';

interface SectorItem {
  key?: string;
  slug: string;
  title: string;
  title_en?: string;
  title_gu?: string;
  subtitle?: string;
  icon?: string;
  accent_color?: string;
  show_apply_form?: boolean;
  count?: number;
}

/**
 * Maps Lucide icon names (stored in backend DB) → Ionicons names.
 * DB stores lowercase kebab-case (e.g. graduation-cap, book-open, heart-handshake).
 * PascalCase aliases kept for forward-compatibility with new seeders.
 */
const LUCIDE_TO_IONICONS: Record<string, string> = {
  // ─── Actual DB values (lowercase kebab-case) ───
  'graduation-cap': 'school-outline',
  'book-open': 'book-outline',
  'heart-pulse': 'fitness-outline',
  'heart-handshake': 'people-circle-outline',
  'shield-alert': 'shield-outline',
  'shield-check': 'shield-checkmark-outline',
  'file-text': 'document-text-outline',
  'file-check': 'document-outline',
  'file-spreadsheet': 'document-outline',
  'map-pin': 'location-outline',
  'help-circle': 'help-circle-outline',
  'shopping-bag': 'bag-outline',
  'user-plus': 'person-add-outline',
  'user-check': 'person-done-outline',
  'cloud-rain': 'rainy-outline',
  'building-2': 'business-outline',
  'check-circle': 'checkmark-circle-outline',
  'hand-heart': 'hand-left-outline',
  'clipboard-list': 'list-outline',
  sprout: 'leaf-outline',
  landmark: 'business-outline',
  briefcase: 'briefcase-outline',
  activity: 'pulse-outline',
  droplet: 'water-outline',
  droplets: 'water-outline',
  users: 'people-outline',
  scale: 'scale-outline',
  layers: 'layers-outline',
  home: 'home-outline',
  sun: 'sunny-outline',
  zap: 'flash-outline',
  wrench: 'construct-outline',
  package: 'cube-outline',
  sparkles: 'sparkles-outline',
  smile: 'happy-outline',
  coins: 'cash-outline',
  bike: 'bicycle-outline',
  ambulance: 'medkit-outline',
  navigation: 'navigate-outline',
  lightbulb: 'bulb-outline',
  award: 'shield-checkmark-outline',
  search: 'search-outline',
  shield: 'shield-outline',
  book: 'book-outline',
  trees: 'leaf-outline',
  // ─── PascalCase aliases (seeder / legacy) ───
  Award: 'shield-checkmark-outline',
  ShieldAlert: 'shield-outline',
  Shield: 'shield-outline',
  ShieldCheck: 'shield-checkmark-outline',
  GraduationCap: 'school-outline',
  BookOpen: 'book-outline',
  Book: 'book-outline',
  FileText: 'document-text-outline',
  FileCheck: 'document-outline',
  HeartPulse: 'fitness-outline',
  Activity: 'pulse-outline',
  Accessibility: 'accessibility-outline',
  UserCheck: 'person-done-outline',
  Scale: 'scale-outline',
  FileSpreadsheet: 'document-outline',
  MapPin: 'location-outline',
  HelpCircle: 'help-circle-outline',
  Briefcase: 'briefcase-outline',
  Wrench: 'construct-outline',
  ShoppingBag: 'bag-outline',
  Zap: 'flash-outline',
  UserPlus: 'person-add-outline',
  Trees: 'leaf-outline',
  Sprout: 'leaf-outline',
  CloudRain: 'rainy-outline',
  Layers: 'layers-outline',
  Package: 'cube-outline',
  Building2: 'business-outline',
  Building: 'business-outline',
  Droplets: 'water-outline',
  Navigation: 'navigate-outline',
  Lightbulb: 'bulb-outline',
  Trash2: 'trash-outline',
  Users: 'people-outline',
  HandHeart: 'hand-left-outline',
  Sparkles: 'sparkles-outline',
  Home: 'home-outline',
  Sun: 'sunny-outline',
  Coins: 'cash-outline',
  Bike: 'bicycle-outline',
  Ambulance: 'medkit-outline',
  CheckCircle: 'checkmark-circle-outline',
  Smile: 'happy-outline',
  Search: 'search-outline',
};

/** Default colors per sector type keyed by slug keyword */
const SLUG_COLORS: Array<{ keywords: string[]; color: string }> = [
  { keywords: ['scheme', 'yojana', 'government'], color: '#059669' },
  { keywords: ['scholarship', 'vidhyarthi'], color: '#4F46E5' },
  { keywords: ['job', 'employment', 'rojgar', 'livelihood'], color: '#0284C7' },
  {
    keywords: ['education', 'shikshan', 'library', 'mock', 'book'],
    color: '#D97706',
  },
  { keywords: ['blood', 'raktdan', 'emergency'], color: '#DC2626' },
  { keywords: ['health', 'aarogya', 'camp', 'medical'], color: '#E11D48' },
  {
    keywords: ['forest', 'kisan', 'krushi', 'agri', 'tree', 'sprout'],
    color: '#16A34A',
  },
  { keywords: ['legal', 'justice', 'scale', 'law'], color: '#7C3AED' },
  {
    keywords: ['infra', 'building', 'water', 'road', 'sanitation'],
    color: '#0369A1',
  },
  { keywords: ['sakhi', 'women', 'women'], color: '#DB2777' },
];

const resolveIconName = (backendIcon?: string): string => {
  if (!backendIcon) return 'grid-outline';
  // Direct mapping first
  if (LUCIDE_TO_IONICONS[backendIcon]) return LUCIDE_TO_IONICONS[backendIcon];
  // If it already looks like an Ionicons name (contains dash), use as-is
  if (backendIcon.includes('-')) return backendIcon;
  // Fallback
  return 'grid-outline';
};

const resolveColor = (slug: string, backendAccent?: string): string => {
  if (
    backendAccent &&
    backendAccent !== '#000000' &&
    backendAccent !== '#ffffff'
  ) {
    return backendAccent;
  }
  const s = slug.toLowerCase();
  for (const entry of SLUG_COLORS) {
    if (entry.keywords.some(k => s.includes(k))) return entry.color;
  }
  return '#2D6A4F';
};

export const SectorsScreen: React.FC<{
  onBack?: () => void;
  onSelect: (slug: string, title: string) => void;
}> = ({ onBack, onSelect }) => {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const { locale, language } = useTranslation();

  const [sectors, setSectors] = useState<SectorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    configService
      .getModules(locale)
      .then(data => {
        if (isMounted) {
          setSectors((data as SectorItem[]) || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [locale]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return sectors;
    const q = searchQuery.toLowerCase().trim();
    return sectors.filter(
      s =>
        s.title.toLowerCase().includes(q) ||
        (s.subtitle && s.subtitle.toLowerCase().includes(q)) ||
        (s.title_en && s.title_en.toLowerCase().includes(q)) ||
        (s.title_gu && s.title_gu.toLowerCase().includes(q)) ||
        s.slug.toLowerCase().includes(q),
    );
  }, [sectors, searchQuery]);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <CanopyHeader
        title={language === 'gu' ? 'સમાજ કલ્યાણ ક્ષેત્રો' : 'Community Sectors'}
        showBack={Boolean(onBack)}
        onBack={onBack}
      />

      {/* Top Search & Filter Bar */}
      <View
        style={[styles.searchContainer, { backgroundColor: colors.background }]}
      >
        <View
          style={[
            styles.searchBar,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={
              language === 'gu'
                ? 'ક્ષેત્રો, યોજનાઓ અથવા સેવાઓ શોધો...'
                : 'Search sectors, schemes or services...'
            }
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sector Count Header Pill */}
      <View style={styles.subHeader}>
        <Text style={[styles.subHeaderCount, { color: colors.textMuted }]}>
          {language === 'gu'
            ? `${filtered.length} કલ્યાણ સેવા ઉપલબ્ધ`
            : `Showing ${filtered.length} Active Services`}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            {language === 'gu'
              ? 'વિગતો લોડ થઈ રહી છે...'
              : 'Loading community sectors...'}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filtered.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="search" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {language === 'gu'
                  ? 'કોઈ ક્ષેત્ર મળ્યું નથી'
                  : 'No sectors found'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {language === 'gu'
                  ? 'કૃપા કરીને અન્ય શબ્દ વડે શોધો.'
                  : 'Try searching with different keywords.'}
              </Text>
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={[
                  styles.clearBtn,
                  { backgroundColor: colors.primaryContainer },
                ]}
              >
                <Text
                  style={[
                    styles.clearBtnText,
                    { color: colors.onPrimaryContainer },
                  ]}
                >
                  {language === 'gu' ? 'બધા દર્શાવો' : 'Show All'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            filtered.map(s => {
              const iconName = resolveIconName(s.icon);
              const accentColor = resolveColor(s.slug, s.accent_color);
              const displayTitle =
                language === 'gu'
                  ? s.title_gu || s.title
                  : s.title_en || s.title;

              return (
                <TouchableOpacity
                  key={s.slug}
                  activeOpacity={0.7}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => onSelect(s.slug, displayTitle)}
                >
                  {/* Left Icon with Vibrant Tinted Background */}
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: `${accentColor}18` },
                    ]}
                  >
                    <Ionicons
                      name={iconName as any}
                      size={26}
                      color={accentColor}
                    />
                  </View>

                  {/* Main Content */}
                  <View style={styles.cardContent}>
                    {/* Count Chip */}
                    {s.count !== undefined && s.count > 0 && (
                      <View style={styles.badgeRow}>
                        <View
                          style={[
                            styles.categoryTag,
                            { backgroundColor: `${accentColor}14` },
                          ]}
                        >
                          <Text
                            style={[
                              styles.categoryTagText,
                              { color: accentColor },
                            ]}
                          >
                            {language === 'gu'
                              ? `${s.count} સેવાઓ`
                              : `${s.count} Services`}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Title */}
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      {displayTitle}
                    </Text>

                    {/* Subtitle / Description */}
                    {s.subtitle ? (
                      <Text
                        style={[
                          styles.cardSubtitle,
                          { color: colors.textMuted },
                        ]}
                        numberOfLines={3}
                      >
                        {s.subtitle}
                      </Text>
                    ) : null}
                  </View>

                  {/* Right Circular Action Arrow */}
                  <View
                    style={[
                      styles.arrowCircle,
                      { backgroundColor: `${accentColor}12` },
                    ]}
                  >
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={accentColor}
                    />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  subHeader: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 4,
  },
  subHeaderCount: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  body: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
    paddingBottom: 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  countChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    marginTop: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  clearBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
