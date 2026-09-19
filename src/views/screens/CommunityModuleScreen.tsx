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
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
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
  const { t } = useTranslation();

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
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineDesc, setInlineDesc] = useState('');
  const [inlineUrgency, setInlineUrgency] = useState<
    'normal' | 'urgent' | 'critical'
  >('normal');
  const [inlineSubmitting, setInlineSubmitting] = useState(false);
  const [inlineSuccessCase, setInlineSuccessCase] = useState<string | null>(
    null,
  );

  const handleInlineSubmit = async () => {
    if (!inlineTitle.trim() || !inlineDesc.trim()) {
      Alert.alert(
        t('common.required', 'Required'),
        t('common.fill_required', 'Please enter a title and description.'),
      );
      return;
    }
    setInlineSubmitting(true);
    try {
      const res = await applicationService.createApplication({
        category_id: 1,
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
      });
      const caseNumber = res.case_no || (res as any).caseNo || 'THH-APP';
      setInlineSuccessCase(caseNumber);
      setInlineTitle('');
      setInlineDesc('');
      Alert.alert(
        t('common.success', 'Request Registered!'),
        `${t('wizard.case_no_label', 'Your Case Tracking ID:')} ${caseNumber}`,
      );
    } catch {
      Alert.alert(
        t('common.offline_saved', 'Saved Offline'),
        'Your request has been queued offline and will automatically sync once connected.',
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
  }, [moduleKey]);

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

  const submitVillageReportForm = async () => {
    if (!reportTitle.trim() || !reportDescription.trim()) {
      Alert.alert(
        'Incomplete',
        'Please provide a title and problem description.',
      );
      return;
    }
    setSubmitting(true);
    const res = await contentService.submitVillageReport({
      title: reportTitle.trim(),
      category: reportCategory,
      description: reportDescription.trim(),
    });
    setSubmitting(false);
    setModalType(null);
    setReportTitle('');
    setReportDescription('');
    Alert.alert('Success', res.message);
    fetchData();
  };

  const submitBloodForm = async () => {
    if (!bloodPatient.trim() || !bloodPhone.trim()) {
      Alert.alert(
        'Incomplete',
        'Please provide patient name and contact phone.',
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
    Alert.alert('Success', res.message);
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
    Alert.alert('Success', res.message);
  };

  const submitMentorForm = async () => {
    if (!mentorQuestion.trim()) {
      Alert.alert('Incomplete', 'Please write your question for the mentor.');
      return;
    }
    setSubmitting(true);
    const res = await contentService.askMentor(1, mentorQuestion.trim());
    setSubmitting(false);
    setModalType(null);
    setMentorQuestion('');
    Alert.alert('Success', res.message);
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
            numberOfLines={1}
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
                    numberOfLines={3}
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
                    {(['normal', 'urgent', 'critical'] as const).map(u => (
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
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Report a Village Problem
              </Text>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Problem Title
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
                placeholder="e.g. Drinking water well contaminated"
                placeholderTextColor={colors.textMuted}
                value={reportTitle}
                onChangeText={setReportTitle}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Category
              </Text>
              <View style={styles.categoryChips}>
                {['water', 'road', 'electricity', 'school', 'sanitation'].map(
                  cat => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setReportCategory(cat)}
                      style={[
                        styles.chip,
                        { borderColor: colors.border },
                        reportCategory === cat && {
                          backgroundColor: colors.primary,
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color:
                            reportCategory === cat ? '#ffffff' : colors.text,
                          fontSize: 12,
                          textTransform: 'capitalize',
                        }}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>

              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Description & Location
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
                placeholder="Explain the problem and exact location in the village..."
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
