import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CanopyHeader } from '../components/CanopyHeader';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { demographicsService } from '../../services/demographicsService';
import { captureLocation } from '../../services/deviceCapture';
import { District, Taluka, Village } from '../../models/demographics.model';
import { captureFromCamera, pickFromGallery } from '../../services/imagePickerService';

interface Props {
  onSettings?: () => void;
  onBack?: () => void;
}

const BLOOD_GROUPS = [
  { code: 'A+', nameGu: 'એ પોઝિટિવ', note: 'A+ Recipient' },
  { code: 'A-', nameGu: 'એ નેગેટિવ', note: 'A- Rare Type' },
  { code: 'B+', nameGu: 'બી પોઝિટિવ', note: 'B+ Common Type' },
  { code: 'B-', nameGu: 'બી નેગેટિવ', note: 'B- Rare Type' },
  { code: 'AB+', nameGu: 'એબી પોઝિટિવ', note: 'Universal Plasma Donor' },
  { code: 'AB-', nameGu: 'એબી નેગેટિવ', note: 'AB- Rarest Type' },
  { code: 'O+', nameGu: 'ઓ પોઝિટિવ', note: 'Universal Red Cell' },
  { code: 'O-', nameGu: 'ઓ નેગેટિવ', note: 'Universal Emergency Donor' },
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face',
];

export const ProfileScreen: React.FC<Props> = ({ onSettings, onBack }) => {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const { t, language } = useTranslation();
  const { user, updateProfile, uploadAvatar, logout } = useAuth();
  const { showToast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [dob, setDob] = useState('');
  const [blood, setBlood] = useState('O+');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [rationCardNo, setRationCardNo] = useState('');
  const [bloodDonorActive, setBloodDonorActive] = useState(true);
  const [smsAlertsActive, setSmsAlertsActive] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Editable Demographics Location State
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [talukaId, setTalukaId] = useState<number | null>(null);
  const [villageId, setVillageId] = useState<number | null>(null);
  const [districtsList, setDistrictsList] = useState<District[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationTab, setLocationTab] = useState<
    'district' | 'taluka' | 'village'
  >('district');
  const [locationSearch, setLocationSearch] = useState('');

  const [showBloodPicker, setShowBloodPicker] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Load master districts list
  useEffect(() => {
    demographicsService
      .getDistricts()
      .then(dists => {
        if (dists && dists.length > 0) {
          setDistrictsList(dists);
        }
      })
      .catch(err => {
        console.warn('Failed to load districts:', err);
      });
  }, []);

  useEffect(() => {
    if (user) {
      const fName =
        user.first_name ||
        (user.name ? user.name.split(' (')[0].split(' ')[0] : '');
      const lName =
        user.last_name ||
        (user.name
          ? user.name.split(' (')[0].split(' ').slice(1).join(' ')
          : '');
      setFirstName(fName);
      setLastName(lName);
      if (user.gender) setGender(user.gender as 'male' | 'female' | 'other');
      if (user.date_of_birth) setDob(user.date_of_birth);
      if (user.blood_group) setBlood(user.blood_group);
      setAddress(user.address || '');
      setPincode(user.pincode || '');
      setRationCardNo(user.ration_card_no || '');
      setBloodDonorActive(user.blood_donor_active ?? true);
      setSmsAlertsActive(user.sms_alerts_active ?? true);
      setAvatarUrl(user.avatar_url || null);

      setDistrictId(user.district_id || user.district?.id || null);
      setTalukaId(user.taluka_id || user.taluka?.id || null);
      setVillageId(user.village_id || user.village?.id || null);
    }
  }, [user]);

  const save = async () => {
    setBusy(true);
    try {
      await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        gender,
        date_of_birth: dob.trim(),
        blood_group: blood,
        district_id: districtId,
        taluka_id: talukaId,
        village_id: villageId,
        address: address.trim(),
        pincode: pincode.trim(),
        ration_card_no: rationCardNo.trim(),
        blood_donor_active: bloodDonorActive,
        sms_alerts_active: smsAlertsActive,
        avatar_url: avatarUrl,
      });
      showToast(
        language === 'gu'
          ? 'માહિતી અને ગામ વિગતો સાચવાઈ ગઈ!'
          : 'Profile and village details updated successfully!',
        'success',
      );
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : language === 'gu'
          ? 'સાચવી શકાયું નહીં. કૃપા કરીને ફરી પ્રયાસ કરો.'
          : 'Could not save profile. Please retry.',
        'error',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleCameraCapture = async () => {
    setShowPhotoModal(false);
    try {
      const media = await captureFromCamera();
      if (!media) return;

      setPhotoUploading(true);
      setAvatarUrl(media.uri); // Instant optimistic preview

      if (media.base64) {
        const res = await uploadAvatar({ avatar_base64: media.base64 });
        if (res.data?.avatar_url) {
          setAvatarUrl(res.data.avatar_url);
        }
      }

      showToast(
        language === 'gu'
          ? 'કેમેરા ફોટો પ્રોફાઇલમાં સાચવવામાં આવ્યો છે.'
          : 'Camera photo saved to profile successfully.',
        'success',
      );
    } catch {
      showToast(
        language === 'gu'
          ? 'કેમેરા ફોટો સાચવી શકાયો નહીં.'
          : 'Failed to save camera photo.',
        'error',
      );
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleGalleryPick = async () => {
    setShowPhotoModal(false);
    try {
      const media = await pickFromGallery();
      if (!media) return;

      setPhotoUploading(true);
      setAvatarUrl(media.uri); // Instant optimistic preview

      if (media.base64) {
        const res = await uploadAvatar({ avatar_base64: media.base64 });
        if (res.data?.avatar_url) {
          setAvatarUrl(res.data.avatar_url);
        }
      }

      showToast(
        language === 'gu'
          ? 'ગેલેરી ફોટો પ્રોફાઇલમાં અપડેટ કરવામાં આવ્યો છે.'
          : 'Gallery photo updated successfully.',
        'success',
      );
    } catch {
      showToast(
        language === 'gu'
          ? 'ગેલેરી ફોટો સાચવી શકાયો નહીં.'
          : 'Failed to import gallery photo.',
        'error',
      );
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSelectPresetAvatar = async (url: string) => {
    setShowPhotoModal(false);
    setPhotoUploading(true);
    try {
      setAvatarUrl(url);
      await updateProfile({ avatar_url: url });
      showToast(
        language === 'gu'
          ? 'અવતાર પ્રોફાઇલ પર લાગુ કરવામાં આવ્યો છે.'
          : 'Avatar applied successfully.',
        'success',
      );
    } catch {
      showToast(
        language === 'gu'
          ? 'અવતાર અપડેટ નિષ્ફળ રહ્યો.'
          : 'Failed to update avatar.',
        'error',
      );
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setShowPhotoModal(false);
    setPhotoUploading(true);
    try {
      setAvatarUrl(null);
      await updateProfile({ avatar_url: null });
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout', 'Log Out'),
      t('settings.logout_confirm', 'Are you sure you want to log out?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('settings.logout', 'Log Out'),
          style: 'destructive',
          onPress: logout,
        },
      ],
    );
  };

  const displayName =
    `${firstName} ${lastName}`.trim() ||
    (user?.name ? user.name.split(' (')[0] : 'Citizen Member');

  const displayGuName = user?.name?.includes('(')
    ? user.name.split('(')[1]?.replace(')', '')
    : user?.occupation || 'ગુજરાત ગ્રામીણ નાગરિક';

  const memberCode = `THH-MEM-${
    user?.id ? String(user.id).padStart(4, '0') : '2026'
  }`;

  // Cascading location objects
  const selectedDistrict = useMemo(
    () => districtsList.find(d => d.id === districtId),
    [districtsList, districtId],
  );
  const availableTalukas = useMemo(
    () => selectedDistrict?.talukas || [],
    [selectedDistrict],
  );
  const selectedTaluka = useMemo(
    () => availableTalukas.find(item => item.id === talukaId),
    [availableTalukas, talukaId],
  );
  const availableVillages = useMemo(
    () => selectedTaluka?.villages || [],
    [selectedTaluka],
  );
  const selectedVillage = useMemo(
    () => availableVillages.find(v => v.id === villageId),
    [availableVillages, villageId],
  );

  const districtName =
    (language === 'gu'
      ? selectedDistrict?.name_gu
      : selectedDistrict?.name_en || selectedDistrict?.name_gu) ||
    user?.district?.name_gu ||
    user?.district?.name_en ||
    (language === 'gu' ? 'જિલ્લો પસંદ કરો' : 'Select District');

  const talukaName =
    (language === 'gu'
      ? selectedTaluka?.name_gu
      : selectedTaluka?.name_en || selectedTaluka?.name_gu) ||
    user?.taluka?.name_gu ||
    user?.taluka?.name_en ||
    (language === 'gu' ? 'તાલુકો પસંદ કરો' : 'Select Taluka');

  const villageName =
    (language === 'gu'
      ? selectedVillage?.name_gu
      : selectedVillage?.name_en || selectedVillage?.name_gu) ||
    user?.village?.name_gu ||
    user?.village?.name_en ||
    (language === 'gu' ? 'ગામ પસંદ કરો' : 'Select Village');

  const handleSelectDistrict = (dist: District) => {
    setDistrictId(dist.id);
    const talukas = dist.talukas || [];
    if (!talukas.some(item => item.id === talukaId)) {
      setTalukaId(null);
      setVillageId(null);
    }
    setLocationSearch('');
    if (talukas.length > 0) {
      setLocationTab('taluka');
    }
  };

  const handleSelectTaluka = (taluka: Taluka) => {
    setTalukaId(taluka.id);
    const villages = taluka.villages || [];
    if (!villages.some(v => v.id === villageId)) {
      setVillageId(null);
    }
    setLocationSearch('');
    if (villages.length > 0) {
      setLocationTab('village');
    }
  };

  const handleSelectVillage = (village: Village) => {
    setVillageId(village.id);
    setLocationSearch('');
    setShowLocationModal(false);
    showToast(
      language === 'gu'
        ? `ગામ "${village.name_gu}" પસંદ કરાયું`
        : `Village "${village.name_en || village.name_gu}" selected`,
      'info',
    );
  };

  /**
   * GPS Auto-Fill: Get device location → nearest village API → populate district/taluka/village.
   * Falls back gracefully if GPS or API is unavailable.
   */
  const handleGpsAutoFill = async () => {
    setGpsLoading(true);
    try {
      const coords = await captureLocation();
      if (!coords) {
        showToast(
          language === 'gu'
            ? 'GPS અક્ષ્ય નહીં. ભૌગોલિક સ્થાન ચાલુ છે?'
            : 'Could not access GPS. Is location enabled?',
          'warning',
          language === 'gu' ? 'GPS અનુપલબ્ધ' : 'GPS Unavailable',
        );
        return;
      }

      const nearest = await demographicsService.getNearestLocation(coords.lat, coords.lng);
      if (!nearest) {
        showToast(
          language === 'gu'
            ? 'આ GPS સ્થાન માટે નજીકનું ગામ મળ્યું નહીં.'
            : 'No nearby village found for your GPS position.',
          'warning',
        );
        return;
      }

      // Set district, taluka, village IDs from nearest result
      if (nearest.district) {
        setDistrictId(nearest.district.id);
      }
      if (nearest.taluka) {
        setTalukaId(nearest.taluka.id);
      }
      setVillageId(nearest.village.id);
      if (nearest.village.pincode) {
        setPincode(nearest.village.pincode);
      }

      const villageLabelEn = nearest.village.name_en || nearest.village.name_gu;
      const villageLabelGu = nearest.village.name_gu;
      const distKm = nearest.distance_km;

      showToast(
        language === 'gu'
          ? `સ્થળ ભરાયું: ${villageLabelGu} (${distKm} km)`
          : `Location filled: ${villageLabelEn} (${distKm} km away)`,
        'success',
        language === 'gu' ? 'GPS સ્થળ' : 'GPS Located',
      );
    } catch {
      showToast(
        language === 'gu'
          ? 'GPS સ્થળ ભરી શકાયું નહીં.'
          : 'Failed to auto-fill location via GPS.',
        'error',
      );
    } finally {
      setGpsLoading(false);
    }
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      {/* Reusable Canopy Header */}
      <CanopyHeader
        subtitle={t('nav.profile', 'Profile')}
        showBack={Boolean(onBack)}
        onBack={onBack}
        right={
          onSettings ? (
            <TouchableOpacity onPress={onSettings} style={styles.settingsBtn}>
              <Ionicons name="settings-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scrollContent, { flexGrow: 1, paddingBottom: 220 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Profile Hero & Verified Member Card */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.heroCenterCol}>
              {/* Avatar with Photo Trigger */}
              <View style={styles.avatarWrap}>
                <View
                  style={[
                    styles.avatarCircleLarge,
                    { backgroundColor: colors.primaryContainer },
                  ]}
                >
                  {avatarUrl ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      style={styles.avatarImageLarge}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.avatarTextLarge,
                        { color: colors.onPrimaryContainer },
                      ]}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  )}
                  {photoUploading && (
                    <View style={styles.avatarUploadingOverlay}>
                      <ActivityIndicator size="small" color="#ffffff" />
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => setShowPhotoModal(true)}
                  style={[
                    styles.cameraBadgeBtn,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Ionicons name="camera" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <View style={styles.nameRow}>
                <Text style={[styles.nameTitle, { color: colors.text }]}>
                  {displayName}
                </Text>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.nameGu, { color: colors.textMuted }]}>
                {displayGuName}
              </Text>

              {/* Member Badges */}
              <View style={styles.badgeChipsRow}>
                <View
                  style={[
                    styles.chipPill,
                    { backgroundColor: colors.primaryContainer },
                  ]}
                >
                  <Ionicons
                    name="id-card-outline"
                    size={13}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.chipPillText, { color: colors.primary }]}
                  >
                    {memberCode}
                  </Text>
                </View>
                {Boolean(user?.email_verified || user?.email_verified_at) && (
                  <View
                    style={[
                      styles.chipPill,
                      {
                        backgroundColor: `${colors.primary}18`,
                        borderColor: `${colors.primary}40`,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name="shield-checkmark"
                      size={13}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.chipPillText,
                        { color: colors.primary, fontWeight: '700' },
                      ]}
                    >
                      {language === 'gu' ? 'ઈમેલ ચકાસાયેલ' : 'Email Verified'}
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    styles.chipPill,
                    { backgroundColor: colors.surfaceSubtle },
                  ]}
                >
                  <Ionicons
                    name="location-outline"
                    size={13}
                    color={colors.secondary}
                  />
                  <Text style={[styles.chipPillText, { color: colors.text }]}>
                    {talukaName}
                  </Text>
                </View>
              </View>

              {/* Quick Trust Indicators Bar (3 columns) */}
              <View
                style={[
                  styles.trustIndicatorsGrid,
                  { backgroundColor: colors.surfaceSubtle },
                ]}
              >
                <View style={styles.trustCol}>
                  <Text
                    style={[styles.trustLabel, { color: colors.textMuted }]}
                  >
                    {language === 'gu' ? 'સભ્ય સ્થિતિ' : 'Member Status'}
                  </Text>
                  <View style={styles.trustValRow}>
                    <Ionicons
                      name="shield-checkmark"
                      size={13}
                      color={colors.primary}
                    />
                    <Text style={[styles.trustVal, { color: colors.primary }]}>
                      {language === 'gu' ? 'સક્રિય' : 'Active'}
                    </Text>
                  </View>
                </View>
                <View style={styles.trustCol}>
                  <Text
                    style={[styles.trustLabel, { color: colors.textMuted }]}
                  >
                    Ration Card
                  </Text>
                  <View style={styles.trustValRow}>
                    <View
                      style={[
                        styles.dotAmber,
                        {
                          backgroundColor: rationCardNo ? '#10b981' : '#f59e0b',
                        },
                      ]}
                    />
                    <Text
                      style={[styles.trustVal, { color: colors.secondary }]}
                    >
                      {rationCardNo ? 'Linked' : 'BPL / PHH'}
                    </Text>
                  </View>
                </View>
                <View style={styles.trustCol}>
                  <Text
                    style={[styles.trustLabel, { color: colors.textMuted }]}
                  >
                    {language === 'gu' ? 'રક્તદાતા' : 'Donor Status'}
                  </Text>
                  <View style={styles.trustValRow}>
                    <Ionicons name="water" size={13} color={colors.error} />
                    <Text
                      style={[styles.trustVal, { color: colors.secondary }]}
                    >
                      {blood ||
                        (language === 'gu' ? 'નોંધાયેલ નથી' : 'Not Set')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* 2. Personal Details Form */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionTitleRow}>
              <View
                style={[
                  styles.titleBarIndicator,
                  { backgroundColor: colors.primary },
                ]}
              />
              <Text style={[styles.sectionTitleH2, { color: colors.text }]}>
                {language === 'gu' ? 'વ્યક્તિગત વિગત' : 'Personal Details'}
              </Text>
            </View>

            {/* First & Last Name */}
            <View style={styles.nameInputsGrid}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.inputFieldLabel, { color: colors.textMuted }]}
                >
                  {language === 'gu' ? 'પ્રથમ નામ' : 'First Name'}
                </Text>
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder={language === 'gu' ? 'પ્રથમ નામ' : 'First name'}
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.textInputStyle,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      color: colors.text,
                    },
                  ]}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.inputFieldLabel, { color: colors.textMuted }]}
                >
                  {language === 'gu' ? 'અટક' : 'Last Name'}
                </Text>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder={language === 'gu' ? 'અટક' : 'Last name'}
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.textInputStyle,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      color: colors.text,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Mobile (Verified Lock) */}
            <View>
              <View style={styles.fieldHeaderBetween}>
                <Text
                  style={[styles.inputFieldLabel, { color: colors.textMuted }]}
                >
                  {language === 'gu' ? 'મોબાઇલ નંબર' : 'Mobile Number'}
                </Text>
                <View style={styles.verifiedTagRow}>
                  <Ionicons
                    name="shield-checkmark"
                    size={12}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.verifiedTagText, { color: colors.primary }]}
                  >
                    {language === 'gu' ? 'ચકાસાયેલ' : 'Verified'}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.lockedInputBox,
                  { backgroundColor: colors.surfaceSubtle },
                ]}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={18}
                  color={colors.secondary}
                />
                <Text style={[styles.lockedInputText, { color: colors.text }]}>
                  {!user?.phone || user.phone.includes('@')
                    ? language === 'gu'
                      ? 'નોંધાયેલ નથી'
                      : 'Not provided'
                    : user.phone}
                </Text>
                <Ionicons
                  name="lock-closed"
                  size={16}
                  color={colors.textMuted}
                  style={{ marginLeft: 'auto' }}
                />
              </View>
            </View>

            {/* Email ID (Verified Lock) */}
            <View>
              <View style={styles.fieldHeaderBetween}>
                <Text
                  style={[styles.inputFieldLabel, { color: colors.textMuted }]}
                >
                  {language === 'gu' ? 'ઈમેલ સરનામું' : 'Email Address'}
                </Text>
                <View style={styles.verifiedTagRow}>
                  <Ionicons
                    name="mail-unread"
                    size={12}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.verifiedTagText, { color: colors.primary }]}
                  >
                    {language === 'gu' ? 'સક્રિય' : 'Active'}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.lockedInputBox,
                  { backgroundColor: colors.surfaceSubtle },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={colors.secondary}
                />
                <Text
                  style={[styles.lockedInputText, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {user?.email ||
                    (language === 'gu' ? 'નોંધાયેલ નથી' : 'Not provided')}
                </Text>
                <Ionicons
                  name="lock-closed"
                  size={16}
                  color={colors.textMuted}
                  style={{ marginLeft: 'auto' }}
                />
              </View>
            </View>

            {/* Gender Selector */}
            <View>
              <Text
                style={[styles.inputFieldLabel, { color: colors.textMuted }]}
              >
                {language === 'gu' ? 'જાતિ' : 'Gender'}
              </Text>
              <View style={styles.genderOptionsRow}>
                {(['male', 'female', 'other'] as const).map(g => {
                  const label =
                    g === 'male'
                      ? language === 'gu'
                        ? 'પુરુષ'
                        : 'Male'
                      : g === 'female'
                      ? language === 'gu'
                        ? 'સ્ત્રી'
                        : 'Female'
                      : language === 'gu'
                      ? 'અન્ય'
                      : 'Other';
                  return (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setGender(g)}
                      style={[
                        styles.genderTabBtn,
                        gender === g
                          ? { backgroundColor: colors.primary }
                          : { backgroundColor: colors.surfaceSubtle },
                      ]}
                    >
                      <Ionicons
                        name={
                          g === 'male'
                            ? 'man'
                            : g === 'female'
                            ? 'woman'
                            : 'person'
                        }
                        size={16}
                        color={gender === g ? colors.textInverse : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.genderTabText,
                          { color: gender === g ? colors.textInverse : colors.text },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* DOB & Predefined Blood Group Dropdown */}
            <View style={styles.nameInputsGrid}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.inputFieldLabel, { color: colors.textMuted }]}
                >
                  {language === 'gu' ? 'જન્મ તારીખ' : 'Birth Date'}
                </Text>
                <View
                  style={[
                    styles.iconInputWrap,
                    { backgroundColor: colors.surfaceSubtle },
                  ]}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={colors.secondary}
                  />
                  <TextInput
                    value={dob}
                    onChangeText={setDob}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                    style={[styles.inlineInput, { color: colors.text }]}
                  />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.inputFieldLabel, { color: colors.textMuted }]}
                >
                  {language === 'gu' ? 'બ્લડ ગ્રુપ' : 'Blood Group'}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowBloodPicker(true)}
                  style={[
                    styles.iconInputWrap,
                    { backgroundColor: colors.surfaceSubtle },
                  ]}
                >
                  <Ionicons name="water" size={16} color={colors.error} />
                  <Text style={[styles.bloodValueText, { color: colors.text }]}>
                    {blood || (language === 'gu' ? 'પસંદ કરો' : 'Select')}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={colors.textMuted}
                    style={{ marginLeft: 'auto' }}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 3. Village & Residence Card (Full Editable Form) */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionTitleRow}>
              <View
                style={[
                  styles.titleBarIndicator,
                  { backgroundColor: colors.secondary },
                ]}
              />
              <Text style={[styles.sectionTitleH2, { color: colors.text }]}>
                {language === 'gu' ? 'ગામ અને સરનામું' : 'Village & Residence'}
              </Text>
            </View>

            {/* Location Summary Header with Change Pill */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setLocationTab(
                  villageId
                    ? 'village'
                    : talukaId
                    ? 'village'
                    : districtId
                    ? 'taluka'
                    : 'district',
                );
                setLocationSearch('');
                setShowLocationModal(true);
              }}
              style={[
                styles.villageInfoBox,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <View style={styles.villageHeaderRow}>
                <View
                  style={[
                    styles.cottageIconBox,
                    { backgroundColor: colors.secondaryContainer },
                  ]}
                >
                  <Ionicons
                    name="home"
                    size={18}
                    color={colors.onSecondaryContainer}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.villageTitle, { color: colors.text }]}>
                    {language === 'gu'
                      ? `ગામ: ${villageName}`
                      : `Village: ${villageName}`}
                  </Text>
                  <Text
                    style={[styles.villageSub, { color: colors.textMuted }]}
                  >
                    {language === 'gu'
                      ? `તાલુકો: ${talukaName} | જિલ્લો: ${districtName}`
                      : `Taluka: ${talukaName} | District: ${districtName}`}
                  </Text>
                </View>
                <View
                  style={[
                    styles.changeLocationPill,
                    { backgroundColor: colors.primaryContainer },
                  ]}
                >
                  <Ionicons name="pencil" size={12} color={colors.onPrimaryContainer} />
                  <Text
                    style={[
                      styles.changeLocationText,
                      { color: colors.onPrimaryContainer },
                    ]}
                  >
                    {language === 'gu' ? 'બદલો' : 'Edit'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* GPS Auto-Detect Button */}
            <TouchableOpacity
              onPress={handleGpsAutoFill}
              disabled={gpsLoading}
              style={[
                styles.gpsDetectBtn,
                {
                  backgroundColor: gpsLoading
                    ? colors.surfaceSubtle
                    : colors.secondaryContainer,
                  borderColor: colors.secondary,
                },
              ]}
            >
              {gpsLoading ? (
                <ActivityIndicator size="small" color={colors.secondary} />
              ) : (
                <Ionicons
                  name="navigate"
                  size={16}
                  color={colors.onSecondaryContainer}
                />
              )}
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.gpsDetectTitle,
                    { color: colors.onSecondaryContainer },
                  ]}
                >
                  {gpsLoading
                    ? language === 'gu'
                      ? 'GPS સ્થળ શોધી રહ્યા છે...'
                      : 'Detecting location...'
                    : language === 'gu'
                    ? 'GPS થી સ્થળ ભરો'
                    : 'Auto-detect via GPS'}
                </Text>
                <Text
                  style={[
                    styles.gpsDetectSub,
                    { color: colors.onSecondaryContainer, opacity: 0.85 },
                  ]}
                >
                  {language === 'gu'
                    ? 'નજીકનું ગામ, તાલુકો, જિલ્લો આપમેળે ભરાશે'
                    : 'Nearest village, taluka & district auto-filled'}
                </Text>
              </View>
              <View
                style={[
                  styles.gpsDetectBadge,
                  { backgroundColor: colors.secondary },
                ]}
              >
                <Ionicons name="flash" size={12} color={colors.textInverse} />
              </View>
            </TouchableOpacity>

            {/* Interactive Tier Pickers (District, Taluka, Village) */}
            <View style={styles.locationSelectorsContainer}>
              {/* District Selector */}
              <View style={{ marginBottom: 10 }}>
                <Text
                  style={[styles.inputFieldLabel, { color: colors.textMuted }]}
                >
                  {language === 'gu' ? 'જિલ્લો (District)' : 'District'}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setLocationTab('district');
                    setLocationSearch('');
                    setShowLocationModal(true);
                  }}
                  style={[
                    styles.selectorInputWrap,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.selectorValueText,
                      { color: districtId ? colors.text : colors.textMuted },
                    ]}
                  >
                    {districtName}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={colors.textMuted}
                    style={{ marginLeft: 'auto' }}
                  />
                </TouchableOpacity>
              </View>

              {/* Taluka Selector */}
              <View style={{ marginBottom: 10 }}>
                <Text
                  style={[styles.inputFieldLabel, { color: colors.textMuted }]}
                >
                  {language === 'gu' ? 'તાલુકો (Taluka)' : 'Taluka'}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setLocationTab('taluka');
                    setLocationSearch('');
                    setShowLocationModal(true);
                  }}
                  style={[
                    styles.selectorInputWrap,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <Ionicons
                    name="business-outline"
                    size={16}
                    color={colors.secondary}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.selectorValueText,
                      { color: talukaId ? colors.text : colors.textMuted },
                    ]}
                  >
                    {talukaName}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={colors.textMuted}
                    style={{ marginLeft: 'auto' }}
                  />
                </TouchableOpacity>
              </View>

              {/* Village Selector */}
              <View style={{ marginBottom: 4 }}>
                <Text
                  style={[styles.inputFieldLabel, { color: colors.textMuted }]}
                >
                  {language === 'gu' ? 'ગામ (Village)' : 'Village'}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setLocationTab('village');
                    setLocationSearch('');
                    setShowLocationModal(true);
                  }}
                  style={[
                    styles.selectorInputWrap,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <Ionicons
                    name="home-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.selectorValueText,
                      { color: villageId ? colors.text : colors.textMuted },
                    ]}
                  >
                    {villageName}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color={colors.textMuted}
                    style={{ marginLeft: 'auto' }}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Editable Street / Ward / House Address */}
            <View style={{ marginTop: 12 }}>
              <Text
                style={[styles.inputFieldLabel, { color: colors.textMuted }]}
              >
                {language === 'gu'
                  ? 'ઘર / વોર્ડ / ફળિયાનું સરનામું'
                  : 'House / Ward / Street Address'}
              </Text>
              <View
                style={[
                  styles.iconInputWrap,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Ionicons
                  name="map-outline"
                  size={16}
                  color={colors.secondary}
                />
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder={
                    language === 'gu'
                      ? 'વોર્ડ નં., ફળિયું, સરનામું'
                      : 'Ward No., Faliya, Street Address'
                  }
                  placeholderTextColor={colors.textMuted}
                  style={[styles.inlineInput, { color: colors.text }]}
                />
              </View>
            </View>

            {/* Editable PIN Code & Ration Card No */}
            <View style={[styles.nameInputsGrid, { marginTop: 10 }]}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.inputFieldLabel, { color: colors.textMuted }]}
                >
                  {language === 'gu' ? 'પીનકોડ' : 'PIN Code'}
                </Text>
                <View
                  style={[
                    styles.iconInputWrap,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <Ionicons
                    name="navigate-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <TextInput
                    value={pincode}
                    onChangeText={setPincode}
                    placeholder="396445"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    maxLength={10}
                    style={[styles.inlineInput, { color: colors.text }]}
                  />
                </View>
              </View>

              <View style={{ flex: 1.2 }}>
                <Text
                  style={[styles.inputFieldLabel, { color: colors.textMuted }]}
                >
                  {language === 'gu' ? 'રેશન કાર્ડ નંબર' : 'Ration Card'}
                </Text>
                <View
                  style={[
                    styles.iconInputWrap,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <Ionicons
                    name="newspaper-outline"
                    size={16}
                    color={colors.secondary}
                  />
                  <TextInput
                    value={rationCardNo}
                    onChangeText={setRationCardNo}
                    placeholder="GJ-24-CKL-882941"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    style={[styles.inlineInput, { color: colors.text }]}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* 4. Community & Safety Toggles */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionTitleRow}>
              <View
                style={[
                  styles.titleBarIndicator,
                  { backgroundColor: colors.primary },
                ]}
              />
              <Text style={[styles.sectionTitleH2, { color: colors.text }]}>
                {language === 'gu'
                  ? 'સેવા અને સુરક્ષા પસંદગી'
                  : 'Community & Safety'}
              </Text>
            </View>

            {/* Blood Donor Network Toggle */}
            <View
              style={[
                styles.toggleCardItem,
                { backgroundColor: colors.surfaceSubtle },
              ]}
            >
              <View
                style={[
                  styles.toggleIconBox,
                  { backgroundColor: colors.errorContainer },
                ]}
              >
                <Ionicons name="water" size={18} color={colors.error} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>
                  {language === 'gu'
                    ? 'ઇમરજન્સી રક્તદાતા નેટવર્ક'
                    : 'Emergency Blood Donor Network'}
                </Text>
                <Text style={[styles.toggleSub, { color: colors.textMuted }]}>
                  {language === 'gu'
                    ? `સ્થાનિક હોસ્પિટલ અને સેવકોને રક્ત જરૂરિયાત માટે વિનંતી મોકલવાની પરવાનગી આપો (${blood}).`
                    : 'Allow local civil hospitals & THH coordinators to request urgent blood donation.'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setBloodDonorActive(prev => !prev)}
                style={[
                  styles.customToggleBox,
                  {
                    backgroundColor: bloodDonorActive
                      ? colors.primary
                      : colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.customToggleKnob,
                    bloodDonorActive && styles.customToggleKnobActive,
                  ]}
                />
              </TouchableOpacity>
            </View>

            {/* Push / SMS Alerts Toggle */}
            <View
              style={[
                styles.toggleCardItem,
                { backgroundColor: colors.surfaceSubtle },
              ]}
            >
              <View
                style={[
                  styles.toggleIconBox,
                  { backgroundColor: colors.secondaryContainer },
                ]}
              >
                <Ionicons
                  name="notifications"
                  size={18}
                  color={colors.onSecondaryContainer}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>
                  {language === 'gu'
                    ? 'રિયલ-ટાઇમ SMS સૂચનાઓ'
                    : 'Realtime Welfare SMS Alerts'}
                </Text>
                <Text style={[styles.toggleSub, { color: colors.textMuted }]}>
                  {language === 'gu'
                    ? 'જ્યારે પણ અધિકારી તમારી અરજીની સ્થિતિ અપડેટ કરે ત્યારે SMS મેળવો.'
                    : 'Receive SMS updates whenever an officer updates your case status.'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSmsAlertsActive(prev => !prev)}
                style={[
                  styles.customToggleBox,
                  {
                    backgroundColor: smsAlertsActive
                      ? colors.primary
                      : colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.customToggleKnob,
                    smsAlertsActive && styles.customToggleKnobActive,
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Save Profile CTA */}
          <TouchableOpacity
            disabled={busy}
            onPress={save}
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          >
            {busy ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="save" size={18} color="#ffffff" />
                <Text style={styles.saveBtnText}>
                  {language === 'gu' ? 'પ્રોફાઇલ સાચવો' : 'Save Profile'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Log out button */}
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>
              {language === 'gu' ? 'બહાર નીકળો' : 'Log Out'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Predefined Blood Group Selector Modal */}
      <Modal
        visible={showBloodPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBloodPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.bloodModalContent,
              { backgroundColor: colors.surface },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name="water"
                  size={20}
                  color={colors.error}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.modalTitleText, { color: colors.text }]}>
                  {language === 'gu'
                    ? 'રક્ત જૂથ પસંદ કરો'
                    : 'Select Blood Group'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowBloodPicker(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text
              style={[styles.modalSubtitleText, { color: colors.textMuted }]}
            >
              {language === 'gu'
                ? 'ગુજરાત આરોગ્ય કટોકટી સહાય માટે નિર્ધારિત રક્ત જૂથો:'
                : 'Predefined blood groups for emergency health support:'}
            </Text>

            <View style={styles.bloodGrid}>
              {BLOOD_GROUPS.map(item => {
                const isSelected = blood === item.code;
                return (
                  <TouchableOpacity
                    key={item.code}
                    onPress={() => {
                      setBlood(item.code);
                      setShowBloodPicker(false);
                    }}
                    style={[
                      styles.bloodItemBtn,
                      {
                        backgroundColor: isSelected
                          ? colors.primaryContainer
                          : colors.surfaceSubtle,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.bloodItemTopRow}>
                      <Text
                        style={[
                          styles.bloodCodeText,
                          { color: isSelected ? colors.primary : colors.text },
                        ]}
                      >
                        {item.code}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={colors.primary}
                        />
                      )}
                    </View>
                    <Text
                      style={[styles.bloodGuText, { color: colors.textMuted }]}
                    >
                      {language === 'gu' ? item.nameGu : item.code}
                    </Text>
                    <Text
                      style={[
                        styles.bloodNoteText,
                        { color: colors.secondary },
                      ]}
                    >
                      {item.note}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Camera / Gallery Avatar Picker Modal */}
      <Modal
        visible={showPhotoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View style={styles.modalOverlayBottom}>
          <View
            style={[
              styles.photoSheetContent,
              { backgroundColor: colors.surface },
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {language === 'gu' ? 'પ્રોફાઇલ ફોટો' : 'Profile Photo'}
            </Text>
            <Text style={[styles.sheetSub, { color: colors.textMuted }]}>
              {language === 'gu'
                ? 'કેમેરા અથવા ગેલેરીમાંથી ફોટો પસંદ કરો:'
                : 'Choose camera or gallery portrait:'}
            </Text>

            <View style={styles.sheetActionRow}>
              <TouchableOpacity
                onPress={handleCameraCapture}
                style={[
                  styles.sheetActionBtn,
                  { backgroundColor: colors.surfaceSubtle },
                ]}
              >
                <View
                  style={[
                    styles.sheetActionIconCircle,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Ionicons name="camera" size={22} color="#ffffff" />
                </View>
                <Text style={[styles.sheetActionLabel, { color: colors.text }]}>
                  {language === 'gu' ? 'કેમેરા' : 'Camera'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleGalleryPick}
                style={[
                  styles.sheetActionBtn,
                  { backgroundColor: colors.surfaceSubtle },
                ]}
              >
                <View
                  style={[
                    styles.sheetActionIconCircle,
                    { backgroundColor: colors.secondary },
                  ]}
                >
                  <Ionicons name="images" size={22} color="#ffffff" />
                </View>
                <Text style={[styles.sheetActionLabel, { color: colors.text }]}>
                  {language === 'gu' ? 'ગેલેરી' : 'Gallery'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={[styles.presetSectionTitle, { color: colors.textMuted }]}
            >
              {language === 'gu'
                ? 'અથવા અવતાર પસંદ કરો:'
                : 'Or select an avatar:'}
            </Text>
            <View style={styles.presetAvatarsRow}>
              {PRESET_AVATARS.map((uri, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSelectPresetAvatar(uri)}
                  style={styles.presetAvatarBtn}
                >
                  <Image source={{ uri }} style={styles.presetAvatarImg} />
                </TouchableOpacity>
              ))}
            </View>

            {avatarUrl && (
              <TouchableOpacity
                onPress={handleRemovePhoto}
                style={styles.removePhotoRow}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
                <Text style={[styles.removePhotoText, { color: colors.error }]}>
                  {language === 'gu' ? 'ફોટો હટાવો' : 'Remove Photo'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => setShowPhotoModal(false)}
              style={[
                styles.cancelModalBtn,
                { backgroundColor: colors.surfaceSubtle },
              ]}
            >
              <Text style={[styles.cancelModalText, { color: colors.text }]}>
                {language === 'gu' ? 'રદ કરો' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 3-Tier District, Taluka & Village Location Picker Modal */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlayBottom}>
          <View
            style={[
              styles.locationModalCard,
              { backgroundColor: colors.surface },
            ]}
          >
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              >
                <View
                  style={[
                    styles.cottageIconBox,
                    {
                      backgroundColor: colors.primaryContainer,
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                    },
                  ]}
                >
                  <Ionicons name="location" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.modalTitleText, { color: colors.text }]}>
                  {language === 'gu'
                    ? 'સ્થળ / રહેઠાણ પસંદ કરો'
                    : 'Select Location'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Segmented Step Tabs */}
            <View style={styles.locTabNav}>
              {/* Tab 1: District */}
              <TouchableOpacity
                onPress={() => {
                  setLocationTab('district');
                  setLocationSearch('');
                }}
                style={[
                  styles.locTabBtn,
                  {
                    backgroundColor:
                      locationTab === 'district'
                        ? colors.primaryContainer
                        : colors.surfaceSubtle,
                    borderColor:
                      locationTab === 'district'
                        ? colors.primary
                        : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.locTabTitle,
                    {
                      color:
                        locationTab === 'district'
                          ? colors.primary
                          : colors.text,
                    },
                  ]}
                >
                  {language === 'gu' ? '૧. જિલ્લો' : '1. District'}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.locTabSubtitle,
                    {
                      color:
                        locationTab === 'district'
                          ? colors.primary
                          : colors.textMuted,
                    },
                  ]}
                >
                  {selectedDistrict
                    ? language === 'gu'
                      ? selectedDistrict.name_gu
                      : selectedDistrict.name_en || selectedDistrict.name_gu
                    : language === 'gu'
                    ? 'બાકી'
                    : 'Pending'}
                </Text>
              </TouchableOpacity>

              {/* Tab 2: Taluka */}
              <TouchableOpacity
                onPress={() => {
                  setLocationTab('taluka');
                  setLocationSearch('');
                }}
                style={[
                  styles.locTabBtn,
                  {
                    backgroundColor:
                      locationTab === 'taluka'
                        ? colors.primaryContainer
                        : colors.surfaceSubtle,
                    borderColor:
                      locationTab === 'taluka' ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.locTabTitle,
                    {
                      color:
                        locationTab === 'taluka' ? colors.primary : colors.text,
                    },
                  ]}
                >
                  {language === 'gu' ? '૨. તાલુકો' : '2. Taluka'}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.locTabSubtitle,
                    {
                      color:
                        locationTab === 'taluka'
                          ? colors.primary
                          : colors.textMuted,
                    },
                  ]}
                >
                  {selectedTaluka
                    ? language === 'gu'
                      ? selectedTaluka.name_gu
                      : selectedTaluka.name_en || selectedTaluka.name_gu
                    : language === 'gu'
                    ? 'બાકી'
                    : 'Pending'}
                </Text>
              </TouchableOpacity>

              {/* Tab 3: Village */}
              <TouchableOpacity
                onPress={() => {
                  setLocationTab('village');
                  setLocationSearch('');
                }}
                style={[
                  styles.locTabBtn,
                  {
                    backgroundColor:
                      locationTab === 'village'
                        ? colors.primaryContainer
                        : colors.surfaceSubtle,
                    borderColor:
                      locationTab === 'village'
                        ? colors.primary
                        : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.locTabTitle,
                    {
                      color:
                        locationTab === 'village'
                          ? colors.primary
                          : colors.text,
                    },
                  ]}
                >
                  {language === 'gu' ? '૩. ગામ' : '3. Village'}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.locTabSubtitle,
                    {
                      color:
                        locationTab === 'village'
                          ? colors.primary
                          : colors.textMuted,
                    },
                  ]}
                >
                  {selectedVillage
                    ? language === 'gu'
                      ? selectedVillage.name_gu
                      : selectedVillage.name_en || selectedVillage.name_gu
                    : language === 'gu'
                    ? 'બાકી'
                    : 'Pending'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View
              style={[
                styles.locSearchContainer,
                { backgroundColor: colors.surfaceSubtle },
              ]}
            >
              <Ionicons name="search" size={16} color={colors.textMuted} />
              <TextInput
                value={locationSearch}
                onChangeText={setLocationSearch}
                placeholder={
                  locationTab === 'district'
                    ? language === 'gu'
                      ? 'જિલ્લો શોધો...'
                      : 'Search District...'
                    : locationTab === 'taluka'
                    ? language === 'gu'
                      ? 'તાલુકો શોધો...'
                      : 'Search Taluka...'
                    : language === 'gu'
                    ? 'ગામ શોધો...'
                    : 'Search Village...'
                }
                placeholderTextColor={colors.textMuted}
                style={[styles.locSearchInput, { color: colors.text }]}
              />
              {locationSearch.length > 0 && (
                <TouchableOpacity onPress={() => setLocationSearch('')}>
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* List Content */}
            <ScrollView
              style={styles.locListScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Tab 1: District Listing */}
              {locationTab === 'district' && (
                <View>
                  {districtsList
                    .filter(d => {
                      if (!locationSearch.trim()) return true;
                      const q = locationSearch.trim().toLowerCase();
                      return (
                        d.name_gu.toLowerCase().includes(q) ||
                        (d.name_en && d.name_en.toLowerCase().includes(q))
                      );
                    })
                    .map(dist => {
                      const isSelected = districtId === dist.id;
                      return (
                        <TouchableOpacity
                          key={dist.id}
                          onPress={() => handleSelectDistrict(dist)}
                          style={[
                            styles.locRowItem,
                            {
                              backgroundColor: isSelected
                                ? colors.primaryContainer
                                : colors.surfaceSubtle,
                              borderColor: isSelected
                                ? colors.primary
                                : colors.border,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.locRowIconBox,
                              {
                                backgroundColor: isSelected
                                  ? colors.primary
                                  : colors.surface,
                              },
                            ]}
                          >
                            <Ionicons
                              name="location"
                              size={16}
                              color={isSelected ? '#ffffff' : colors.primary}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.locRowTitle,
                                {
                                  color: isSelected
                                    ? colors.primary
                                    : colors.text,
                                },
                              ]}
                            >
                              {language === 'gu'
                                ? dist.name_gu
                                : dist.name_en || dist.name_gu}
                            </Text>
                            <Text
                              style={[
                                styles.locRowSub,
                                { color: colors.textMuted },
                              ]}
                            >
                              {language === 'gu'
                                ? `${dist.name_en || ''} • ${
                                    dist.talukas?.length || 0
                                  } તાલુકા`
                                : `${dist.name_gu} • ${
                                    dist.talukas?.length || 0
                                  } Talukas`}
                            </Text>
                          </View>
                          {isSelected && (
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color={colors.primary}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                </View>
              )}

              {/* Tab 2: Taluka Listing */}
              {locationTab === 'taluka' && (
                <View>
                  {!districtId ? (
                    <View style={styles.emptyStateBox}>
                      <Ionicons
                        name="alert-circle-outline"
                        size={32}
                        color={colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.emptyStateText,
                          { color: colors.textMuted },
                        ]}
                      >
                        {language === 'gu'
                          ? 'કૃપા કરીને પહેલા જિલ્લો પસંદ કરો.'
                          : 'Please select a District first.'}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setLocationTab('district')}
                        style={[
                          styles.emptyStateActionBtn,
                          { backgroundColor: colors.primaryContainer },
                        ]}
                      >
                        <Text
                          style={[
                            styles.emptyStateActionText,
                            { color: colors.primary },
                          ]}
                        >
                          {language === 'gu'
                            ? 'જિલ્લો પસંદ કરો'
                            : 'Select District'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    availableTalukas
                      .filter(item => {
                        if (!locationSearch.trim()) return true;
                        const q = locationSearch.trim().toLowerCase();
                        return (
                          item.name_gu.toLowerCase().includes(q) ||
                          (item.name_en &&
                            item.name_en.toLowerCase().includes(q))
                        );
                      })
                      .map(taluka => {
                        const isSelected = talukaId === taluka.id;
                        return (
                          <TouchableOpacity
                            key={taluka.id}
                            onPress={() => handleSelectTaluka(taluka)}
                            style={[
                              styles.locRowItem,
                              {
                                backgroundColor: isSelected
                                  ? colors.primaryContainer
                                  : colors.surfaceSubtle,
                                borderColor: isSelected
                                  ? colors.primary
                                  : colors.border,
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.locRowIconBox,
                                {
                                  backgroundColor: isSelected
                                    ? colors.primary
                                    : colors.surface,
                                },
                              ]}
                            >
                              <Ionicons
                                name="business"
                                size={16}
                                color={
                                  isSelected ? '#ffffff' : colors.secondary
                                }
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  styles.locRowTitle,
                                  {
                                    color: isSelected
                                      ? colors.primary
                                      : colors.text,
                                  },
                                ]}
                              >
                                {language === 'gu'
                                  ? taluka.name_gu
                                  : taluka.name_en || taluka.name_gu}
                              </Text>
                              <Text
                                style={[
                                  styles.locRowSub,
                                  { color: colors.textMuted },
                                ]}
                              >
                                {language === 'gu'
                                  ? `${taluka.name_en || ''} • ${
                                      taluka.villages?.length || 0
                                    } ગામ`
                                  : `${taluka.name_gu} • ${
                                      taluka.villages?.length || 0
                                    } Villages`}
                              </Text>
                            </View>
                            {isSelected && (
                              <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color={colors.primary}
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })
                  )}
                </View>
              )}

              {/* Tab 3: Village Listing */}
              {locationTab === 'village' && (
                <View>
                  {!talukaId ? (
                    <View style={styles.emptyStateBox}>
                      <Ionicons
                        name="alert-circle-outline"
                        size={32}
                        color={colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.emptyStateText,
                          { color: colors.textMuted },
                        ]}
                      >
                        {language === 'gu'
                          ? 'કૃપા કરીને પહેલા તાલુકો પસંદ કરો.'
                          : 'Please select a Taluka first.'}
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          setLocationTab(districtId ? 'taluka' : 'district')
                        }
                        style={[
                          styles.emptyStateActionBtn,
                          { backgroundColor: colors.primaryContainer },
                        ]}
                      >
                        <Text
                          style={[
                            styles.emptyStateActionText,
                            { color: colors.primary },
                          ]}
                        >
                          {language === 'gu'
                            ? 'તાલુકો પસંદ કરો'
                            : 'Select Taluka'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : availableVillages.length === 0 ? (
                    <View style={styles.emptyStateBox}>
                      <Ionicons
                        name="information-circle-outline"
                        size={32}
                        color={colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.emptyStateText,
                          { color: colors.textMuted },
                        ]}
                      >
                        {language === 'gu'
                          ? 'આ તાલુકામાં ગામની યાદી લોડ થઈ નથી. કૃપા કરીને નીચે સરનામું લખો.'
                          : 'No pre-seeded villages found for this taluka. Enter your village in the address box.'}
                      </Text>
                    </View>
                  ) : (
                    availableVillages
                      .filter(v => {
                        if (!locationSearch.trim()) return true;
                        const q = locationSearch.trim().toLowerCase();
                        return (
                          v.name_gu.toLowerCase().includes(q) ||
                          (v.name_en && v.name_en.toLowerCase().includes(q))
                        );
                      })
                      .map(village => {
                        const isSelected = villageId === village.id;
                        return (
                          <TouchableOpacity
                            key={village.id}
                            onPress={() => handleSelectVillage(village)}
                            style={[
                              styles.locRowItem,
                              {
                                backgroundColor: isSelected
                                  ? colors.primaryContainer
                                  : colors.surfaceSubtle,
                                borderColor: isSelected
                                  ? colors.primary
                                  : colors.border,
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.locRowIconBox,
                                {
                                  backgroundColor: isSelected
                                    ? colors.primary
                                    : colors.surface,
                                },
                              ]}
                            >
                              <Ionicons
                                name="home"
                                size={16}
                                color={isSelected ? '#ffffff' : colors.primary}
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  styles.locRowTitle,
                                  {
                                    color: isSelected
                                      ? colors.primary
                                      : colors.text,
                                  },
                                ]}
                              >
                                {language === 'gu'
                                  ? village.name_gu
                                  : village.name_en || village.name_gu}
                              </Text>
                              {village.name_en ? (
                                <Text
                                  style={[
                                    styles.locRowSub,
                                    { color: colors.textMuted },
                                  ]}
                                >
                                  {language === 'gu'
                                    ? village.name_en
                                    : village.name_gu}
                                </Text>
                              ) : null}
                            </View>
                            {isSelected && (
                              <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color={colors.primary}
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })
                  )}
                </View>
              )}
            </ScrollView>

            {/* Bottom Done Button */}
            <TouchableOpacity
              onPress={() => setShowLocationModal(false)}
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.doneBtnText}>
                {language === 'gu' ? 'પૂર્ણ / થઈ ગયું' : 'Done / Confirm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 10 },
  logoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoText: { fontWeight: '900', fontSize: 13 },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  headerSub: { fontSize: 11, fontWeight: '600' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langPill: { flexDirection: 'row', borderRadius: 20, padding: 3 },
  langTab: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 16 },
  langText: { fontSize: 12, fontWeight: '700' },
  settingsBtn: { padding: 4 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  heroCenterCol: { alignItems: 'center' },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  avatarCircleLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImageLarge: { width: 88, height: 88, borderRadius: 44 },
  avatarUploadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextLarge: { fontSize: 36, fontWeight: '800' },
  cameraBadgeBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  nameTitle: { fontSize: 19, fontWeight: '800' },
  nameGu: { fontSize: 13, marginBottom: 8 },
  badgeChipsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  chipPillText: { fontSize: 12, fontWeight: '600' },
  trustIndicatorsGrid: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
  },
  trustCol: { flex: 1, alignItems: 'center' },
  trustLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  trustValRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustVal: { fontSize: 12, fontWeight: '700' },
  dotAmber: { width: 6, height: 6, borderRadius: 3 },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 6,
  },
  titleBarIndicator: { width: 4, height: 18, borderRadius: 2 },
  sectionTitleH2: { fontSize: 16, fontWeight: '800' },
  sectionTitleSub: { fontSize: 13, fontWeight: '600' },
  nameInputsGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  inputFieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  textInputStyle: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  fieldHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  verifiedTagRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  verifiedTagText: { fontSize: 11, fontWeight: '700' },
  lockedInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 10,
  },
  lockedInputText: { fontSize: 14, fontWeight: '600', flex: 1 },
  genderOptionsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  genderTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 40,
    borderRadius: 10,
  },
  genderTabText: { fontSize: 12, fontWeight: '700' },
  iconInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  inlineInput: { flex: 1, height: 44, fontSize: 14, fontWeight: '600' },
  bloodValueText: { fontSize: 14, fontWeight: '700' },
  villageInfoBox: { borderRadius: 12, padding: 12 },
  villageHeaderRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  cottageIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  villageTitle: { fontSize: 14, fontWeight: '700' },
  villageSub: { fontSize: 12, marginTop: 2 },
  changeLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  changeLocationText: { fontSize: 11, fontWeight: '700' },
  locationSelectorsContainer: { marginTop: 12 },
  selectorInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  selectorValueText: { fontSize: 14, fontWeight: '700', flex: 1 },
  toggleCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  toggleIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTitle: { fontSize: 14, fontWeight: '700' },
  toggleSub: { fontSize: 11, marginTop: 2 },
  toggleSubGu: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  customToggleBox: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  customToggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  customToggleKnobActive: { alignSelf: 'flex-end' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
    marginTop: 4,
    marginBottom: 12,
    elevation: 2,
  },
  saveBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 14,
  },
  logoutText: { fontSize: 14, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalOverlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bloodModalContent: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitleText: { fontSize: 16, fontWeight: '800' },
  modalSubtitleText: { fontSize: 12, marginBottom: 14 },
  bloodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bloodItemBtn: {
    width: '48%',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 10,
  },
  bloodItemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bloodCodeText: { fontSize: 18, fontWeight: '900' },
  bloodGuText: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  bloodNoteText: { fontSize: 10, marginTop: 2 },
  photoSheetContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800' },
  sheetSub: { fontSize: 13, marginTop: 2, marginBottom: 18 },
  sheetActionRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  sheetActionBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
  },
  sheetActionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sheetActionLabel: { fontSize: 14, fontWeight: '800' },
  sheetActionSub: { fontSize: 11, marginTop: 2 },
  presetSectionTitle: { fontSize: 12, fontWeight: '700', marginBottom: 10 },
  presetAvatarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  presetAvatarBtn: {
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  presetAvatarImg: { width: 56, height: 56 },
  removePhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginBottom: 8,
  },
  removePhotoText: { fontSize: 14, fontWeight: '700' },
  cancelModalBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalText: { fontSize: 14, fontWeight: '700' },
  locationModalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  locTabNav: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  locTabBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  locTabTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  locTabSubtitle: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  locSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 10,
    paddingHorizontal: 10,
    gap: 8,
    marginBottom: 12,
  },
  locSearchInput: {
    flex: 1,
    height: 42,
    fontSize: 13,
    fontWeight: '600',
  },
  locListScroll: {
    maxHeight: 280,
  },
  locRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    gap: 10,
  },
  locRowIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locRowTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  locRowSub: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  emptyStateText: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  emptyStateActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  emptyStateActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  doneBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 14,
  },
  gpsDetectTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  gpsDetectSub: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  gpsDetectBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
