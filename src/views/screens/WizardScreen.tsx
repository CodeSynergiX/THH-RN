import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useWizardViewModel } from '../../viewmodels/useWizardViewModel';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Header } from '../components/Header';
import { StepIndicator } from '../components/StepIndicator';

interface WizardScreenProps {
  initialCategory?: string | number | null;
  onCancel: () => void;
  onTrackCase: (caseNo: string) => void;
}

export const WizardScreen: React.FC<WizardScreenProps> = ({
  initialCategory,
  onCancel,
  onTrackCase,
}) => {
  const { theme } = useAppTheme();
  const { colors, spacing, typography, borderRadius } = theme;
  const { t } = useTranslation();

  const {
    step,
    categories,
    districts,
    availableTalukas,
    availableVillages,
    availableSubCategories,
    formData,
    errors,
    isSubmitting,
    submitSuccess,
    generatedCaseNo,
    isSavedOffline,
    selectCategory,
    selectSubCategory,
    selectDistrict,
    selectTaluka,
    selectVillage,
    detectLiveLocation,
    clearCoordinates,
    updateField,
    nextStep,
    prevStep,
    submitApplication,
    resetWizard,
  } = useWizardViewModel(initialCategory);

  // Success Screen
  if (submitSuccess && generatedCaseNo) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Header title={t('wizard.title', 'Submit Help Request')} />
        <View style={[styles.successWrapper, { padding: spacing.xl }]}>
          <View
            style={[
              styles.successCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: borderRadius.xl,
                padding: spacing.xl,
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle"
              size={56}
              color={colors.statusResolved}
              style={{ alignSelf: 'center', marginBottom: 12 }}
            />
            <Text
              style={[
                styles.successTitle,
                { color: colors.text, fontSize: typography.fontSizeXl },
              ]}
            >
              {t(
                'wizard.success_title',
                'Application Registered Successfully!',
              )}
            </Text>

            <View
              style={[
                styles.caseBadge,
                {
                  backgroundColor: colors.primary + '15',
                  borderColor: colors.primary + '30',
                  borderRadius: borderRadius.md,
                  marginVertical: spacing.md,
                  padding: spacing.md,
                },
              ]}
            >
              <Text
                style={[
                  styles.caseBadgeLabel,
                  { color: colors.textMuted, fontSize: typography.fontSizeXs },
                ]}
              >
                {t('wizard.case_no_label', 'Your Tracking Case ID:')}
              </Text>
              <Text
                style={[
                  styles.caseBadgeNo,
                  { color: colors.primary, fontSize: typography.fontSizeXl },
                ]}
              >
                {generatedCaseNo}
              </Text>
            </View>

            <Text
              style={[
                styles.successNote,
                { color: colors.textMuted, fontSize: typography.fontSizeSm },
              ]}
            >
              {isSavedOffline
                ? t(
                    'wizard.offline_saved',
                    'Your device is offline. Application saved locally and will auto-sync once connected.',
                  )
                : t(
                    'wizard.success_note',
                    'Keep this case ID safe. You can track resolution status anytime.',
                  )}
            </Text>

            <View
              style={[
                styles.successActions,
                { marginTop: spacing.lg, gap: spacing.sm },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onTrackCase(generatedCaseNo)}
                style={[
                  styles.primaryBtn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.md,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.btnText,
                    {
                      color: colors.textInverse,
                      fontSize: typography.fontSizeBase,
                    },
                  ]}
                >
                  {t('action.track', 'Track Case Status')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={resetWizard}
                style={[
                  styles.secondaryBtn,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.secBtnText,
                    { color: colors.text, fontSize: typography.fontSizeSm },
                  ]}
                >
                  {t('dashboard.quick_request', 'Submit Another Request')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header
        title={t('wizard.title', 'Submit Help Request')}
        onBackPress={step > 1 ? prevStep : onCancel}
      />

      <StepIndicator currentStep={step} totalSteps={5} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { padding: spacing.md, flexGrow: 1, paddingBottom: 160 },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
        >
          {/* Step 1: Category Selection */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text
                style={[
                  styles.stepTitle,
                  { color: colors.text, fontSize: typography.fontSizeLg },
                ]}
              >
                {t('wizard.step1_title', '1. Choose Category')}
              </Text>
              <Text
                style={[
                  styles.stepDesc,
                  { color: colors.textMuted, fontSize: typography.fontSizeSm },
                ]}
              >
                {t(
                  'wizard.step1_desc',
                  'What area do you need assistance with?',
                )}
              </Text>

              {errors.categoryId ? (
                <Text
                  style={[
                    styles.errorText,
                    {
                      color: colors.statusRejected,
                      fontSize: typography.fontSizeXs,
                    },
                  ]}
                >
                  {errors.categoryId}
                </Text>
              ) : null}

              <View style={[styles.categoryGrid, { marginTop: spacing.md }]}>
                {categories.map(cat => {
                  const isSelected = formData.categoryId === cat.id;
                  const iconName = cat.icon || 'folder-outline';
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      activeOpacity={0.75}
                      onPress={() => selectCategory(cat.id)}
                      style={[
                        styles.categoryCard,
                        {
                          backgroundColor: isSelected
                            ? colors.primary + '15'
                            : colors.surface,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.border,
                          borderRadius: borderRadius.md,
                          padding: spacing.md,
                          marginBottom: spacing.sm,
                        },
                      ]}
                    >
                      <View style={styles.categoryCardLeft}>
                        <View
                          style={[
                            styles.catIconWrap,
                            {
                              backgroundColor: isSelected
                                ? colors.primary
                                : colors.surfaceSubtle,
                              borderRadius: borderRadius.sm,
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={iconName}
                            size={22}
                            color={isSelected ? '#FFFFFF' : colors.primary}
                          />
                        </View>
                        <View style={styles.catTextWrap}>
                          <Text
                            style={[
                              styles.categoryName,
                              {
                                color: isSelected
                                  ? colors.primary
                                  : colors.text,
                                fontSize: typography.fontSizeBase,
                              },
                            ]}
                          >
                            {cat.name_gu || cat.name_en || cat.slug}
                          </Text>
                          {cat.name_en && cat.name_gu ? (
                            <Text
                              style={[
                                styles.categorySub,
                                {
                                  color: colors.textMuted,
                                  fontSize: typography.fontSizeXs,
                                },
                              ]}
                            >
                              {cat.name_en}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                      <View
                        style={[
                          styles.radioIndicator,
                          {
                            borderColor: isSelected
                              ? colors.primary
                              : colors.border,
                            backgroundColor: isSelected
                              ? colors.primary
                              : 'transparent',
                          },
                        ]}
                      >
                        {isSelected && <Text style={styles.radioCheck}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Subcategories if any */}
              {availableSubCategories.length > 0 && (
                <View style={{ marginTop: spacing.md }}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: colors.text, fontSize: typography.fontSizeSm },
                    ]}
                  >
                    પેટા કેટેગરી (Subcategory)
                  </Text>
                  <View style={styles.subCatRow}>
                    {availableSubCategories.map(sub => {
                      const isSubSelected = formData.subCategoryId === sub.id;
                      return (
                        <TouchableOpacity
                          key={sub.id}
                          activeOpacity={0.75}
                          onPress={() =>
                            selectSubCategory(isSubSelected ? null : sub.id)
                          }
                          style={[
                            styles.subCatPill,
                            {
                              backgroundColor: isSubSelected
                                ? colors.primary
                                : colors.surfaceSubtle,
                              borderColor: colors.border,
                              borderRadius: borderRadius.full,
                              paddingHorizontal: spacing.md,
                              paddingVertical: spacing.xs,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.subCatText,
                              {
                                color: isSubSelected
                                  ? colors.textInverse
                                  : colors.text,
                                fontSize: typography.fontSizeXs,
                              },
                            ]}
                          >
                            {sub.name_gu || sub.name_en || sub.slug}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Step 2: Request Details & Urgency */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text
                style={[
                  styles.stepTitle,
                  { color: colors.text, fontSize: typography.fontSizeLg },
                ]}
              >
                {t('wizard.step2_title', '2. Request Details')}
              </Text>
              <Text
                style={[
                  styles.stepDesc,
                  { color: colors.textMuted, fontSize: typography.fontSizeSm },
                ]}
              >
                {t(
                  'wizard.step2_desc',
                  'Provide a clear summary and indicate urgency.',
                )}
              </Text>

              {/* Title Input */}
              <View style={{ marginTop: spacing.md }}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.text, fontSize: typography.fontSizeSm },
                  ]}
                >
                  {t('wizard.title_field', 'Title')} *
                </Text>
                <TextInput
                  value={formData.title}
                  onChangeText={val => updateField('title', val)}
                  placeholder={t(
                    'wizard.title_placeholder',
                    'Title (e.g. Scholarship Assistance)',
                  )}
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: errors.title
                        ? colors.statusRejected
                        : colors.border,
                      color: colors.text,
                      borderRadius: borderRadius.md,
                      padding: spacing.md,
                    },
                  ]}
                />
                {errors.title && (
                  <Text
                    style={[
                      styles.errorText,
                      {
                        color: colors.statusRejected,
                        fontSize: typography.fontSizeXs,
                      },
                    ]}
                  >
                    {errors.title}
                  </Text>
                )}
              </View>

              {/* Description Input */}
              <View style={{ marginTop: spacing.md }}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.text, fontSize: typography.fontSizeSm },
                  ]}
                >
                  {t('wizard.description_field', 'Description')} *
                </Text>
                <TextInput
                  value={formData.description}
                  onChangeText={val => updateField('description', val)}
                  placeholder={t(
                    'wizard.desc_placeholder',
                    'Explain your situation and requirement in detail...',
                  )}
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: colors.surface,
                      borderColor: errors.description
                        ? colors.statusRejected
                        : colors.border,
                      color: colors.text,
                      borderRadius: borderRadius.md,
                      padding: spacing.md,
                    },
                  ]}
                />
                {errors.description && (
                  <Text
                    style={[
                      styles.errorText,
                      {
                        color: colors.statusRejected,
                        fontSize: typography.fontSizeXs,
                      },
                    ]}
                  >
                    {errors.description}
                  </Text>
                )}
              </View>

              {/* Urgency Selector */}
              <View style={{ marginTop: spacing.md }}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.text, fontSize: typography.fontSizeSm },
                  ]}
                >
                  {t('wizard.urgency', 'Urgency')}
                </Text>
                <View style={styles.urgencyRow}>
                  {(['low', 'medium', 'urgent'] as const).map(urg => {
                    const isSelected = formData.urgency === urg;
                    return (
                      <TouchableOpacity
                        key={urg}
                        activeOpacity={0.8}
                        onPress={() => updateField('urgency', urg)}
                        style={[
                          styles.urgencyBtn,
                          {
                            backgroundColor: isSelected
                              ? colors.primary
                              : colors.surface,
                            borderColor: isSelected
                              ? colors.primary
                              : colors.border,
                            borderRadius: borderRadius.md,
                            paddingVertical: spacing.sm,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.urgencyText,
                            {
                              color: isSelected
                                ? colors.textInverse
                                : colors.text,
                              fontSize: typography.fontSizeXs,
                            },
                          ]}
                        >
                          {t(`urgency.${urg}`, urg)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Helper Mode Toggle */}
              <View
                style={[
                  styles.helperModeCard,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    marginTop: spacing.lg,
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    updateField('isHelperMode', !formData.isHelperMode)
                  }
                  style={styles.helperToggleRow}
                >
                  <View
                    style={[
                      styles.helperTextWrapper,
                      { flexDirection: 'row', alignItems: 'center' },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="account-group-outline"
                      size={20}
                      color={colors.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.helperTitle,
                        { color: colors.text, fontSize: typography.fontSizeSm },
                      ]}
                    >
                      {t(
                        'wizard.helper_mode',
                        'Helper Mode (On behalf of another citizen)',
                      )}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: colors.primary,
                        backgroundColor: formData.isHelperMode
                          ? colors.primary
                          : 'transparent',
                      },
                    ]}
                  >
                    {formData.isHelperMode && (
                      <Text style={{ color: colors.textInverse, fontSize: 11 }}>
                        ✓
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>

                <TextInput
                  value={formData.email}
                  onChangeText={val => updateField('email', val)}
                  placeholder={t(
                    'wizard.email',
                    'Email (for login and updates)',
                  )}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: errors.email
                        ? colors.statusRejected
                        : colors.border,
                      color: colors.text,
                      borderRadius: borderRadius.md,
                      padding: spacing.md,
                      marginTop: spacing.md,
                    },
                  ]}
                />

                {formData.isHelperMode && (
                  <View style={{ marginTop: spacing.md }}>
                    <TextInput
                      value={formData.beneficiaryName}
                      onChangeText={val => updateField('beneficiaryName', val)}
                      placeholder={t(
                        'wizard.beneficiary_name',
                        'Beneficiary Full Name',
                      )}
                      placeholderTextColor={colors.textMuted}
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.surface,
                          borderColor: errors.beneficiaryName
                            ? colors.statusRejected
                            : colors.border,
                          color: colors.text,
                          borderRadius: borderRadius.md,
                          padding: spacing.md,
                          marginBottom: spacing.sm,
                        },
                      ]}
                    />
                    <TextInput
                      value={formData.beneficiaryPhone}
                      onChangeText={val => updateField('beneficiaryPhone', val)}
                      placeholder={t(
                        'wizard.beneficiary_phone',
                        'Beneficiary Phone Number',
                      )}
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          color: colors.text,
                          borderRadius: borderRadius.md,
                          padding: spacing.md,
                        },
                      ]}
                    />
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Step 3: Location Selection */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text
                style={[
                  styles.stepTitle,
                  { color: colors.text, fontSize: typography.fontSizeLg },
                ]}
              >
                {t('wizard.step3_title', '3. Location')}
              </Text>
              <Text
                style={[
                  styles.stepDesc,
                  { color: colors.textMuted, fontSize: typography.fontSizeSm },
                ]}
              >
                {t(
                  'wizard.step3_desc',
                  'Select your District, Taluka and Village.',
                )}
              </Text>

              {/* District Selector */}
              <View style={{ marginTop: spacing.md }}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: colors.text, fontSize: typography.fontSizeSm },
                  ]}
                >
                  {t('wizard.district', 'District')}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginVertical: 4 }}
                >
                  {districts.map(d => {
                    const isSelected = formData.districtId === d.id;
                    return (
                      <TouchableOpacity
                        key={d.id}
                        activeOpacity={0.8}
                        onPress={() => selectDistrict(isSelected ? null : d.id)}
                        style={[
                          styles.locPill,
                          {
                            backgroundColor: isSelected
                              ? colors.primary
                              : colors.surface,
                            borderColor: isSelected
                              ? colors.primary
                              : colors.border,
                            borderRadius: borderRadius.md,
                            paddingHorizontal: spacing.md,
                            paddingVertical: spacing.sm,
                            marginRight: spacing.sm,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.locPillText,
                            {
                              color: isSelected
                                ? colors.textInverse
                                : colors.text,
                              fontSize: typography.fontSizeSm,
                            },
                          ]}
                        >
                          {d.name_gu || d.name_en}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Taluka Selector */}
              {availableTalukas.length > 0 && (
                <View style={{ marginTop: spacing.md }}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: colors.text, fontSize: typography.fontSizeSm },
                    ]}
                  >
                    {t('wizard.taluka', 'Taluka')}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginVertical: 4 }}
                  >
                    {availableTalukas.map(taluka => {
                      const isSelected = formData.talukaId === taluka.id;
                      return (
                        <TouchableOpacity
                          key={taluka.id}
                          activeOpacity={0.8}
                          onPress={() =>
                            selectTaluka(isSelected ? null : taluka.id)
                          }
                          style={[
                            styles.locPill,
                            {
                              backgroundColor: isSelected
                                ? colors.secondary
                                : colors.surface,
                              borderColor: isSelected
                                ? colors.secondary
                                : colors.border,
                              borderRadius: borderRadius.md,
                              paddingHorizontal: spacing.md,
                              paddingVertical: spacing.sm,
                              marginRight: spacing.sm,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.locPillText,
                              {
                                color: isSelected
                                  ? colors.textInverse
                                  : colors.text,
                                fontSize: typography.fontSizeSm,
                              },
                            ]}
                          >
                            {taluka.name_gu || taluka.name_en}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Village Selector */}
              {availableVillages.length > 0 && (
                <View style={{ marginTop: spacing.md }}>
                  <Text
                    style={[
                      styles.fieldLabel,
                      { color: colors.text, fontSize: typography.fontSizeSm },
                    ]}
                  >
                    {t('wizard.village', 'Village')}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginVertical: 4 }}
                  >
                    {availableVillages.map(v => {
                      const isSelected = formData.villageId === v.id;
                      return (
                        <TouchableOpacity
                          key={v.id}
                          activeOpacity={0.8}
                          onPress={() =>
                            selectVillage(isSelected ? null : v.id)
                          }
                          style={[
                            styles.locPill,
                            {
                              backgroundColor: isSelected
                                ? colors.accent
                                : colors.surface,
                              borderColor: isSelected
                                ? colors.accent
                                : colors.border,
                              borderRadius: borderRadius.md,
                              paddingHorizontal: spacing.md,
                              paddingVertical: spacing.sm,
                              marginRight: spacing.sm,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.locPillText,
                              {
                                color: isSelected
                                  ? colors.textInverse
                                  : colors.text,
                                fontSize: typography.fontSizeSm,
                              },
                            ]}
                          >
                            {v.name_gu || v.name_en}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Live Location / GPS Pin Card */}
              <View
                style={{
                  marginTop: spacing.lg,
                  backgroundColor: colors.surface,
                  borderColor: formData.lat ? colors.secondary : colors.border,
                  borderWidth: formData.lat ? 1.5 : 1,
                  borderRadius: borderRadius.lg,
                  padding: spacing.md,
                  shadowColor: colors.cardShadow,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: spacing.xs,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons
                      name="location"
                      size={22}
                      color={formData.lat ? colors.secondary : colors.primary}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: typography.fontSizeBase,
                        fontWeight: '700',
                      }}
                    >
                      {t('wizard.live_pin_title', 'Live Location Pin (GPS)')}
                    </Text>
                  </View>
                  {formData.lat ? (
                    <View
                      style={{
                        backgroundColor: colors.secondary + '20',
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 2,
                        borderRadius: borderRadius.full,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.secondary,
                          fontSize: typography.fontSizeXs,
                          fontWeight: '700',
                        }}
                      >
                        ● {t('wizard.pinned', 'Pinned')}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: typography.fontSizeXs,
                    marginBottom: spacing.md,
                    lineHeight: 18,
                  }}
                >
                  {t(
                    'wizard.live_pin_desc',
                    'Capture exact coordinates so the field coordinator or village volunteer can reach the problem site without delay.',
                  )}
                </Text>

                {formData.lat && formData.lng ? (
                  <View
                    style={{
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.border,
                      borderWidth: 1,
                      borderRadius: borderRadius.md,
                      padding: spacing.md,
                      marginBottom: spacing.md,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <View>
                        <Text
                          style={{
                            color: colors.textMuted,
                            fontSize: 10,
                            textTransform: 'uppercase',
                            fontWeight: '700',
                            letterSpacing: 0.5,
                          }}
                        >
                          GPS Coordinates
                        </Text>
                        <Text
                          style={{
                            color: colors.text,
                            fontSize: typography.fontSizeSm,
                            fontWeight: '700',
                            fontFamily: 'monospace',
                            marginTop: 2,
                          }}
                        >
                          {formData.lat.toFixed(5)}° N,{' '}
                          {formData.lng.toFixed(5)}° E
                        </Text>
                      </View>
                      {formData.locationAccuracy ? (
                        <View
                          style={{
                            backgroundColor: colors.primary + '15',
                            paddingHorizontal: spacing.xs,
                            paddingVertical: 2,
                            borderRadius: borderRadius.sm,
                          }}
                        >
                          <Text
                            style={{
                              color: colors.primary,
                              fontSize: 10,
                              fontWeight: '600',
                            }}
                          >
                            {formData.locationAccuracy}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        gap: spacing.sm,
                        marginTop: spacing.sm,
                        paddingTop: spacing.xs,
                        borderTopColor: colors.border,
                        borderTopWidth: 1,
                      }}
                    >
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() =>
                          Linking.openURL(
                            `https://www.google.com/maps?q=${formData.lat},${formData.lng}`,
                          )
                        }
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons
                          name="map-outline"
                          size={14}
                          color={colors.primary}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={{
                            color: colors.primary,
                            fontSize: typography.fontSizeXs,
                            fontWeight: '600',
                          }}
                        >
                          View in Maps
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={clearCoordinates}
                        style={{
                          marginLeft: 'auto',
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons
                          name="close-circle-outline"
                          size={14}
                          color={colors.statusRejected}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={{
                            color: colors.statusRejected,
                            fontSize: typography.fontSizeXs,
                          }}
                        >
                          Clear Pin
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={detectLiveLocation}
                  disabled={formData.isDetectingLocation}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: formData.lat
                      ? colors.surfaceSubtle
                      : colors.primary,
                    borderColor: formData.lat
                      ? colors.secondary
                      : colors.primary,
                    borderWidth: 1,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                  }}
                >
                  {formData.isDetectingLocation ? (
                    <ActivityIndicator
                      size="small"
                      color={formData.lat ? colors.primary : colors.textInverse}
                    />
                  ) : (
                    <>
                      <Ionicons
                        name={formData.lat ? 'refresh' : 'navigate'}
                        size={18}
                        color={formData.lat ? colors.text : colors.textInverse}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={{
                          color: formData.lat
                            ? colors.text
                            : colors.textInverse,
                          fontSize: typography.fontSizeSm,
                          fontWeight: '700',
                        }}
                      >
                        {formData.lat
                          ? t(
                              'wizard.update_location',
                              'Update Live Location Pin',
                            )
                          : t(
                              'wizard.detect_location',
                              '📍 Detect My Live Location',
                            )}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 4: Documents Notice */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <Text
                style={[
                  styles.stepTitle,
                  { color: colors.text, fontSize: typography.fontSizeLg },
                ]}
              >
                {t('wizard.step4_title', '4. Supporting Documents')}
              </Text>
              <Text
                style={[
                  styles.stepDesc,
                  { color: colors.textMuted, fontSize: typography.fontSizeSm },
                ]}
              >
                {t(
                  'wizard.step4_desc',
                  'Attach relevant IDs, scheme papers or photos.',
                )}
              </Text>

              <View
                style={[
                  styles.docNoticeCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: borderRadius.lg,
                    padding: spacing.lg,
                    marginTop: spacing.md,
                  },
                ]}
              >
                <Ionicons
                  name="document-attach-outline"
                  size={38}
                  color={colors.textMuted}
                  style={{ textAlign: 'center', marginBottom: 8 }}
                />
                <Text
                  style={[
                    styles.docNoticeTitle,
                    { color: colors.text, fontSize: typography.fontSizeBase },
                  ]}
                >
                  દસ્તાવેજો વૈકલ્પિક છે (Documents Optional)
                </Text>
                <Text
                  style={[
                    styles.docNoticeDesc,
                    {
                      color: colors.textMuted,
                      fontSize: typography.fontSizeXs,
                      marginTop: 4,
                    },
                  ]}
                >
                  જો તમારી પાસે આધાર કાર્ડ, જાતિ પ્રમાણપત્ર અથવા રેશન કાર્ડ હોય
                  તો અરજી મંજૂર કરવામાં સરળતા રહે છે. તમે આ વિગત વિના પણ અરજી
                  સબમિટ કરી શકો છો. અમારા ગ્રામીણ મિત્ર તમારો સંપર્ક કરશે.
                </Text>
              </View>
            </View>
          )}

          {/* Step 5: Review & Confirm */}
          {step === 5 && (
            <View style={styles.stepContainer}>
              <Text
                style={[
                  styles.stepTitle,
                  { color: colors.text, fontSize: typography.fontSizeLg },
                ]}
              >
                {t('wizard.step5_title', '5. Review & Confirm')}
              </Text>
              <Text
                style={[
                  styles.stepDesc,
                  { color: colors.textMuted, fontSize: typography.fontSizeSm },
                ]}
              >
                {t(
                  'wizard.step5_desc',
                  'Verify all details before submitting.',
                )}
              </Text>

              <View
                style={[
                  styles.reviewCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
                    marginTop: spacing.md,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.reviewLabel,
                    {
                      color: colors.textMuted,
                      fontSize: typography.fontSizeXs,
                    },
                  ]}
                >
                  {t('wizard.title_field', 'Title')}
                </Text>
                <Text
                  style={[
                    styles.reviewValue,
                    { color: colors.text, fontSize: typography.fontSizeBase },
                  ]}
                >
                  {formData.title}
                </Text>

                <Text
                  style={[
                    styles.reviewLabel,
                    {
                      color: colors.textMuted,
                      fontSize: typography.fontSizeXs,
                      marginTop: spacing.sm,
                    },
                  ]}
                >
                  {t('wizard.description_field', 'Description')}
                </Text>
                <Text
                  style={[
                    styles.reviewValue,
                    { color: colors.text, fontSize: typography.fontSizeSm },
                  ]}
                >
                  {formData.description}
                </Text>

                <Text
                  style={[
                    styles.reviewLabel,
                    {
                      color: colors.textMuted,
                      fontSize: typography.fontSizeXs,
                      marginTop: spacing.sm,
                    },
                  ]}
                >
                  {t('wizard.urgency', 'Urgency')}
                </Text>
                <Text
                  style={[
                    styles.reviewValue,
                    {
                      color: colors.primary,
                      fontSize: typography.fontSizeSm,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {t(`urgency.${formData.urgency}`, formData.urgency)}
                </Text>

                {formData.isHelperMode && (
                  <>
                    <Text
                      style={[
                        styles.reviewLabel,
                        {
                          color: colors.textMuted,
                          fontSize: typography.fontSizeXs,
                          marginTop: spacing.sm,
                        },
                      ]}
                    >
                      લાભાર્થી (Beneficiary)
                    </Text>
                    <Text
                      style={[
                        styles.reviewValue,
                        { color: colors.text, fontSize: typography.fontSizeSm },
                      ]}
                    >
                      {formData.beneficiaryName} (
                      {formData.beneficiaryPhone || '-'})
                    </Text>
                  </>
                )}

                <Text
                  style={[
                    styles.reviewLabel,
                    {
                      color: colors.textMuted,
                      fontSize: typography.fontSizeXs,
                      marginTop: spacing.sm,
                    },
                  ]}
                >
                  📍 સ્થળ (Location)
                </Text>
                <Text
                  style={[
                    styles.reviewValue,
                    { color: colors.text, fontSize: typography.fontSizeSm },
                  ]}
                >
                  {formData.villageId
                    ? availableVillages.find(v => v.id === formData.villageId)
                        ?.name_gu ||
                      availableVillages.find(v => v.id === formData.villageId)
                        ?.name_en
                    : 'ગામ પસંદ નથી (Village not set)'}
                  {' · '}
                  {formData.districtId
                    ? districts.find(d => d.id === formData.districtId)
                        ?.name_gu ||
                      districts.find(d => d.id === formData.districtId)?.name_en
                    : '-'}
                </Text>

                {formData.lat && formData.lng ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.secondary + '15',
                      padding: spacing.xs,
                      borderRadius: borderRadius.sm,
                      marginTop: spacing.xs,
                    }}
                  >
                    <Ionicons
                      name="location"
                      size={14}
                      color={colors.secondary}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={{
                        color: colors.secondary,
                        fontSize: typography.fontSizeXs,
                        fontWeight: '700',
                        fontFamily: 'monospace',
                      }}
                    >
                      GPS Pin: {formData.lat.toFixed(4)}°,{' '}
                      {formData.lng.toFixed(4)}°
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}

          {/* Navigation Buttons */}
          <View
            style={[styles.btnRow, { marginTop: spacing.xl, gap: spacing.sm }]}
          >
            {step > 1 && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={prevStep}
                style={[
                  styles.navBtn,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.navBtnText,
                    { color: colors.text, fontSize: typography.fontSizeSm },
                  ]}
                >
                  ← {t('action.prev', 'Back')}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={step === 5 ? submitApplication : nextStep}
              disabled={isSubmitting}
              style={[
                styles.navBtnPrimary,
                {
                  backgroundColor: colors.primary,
                  borderRadius: 22,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.xl,
                },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <Text
                  style={[
                    styles.navBtnPrimaryText,
                    {
                      color: colors.textInverse,
                      fontSize: typography.fontSizeBase,
                    },
                  ]}
                >
                  {step === 5
                    ? t('action.submit', 'Submit Request')
                    : `${t('action.next', 'Next')} →`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  stepContainer: {},
  stepTitle: {
    fontWeight: '800',
    marginBottom: 4,
  },
  stepDesc: {
    lineHeight: 18,
    marginBottom: 12,
  },
  errorText: {
    fontWeight: '600',
    marginTop: 4,
  },
  categoryGrid: {},
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
  },
  categoryCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  catIconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTextWrap: {
    flex: 1,
  },
  categoryName: {
    fontWeight: '700',
  },
  categorySub: {
    marginTop: 2,
  },
  radioIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  subCatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  subCatPill: {
    borderWidth: 1,
  },
  subCatText: {
    fontWeight: '600',
  },
  fieldLabel: {
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
  },
  textArea: {
    borderWidth: 1,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  urgencyBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  urgencyText: {
    fontWeight: '700',
  },
  helperModeCard: {
    borderWidth: 1,
  },
  helperToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  helperTextWrapper: {
    flex: 1,
  },
  helperTitle: {
    fontWeight: '700',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locPill: {
    borderWidth: 1,
  },
  locPillText: {
    fontWeight: '700',
  },
  docNoticeCard: {
    borderWidth: 1,
    alignItems: 'center',
  },
  docNoticeTitle: {
    fontWeight: '800',
    textAlign: 'center',
  },
  docNoticeDesc: {
    textAlign: 'center',
    lineHeight: 18,
  },
  reviewCard: {
    borderWidth: 1,
  },
  reviewLabel: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  reviewValue: {
    fontWeight: '600',
    marginTop: 2,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navBtn: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: {
    fontWeight: '700',
  },
  navBtnPrimary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnPrimaryText: {
    fontWeight: '800',
  },
  successWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  successCard: {
    borderWidth: 1,
    alignItems: 'center',
    textAlign: 'center',
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  successTitle: {
    fontWeight: '800',
    textAlign: 'center',
  },
  caseBadge: {
    borderWidth: 1.5,
    alignItems: 'center',
    width: '100%',
  },
  caseBadgeLabel: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  caseBadgeNo: {
    fontFamily: 'monospace',
    fontWeight: '900',
    marginTop: 4,
  },
  successNote: {
    textAlign: 'center',
    lineHeight: 18,
  },
  successActions: {
    width: '100%',
  },
  primaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontWeight: '800',
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secBtnText: {
    fontWeight: '700',
  },
});
