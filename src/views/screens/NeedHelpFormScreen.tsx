import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { applicationService } from '../../services/applicationService';
import { demographicsService } from '../../services/demographicsService';
import { captureLocation } from '../../services/deviceCapture';
import {
  captureFromCamera,
  pickFromGallery,
} from '../../services/imagePickerService';
import { District } from '../../models/demographics.model';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { configService } from '../../services/configService';
import { CanopyHeader } from '../components/CanopyHeader';

interface Props {
  moduleSlug?: string | null;
  moduleTitle?: string | null;
  onCancel: () => void;
  onSubmitted: (caseNo: string) => void;
  onChangeSector: () => void;
}

export const NeedHelpFormScreen: React.FC<Props> = ({
  moduleSlug,
  moduleTitle,
  onCancel,
  onSubmitted,
  onChangeSector,
}) => {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || 'Rajeshkumar D. Patel');
  const [editingName, setEditingName] = useState(false);

  // Dynamic Demographics Master Data State
  const [districtsList, setDistrictsList] = useState<District[]>([]);
  const [districtId, setDistrictId] = useState<number | null>(
    user?.district_id || user?.district?.id || null,
  );
  const [talukaId, setTalukaId] = useState<number | null>(
    user?.taluka_id || user?.taluka?.id || null,
  );
  const [villageId, setVillageId] = useState<number | null>(
    user?.village_id || user?.village?.id || null,
  );
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationTab, setLocationTab] = useState<
    'district' | 'taluka' | 'village'
  >('district');
  const [locationSearch, setLocationSearch] = useState('');

  const [message, setMessage] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [locating, setLocating] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // Document attachments state
  const [docs, setDocs] = useState<
    Array<{
      name: string;
      uri: string;
      type: string;
      size: string;
      base64?: string;
      path?: string;
    }>
  >([
    {
      name: 'Identity_Proof_Front.pdf',
      uri: '',
      type: 'application/pdf',
      size: '1.4 MB',
    },
    {
      name: 'Income_Cert_2024.jpg',
      uri: '',
      type: 'image/jpeg',
      size: '840 KB',
    },
  ]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [showDocPickerModal, setShowDocPickerModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sectorTitle, setSectorTitle] = useState(
    moduleTitle || 'Government Schemes',
  );
  const [registeredCaseNo, setRegisteredCaseNo] = useState<string | null>(null);

  // Load master districts list
  useEffect(() => {
    demographicsService
      .getDistricts()
      .then(dists => {
        if (dists && dists.length > 0) {
          setDistrictsList(dists);
          if (!districtId) {
            const navsari = dists.find(d =>
              d.name_en?.toLowerCase().includes('navsari'),
            );
            if (navsari) {
              setDistrictId(navsari.id);
            } else {
              setDistrictId(dists[0].id);
            }
          }
        }
      })
      .catch(err => {
        console.warn('Failed to load districts in NeedHelpFormScreen:', err);
      });
  }, [districtId]);

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

  const locationDisplayText = useMemo(() => {
    const parts: string[] = [];
    if (selectedVillage) {
      parts.push(
        language === 'gu'
          ? selectedVillage.name_gu
          : selectedVillage.name_en || selectedVillage.name_gu,
      );
    }
    if (selectedTaluka) {
      parts.push(
        language === 'gu'
          ? selectedTaluka.name_gu
          : selectedTaluka.name_en || selectedTaluka.name_gu,
      );
    }
    if (selectedDistrict) {
      parts.push(
        language === 'gu'
          ? selectedDistrict.name_gu
          : selectedDistrict.name_en || selectedDistrict.name_gu,
      );
    }
    if (parts.length > 0) {
      return parts.join(', ');
    }
    return language === 'gu' ? 'ચીખલી, નવસારી' : 'Chikhli, Navsari';
  }, [selectedVillage, selectedTaluka, selectedDistrict, language]);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  useEffect(() => {
    if (moduleTitle) {
      setSectorTitle(moduleTitle);
    } else if (moduleSlug) {
      configService.getModules().then(list => {
        const found = list.find(item => item.slug === moduleSlug);
        if (found) {
          setSectorTitle(found.title);
        }
      });
    }
  }, [moduleSlug, moduleTitle]);

  /**
   * GPS Auto-Detect with Nearest Master Data Assignment
   */
  const detectGPS = async () => {
    setLocating(true);
    try {
      const pos = await captureLocation();
      if (!pos) {
        showToast(
          language === 'gu'
            ? 'GPS અક્ષ્ય નહીં. ભૌગોલિક સ્થાન ચાલુ છે?'
            : 'Allow location permission or select from location list.',
          'warning',
          language === 'gu' ? 'GPS અનુપલબ્ધ' : 'Location unavailable',
        );
        return;
      }
      setLat(pos.lat);
      setLng(pos.lng);

      // Fetch nearest village from backend master API
      const nearest = await demographicsService.getNearestLocation(
        pos.lat,
        pos.lng,
      );
      if (nearest) {
        if (nearest.district) {
          setDistrictId(nearest.district.id);
        }
        if (nearest.taluka) {
          setTalukaId(nearest.taluka.id);
        }
        if (nearest.village) {
          setVillageId(nearest.village.id);
        }

        const vName =
          language === 'gu'
            ? nearest.village.name_gu
            : nearest.village.name_en || nearest.village.name_gu;
        const tName = nearest.taluka
          ? language === 'gu'
            ? nearest.taluka.name_gu
            : nearest.taluka.name_en || nearest.taluka.name_gu
          : '';
        const distKm = nearest.distance_km;

        showToast(
          language === 'gu'
            ? `નજીકનું સ્થળ: ${vName}${
                tName ? ', ' + tName : ''
              } (${distKm} km)`
            : `Nearest location: ${vName}${
                tName ? ', ' + tName : ''
              } (${distKm} km away)`,
          'success',
          language === 'gu' ? 'GPS સ્થળ મળ્યું' : 'Location Assigned',
        );
      } else {
        showToast(
          language === 'gu'
            ? 'GPS સ્થાન નોંધાયું.'
            : 'GPS coordinates recorded.',
          'info',
        );
      }
    } catch {
      showToast(
        language === 'gu'
          ? 'GPS મેળવી શકાયું નહીં.'
          : 'Failed to detect location.',
        'error',
      );
    } finally {
      setLocating(false);
    }
  };

  const speech = useSpeechToText({
    locale: language === 'gu' ? 'gu-IN' : 'en-IN',
    onPartialResult: text => {
      // Live update the field while speaking — replace last partial segment
      if (text) {
        setMessage(prev => {
          const sentinel = '\u200B'; // zero-width space as session separator
          const lastSep = prev.lastIndexOf(sentinel);
          if (lastSep !== -1) {
            return prev.slice(0, lastSep) + sentinel + text;
          }
          return (prev ? prev + sentinel : sentinel) + text;
        });
      }
    },
    onFinalResult: _text => {
      // Native module committed the final result — clean up sentinels
      setMessage(prev =>
        prev
          .replace(/\u200B/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim(),
      );
    },
  });

  // When the user taps Stop, stop recognizer and clean up sentinels
  const toggleSpeech = async () => {
    if (speech.listening) {
      await speech.stop();
      setMessage(prev =>
        prev
          .replace(/\u200B/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim(),
      );
    } else {
      // Mark where the new session starts so partials don't replace earlier text
      setMessage(prev => (prev ? prev + ' ' : ''));
      await speech.start();
    }
  };

  const handleAddDocumentFromCamera = async () => {
    setShowDocPickerModal(false);
    try {
      const media = await captureFromCamera();
      if (!media) return;

      setUploadingDoc(true);
      let serverPath = '';
      if (media.base64) {
        try {
          const res = await applicationService.uploadFile({
            file_base64: media.base64,
            file_name: media.fileName,
            type: 'required_doc',
          });
          if (res.data?.path) {
            serverPath = res.data.path;
          }
        } catch (e) {
          console.warn('Direct upload fallback to inline base64:', e);
        }
      }

      setDocs(prev => [
        ...prev,
        {
          name: media.fileName,
          uri: media.uri,
          type: media.type,
          size: media.formattedSize,
          base64: media.base64,
          path: serverPath,
        },
      ]);
      showToast(
        language === 'gu'
          ? 'દસ્તાવેજ સફળતાપૂર્વક ઉમેરાયો.'
          : 'Document attached successfully.',
        'success',
      );
    } catch {
      showToast(
        language === 'gu' ? 'ફોટો લઈ શકાયો નહીં.' : 'Failed to capture photo.',
        'error',
      );
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleAddDocumentFromGallery = async () => {
    setShowDocPickerModal(false);
    try {
      const media = await pickFromGallery();
      if (!media) return;

      setUploadingDoc(true);
      let serverPath = '';
      if (media.base64) {
        try {
          const res = await applicationService.uploadFile({
            file_base64: media.base64,
            file_name: media.fileName,
            type: 'required_doc',
          });
          if (res.data?.path) {
            serverPath = res.data.path;
          }
        } catch (e) {
          console.warn('Direct upload fallback to inline base64:', e);
        }
      }

      setDocs(prev => [
        ...prev,
        {
          name: media.fileName,
          uri: media.uri,
          type: media.type,
          size: media.formattedSize,
          base64: media.base64,
          path: serverPath,
        },
      ]);
      showToast(
        language === 'gu'
          ? 'દસ્તાવેજ સફળતાપૂર્વક ઉમેરાયો.'
          : 'Document attached successfully.',
        'success',
      );
    } catch {
      showToast(
        language === 'gu'
          ? 'દસ્તાવેજ પસંદ કરી શકાયો નહીં.'
          : 'Failed to pick document from gallery.',
        'error',
      );
    } finally {
      setUploadingDoc(false);
    }
  };

  const removeDoc = (index: number) => {
    setDocs(prev => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (message.trim().length < 5) {
      showToast(
        t(
          'stitch.form.describe_need',
          'Please describe the assistance you need in detail.',
        ),
        'warning',
        t('stitch.form.validation_error', 'Information Missing'),
      );
      return;
    }
    setBusy(true);
    try {
      const app = await applicationService.createApplication({
        module: moduleSlug || undefined,
        title: sectorTitle || 'Assistance Request',
        description: message.trim(),
        urgency: isUrgent ? 'urgent' : 'medium',
        name: name.trim(),
        email: user?.email || undefined,
        phone: user?.phone || undefined,
        district_id: districtId || undefined,
        taluka_id: talukaId || undefined,
        village_id: villageId || undefined,
        lat: lat || undefined,
        lng: lng || undefined,
        documents: docs.map(d => ({
          document_type: 'required_doc',
          file_path: d.path || d.name,
          original_name: d.name,
          type: 'required_doc',
          path: d.path || d.name,
          name: d.name,
          base64: d.base64,
          size: d.size,
        })),
      });
      setRegisteredCaseNo(app.case_no);
      showToast(
        language === 'gu'
          ? `તમારી સહાય અરજી ક્રમાંક #${app.case_no} સફળતાપૂર્વક નોંધાઈ છે.`
          : `Assistance request registered successfully as #${app.case_no}`,
        'success',
        language === 'gu' ? 'અરજી સફળ' : 'Request Registered',
      );
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'Please check connection and try again.',
        'error',
        t('form.submit_failed', 'Submission failed'),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <CanopyHeader
        title={language === 'gu' ? 'નવી સહાય અરજી' : 'New Aid Application'}
        subtitle={
          language === 'gu' ? 'સહાય અરજી પત્રક' : 'Welfare Application Form'
        }
        onBack={onCancel}
        avatarLetter={
          name
            ? name.charAt(0)
            : user?.first_name?.charAt(0) || user?.name?.charAt(0) || 'U'
        }
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { flexGrow: 1, paddingBottom: 220 },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
        >
          {/* Subtle Tree Canopy Decorative Banner */}
          <View style={styles.brandBanner}>
            <View style={styles.brandLeft}>
              <View
                style={[
                  styles.brandIcon,
                  { backgroundColor: colors.surfaceSubtle },
                ]}
              >
                <Ionicons name="people" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.brandOrg, { color: colors.secondary }]}>
                  THE HELPING HANDS (THH)
                </Text>
                <Text style={[styles.brandSub, { color: colors.textMuted }]}>
                  {language === 'gu' ? 'સહાય વિનંતી કેન્દ્ર' : 'Welfare Portal'}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.onlineBadge,
                { backgroundColor: colors.surfaceSubtle },
              ]}
            >
              <View
                style={[styles.pulseDot, { backgroundColor: colors.primary }]}
              />
              <Text style={[styles.onlineText, { color: colors.text }]}>
                {language === 'gu' ? 'તાલુકો ઓનલાઇન' : 'Taluka Online'}
              </Text>
            </View>
          </View>

          {/* 1. Category Selector Card */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.sectorRow}>
              <View style={styles.sectorLeft}>
                <View
                  style={[
                    styles.sectorIconBox,
                    { backgroundColor: colors.primaryContainer },
                  ]}
                >
                  <Ionicons
                    name="business"
                    size={24}
                    color={colors.onPrimaryContainer}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.sectorBadge,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Text style={styles.sectorBadgeText}>
                        {language === 'gu' ? 'સહાય ક્ષેત્ર' : 'Active Sector'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.sectorTitle, { color: colors.text }]}>
                    {sectorTitle}
                  </Text>
                  <Text style={[styles.sectorSub, { color: colors.textMuted }]}>
                    {moduleSlug ||
                      (language === 'gu'
                        ? 'આવાસ યોજના'
                        : 'Awas & Housing Yojana')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={onChangeSector}
                style={[
                  styles.changeBtn,
                  { backgroundColor: colors.surfaceSubtle },
                ]}
              >
                <Text style={[styles.changeBtnText, { color: colors.primary }]}>
                  {language === 'gu' ? 'બદલો' : 'Change'}
                </Text>
                <Ionicons
                  name="swap-horizontal"
                  size={16}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. Prefilled Verified Applicant Details */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View
              style={[styles.accentBar, { backgroundColor: colors.primary }]}
            />
            <View style={styles.cardHeaderRow}>
              <View style={styles.verifiedTitleRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>
                  {language === 'gu' ? 'અરજદાર માહિતી' : 'Applicant Profile'}
                </Text>
              </View>
              <View
                style={[
                  styles.memberPill,
                  { backgroundColor: colors.primaryContainer },
                ]}
              >
                <Text
                  style={[
                    styles.memberPillText,
                    { color: colors.onPrimaryContainer },
                  ]}
                >
                  {language === 'gu' ? 'સભ્ય' : 'THH Member'}
                </Text>
              </View>
            </View>

            {/* Full Name Box with Edit */}
            <View
              style={[
                styles.fieldRowBox,
                { backgroundColor: colors.surfaceSubtle },
              ]}
            >
              <Ionicons
                name="person-circle-outline"
                size={24}
                color={colors.secondary}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                  {language === 'gu' ? 'પૂરું કાનૂની નામ' : 'Full Legal Name'}
                </Text>
                <TextInput
                  editable={editingName}
                  value={name}
                  onChangeText={setName}
                  style={[
                    styles.fieldInput,
                    { color: colors.text },
                    editingName && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.primary,
                    },
                  ]}
                />
              </View>
              <TouchableOpacity
                onPress={() => setEditingName(prev => !prev)}
                style={[
                  styles.editIconBtn,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Ionicons
                  name={editingName ? 'checkmark' : 'create-outline'}
                  size={18}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            {/* Contact Grid */}
            <View style={styles.contactGrid}>
              <View
                style={[
                  styles.contactBox,
                  { backgroundColor: colors.surfaceSubtle },
                ]}
              >
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={colors.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <View style={styles.lockedRow}>
                    <Text
                      style={[styles.contactLabel, { color: colors.textMuted }]}
                    >
                      {language === 'gu' ? 'મોબાઇલ' : 'Mobile'}
                    </Text>
                    <Ionicons
                      name="lock-closed"
                      size={11}
                      color={colors.textMuted}
                    />
                  </View>
                  <Text style={[styles.contactValue, { color: colors.text }]}>
                    {user?.phone || '+91 98251 44320'}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.contactBox,
                  { backgroundColor: colors.surfaceSubtle },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={colors.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <View style={styles.lockedRow}>
                    <Text
                      style={[styles.contactLabel, { color: colors.textMuted }]}
                    >
                      {language === 'gu' ? 'ઈમેલ' : 'Email'}
                    </Text>
                    <Ionicons
                      name="lock-closed"
                      size={11}
                      color={colors.textMuted}
                    />
                  </View>
                  <Text
                    style={[styles.contactValue, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {user?.email || 'rajesh.patel@gramin.in'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 3. Location & Origin Section */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.verifiedTitleRow}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>
                  {language === 'gu' ? 'સ્થળ અને તાલુકો' : 'Location & Taluka'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={detectGPS}
                disabled={locating}
                style={[
                  styles.gpsDetectBtn,
                  { backgroundColor: colors.primaryContainer },
                ]}
              >
                {locating ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.onPrimaryContainer}
                  />
                ) : (
                  <Ionicons
                    name="locate"
                    size={16}
                    color={colors.onPrimaryContainer}
                  />
                )}
                <Text
                  style={[
                    styles.gpsBtnText,
                    { color: colors.onPrimaryContainer },
                  ]}
                >
                  {lat && lng
                    ? `${lat.toFixed(3)}, ${lng.toFixed(3)}`
                    : language === 'gu'
                    ? 'GPS મેળવો'
                    : 'Detect GPS'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
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
                styles.talukaSelect,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text
                  style={[styles.talukaSelectText, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {locationDisplayText}
                </Text>
                {Boolean(selectedVillage?.pincode) && (
                  <Text
                    style={{
                      fontSize: 13,
                      color: colors.textMuted,
                      marginTop: 2,
                    }}
                  >
                    {language === 'gu' ? 'પિનકોડ:' : 'Pincode:'}{' '}
                    {selectedVillage?.pincode}
                  </Text>
                )}
              </View>
              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* 4. Need Description with Voice Dictation */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.verifiedTitleRow}>
                <Ionicons
                  name="document-text"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>
                  {language === 'gu' ? 'સહાયની વિગત' : 'Assistance Needed'}
                </Text>
              </View>
              <Text style={[styles.langTag, { color: colors.textMuted }]}>
                {language === 'gu' ? 'ગુજરાતી' : 'English'}
              </Text>
            </View>

            <View
              style={[
                styles.textareaBox,
                { backgroundColor: colors.surfaceSubtle },
              ]}
            >
              <TextInput
                multiline
                numberOfLines={4}
                value={message}
                onChangeText={setMessage}
                maxLength={500}
                placeholder={
                  language === 'gu'
                    ? 'અહીં તમારી મુશ્કેલી અથવા યોજના સહાયની જરૂરિયાત વિગતવાર જણાવો...'
                    : 'Describe what assistance or problem you need help with in detail...'
                }
                placeholderTextColor={colors.textMuted}
                style={[styles.textarea, { color: colors.text }]}
              />

              <View style={styles.micActionBar}>
                <TouchableOpacity
                  onPress={toggleSpeech}
                  activeOpacity={0.8}
                  style={[
                    styles.micBtn,
                    {
                      backgroundColor: speech.listening
                        ? '#DC2626'
                        : colors.primary,
                    },
                  ]}
                >
                  <Ionicons
                    name={speech.listening ? 'mic' : 'mic-outline'}
                    size={18}
                    color="#ffffff"
                  />
                  <Text style={styles.micBtnText}>
                    {speech.listening
                      ? language === 'gu'
                        ? 'સાંભળી રહ્યું છે...'
                        : 'Listening...'
                      : language === 'gu'
                      ? 'બોલવા માટે ટેપ કરો'
                      : 'Tap to Speak'}
                  </Text>
                  {speech.listening && <View style={styles.listeningDot} />}
                </TouchableOpacity>
                <Text style={[styles.charCounter, { color: colors.textMuted }]}>
                  {message.replace(/\u200B/g, '').length}/500
                </Text>
              </View>
            </View>

            <View style={styles.dictationNote}>
              <Ionicons
                name="volume-medium-outline"
                size={16}
                color={colors.secondary}
              />
              <Text
                style={[styles.dictationNoteText, { color: colors.textMuted }]}
              >
                {language === 'gu'
                  ? 'ગુજરાતી અને અંગ્રેજી બોલવાનું સ્વતઃ લખાણમાં રૂપાંતરિત થાય છે.'
                  : 'Supports Gujarati and English speech auto-transcription.'}
              </Text>
            </View>
          </View>

          {/* 5. Required Documents Section */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.verifiedTitleRow}>
                <Ionicons name="folder-open" size={20} color={colors.primary} />
                <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>
                  {language === 'gu' ? 'પુરાવા દસ્તાવેજ' : 'Required Documents'}
                </Text>
              </View>
              <Text style={[styles.docCountBadge, { color: colors.primary }]}>
                {docs.length} {language === 'gu' ? 'જોડાયેલ' : 'Attached'}
              </Text>
            </View>

            {/* Upload trigger button */}
            <TouchableOpacity
              onPress={() => setShowDocPickerModal(true)}
              disabled={uploadingDoc}
              style={[
                styles.uploadBox,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.border,
                },
              ]}
            >
              <View
                style={[styles.cloudIcon, { backgroundColor: colors.surface }]}
              >
                {uploadingDoc ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons
                    name="cloud-upload"
                    size={24}
                    color={colors.primary}
                  />
                )}
              </View>
              <Text style={[styles.uploadTitle, { color: colors.text }]}>
                {language === 'gu'
                  ? 'ઓળખ પુરાવો, રેશન કાર્ડ અથવા આવક દાખલો ઉમેરો'
                  : 'Tap to add Identity Proof, Ration Card, or Income Proof'}
              </Text>
              <Text style={[styles.uploadSub, { color: colors.textMuted }]}>
                {uploadingDoc
                  ? language === 'gu'
                    ? 'અપલોડ થઈ રહ્યું છે...'
                    : 'Uploading document...'
                  : language === 'gu'
                  ? 'કેમેરા અથવા ગેલેરીમાંથી ફોટો/દસ્તાવેજ પસંદ કરો'
                  : 'Choose from Camera or Gallery'}
              </Text>
            </TouchableOpacity>

            {/* Attached documents list */}
            <View style={styles.docList}>
              {docs.map((doc, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.docChip,
                    { backgroundColor: colors.surfaceSubtle },
                  ]}
                >
                  <View style={styles.docLeft}>
                    <View
                      style={[
                        styles.docIconSquare,
                        { backgroundColor: colors.primaryContainer },
                      ]}
                    >
                      <Ionicons
                        name={doc.name.endsWith('.pdf') ? 'document' : 'image'}
                        size={18}
                        color={colors.onPrimaryContainer}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.docName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {doc.name}
                      </Text>
                      <Text
                        style={[styles.docMeta, { color: colors.textMuted }]}
                      >
                        {doc.size} •{' '}
                        {language === 'gu'
                          ? 'ચકાસાયેલ ઓળખકાર્ડ'
                          : 'Verified Citizen ID'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeDoc(idx)}
                    style={styles.docCancelBtn}
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* 6. Urgent Priority Emergency Toggle */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.urgentRow}>
              <View
                style={[
                  styles.urgentIconBox,
                  { backgroundColor: colors.errorContainer },
                ]}
              >
                <Ionicons name="warning" size={22} color={colors.error} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.urgentTitle, { color: colors.text }]}>
                  {language === 'gu'
                    ? 'અતિ મહત્વપૂર્ણ પ્રાથમિકતા'
                    : 'Mark as Urgent Priority'}
                </Text>
                <Text style={[styles.urgentSub, { color: colors.textMuted }]}>
                  {language === 'gu'
                    ? 'જો ગંભીર તબીબી કટોકટી કે તાત્કાલિક જોખમ હોય તો પસંદ કરો.'
                    : 'Check if this is an emergency medical risk, sudden roof collapse, or critical crisis.'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsUrgent(prev => !prev)}
                style={[
                  styles.customToggle,
                  {
                    backgroundColor: isUrgent
                      ? colors.error
                      : colors.surfaceSubtle,
                  },
                ]}
              >
                <View
                  style={[
                    styles.toggleKnob,
                    isUrgent && styles.toggleKnobActive,
                    { backgroundColor: '#ffffff' },
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* 7. Community Care Promise Note */}
          <View style={styles.promiseBox}>
            <Ionicons name="leaf" size={18} color={colors.primary} />
            <Text style={[styles.promiseText, { color: colors.textMuted }]}>
              {language === 'gu'
                ? 'THH 48 કલાકની અંદર પરિવારોને ચકાસાયેલ ગ્રામ સેવકો અને પંચાયત અધિકારીઓ સાથે જોડે છે.'
                : 'THH connects families with verified village sevaks and panchayat officers within 48 hours.'}
            </Text>
          </View>
        </ScrollView>

        {/* Fixed Bottom Action Bar */}
        <View
          style={[
            styles.bottomBar,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          <TouchableOpacity
            disabled={busy}
            onPress={submit}
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
          >
            {busy ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#ffffff" />
                <Text style={styles.submitBtnText}>
                  {language === 'gu' ? 'અરજી મોકલો' : 'Submit Application'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          <View style={styles.securityStrip}>
            <Ionicons
              name="shield-checkmark"
              size={14}
              color={colors.primary}
            />
            <Text style={[styles.securityText, { color: colors.textMuted }]}>
              {language === 'gu'
                ? 'નવસારી તાલુકા ડેસ્ક પર સીધું મોકલાશે'
                : 'Directly dispatched to Navsari Taluka Desk'}
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Document Source Picker Modal (Camera vs Gallery) */}
      <Modal
        visible={showDocPickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDocPickerModal(false)}
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
              {language === 'gu' ? 'દસ્તાવેજ અપલોડ કરો' : 'Attach Document'}
            </Text>
            <Text style={[styles.sheetSub, { color: colors.textMuted }]}>
              {language === 'gu'
                ? 'ઓળખ પુરાવો અથવા રેશન કાર્ડ માટે સ્ત્રોત પસંદ કરો:'
                : 'Select source for ID proof, ration card, or certificate:'}
            </Text>

            <View style={styles.sheetActionRow}>
              <TouchableOpacity
                onPress={handleAddDocumentFromCamera}
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
                  <Ionicons name="camera" size={24} color="#ffffff" />
                </View>
                <Text
                  style={[styles.sheetActionBtnTitle, { color: colors.text }]}
                >
                  {language === 'gu' ? 'કેમેરાથી ફોટો' : 'Camera'}
                </Text>
                <Text
                  style={[
                    styles.sheetActionBtnSub,
                    { color: colors.textMuted },
                  ]}
                >
                  {language === 'gu' ? 'નવો ફોટો પાડો' : 'Take a photo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddDocumentFromGallery}
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
                  <Ionicons name="images" size={24} color="#ffffff" />
                </View>
                <Text
                  style={[styles.sheetActionBtnTitle, { color: colors.text }]}
                >
                  {language === 'gu' ? 'ગેલેરીમાંથી' : 'Gallery'}
                </Text>
                <Text
                  style={[
                    styles.sheetActionBtnSub,
                    { color: colors.textMuted },
                  ]}
                >
                  {language === 'gu' ? 'ફોટો પસંદ કરો' : 'Choose existing'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setShowDocPickerModal(false)}
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
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                    },
                  ]}
                >
                  <Ionicons name="location" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.modalTitleText, { color: colors.text }]}>
                  {language === 'gu'
                    ? 'સ્થળ અને ગામ પસંદ કરો'
                    : 'Select Location & Village'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* GPS Auto-Detect Button inside modal */}
            <TouchableOpacity
              onPress={detectGPS}
              disabled={locating}
              style={[
                styles.gpsModalShortcut,
                {
                  backgroundColor: colors.primaryContainer,
                  borderColor: colors.primary,
                },
              ]}
            >
              {locating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons
                  name="navigate-circle"
                  size={20}
                  color={colors.primary}
                />
              )}
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.gpsShortcutTitle, { color: colors.primary }]}
                >
                  {language === 'gu'
                    ? 'GPS દ્વારા આપમેળે શોધો'
                    : 'Detect via GPS automatically'}
                </Text>
                <Text
                  style={[styles.gpsShortcutSub, { color: colors.textMuted }]}
                >
                  {language === 'gu'
                    ? 'તમારા વર્તમાન સ્થાન પરથી નજીકનું ગામ મેળવશે'
                    : 'Assigns nearest village, taluka & district'}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </TouchableOpacity>

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
                    ? 'પસંદ કરો'
                    : 'Select'}
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
                    ? 'પસંદ કરો'
                    : 'Select'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View
              style={[
                styles.searchWrap,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                value={locationSearch}
                onChangeText={setLocationSearch}
                placeholder={
                  locationTab === 'district'
                    ? language === 'gu'
                      ? 'જિલ્લો શોધો...'
                      : 'Search district...'
                    : locationTab === 'taluka'
                    ? language === 'gu'
                      ? 'તાલુકો શોધો...'
                      : 'Search taluka...'
                    : language === 'gu'
                    ? 'ગામ અથવા શહેર શોધો...'
                    : 'Search village or city...'
                }
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.text }]}
              />
              {locationSearch.length > 0 && (
                <TouchableOpacity onPress={() => setLocationSearch('')}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Scrollable list */}
            <ScrollView
              style={{ maxHeight: 320 }}
              contentContainerStyle={{ paddingBottom: 16 }}
              keyboardShouldPersistTaps="handled"
            >
              {locationTab === 'district' &&
                districtsList
                  .filter(d => {
                    const q = locationSearch.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      d.name_en?.toLowerCase().includes(q) ||
                      d.name_gu?.toLowerCase().includes(q)
                    );
                  })
                  .map(dist => {
                    const isSelected = dist.id === districtId;
                    return (
                      <TouchableOpacity
                        key={dist.id}
                        onPress={() => {
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
                        }}
                        style={[
                          styles.locListItem,
                          {
                            backgroundColor: isSelected
                              ? colors.primaryContainer
                              : colors.surfaceSubtle,
                            borderColor: isSelected
                              ? colors.primary
                              : colors.borderSubtle,
                          },
                        ]}
                      >
                        <Ionicons
                          name="business-outline"
                          size={18}
                          color={isSelected ? colors.primary : colors.textMuted}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.locItemTitle,
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
                              styles.locItemSub,
                              { color: colors.textMuted },
                            ]}
                          >
                            {dist.talukas?.length || 0}{' '}
                            {language === 'gu' ? 'તાલુકા' : 'Talukas'}
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

              {locationTab === 'taluka' &&
                availableTalukas
                  .filter(te => {
                    const q = locationSearch.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      te.name_en?.toLowerCase().includes(q) ||
                      te.name_gu?.toLowerCase().includes(q)
                    );
                  })
                  .map(tal => {
                    const isSelected = tal.id === talukaId;
                    return (
                      <TouchableOpacity
                        key={tal.id}
                        onPress={() => {
                          setTalukaId(tal.id);
                          const vills = tal.villages || [];
                          if (!vills.some(v => v.id === villageId)) {
                            setVillageId(null);
                          }
                          setLocationSearch('');
                          if (vills.length > 0) {
                            setLocationTab('village');
                          }
                        }}
                        style={[
                          styles.locListItem,
                          {
                            backgroundColor: isSelected
                              ? colors.primaryContainer
                              : colors.surfaceSubtle,
                            borderColor: isSelected
                              ? colors.primary
                              : colors.borderSubtle,
                          },
                        ]}
                      >
                        <Ionicons
                          name="trail-sign-outline"
                          size={18}
                          color={isSelected ? colors.primary : colors.textMuted}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.locItemTitle,
                              {
                                color: isSelected
                                  ? colors.primary
                                  : colors.text,
                              },
                            ]}
                          >
                            {language === 'gu'
                              ? tal.name_gu
                              : tal.name_en || tal.name_gu}
                          </Text>
                          <Text
                            style={[
                              styles.locItemSub,
                              { color: colors.textMuted },
                            ]}
                          >
                            {tal.villages?.length || 0}{' '}
                            {language === 'gu' ? 'ગામ/શહેરો' : 'Villages/Towns'}
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

              {locationTab === 'village' &&
                availableVillages
                  .filter(v => {
                    const q = locationSearch.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      v.name_en?.toLowerCase().includes(q) ||
                      v.name_gu?.toLowerCase().includes(q) ||
                      v.pincode?.includes(q)
                    );
                  })
                  .map(vil => {
                    const isSelected = vil.id === villageId;
                    return (
                      <TouchableOpacity
                        key={vil.id}
                        onPress={() => {
                          setVillageId(vil.id);
                          setShowLocationModal(false);
                          showToast(
                            language === 'gu'
                              ? `ગામ "${vil.name_gu}" પસંદ કરાયું`
                              : `Village "${
                                  vil.name_en || vil.name_gu
                                }" selected`,
                            'info',
                          );
                        }}
                        style={[
                          styles.locListItem,
                          {
                            backgroundColor: isSelected
                              ? colors.primaryContainer
                              : colors.surfaceSubtle,
                            borderColor: isSelected
                              ? colors.primary
                              : colors.borderSubtle,
                          },
                        ]}
                      >
                        <Ionicons
                          name="home-outline"
                          size={18}
                          color={isSelected ? colors.primary : colors.textMuted}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.locItemTitle,
                              {
                                color: isSelected
                                  ? colors.primary
                                  : colors.text,
                              },
                            ]}
                          >
                            {language === 'gu'
                              ? vil.name_gu
                              : vil.name_en || vil.name_gu}
                          </Text>
                          {Boolean(vil.pincode) && (
                            <Text
                              style={[
                                styles.locItemSub,
                                { color: colors.textMuted },
                              ]}
                            >
                              {language === 'gu' ? 'પિનકોડ' : 'PIN'}:{' '}
                              {vil.pincode}
                            </Text>
                          )}
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
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Confirmation Toast Modal */}
      <Modal visible={!!registeredCaseNo} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View
            style={[styles.successCard, { backgroundColor: colors.surface }]}
          >
            <View
              style={[
                styles.successIconCircle,
                { backgroundColor: colors.primaryContainer },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={44}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.successTitle, { color: colors.text }]}>
              {language === 'gu'
                ? 'અરજી સફળતાપૂર્વક નોંધાઈ ગઈ છે!'
                : 'Application Registered!'}
            </Text>
            <Text style={[styles.successSub, { color: colors.secondary }]}>
              {language === 'gu'
                ? 'તમારો કેસ નોંધાઈ ગયો છે'
                : 'Your case has been logged'}
            </Text>
            <Text style={[styles.successBody, { color: colors.textMuted }]}>
              {language === 'gu'
                ? `ટ્રેકિંગ આઈડી: #${registeredCaseNo}. તમને ${
                    user?.phone || '+91 98251 44320'
                  } પર SMS મોકલવામાં આવશે.`
                : `Tracking ID: #${registeredCaseNo}. You will receive an SMS update on ${
                    user?.phone || '+91 98251 44320'
                  }.`}
            </Text>
            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                const cNo = registeredCaseNo;
                setRegisteredCaseNo(null);
                if (cNo) onSubmitted(cNo);
              }}
            >
              <Text style={styles.doneBtnText}>
                {language === 'gu' ? 'પૂર્ણ કરો' : 'Done'}
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 19, fontWeight: '700' },
  headerSubTitle: { fontSize: 13 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langPill: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 2,
  },
  langTab: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  langText: { fontSize: 13, fontWeight: '700' },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '800' },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 120 },
  brandBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandOrg: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8 },
  brandSub: { fontSize: 14 },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pulseDot: { width: 7, height: 7, borderRadius: 3.5 },
  onlineText: { fontSize: 13, fontWeight: '600' },
  card: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  accentBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  sectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sectorIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  sectorBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  sectorBadgeText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  sectorBadgeGu: { fontSize: 13, fontWeight: '600' },
  sectorTitle: { fontSize: 18, fontWeight: '700' },
  sectorSub: { fontSize: 14 },
  changeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeBtnText: { fontSize: 14, fontWeight: '700' },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verifiedTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardHeaderTitle: { fontSize: 16, fontWeight: '700' },
  memberPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  memberPillText: { fontSize: 12, fontWeight: '700' },
  fieldRowBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
  },
  fieldLabel: { fontSize: 13 },
  fieldInput: { fontSize: 16, fontWeight: '700', paddingVertical: 2 },
  editIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactGrid: { flexDirection: 'row', gap: 8 },
  contactBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  contactLabel: { fontSize: 12 },
  contactValue: { fontSize: 14, fontWeight: '700' },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  gpsBtnText: { fontSize: 13, fontWeight: '700' },
  talukaSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  talukaSelectText: { fontSize: 16, fontWeight: '600' },
  langTag: { fontSize: 13, fontWeight: '600' },
  textareaBox: { borderRadius: 10, padding: 10 },
  textarea: { minHeight: 90, textAlignVertical: 'top', fontSize: 16 },
  micActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  micBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  micBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  listeningDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    opacity: 0.85,
    marginLeft: 2,
  },
  charCounter: { fontSize: 13 },
  dictationNote: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dictationNoteText: { fontSize: 13 },
  docCountBadge: { fontSize: 14, fontWeight: '700' },
  uploadBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  cloudIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  uploadTitle: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  uploadSub: { fontSize: 13, textAlign: 'center', marginTop: 2 },
  docList: { gap: 8, marginTop: 4 },
  docChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 10,
  },
  docLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  docIconSquare: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: { fontSize: 15, fontWeight: '600' },
  docMeta: { fontSize: 13 },
  docCancelBtn: { padding: 4 },
  urgentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  urgentIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentTitle: { fontSize: 15, fontWeight: '700' },
  urgentSub: { fontSize: 13, marginTop: 2 },
  customToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  promiseBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  promiseText: { fontSize: 14, flex: 1 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
    alignItems: 'center',
  },
  submitBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  securityStrip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  securityText: { fontSize: 13, fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  talukaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  talukaItemText: { fontSize: 16, fontWeight: '600' },
  successCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  successSub: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  successBody: {
    fontSize: 15,
    textAlign: 'center',
    marginVertical: 6,
    lineHeight: 20,
  },
  doneBtn: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  doneBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  modalOverlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
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
  sheetTitle: { fontSize: 20, fontWeight: '800' },
  sheetSub: { fontSize: 15, marginTop: 2, marginBottom: 18 },
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
  sheetActionBtnTitle: { fontSize: 16, fontWeight: '800' },
  sheetActionBtnSub: { fontSize: 13, marginTop: 2 },
  cancelModalBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalText: { fontSize: 16, fontWeight: '700' },
  locationModalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cottageIconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitleText: { fontSize: 18, fontWeight: '800' },
  gpsModalShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  gpsShortcutTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  gpsShortcutSub: {
    fontSize: 13,
    marginTop: 2,
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
    fontSize: 14,
    fontWeight: '800',
  },
  locTabSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 15,
    fontWeight: '600',
  },
  locListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    gap: 10,
  },
  locItemTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  locItemSub: {
    fontSize: 13,
    marginTop: 2,
  },
});
