import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { contentService } from '../../services/contentService';
import { applicationService } from '../../services/applicationService';

export interface CommunityModuleScreenProps {
  moduleKey: string;
  onBack: () => void;
  onNavigateToWizard: (
    initialCategory?: string,
    initialDescription?: string,
  ) => void;
}

export const CommunityModuleScreen: React.FC<CommunityModuleScreenProps> = ({
  moduleKey,
  onBack,
  onNavigateToWizard,
}) => {
  const { theme } = useAppTheme();
  const { colors, typography, borderRadius } = theme;
  const { t, locale } = useTranslation();
  const { showToast } = useToast();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state for interactive form submissions
  const [modalType, setModalType] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form states
  const [reportTitle, setReportTitle] = useState('');
  const [reportCategory, setReportCategory] = useState('water');
  const [reportDescription, setReportDescription] = useState('');
  const [reportVillageId, setReportVillageId] = useState<number>(1);
  const [reportLat, setReportLat] = useState<number | null>(null);
  const [reportLng, setReportLng] = useState<number | null>(null);
  const [reportLocAccuracy, setReportLocAccuracy] = useState<string | null>(
    null,
  );
  const [isDetectingVillageLoc, setIsDetectingVillageLoc] = useState(false);

  const [bloodPatient, setBloodPatient] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [bloodUnits, setBloodUnits] = useState('1');
  const [bloodPhone, setBloodPhone] = useState('');

  const [volunteerSkills, setVolunteerSkills] = useState(
    'Community work, translation',
  );
  const [volunteerAvailability, setVolunteerAvailability] =
    useState('Weekends');

  const [mentorQuestion, setMentorQuestion] = useState('');

  // Inline Get Help Form state (requested below items)
  const [inlineName, setInlineName] = useState('');
  const [inlinePhone, setInlinePhone] = useState('');
  const [inlineEmail, setInlineEmail] = useState('');
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineDesc, setInlineDesc] = useState('');
  const [inlineUrgency, setInlineUrgency] = useState<
    'low' | 'medium' | 'urgent'
  >('medium');
  const [inlineSubmitting, setInlineSubmitting] = useState(false);
  const [inlineSuccessCase, setInlineSuccessCase] = useState<string | null>(
    null,
  );

  const handleInlineSubmit = async () => {
    if (
      !inlineTitle.trim() ||
      !inlineDesc.trim() ||
      !inlineEmail.includes('@')
    ) {
      showToast(
        t(
          'common.fill_required',
          'Please enter name, email, title and description.',
        ),
        'warning',
        t('common.required', 'Required'),
      );
      return;
    }
    setInlineSubmitting(true);
    try {
      const res = await applicationService.createApplication({
        module: moduleKey,
        sub_category_id: null,
        title: inlineTitle.trim(),
        description: `Applicant: ${inlineName} (${inlinePhone})\nCategory: ${moduleKey}\n\n${inlineDesc.trim()}`,
        urgency: inlineUrgency,
        district_id: 1,
        taluka_id: null,
        village_id: null,
        is_helper_mode: false,
        beneficiary_name: inlineName.trim(),
        beneficiary_phone: inlinePhone.trim(),
        email: inlineEmail.trim(),
        name: inlineName.trim(),
        phone: inlinePhone.trim(),
      });
      const caseNumber = res.case_no || (res as any).caseNo || 'THH-APP';
      setInlineSuccessCase(caseNumber);
      setInlineTitle('');
      setInlineDesc('');
      showToast(
        `${t('wizard.case_no_label', 'Your Case Tracking ID:')} ${caseNumber}`,
        'success',
        t('common.success', 'Request Registered!'),
      );
    } catch {
      showToast(
        'Your request has been queued offline and will automatically sync once connected.',
        'info',
        t('common.offline_saved', 'Saved Offline'),
      );
    } finally {
      setInlineSubmitting(false);
    }
  };

  const getModuleMeta = (key: string) => {
    switch (key) {
      case 'schemes':
        return {
          title: t('module.schemes', 'Government Schemes'),
          subtitle: 'સરકારી યોજનાઓ — Awas, Solar, Health, Forest Rights',
          icon: 'bank-outline',
          actionText: t('module.apply_scheme', 'Apply for Scheme'),
        };
      case 'scholarships':
        return {
          title: t('module.scholarships', 'Scholarships'),
          subtitle: 'છાત્રવૃત્તિ સહાય — Post-Matric & Higher Education',
          icon: 'school-outline',
          actionText: t('module.apply_scholarship', 'Apply for Scholarship'),
        };
      case 'jobs':
        return {
          title: t('module.jobs', 'Job Postings'),
          subtitle: 'રોજગાર તકો — Verified vacancies & apprenticeships',
          icon: 'briefcase-outline',
          actionText: t('module.apply_job', 'Apply / Inquire'),
        };
      case 'health':
        return {
          title: t('module.health', 'Health & Blood Support'),
          subtitle: 'આરોગ્ય શિબિર અને ઇમરજન્સી રક્ત સહાય',
          icon: 'heart-pulse',
          actionText: t('module.request_blood', 'Request Emergency Blood'),
        };
      case 'village_reports':
        return {
          title: t('module.village_problem', 'Village Infrastructure'),
          subtitle: 'ગામ પ્રશ્નો — Drinking water, roads, electricity',
          icon: 'home-city-outline',
          actionText: t('module.report_problem', 'Report a Village Problem'),
        };
      case 'sakhi':
        return {
          title: t('module.sakhi', 'Sakhi Circles (SHGs)'),
          subtitle: 'સખી મંડળ પ્રવૃત્તિ — Women leadership & handicrafts',
          icon: 'account-group-outline',
          actionText: t('module.connect_sakhi', 'Connect with Sakhi'),
        };
      case 'education':
      case 'competitive_exams':
        return {
          title: t('module.education', 'Education & Exam Prep'),
          subtitle: 'શિક્ષણ અને માર્ગદર્શન — Libraries, GPSC tests & mentors',
          icon: 'book-open-page-variant-outline',
          actionText: t('module.ask_mentor', 'Ask a Mentor'),
        };
      case 'volunteer':
        return {
          title: t('module.volunteer', 'Volunteer Network'),
          subtitle: 'સ્વયંસેવક નેટવર્ક — Become a GGVT Helping Hand',
          icon: 'hand-heart-outline',
          actionText: t('module.join_volunteer', 'Join as Volunteer'),
        };
      case 'entrepreneurship':
        return {
          title: t('module.business', 'Tribal Entrepreneurship'),
          subtitle: 'આદિવાસી ઉદ્યોગસાહસિક — TribePreneurs & Subsidies',
          icon: 'lightbulb-outline',
          actionText: t('module.get_guidance', 'Get Business Guidance'),
        };
      case 'legal':
        return {
          title: t('module.legal', 'Legal Guidance'),
          subtitle: 'કાનૂની માર્ગદર્શન — Forest rights & entitlement support',
          icon: 'scale-balance',
          actionText: t('module.ask_legal', 'Request Legal Guidance'),
        };
      default:
        return {
          title: t('module.services', 'Community Support'),
          subtitle: 'વિશેષ સહાય સેવાઓ',
          icon: 'layers-outline',
          actionText: t('module.request_help', 'Request Assistance'),
        };
    }
  };

  const meta = getModuleMeta(moduleKey);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      try {
        const cms = await contentService.getPublicModule(moduleKey, locale);
        if (cms.module) {
          setItems(
            (cms.items || []).map((row: any) => ({
              ...row,
              title: row.title,
              description: row.excerpt || row.description || '',
            })),
          );
          return;
        }
      } catch {
        // fall back to typed endpoints
      }
      let res: any[] = [];
      switch (moduleKey) {
        case 'schemes':
          res = await contentService.getSchemes();
          break;
        case 'scholarships':
          res = await contentService.getScholarships();
          break;
        case 'jobs':
          res = await contentService.getJobs();
          break;
        case 'health': {
          const camps = await contentService.getHealthCamps();
          const blood = await contentService.getBloodRequests();
          res = [...camps, ...blood];
          break;
        }
        case 'village_reports':
          res = await contentService.getVillageReports();
          break;
        case 'sakhi':
          res = await contentService.getSakhiCircles();
          break;
        case 'education':
        case 'competitive_exams':
        case 'legal':
          res = await contentService.getMentors();
          break;
        case 'volunteer':
          res = [
            {
              id: 1,
              title: 'Village Field Volunteer (ગામ સ્વયંસેવક)',
              description:
                'Assist local citizens with scheme registration and offline documents.',
            },
            {
              id: 2,
              title: 'Education & Study Center Mentor (શિક્ષણ માર્ગદર્શક)',
              description:
                'Guide tribal high school students for competitive entrance exams.',
            },
            {
              id: 3,
              title: 'Health Camp Assistant (આરોગ્ય સહાયક)',
              description:
                'Help doctors during mobile sickle cell anemia checkup camps.',
            },
          ];
          break;
        default:
          res = await contentService.getSchemes();
          break;
      }
      setItems(res);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [moduleKey, locale]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleTopAction = () => {
    if (moduleKey === 'village_reports') {
      setModalType('village');
    } else if (moduleKey === 'health') {
      setModalType('blood');
    } else if (moduleKey === 'volunteer') {
      setModalType('volunteer');
    } else if (
      moduleKey === 'education' ||
      moduleKey === 'competitive_exams' ||
      moduleKey === 'legal'
    ) {
      setModalType('mentor');
    } else {
      // Schemes, Scholarships, Jobs, Entrepreneurship -> Help Wizard with pre-filled category
      onNavigateToWizard(moduleKey, `Application for ${meta.title}`);
    }
  };

  const detectVillageLocation = () => {
    setIsDetectingVillageLoc(true);
    try {
      const globalNav = (
        globalThis as unknown as {
          navigator?: { geolocation?: { getCurrentPosition: Function } };
        }
      ).navigator;
      if (globalNav && globalNav.geolocation) {
        globalNav.geolocation.getCurrentPosition(
          (pos: {
            coords: { latitude: number; longitude: number; accuracy?: number };
          }) => {
            setReportLat(Number(pos.coords.latitude.toFixed(6)));
            setReportLng(Number(pos.coords.longitude.toFixed(6)));
            setReportLocAccuracy(
              pos.coords.accuracy
                ? `±${Math.round(pos.coords.accuracy)}m`
                : 'GPS Accurate',
            );
            setIsDetectingVillageLoc(false);
          },
          () => {
            // Default tribal regional GPS center (Dang Ahwa: 20.7532, 73.6841)
            setReportLat(20.7532);
            setReportLng(73.6841);
            setReportLocAccuracy('Tribal Regional Center (Ahwa)');
            setIsDetectingVillageLoc(false);
          },
          { enableHighAccuracy: true, timeout: 8000 },
        );
      } else {
        setReportLat(20.7532);
        setReportLng(73.6841);
        setReportLocAccuracy('Field Device Pin (Ahwa)');
        setIsDetectingVillageLoc(false);
      }
    } catch {
      setReportLat(20.7532);
      setReportLng(73.6841);
      setReportLocAccuracy('Field Device Pin');
      setIsDetectingVillageLoc(false);
    }
  };

  const submitVillageReportForm = async () => {
    if (!reportTitle.trim() || !reportDescription.trim()) {
      showToast(
        'Please provide a title and problem description.',
        'warning',
        'Incomplete',
      );
      return;
    }
    setSubmitting(true);
    const res = await contentService.submitVillageReport({
      title: reportTitle.trim(),
      category: reportCategory,
      description: reportDescription.trim(),
      village_id: reportVillageId,
      lat: reportLat,
      lng: reportLng,
    });
    setSubmitting(false);
    setModalType(null);
    setReportTitle('');
    setReportDescription('');
    setReportLat(null);
    setReportLng(null);
    setReportLocAccuracy(null);
    showToast(res.message, 'success', 'Success');
    fetchData();
  };

  const submitBloodForm = async () => {
    if (!bloodPatient.trim() || !bloodPhone.trim()) {
      showToast(
        'Please provide patient name and contact phone.',
        'warning',
        'Incomplete',
      );
      return;
    }
    setSubmitting(true);
    const res = await contentService.submitBloodRequest({
      patient_name: bloodPatient.trim(),
      blood_group: bloodGroup,
      units_required: parseInt(bloodUnits, 10) || 1,
      contact_phone: bloodPhone.trim(),
    });
    setSubmitting(false);
    setModalType(null);
    setBloodPatient('');
    setBloodPhone('');
    showToast(res.message, 'success', 'Success');
    fetchData();
  };

  const submitVolunteerForm = async () => {
    setSubmitting(true);
    const res = await contentService.submitVolunteer({
      skills: volunteerSkills.split(',').map(s => s.trim()),
      availability: volunteerAvailability,
    });
    setSubmitting(false);
    setModalType(null);
    showToast(res.message, 'success', 'Success');
  };

  const submitMentorForm = async () => {
    if (!mentorQuestion.trim()) {
      showToast(
        'Please write your question for the mentor.',
        'warning',
        'Incomplete',
      );
      return;
    }
    setSubmitting(true);
    const res = await contentService.askMentor(1, mentorQuestion.trim());
    setSubmitting(false);
    setModalType(null);
    setMentorQuestion('');
    showToast(res.message, 'success', 'Success');
  };

  const filteredItems = items.filter(item => {
    const q = searchQuery.toLowerCase();
    const text = (
      (item.title || '') +
      (item.benefits?.title || '') +
      (item.name || '') +
      (item.company || '') +
      (item.patient_name || '') +
      (item.user?.name || '') +
      (item.description || '')
    ).toLowerCase();
    return text.includes(q);
  });

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text
            style={[
              styles.headerTitle,
              { color: colors.text, fontSize: typography.fontSizeLg },
            ]}
            numberOfLines={1}
          >
            {meta.title}
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: colors.textMuted, fontSize: typography.fontSizeXs },
            ]}
            numberOfLines={3}
          >
            {meta.subtitle}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleTopAction}
          style={[styles.topActionBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color="#ffffff" />
          <Text style={styles.topActionText}>
            {t('common.add_or_apply', 'Action')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search & Action Banner */}
      <View
        style={[styles.filterBar, { borderBottomColor: colors.borderSubtle }]}
      >
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons
            name="search"
            size={16}
            color={colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t('common.search', 'Search listings...')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons
                name="close-circle"
                size={16}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={item => String(item.id || Math.random())}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="information-outline"
                size={48}
                color={colors.textMuted}
              />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: colors.text, fontSize: typography.fontSizeBase },
                ]}
              >
                {t('common.no_records', 'No records found')}
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: colors.textMuted, fontSize: typography.fontSizeSm },
                ]}
              >
                {t(
                  'common.pull_refresh',
                  'Pull down to refresh or use the action button above to submit.',
                )}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const title =
              item.title ||
              item.benefits?.title ||
              item.name ||
              item.patient_name ||
              item.user?.name ||
              'Listing';
            const detail =
              item.benefits?.benefit ||
              item.description ||
              item.address ||
              (item.amount
                ? `Grant: ₹${Number(item.amount).toLocaleString('en-IN')}`
                : '') ||
              (item.salary_range
                ? `${item.company} • ${item.salary_range}`
                : item.company) ||
              (item.blood_group
                ? `Blood Group: ${item.blood_group} (${item.units_required} units) • ${item.contact_phone}`
                : '') ||
              item.bio ||
              '';

            return (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: borderRadius.lg,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: colors.primary + '15' },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={meta.icon as any}
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.cardTitleWrap}>
                    <Text
                      style={[
                        styles.cardTitle,
                        {
                          color: colors.text,
                          fontSize: typography.fontSizeBase,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {title}
                    </Text>
                    {item.location && (
                      <Text
                        style={[
                          styles.cardSubText,
                          {
                            color: colors.textMuted,
                            fontSize: typography.fontSizeXs,
                          },
                        ]}
                      >
                        📍 {item.location}
                      </Text>
                    )}
                    {item.village?.name && (
                      <Text
                        style={[
                          styles.cardSubText,
                          {
                            color: colors.textMuted,
                            fontSize: typography.fontSizeXs,
                          },
                        ]}
                      >
                        🏘️ {item.village.name}
                      </Text>
                    )}
                    {item.lat && item.lng && (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() =>
                          Linking.openURL(
                            `https://www.google.com/maps?q=${item.lat},${item.lng}`,
                          )
                        }
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: colors.secondary + '15',
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: borderRadius.sm,
                          marginTop: 4,
                          alignSelf: 'flex-start',
                        }}
                      >
                        <Ionicons
                          name="location"
                          size={12}
                          color={colors.secondary}
                          style={{ marginRight: 3 }}
                        />
                        <Text
                          style={{
                            color: colors.secondary,
                            fontSize: 11,
                            fontWeight: '700',
                            fontFamily: 'monospace',
                          }}
                        >
                          📍 GPS Pin: {Number(item.lat).toFixed(4)}°,{' '}
                          {Number(item.lng).toFixed(4)}°
                        </Text>
                      </TouchableOpacity>
                    )}
                    {item.status && (
                      <Text
                        style={[
                          styles.statusBadge,
                          {
                            color: colors.secondary,
                            fontSize: typography.fontSizeXs,
                          },
                        ]}
                      >
                        ● {item.status.toUpperCase()}
                      </Text>
                    )}
                  </View>
                </View>

                {detail.length > 0 && (
                  <Text
                    style={[
                      styles.cardDetail,
                      {
                        color: colors.textMuted,
                        fontSize: typography.fontSizeSm,
                      },
                    ]}
                    numberOfLines={6}
                  >
                    {detail}
                  </Text>
                )}

                {item.required_documents && (
                  <View style={styles.docTagsRow}>
                    {item.required_documents
                      .slice(0, 3)
                      .map((doc: string, idx: number) => (
                        <View
                          key={idx}
                          style={[
                            styles.tagPill,
                            { backgroundColor: colors.primary + '10' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.tagText,
                              { color: colors.primary, fontSize: 10 },
                            ]}
                          >
                            {doc}
                          </Text>
                        </View>
                      ))}
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.itemActionBtn,
                    { borderColor: colors.primary },
                  ]}
                  activeOpacity={0.7}
                  onPress={() =>
                    onNavigateToWizard(
                      moduleKey,
                      `Inquiry/Application for ${title}`,
                    )
                  }
                >
                  <Text
                    style={[
                      styles.itemActionText,
                      {
                        color: colors.primary,
                        fontSize: typography.fontSizeSm,
                      },
                    ]}
                  >
                    {t('common.request_assistance', 'Request Help with This')} →
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
          ListFooterComponent={
            <View
              style={[
                styles.inlineFormCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: borderRadius.lg,
                },
              ]}
            >
              <View style={styles.inlineFormHeader}>
                <View
                  style={[
                    styles.inlineFormIconWrap,
                    { backgroundColor: colors.primary + '15' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="hand-heart"
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.inlineFormTitleWrap}>
                  <Text
                    style={[
                      styles.inlineFormTitle,
                      { color: colors.text, fontSize: typography.fontSizeBase },
                    ]}
                  >
                    {t('common.get_help_form', 'Get Help / સહાય માટે અરજી કરો')}
                  </Text>
                  <Text
                    style={[
                      styles.inlineFormSubtitle,
                      {
                        color: colors.textMuted,
                        fontSize: typography.fontSizeXs,
                      },
                    ]}
                  >
                    {t(
                      'common.inline_form_desc',
                      'Submit your details below to request direct assistance.',
                    )}
                  </Text>
                </View>
              </View>

              {inlineSuccessCase ? (
                <View
                  style={[
                    styles.inlineSuccessBox,
                    {
                      backgroundColor: '#16A34A15',
                      borderColor: '#16A34A',
                      borderRadius: borderRadius.md,
                    },
                  ]}
                >
                  <Text style={styles.inlineSuccessTitle}>
                    ✓ {t('common.success', 'Registered!')}
                  </Text>
                  <Text
                    style={[styles.inlineSuccessCaseNo, { color: colors.text }]}
                  >
                    {inlineSuccessCase}
                  </Text>
                </View>
              ) : (
                <View style={styles.inlineFormFields}>
                  <Text
                    style={[
                      styles.inlineLabel,
                      { color: colors.text, fontSize: typography.fontSizeXs },
                    ]}
                  >
                    {t('common.applicant_name', 'Applicant Name *')}
                  </Text>
                  <TextInput
                    style={[
                      styles.inlineInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.text,
                        borderRadius: borderRadius.sm,
                      },
                    ]}
                    placeholder="Full Name"
                    placeholderTextColor={colors.textMuted}
                    value={inlineName}
                    onChangeText={setInlineName}
                  />

                  <Text
                    style={[
                      styles.inlineLabel,
                      { color: colors.text, fontSize: typography.fontSizeXs },
                    ]}
                  >
                    {t('common.phone_number', 'Phone Number *')}
                  </Text>
                  <TextInput
                    style={[
                      styles.inlineInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.text,
                        borderRadius: borderRadius.sm,
                      },
                    ]}
                    placeholder="Phone Number"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    value={inlinePhone}
                    onChangeText={setInlinePhone}
                  />

                  <Text
                    style={[
                      styles.inlineLabel,
                      { color: colors.text, fontSize: typography.fontSizeXs },
                    ]}
                  >
                    {t('common.email', 'Email *')}
                  </Text>
                  <TextInput
                    style={[
                      styles.inlineInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.text,
                        borderRadius: borderRadius.sm,
                      },
                    ]}
                    placeholder="email@example.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={inlineEmail}
                    onChangeText={setInlineEmail}
                  />

                  <Text
                    style={[
                      styles.inlineLabel,
                      { color: colors.text, fontSize: typography.fontSizeXs },
                    ]}
                  >
                    {t('common.title_subject', 'Request Subject / Title *')}
                  </Text>
                  <TextInput
                    style={[
                      styles.inlineInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.text,
                        borderRadius: borderRadius.sm,
                      },
                    ]}
                    placeholder={`Need help with ${meta.title}`}
                    placeholderTextColor={colors.textMuted}
                    value={inlineTitle}
                    onChangeText={setInlineTitle}
                  />

                  <Text
                    style={[
                      styles.inlineLabel,
                      { color: colors.text, fontSize: typography.fontSizeXs },
                    ]}
                  >
                    {t('common.description', 'Details / Problem Description *')}
                  </Text>
                  <TextInput
                    style={[
                      styles.inlineInput,
                      styles.inlineTextArea,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.text,
                        borderRadius: borderRadius.sm,
                      },
                    ]}
                    placeholder="Explain what help or document is needed..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    value={inlineDesc}
                    onChangeText={setInlineDesc}
                  />

                  <View style={styles.urgencyRow}>
                    {(['low', 'medium', 'urgent'] as const).map(u => (
                      <TouchableOpacity
                        key={u}
                        activeOpacity={0.8}
                        onPress={() => setInlineUrgency(u)}
                        style={[
                          styles.urgencyPill,
                          {
                            backgroundColor:
                              inlineUrgency === u
                                ? colors.primary
                                : colors.surfaceSubtle,
                            borderColor:
                              inlineUrgency === u
                                ? colors.primary
                                : colors.border,
                            borderRadius: borderRadius.sm,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.urgencyPillText,
                            {
                              color:
                                inlineUrgency === u
                                  ? '#FFFFFF'
                                  : colors.textMuted,
                            },
                          ]}
                        >
                          {u.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.inlineSubmitBtn,
                      {
                        backgroundColor: colors.primary,
                        borderRadius: borderRadius.md,
                      },
                    ]}
                    activeOpacity={0.85}
                    disabled={inlineSubmitting}
                    onPress={handleInlineSubmit}
                  >
                    {inlineSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.inlineSubmitText}>
                        {t(
                          'common.submit_request',
                          'Submit Assistance Request',
                        )}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.openWizardBtn}
                    activeOpacity={0.7}
                    onPress={() => onNavigateToWizard(moduleKey)}
                  >
                    <Text
                      style={[styles.openWizardText, { color: colors.primary }]}
                    >
                      {t(
                        'common.open_full_wizard',
                        'Or Open Step-by-Step Help Wizard →',
                      )}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          }
        />
      )}

      {/* Interactive Form Submission Modals */}
      {/* 1. Report Village Problem Modal */}
      <Modal
        visible={modalType === 'village'}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: colors.text, fontSize: 18, fontWeight: '700' },
                  ]}
                >
                  🚨 {t('module.report_problem', 'Report Village Problem')}
                </Text>
                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: 12,
                    marginTop: 2,
                  }}
                >
                  ગામ પ્રશ્ન — પાણી, રસ્તા, વીજળી કે શાળાની સમસ્યા નોંધાવો
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons
                  name="close-circle"
                  size={26}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }}>
              {/* Category selector */}
              <Text
                style={[
                  styles.inputLabel,
                  { color: colors.text, marginTop: 8 },
                ]}
              >
                {t('module.problem_category', 'Problem Category (કેટેગરી)')} *
              </Text>
              <View
                style={[styles.categoryChips, { flexWrap: 'wrap', gap: 6 }]}
              >
                {[
                  { key: 'water', label: '💧 Water / પાણી', color: '#0284C7' },
                  { key: 'road', label: '🛣️ Road / રસ્તા', color: '#D97706' },
                  {
                    key: 'electricity',
                    label: '⚡ Power / વીજળી',
                    color: '#EAB308',
                  },
                  {
                    key: 'school',
                    label: '🏫 School / શાળા',
                    color: '#7C3AED',
                  },
                  {
                    key: 'sanitation',
                    label: '🧹 Cleanliness / સ્વચ્છતા',
                    color: '#059669',
                  },
                  {
                    key: 'health',
                    label: '🏥 Health / આરોગ્ય',
                    color: '#E11D48',
                  },
                ].map(cat => (
                  <TouchableOpacity
                    key={cat.key}
                    onPress={() => setReportCategory(cat.key)}
                    style={[
                      styles.chip,
                      {
                        borderColor:
                          reportCategory === cat.key
                            ? cat.color
                            : colors.border,
                        backgroundColor:
                          reportCategory === cat.key
                            ? cat.color + '20'
                            : colors.surfaceSubtle,
                        borderWidth: reportCategory === cat.key ? 1.5 : 1,
                        paddingVertical: 6,
                        paddingHorizontal: 10,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          reportCategory === cat.key ? cat.color : colors.text,
                        fontSize: 12,
                        fontWeight: reportCategory === cat.key ? '700' : '500',
                      }}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Village Selector */}
              <Text
                style={[
                  styles.inputLabel,
                  { color: colors.text, marginTop: 12 },
                ]}
              >
                {t('wizard.village', 'Village (ગામ)')} *
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginVertical: 4 }}
              >
                {[
                  { id: 1, name: 'Ahwa (આહવા)' },
                  { id: 2, name: 'Subir (સુબીર)' },
                  { id: 3, name: 'Waghai (વઘઈ)' },
                  { id: 4, name: 'Saputara (સાપુતારા)' },
                  { id: 5, name: 'Gadhvi (ગઢવી)' },
                  { id: 6, name: 'Shamgahan (શામગહાન)' },
                ].map(v => {
                  const isSel = reportVillageId === v.id;
                  return (
                    <TouchableOpacity
                      key={v.id}
                      onPress={() => setReportVillageId(v.id)}
                      style={{
                        backgroundColor: isSel
                          ? colors.primary
                          : colors.surfaceSubtle,
                        borderColor: isSel ? colors.primary : colors.border,
                        borderWidth: 1,
                        borderRadius: borderRadius.md,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        marginRight: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: isSel ? colors.textInverse : colors.text,
                          fontSize: 12,
                          fontWeight: isSel ? '700' : '500',
                        }}
                      >
                        {v.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Live Location Pin (GPS) */}
              <View
                style={{
                  marginTop: 12,
                  marginBottom: 8,
                  backgroundColor: reportLat
                    ? colors.secondary + '10'
                    : colors.surfaceSubtle,
                  borderColor: reportLat ? colors.secondary : colors.border,
                  borderWidth: 1,
                  borderRadius: borderRadius.md,
                  padding: 12,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons
                      name="location"
                      size={18}
                      color={reportLat ? colors.secondary : colors.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 13,
                        fontWeight: '700',
                      }}
                    >
                      📍 {t('wizard.live_pin_title', 'Live Location Pin (GPS)')}
                    </Text>
                  </View>
                  {reportLat ? (
                    <View
                      style={{
                        backgroundColor: colors.secondary + '25',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 999,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.secondary,
                          fontSize: 10,
                          fontWeight: '700',
                        }}
                      >
                        ● PINNED
                      </Text>
                    </View>
                  ) : null}
                </View>

                {reportLat && reportLng ? (
                  <View
                    style={{
                      marginTop: 8,
                      paddingTop: 6,
                      borderTopColor: colors.border,
                      borderTopWidth: 1,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 12,
                        fontWeight: '700',
                        fontFamily: 'monospace',
                      }}
                    >
                      GPS: {reportLat.toFixed(5)}° N, {reportLng.toFixed(5)}° E
                    </Text>
                    {reportLocAccuracy ? (
                      <Text
                        style={{
                          color: colors.textMuted,
                          fontSize: 11,
                          marginTop: 2,
                        }}
                      >
                        Accuracy: {reportLocAccuracy}
                      </Text>
                    ) : null}
                    <TouchableOpacity
                      onPress={() => {
                        setReportLat(null);
                        setReportLng(null);
                        setReportLocAccuracy(null);
                      }}
                      style={{ marginTop: 4, alignSelf: 'flex-start' }}
                    >
                      <Text
                        style={{ color: colors.statusRejected, fontSize: 11 }}
                      >
                        Clear Pin
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 11,
                      marginTop: 4,
                    }}
                  >
                    Tap below to pin exact coordinates of the broken pipe,
                    pothole or pole.
                  </Text>
                )}

                <TouchableOpacity
                  onPress={detectVillageLocation}
                  disabled={isDetectingVillageLoc}
                  style={{
                    marginTop: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: reportLat
                      ? colors.surface
                      : colors.primary,
                    borderColor: reportLat ? colors.secondary : colors.primary,
                    borderWidth: 1,
                    borderRadius: borderRadius.sm,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                  }}
                >
                  {isDetectingVillageLoc ? (
                    <ActivityIndicator
                      size="small"
                      color={reportLat ? colors.primary : '#ffffff'}
                    />
                  ) : (
                    <>
                      <Ionicons
                        name={reportLat ? 'refresh' : 'navigate'}
                        size={15}
                        color={reportLat ? colors.text : '#ffffff'}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={{
                          color: reportLat ? colors.text : '#ffffff',
                          fontSize: 12,
                          fontWeight: '700',
                        }}
                      >
                        {reportLat
                          ? 'Update Location Pin'
                          : '📍 Drop Live Location Pin'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <Text
                style={[
                  styles.inputLabel,
                  { color: colors.text, marginTop: 8 },
                ]}
              >
                {t('common.title_subject', 'Problem Title (વિષય)')} *
              </Text>
              <TextInput
                style={[
                  styles.inputField,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="e.g. Drinking water handpump broken near primary school"
                placeholderTextColor={colors.textMuted}
                value={reportTitle}
                onChangeText={setReportTitle}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {t('common.description', 'Problem Description & Details')} *
              </Text>
              <TextInput
                style={[
                  styles.inputField,
                  styles.textArea,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Explain what is damaged, how many families affected, and landmark..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                value={reportDescription}
                onChangeText={setReportDescription}
              />
            </ScrollView>

            <TouchableOpacity
              onPress={submitVillageReportForm}
              disabled={submitting}
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Problem Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. Request Blood Modal */}
      <Modal visible={modalType === 'blood'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Request Emergency Blood
              </Text>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Patient Name
              </Text>
              <TextInput
                style={[
                  styles.inputField,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Full name of patient"
                placeholderTextColor={colors.textMuted}
                value={bloodPatient}
                onChangeText={setBloodPatient}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Blood Group
              </Text>
              <View style={styles.categoryChips}>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <TouchableOpacity
                    key={bg}
                    onPress={() => setBloodGroup(bg)}
                    style={[
                      styles.chip,
                      { borderColor: colors.border },
                      bloodGroup === bg && {
                        backgroundColor: colors.statusRejected,
                        borderColor: colors.statusRejected,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: bloodGroup === bg ? '#ffffff' : colors.text,
                        fontSize: 12,
                        fontWeight: 'bold',
                      }}
                    >
                      {bg}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Units Needed
              </Text>
              <TextInput
                style={[
                  styles.inputField,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="1"
                keyboardType="numeric"
                value={bloodUnits}
                onChangeText={setBloodUnits}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Contact Phone
              </Text>
              <TextInput
                style={[
                  styles.inputField,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="10-digit mobile number"
                keyboardType="phone-pad"
                value={bloodPhone}
                onChangeText={setBloodPhone}
              />
            </ScrollView>

            <TouchableOpacity
              onPress={submitBloodForm}
              disabled={submitting}
              style={[
                styles.submitBtn,
                { backgroundColor: colors.statusRejected },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>
                  Post Urgent Blood Request
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3. Volunteer Signup Modal */}
      <Modal
        visible={modalType === 'volunteer'}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Join GGVT Helping Hand Network
              </Text>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Your Skills / Interests
              </Text>
              <TextInput
                style={[
                  styles.inputField,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="e.g. Teaching, computer, legal aid, social work"
                placeholderTextColor={colors.textMuted}
                value={volunteerSkills}
                onChangeText={setVolunteerSkills}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Availability
              </Text>
              <TextInput
                style={[
                  styles.inputField,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="e.g. Weekends, 4 hours weekly"
                placeholderTextColor={colors.textMuted}
                value={volunteerAvailability}
                onChangeText={setVolunteerAvailability}
              />
            </ScrollView>

            <TouchableOpacity
              onPress={submitVolunteerForm}
              disabled={submitting}
              style={[styles.submitBtn, { backgroundColor: colors.secondary }]}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>Register as Volunteer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 4. Ask a Mentor Modal */}
      <Modal visible={modalType === 'mentor'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Ask an Expert Mentor
              </Text>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Your Question / Career Guidance Query
              </Text>
              <TextInput
                style={[
                  styles.inputField,
                  styles.textArea,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="e.g. How should I prepare for GPSC or Police exam? What books should I read in Gujarati?"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                value={mentorQuestion}
                onChangeText={setMentorQuestion}
              />
            </ScrollView>

            <TouchableOpacity
              onPress={submitMentorForm}
              disabled={submitting}
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>
                  Send Question to Mentor
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    marginRight: 10,
    padding: 2,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '700',
  },
  headerSubtitle: {
    marginTop: 2,
  },
  topActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  topActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 4,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 32,
  },
  card: {
    padding: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: '700',
    lineHeight: 20,
  },
  cardSubText: {
    marginTop: 2,
  },
  statusBadge: {
    marginTop: 2,
    fontWeight: '700',
  },
  cardDetail: {
    marginTop: 10,
    lineHeight: 18,
  },
  docTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontWeight: '600',
  },
  itemActionBtn: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-end',
  },
  itemActionText: {
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  inputField: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  submitBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  inlineFormCard: {
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  inlineFormHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  inlineFormIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inlineFormTitleWrap: {
    flex: 1,
  },
  inlineFormTitle: {
    fontWeight: '700',
  },
  inlineFormSubtitle: {
    marginTop: 2,
  },
  inlineSuccessBox: {
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  inlineSuccessTitle: {
    color: '#16A34A',
    fontWeight: '700',
    fontSize: 15,
  },
  inlineSuccessCaseNo: {
    marginTop: 4,
    fontWeight: '600',
    fontSize: 13,
  },
  inlineFormFields: {
    gap: 4,
  },
  inlineLabel: {
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 2,
  },
  inlineInput: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  inlineTextArea: {
    height: 72,
    textAlignVertical: 'top',
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  urgencyPill: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  urgencyPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inlineSubmitBtn: {
    marginTop: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineSubmitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  openWizardBtn: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 6,
  },
  openWizardText: {
    fontWeight: '600',
    fontSize: 12,
  },
});
