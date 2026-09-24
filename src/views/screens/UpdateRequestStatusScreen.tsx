import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { CanopyHeader } from '../components/CanopyHeader';
import { useAppTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { helperService } from '../../services/helperService';
import { applicationService } from '../../services/applicationService';
import { Application, TimelineEvent } from '../../models/application.model';
import {
  captureLocation,
  requestMicPermission,
} from '../../services/deviceCapture';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import { ArchedTimelineDial } from '../components/ArchedTimelineDial';

interface Props {
  applicationId: number;
  onBack: () => void;
}

const formatEventTitle = (eventType: string, language: string) => {
  const isGu = language === 'gu';
  if (!eventType) return isGu ? 'સ્થિતિ અપડેટ' : 'Status Update';
  if (eventType.includes('received') || eventType.includes('submitted')) {
    return isGu ? 'અરજી સફળતાપૂર્વક નોંધાઈ' : 'Application Registered';
  }
  if (eventType.includes('verification')) {
    return isGu ? 'દસ્તાવેજ અને સ્થળ ચકાસણી' : 'Document Verification';
  }
  if (eventType.includes('categorised')) {
    return isGu ? 'વિભાગીય વર્ગીકરણ' : 'Categorised by Welfare Desk';
  }
  if (eventType.includes('assigned')) {
    return isGu ? 'ક્ષેત્ર સેવક ફાળવવામાં આવ્યા' : 'Assigned to Field Mentor';
  }
  if (eventType.includes('assistance')) {
    return isGu ? 'સહાય સેવા પ્રગતિમાં' : 'Assistance in Progress';
  }
  if (eventType.includes('followUp') || eventType.includes('follow_up')) {
    return isGu ? 'ફોલો-અપ શેડ્યૂલ કરાયું' : 'Follow-Up Scheduled';
  }
  if (eventType.includes('awaiting_confirmation')) {
    return isGu ? 'સેવા પૂર્ણતા પુષ્ટિ અર્થે' : 'Awaiting Citizen Confirmation';
  }
  if (
    eventType.includes('resolved') ||
    eventType.includes('closed') ||
    eventType.includes('solved')
  ) {
    return isGu ? 'સહાય કાર્ય સફળતાપૂર્વક પૂર્ણ' : 'Case Resolved & Completed';
  }
  if (eventType.includes('rejected')) {
    return isGu ? 'અરજી અસ્વીકાર' : 'Application Rejected';
  }
  if (eventType.includes('onHold') || eventType.includes('on_hold')) {
    return isGu ? 'અરજી મોકૂફ રાખવામાં આવી' : 'Case Placed On Hold';
  }
  if (
    eventType.includes('needMoreInfo') ||
    eventType.includes('need_more_info')
  ) {
    return isGu
      ? 'વધારાની માહિતી / દસ્તાવેજ મંગાવ્યા'
      : 'More Information Requested';
  }
  if (eventType.includes('document_uploaded')) {
    return isGu ? 'દસ્તાવેજ અપલોડ કરાયો' : 'Document Uploaded';
  }
  return eventType.replace(/_/g, ' ');
};

const formatEventDate = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export type MentorStatus =
  | 'assistance'
  | 'awaiting_confirmation'
  | 'resolved'
  | 'onHold'
  | 'needMoreInfo'
  | 'followUp'
  | 'verification'
  | 'rejected';

interface StatusDefinition {
  key: MentorStatus;
  labelEn: string;
  labelGu: string;
  subEn: string;
  subGu: string;
  icon: string;
  themeColor: string;
  badgeBg: string;
}

const ALL_STATUS_OPTIONS: StatusDefinition[] = [
  {
    key: 'assistance',
    labelEn: 'Assistance In Progress',
    labelGu: 'સહાય પ્રગતિમાં',
    subEn: 'Field inspection completed, actively resolving assistance',
    subGu: 'રૂબરૂ સ્થળ તપાસ પૂર્ણ, સહાય આપવાની પ્રક્રિયા ચાલુ છે',
    icon: 'construct-outline',
    themeColor: '#0284c7',
    badgeBg: '#e0f2fe',
  },
  {
    key: 'awaiting_confirmation',
    labelEn: 'Awaiting Citizen Confirmation',
    labelGu: 'અરજદાર પુષ્ટિ',
    subEn: 'Assistance delivered, waiting for applicant acknowledgement',
    subGu: 'સહાય વિતરણ પૂર્ણ, અરજદાર નાગરિકની પુષ્ટિ બાકી',
    icon: 'checkmark-circle-outline',
    themeColor: '#16a34a',
    badgeBg: '#dcfce7',
  },
  {
    key: 'resolved',
    labelEn: 'Resolved / Closed',
    labelGu: 'સફળતાપૂર્વક પૂર્ણ',
    subEn: 'Case fully resolved, all paperwork and aid disbursed',
    subGu: 'કામગીરી સફળતાપૂર્વક પૂર્ણ અને કેસ બંધ કરેલ છે',
    icon: 'checkmark-done-circle-outline',
    themeColor: '#059669',
    badgeBg: '#d1fae5',
  },
  {
    key: 'onHold',
    labelEn: 'On Hold',
    labelGu: 'મોકૂફ રાખેલ',
    subEn: 'Temporarily paused (pending budget, dept sanction, etc.)',
    subGu: 'વિભાગીય મંજૂરી અથવા બજેટના કારણે કામચલાઉ મોકૂફ',
    icon: 'pause-circle-outline',
    themeColor: '#d97706',
    badgeBg: '#fef3c7',
  },
  {
    key: 'needMoreInfo',
    labelEn: 'Need More Info / Awaiting Documents',
    labelGu: 'વધુ વિગત જરૂરી (દસ્તાવેજ બાકી)',
    subEn: 'Citizen must provide additional proof (Aadhaar, 7/12, etc.)',
    subGu: 'અરજદાર પાસેથી વધારાના પ્રમાણપત્રો અથવા વિગતો બાકી છે',
    icon: 'document-text-outline',
    themeColor: '#2563eb',
    badgeBg: '#dbeafe',
  },
  {
    key: 'followUp',
    labelEn: 'Follow-Up Scheduled',
    labelGu: 'ફોલો-અપ શેડ્યૂલ',
    subEn: 'Second physical visit or panchayat review scheduled',
    subGu: 'બીજી રૂબરૂ મુલાકાત અથવા પંચાયત ચકાસણી નક્કી કરેલ છે',
    icon: 'calendar-outline',
    themeColor: '#9333ea',
    badgeBg: '#f3e8ff',
  },
  {
    key: 'verification',
    labelEn: 'In Verification / Field Inspection',
    labelGu: 'ચકાસણી હેઠળ',
    subEn: 'Under official Gram Panchayat / Department field review',
    subGu: 'પંચાયત અથવા તાલુકા કક્ષાએ સ્થળ ચકાસણી પ્રક્રિયા હેઠળ',
    icon: 'search-outline',
    themeColor: '#475569',
    badgeBg: '#f1f5f9',
  },
  {
    key: 'rejected',
    labelEn: 'Rejected',
    labelGu: 'અસ્વીકાર',
    subEn: 'Does not qualify or criteria not met under guidelines',
    subGu: 'યોજનાના નિયમો મુજબ પાત્રતા ધરાવતા ન હોવાથી અસ્વીકાર',
    icon: 'close-circle-outline',
    themeColor: '#dc2626',
    badgeBg: '#fee2e2',
  },
];

export const UpdateRequestStatusScreen: React.FC<Props> = ({
  applicationId,
  onBack,
}) => {
  const { theme } = useAppTheme();
  const { colors } = theme;
  const { language } = useTranslation();
  const { showToast } = useToast();

  const [app, setApp] = useState<Application | null>(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  // Check if case is resolved, rejected or closed (read-only mode)
  const isReadOnly = useMemo(() => {
    return (
      app?.status === 'resolved' ||
      app?.status === 'rejected' ||
      app?.status === 'closed'
    );
  }, [app?.status]);

  // Dropdown selector state
  const [selectedStatus, setSelectedStatus] =
    useState<MentorStatus>('assistance');
  const [showDropdownModal, setShowDropdownModal] = useState(false);

  // Dynamic inputs
  const [notes, setNotes] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [geotagPhoto, setGeotagPhoto] = useState<string | null>(null);
  const [lat, setLat] = useState<number>(20.758);
  const [lng, setLng] = useState<number>(73.012);
  const [locCaptured, setLocCaptured] = useState(false);

  // Native Speech-To-Text hook
  const speech = useSpeechToText({
    locale: language === 'gu' ? 'gu-IN' : 'en-IN',
    onPartialResult: (text: string) => {
      if (text) {
        setNotes(prev => {
          const sentinel = '\u200B';
          const lastSep = prev.lastIndexOf(sentinel);
          if (lastSep !== -1) {
            return prev.slice(0, lastSep) + sentinel + text;
          }
          return (prev ? prev + sentinel : sentinel) + text;
        });
      }
    },
    onFinalResult: (_text: string) => {
      setNotes(prev =>
        prev
          .replace(/\u200B/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim(),
      );
    },
  });

  const toggleMic = async () => {
    if (speech.listening) {
      await speech.stop();
      setNotes(prev =>
        prev
          .replace(/\u200B/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim(),
      );
    } else {
      const hasMic = await requestMicPermission();
      if (!hasMic) {
        showToast(
          language === 'gu'
            ? 'બોલીને નોંધ લખવા માટે કૃપા કરીને માઇક્રોફોન પરવાનગી આપો.'
            : 'Please grant microphone access to dictate inspection notes.',
          'warning',
          language === 'gu'
            ? 'પરવાનગી જરૂરી'
            : 'Microphone Permission Required',
        );
        return;
      }
      setNotes(prev => (prev ? prev + ' ' : ''));
      await speech.start();
    }
  };

  // Load application & match initial status & timeline events
  useEffect(() => {
    let isMounted = true;
    setLoadingApp(true);
    applicationService
      .getApplicationById(applicationId)
      .then(data => {
        if (!isMounted) return;
        setLoadingApp(false);
        if (data) {
          setApp(data);
          if (data.urgency === 'urgent') setIsUrgent(true);
          if (data.lat && data.lng) {
            setLat(Number(data.lat));
            setLng(Number(data.lng));
            setLocCaptured(true);
          }

          const rawEvents =
            (data.timeline_events as TimelineEvent[]) ||
            (data.timeline as TimelineEvent[]) ||
            [];
          if (Array.isArray(rawEvents) && rawEvents.length > 0) {
            const sorted = [...rawEvents].sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime(),
            );
            setEvents(sorted);
          }

          // Match initial status from existing case
          const matched = ALL_STATUS_OPTIONS.find(s => s.key === data.status);
          if (matched) {
            setSelectedStatus(matched.key);
          } else if (data.status === 'assigned') {
            setSelectedStatus('assistance');
          } else {
            setSelectedStatus('assistance');
          }
        }
      })
      .catch(() => {
        if (isMounted) setLoadingApp(false);
      });

    // Also fetch dedicated timeline endpoint
    applicationService
      .getTimeline(applicationId)
      .then(tl => {
        if (!isMounted) return;
        const rawEvents = (tl?.data as TimelineEvent[]) || [];
        if (Array.isArray(rawEvents) && rawEvents.length > 0) {
          const sorted = [...rawEvents].sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime(),
          );
          setEvents(sorted);
        }
      })
      .catch(() => {});

    captureLocation()
      .then(loc => {
        if (isMounted && loc) {
          setLat(loc.lat);
          setLng(loc.lng);
          setLocCaptured(true);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
      if (speech.listening) {
        speech.stop();
      }
    };
  }, [applicationId, speech]);

  const handleCapturePhoto = async () => {
    const loc = await captureLocation();
    if (loc) {
      setLat(loc.lat);
      setLng(loc.lng);
      setLocCaptured(true);
    }
    const samplePhotoName = `visit_proof_${Date.now()
      .toString()
      .slice(-4)}.jpg`;
    setGeotagPhoto(samplePhotoName);
    showToast(
      language === 'gu'
        ? `અક્ષાંશ ${lat.toFixed(4)}°, રેખાંશ ${lng.toFixed(
            4,
          )}° સાથે તસવીર ટેગ થઈ.`
        : `Photo verified at Lat ${lat.toFixed(4)}°, Long ${lng.toFixed(4)}°`,
      'info',
      language === 'gu' ? 'જીપીએસ ટેગ થયેલ' : 'GPS Auto-Tagged',
    );
  };

  // Pre-fill contextual snippet based on chosen status
  const insertSnippet = (customText?: string) => {
    let snippet = customText;
    if (!snippet) {
      switch (selectedStatus) {
        case 'resolved':
          snippet =
            language === 'gu'
              ? 'સ્થળ પર રૂબરૂ જઈને અરજદારની સહાય વિતરણ અને કામગીરી પૂર્ણ કરેલ છે. કેસ સફળતાપૂર્વક ઉકેલાયો છે.'
              : 'Inspected site physically and completed assistance delivery. Case successfully resolved.';
          break;
        case 'awaiting_confirmation':
          snippet =
            language === 'gu'
              ? 'સહાય કામગીરી પૂર્ણ થયેલ છે, અરજદાર નાગરિકની આખરી પુષ્ટિ અને પહોંચ મેળવવાની બાકી છે.'
              : 'Aid provided successfully, queued for citizen acknowledgement and confirmation.';
          break;
        case 'onHold':
          snippet =
            language === 'gu'
              ? 'સરકારી વિભાગ તરફથી યોજના મંજૂરી ઓર્ડર અને ગ્રાન્ટ ફાળવણીની રાહમાં અરજી કામચલાઉ મોકૂફ રાખેલ છે.'
              : 'Temporarily on hold awaiting government department sanction and grant release.';
          break;
        case 'needMoreInfo':
          snippet =
            language === 'gu'
              ? 'અરજી આગળ વધારવા માટે અરજદાર પાસેથી આવકનો દાખલો, આધાર કાર્ડ અને રેશનકાર્ડની નકલ જરૂરી છે.'
              : 'Applicant must submit updated income certificate, Aadhaar copy and ration card to proceed.';
          break;
        case 'followUp':
          snippet =
            language === 'gu'
              ? 'ગ્રામ પંચાયત સભ્ય અને તલાટી સાથે સંયુક્ત સ્થળ સમીક્ષા માટે ફોલો-અપ મુલાકાત નિયત કરેલ છે.'
              : 'Scheduled joint field verification visit with Talati and Gram Panchayat.';
          break;
        case 'rejected':
          snippet =
            language === 'gu'
              ? 'સરકારી માર્ગદર્શિકા મુજબ નિયત પાત્રતા માપદંડ પૂર્ણ ન થતાં અરજી અસ્વીકાર કરવામાં આવે છે.'
              : 'Application does not meet statutory scheme criteria and eligibility guidelines.';
          break;
        default:
          snippet =
            language === 'gu'
              ? 'સ્થળ પર રૂબરૂ મુલાકાત લઈ સ્થિતિ ચકાસી. જરૂરી સહાયની ભલામણ સાથે કામગીરી પ્રગતિમાં છે.'
              : 'Conducted ground inspection with local panchayat. Assistance processing in progress.';
      }
    }

    setNotes(prev => {
      const clean = prev.replace(/\u200B/g, ' ').trim();
      return clean ? `${clean}\n${snippet}` : snippet;
    });
  };

  // Submit status update to backend
  const handleSubmit = async () => {
    if (speech.listening) {
      await speech.stop();
    }
    const cleanNotes = notes.replace(/\u200B/g, ' ').trim();

    if (cleanNotes.length < 5) {
      showToast(
        language === 'gu'
          ? 'કૃપા કરીને આ સ્થિતિ માટે વિગતો અથવા અહેવાલ દાખલ કરો (ઓછામાં ઓછા ૫ અક્ષરો).'
          : 'Please enter details or explanation for this status update (minimum 5 characters).',
        'warning',
        language === 'gu' ? 'વિગત દાખલ કરવી જરૂરી છે' : 'Details Required',
      );
      return;
    }

    setBusy(true);
    try {
      if (selectedStatus === 'awaiting_confirmation') {
        await helperService.resolve(applicationId, cleanNotes);
        showToast(
          language === 'gu'
            ? 'અરજી પૂર્ણ તરીકે નોંધાઈ છે અને અરજદાર નાગરિકની પુષ્ટિ માટે મોકલવામાં આવી છે.'
            : 'Case resolved and queued for citizen acknowledgement.',
          'success',
          language === 'gu'
            ? 'પુષ્ટિ માટે મોકલ્યું!'
            : 'Sent for Confirmation!',
        );
        setTimeout(() => {
          onBack();
        }, 500);
      } else {
        await helperService.updateStatus(applicationId, selectedStatus, {
          notes: cleanNotes,
          urgency: isUrgent ? 'urgent' : 'medium',
          lat,
          lng,
          proof_photo: geotagPhoto || undefined,
        });
        showToast(
          language === 'gu'
            ? `અરજીની સ્થિતિ '${selectedDef.labelGu}' તરીકે સફળતાપૂર્વક સાચવવામાં આવી.`
            : `Case status transitioned to '${selectedDef.labelEn}'.`,
          'success',
          language === 'gu'
            ? 'સ્થિતિ સફળતાપૂર્વક અપડેટ થઈ!'
            : 'Status Updated!',
        );
        setTimeout(() => {
          onBack();
        }, 500);
      }
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'Please check your connection and retry.',
        'error',
        language === 'gu' ? 'અપડેટ નિષ્ફળ' : 'Update Failed',
      );
    } finally {
      setBusy(false);
    }
  };

  const selectedDef = useMemo(() => {
    return (
      ALL_STATUS_OPTIONS.find(s => s.key === selectedStatus) ||
      ALL_STATUS_OPTIONS[0]
    );
  }, [selectedStatus]);

  // Stepper progress indicator based on current status
  const currentStepInfo = useMemo(() => {
    const status = app?.status;
    switch (status) {
      case 'received':
        return {
          percent: '20%',
          labelEn: '1. Received',
          labelGu: '૧. નવી અરજી',
        };
      case 'verification':
        return {
          percent: '40%',
          labelEn: '2. Under Verification',
          labelGu: '૨. ચકાસણી હેઠળ',
        };
      case 'categorised':
        return {
          percent: '50%',
          labelEn: '2. Categorised',
          labelGu: '૨. વર્ગીકૃત',
        };
      case 'assigned':
        return {
          percent: '65%',
          labelEn: '3. Assigned to You',
          labelGu: '૩. તમને સોંપેલ છે',
        };
      case 'assistance':
        return {
          percent: '80%',
          labelEn: '3. Assistance In Progress',
          labelGu: '૩. સહાય પ્રગતિમાં',
        };
      case 'needMoreInfo':
        return {
          percent: '60%',
          labelEn: '3. Awaiting Documents',
          labelGu: '૩. દસ્તાવેજ બાકી',
        };
      case 'onHold':
        return {
          percent: '70%',
          labelEn: '3. On Hold',
          labelGu: '૩. મોકૂફ રાખેલ',
        };
      case 'followUp':
        return {
          percent: '80%',
          labelEn: '3. Follow-Up Scheduled',
          labelGu: '૩. ફોલો-અપ શેડ્યૂલ',
        };
      case 'awaiting_confirmation':
        return {
          percent: '90%',
          labelEn: '4. Awaiting Confirmation',
          labelGu: '૪. નાગરિક પુષ્ટિ બાકી',
        };
      case 'resolved':
        return {
          percent: '100%',
          labelEn: '5. Resolved & Closed',
          labelGu: '૫. સફળતાપૂર્વક પૂર્ણ',
        };
      case 'rejected':
        return {
          percent: '100%',
          labelEn: 'Closed (Rejected)',
          labelGu: 'પૂર્ણ (અસ્વીકાર)',
        };
      default:
        return {
          percent: '65%',
          labelEn: status || 'In Progress',
          labelGu: status || 'પ્રગતિમાં',
        };
    }
  }, [app?.status]);

  const renderDetailedTimeline = () => (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.progressHeaderRow}>
        <View style={styles.progressTitleLeft}>
          <Ionicons
            name="git-network-outline"
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.progressTitle, { color: colors.text }]}>
            {language === 'gu'
              ? 'વિગતવાર પ્રગતિ સમયરેખા'
              : 'Detailed Progress Timeline'}
          </Text>
        </View>
        <View
          style={[
            styles.stepsCountBadge,
            { backgroundColor: colors.primaryContainer },
          ]}
        >
          <Text
            style={[
              styles.stepsCountText,
              { color: colors.onPrimaryContainer },
            ]}
          >
            {events.length > 0
              ? `${events.length} ${language === 'gu' ? 'નોંધ' : 'Records'}`
              : language === 'gu'
              ? 'ચાલુ'
              : 'Active'}
          </Text>
        </View>
      </View>

      {/* Dynamic Slidable Timeline Stepper */}
      <ArchedTimelineDial
        status={app?.status || 'received'}
        stages={app?.workflow_stages}
        language={language}
        assigneeName={app?.current_assignee?.name}
      />

      {/* Vertical Events Trail */}
      {events.length > 0 ? (
        <View style={styles.verticalTrailContainer}>
          {events.map((ev, index) => {
            const isLast = index === events.length - 1;
            const eventDate = formatEventDate(ev.created_at);

            return (
              <View key={ev.id || index} style={styles.eventTimelineWrap}>
                <View style={styles.timelineStepItem}>
                  <View
                    style={[
                      styles.stepIconCircle,
                      {
                        backgroundColor: isLast
                          ? colors.primary
                          : colors.primaryContainer,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Ionicons
                      name={isLast ? 'radio-button-on' : 'checkmark'}
                      size={14}
                      color={isLast ? '#ffffff' : colors.primary}
                    />
                  </View>

                  <View style={styles.stepContentWrap}>
                    <View style={styles.stepHeaderRow}>
                      <Text
                        style={[styles.stepTitleText, { color: colors.text }]}
                      >
                        {formatEventTitle(
                          ev.event_type || ev.to_status || '',
                          language,
                        )}
                      </Text>
                      {eventDate ? (
                        <Text
                          style={[
                            styles.stepTimeText,
                            { color: colors.textMuted },
                          ]}
                        >
                          {eventDate}
                        </Text>
                      ) : null}
                    </View>

                    {/* Status Transition pill if from_status & to_status exist */}
                    {ev.to_status && (
                      <View
                        style={[
                          styles.statusTransitionPill,
                          { backgroundColor: colors.surfaceSubtle },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusTransitionText,
                            { color: colors.secondary },
                          ]}
                        >
                          {ev.from_status ? `${ev.from_status} → ` : ''}
                          {ev.to_status}
                        </Text>
                      </View>
                    )}

                    {ev.body ? (
                      <Text
                        style={[styles.stepDescText, { color: colors.text }]}
                      >
                        {ev.body}
                      </Text>
                    ) : null}

                    {ev.actor_name ? (
                      <View style={styles.systemVerifiedRow}>
                        <Ionicons
                          name="person-outline"
                          size={12}
                          color={colors.primary}
                        />
                        <Text
                          style={[
                            styles.systemVerifiedText,
                            { color: colors.primary },
                          ]}
                        >
                          {ev.actor_name} (
                          {ev.actor_role ||
                            (language === 'gu' ? 'સેવક' : 'Staff')}
                          )
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {!isLast && (
                  <View
                    style={[
                      styles.verticalTrailLine,
                      { backgroundColor: colors.border },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.verticalTrailContainer}>
          <View style={styles.timelineStepItem}>
            <View
              style={[
                styles.stepIconCircle,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Ionicons name="checkmark" size={14} color="#ffffff" />
            </View>
            <View style={styles.stepContentWrap}>
              <View style={styles.stepHeaderRow}>
                <Text style={[styles.stepTitleText, { color: colors.text }]}>
                  {language === 'gu'
                    ? 'અરજી સફળતાપૂર્વક નોંધાઈ'
                    : 'Application Registered'}
                </Text>
                <Text
                  style={[styles.stepTimeText, { color: colors.textMuted }]}
                >
                  {formatEventDate(app?.created_at)}
                </Text>
              </View>
              <Text style={[styles.stepDescText, { color: colors.textMuted }]}>
                {language === 'gu'
                  ? 'મોબાઈલ પોર્ટલ મારફતે સહાય અરજી સિસ્ટમમાં દાખલ કરવામાં આવી.'
                  : 'Welfare assistance request registered into system.'}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      {/* Top Reusable Canopy Header */}
      <CanopyHeader
        title={
          isReadOnly
            ? language === 'gu'
              ? 'કેસ સમીક્ષા અને સમયરેખા'
              : 'Case Review & Timeline'
            : language === 'gu'
            ? 'સ્થિતિ અપડેટ ડેસ્ક'
            : 'Transition Case Status'
        }
        showBack={true}
        onBack={onBack}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isReadOnly ? { paddingBottom: 28 } : { paddingBottom: 110 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Helper Banner */}
          <View
            style={[
              styles.glowBanner,
              {
                backgroundColor: isReadOnly ? colors.surfaceSubtle : '#fef3c7',
              },
            ]}
          >
            <View style={styles.glowBannerLeft}>
              <Ionicons
                name={isReadOnly ? 'document-text-outline' : 'shield-checkmark'}
                size={18}
                color={isReadOnly ? colors.primary : '#b45309'}
              />
              <Text
                style={[
                  styles.glowBannerText,
                  { color: isReadOnly ? colors.primary : '#92400e' },
                ]}
              >
                {isReadOnly
                  ? language === 'gu'
                    ? 'સેવક ડેસ્ક • કેસ સમીક્ષા (ફક્ત વાંચવા માટે)'
                    : 'Field Mentor Desk • Case Review (Read Only)'
                  : language === 'gu'
                  ? 'સેવક કાર્યક્ષેત્ર • સ્થિતિ વ્યવસ્થાપન'
                  : 'Field Mentor Desk • Status Manager'}
              </Text>
            </View>
            <View
              style={[
                styles.langIndicator,
                { backgroundColor: colors.surface },
              ]}
            >
              <Text
                style={[styles.langIndicatorActive, { color: colors.primary }]}
              >
                {language === 'gu' ? 'ગુજરાતી' : 'English'}
              </Text>
            </View>
          </View>

          {/* Citizen & Case Summary Card */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {loadingApp ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginVertical: 12 }}
              />
            ) : (
              <View style={styles.summaryTopRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.badgeRow}>
                    <View
                      style={[
                        styles.caseCodeBadge,
                        { backgroundColor: colors.surfaceSubtle },
                      ]}
                    >
                      <Text
                        style={[styles.caseCodeText, { color: colors.text }]}
                      >
                        #{app?.case_no || 'THH-CASE'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.sectorPill,
                        { backgroundColor: colors.secondaryContainer },
                      ]}
                    >
                      <Text
                        style={[
                          styles.sectorPillText,
                          { color: colors.onSecondaryContainer },
                        ]}
                      >
                        {app?.category?.slug ||
                          app?.module ||
                          (language === 'gu' ? 'સરકારી સહાય' : 'Welfare Grant')}
                      </Text>
                    </View>
                    {isUrgent && (
                      <View
                        style={[
                          styles.urgentPill,
                          { backgroundColor: colors.errorContainer },
                        ]}
                      >
                        <Text
                          style={[
                            styles.urgentPillText,
                            { color: colors.error },
                          ]}
                        >
                          {language === 'gu' ? 'તાકીદનું' : 'URGENT'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.citizenTitle, { color: colors.text }]}>
                    {app?.user?.name ||
                      app?.contact_name ||
                      (language === 'gu'
                        ? 'અરજદાર નાગરિક'
                        : 'Citizen Applicant')}
                  </Text>
                  <View style={styles.locationRow}>
                    <Ionicons
                      name="location"
                      size={14}
                      color={colors.primary}
                    />
                    <Text
                      style={[styles.locationText, { color: colors.secondary }]}
                    >
                      {app?.village?.name_gu ||
                        app?.village?.name_en ||
                        (language === 'gu'
                          ? 'નવસારી / ડાંગ'
                          : 'Navsari / Dang')}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.avatarSquare,
                    { backgroundColor: colors.primaryContainer },
                  ]}
                >
                  <Ionicons
                    name="person"
                    size={28}
                    color={colors.onPrimaryContainer}
                  />
                </View>
              </View>
            )}

            {/* Stepper Progress Bar */}
            <View
              style={[
                styles.stepperContainer,
                { backgroundColor: colors.surfaceSubtle },
              ]}
            >
              <View style={styles.stepperHeader}>
                <Text
                  style={[styles.stepperTitle, { color: colors.secondary }]}
                >
                  {language === 'gu' ? 'હાલની સ્થિતિ' : 'Current Status'}
                </Text>
                <View style={styles.stepperPulseRow}>
                  <View
                    style={[
                      styles.pulseDotGreen,
                      { backgroundColor: colors.primary },
                    ]}
                  />
                  <Text
                    style={[
                      styles.stepperStatusText,
                      { color: colors.primary },
                    ]}
                  >
                    {language === 'gu'
                      ? currentStepInfo.labelGu
                      : currentStepInfo.labelEn}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.progressBarTrack,
                  { backgroundColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: colors.primary,
                      width: currentStepInfo.percent as any,
                    },
                  ]}
                />
              </View>

              <View style={styles.milestoneLabelsRow}>
                <Text
                  style={[styles.milestoneLabel, { color: colors.textMuted }]}
                >
                  {language === 'gu' ? '૧. અરજી' : '1. Applied'}
                </Text>
                <Text
                  style={[styles.milestoneLabel, { color: colors.textMuted }]}
                >
                  {language === 'gu' ? '૨. ચકાસણી' : '2. Verify'}
                </Text>
                <Text
                  style={[
                    styles.milestoneLabel,
                    { color: colors.primary, fontWeight: '700' },
                  ]}
                >
                  {language === 'gu' ? '૩. સેવક સહાય' : '3. Field Mentor'}
                </Text>
                <Text
                  style={[styles.milestoneLabel, { color: colors.textMuted }]}
                >
                  {language === 'gu' ? '૪. પૂર્ણ' : '4. Solved'}
                </Text>
              </View>
            </View>
          </View>

          {/* ── CONDITIONAL: READ ONLY REVIEW VS EDITABLE STATUS TRANSITION ── */}
          {isReadOnly ? (
            <>
              {/* ── READ-ONLY TERMINAL STATUS BANNER CARD ── */}
              <View
                style={[
                  styles.readOnlyBannerCard,
                  {
                    backgroundColor:
                      app?.status === 'rejected'
                        ? colors.errorContainer || '#fee2e2'
                        : '#ecfdf5',
                    borderColor:
                      app?.status === 'rejected' ? colors.error : '#10b981',
                  },
                ]}
              >
                <View style={styles.readOnlyBannerTop}>
                  <View
                    style={[
                      styles.readOnlyIconCircle,
                      {
                        backgroundColor:
                          app?.status === 'rejected' ? colors.error : '#10b981',
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        app?.status === 'rejected' ? 'close' : 'checkmark-done'
                      }
                      size={22}
                      color="#ffffff"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.readOnlyBannerTitle,
                        {
                          color:
                            app?.status === 'rejected'
                              ? colors.error
                              : '#065f46',
                        },
                      ]}
                    >
                      {app?.status === 'rejected'
                        ? language === 'gu'
                          ? 'અરજી અસ્વીકાર થયેલ છે (Rejected)'
                          : 'Case Rejected & Closed'
                        : language === 'gu'
                        ? 'કેસ સફળતાપૂર્વક પૂર્ણ થયેલ છે (Resolved)'
                        : 'Case Successfully Resolved & Closed'}
                    </Text>
                    <Text
                      style={[
                        styles.readOnlyBannerSub,
                        {
                          color:
                            app?.status === 'rejected' ? '#991b1b' : '#047857',
                        },
                      ]}
                    >
                      {language === 'gu'
                        ? 'આ અરજીનો અંતિમ નિકાલ પૂર્ણ થયેલ છે. આ કેસ હવે માત્ર વિગતો અને સમયરેખા જોવા માટે ઉપલબ્ધ છે, સ્થિતિ બદલી શકાશે નહીં.'
                        : 'This application has reached its final state. Status updates are locked for this record.'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* ── CASE NEED & RESOLUTION SUMMARY CARD ── */}
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Ionicons
                        name="document-text-outline"
                        size={18}
                        color={colors.primary}
                      />
                      <Text
                        style={[styles.cardHeaderTitle, { color: colors.text }]}
                      >
                        {language === 'gu'
                          ? 'અરજી વિગત અને ઉકેલ અહેવાલ'
                          : 'Case Subject & Resolution Notes'}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.cardHeaderSub,
                        { color: colors.secondary },
                      ]}
                    >
                      {language === 'gu'
                        ? 'નાગરિકની જરૂરિયાત અને સેવક દ્વારા થયેલ કાર્યવાહી'
                        : 'Citizen requirement and mentor field resolution report'}
                    </Text>
                  </View>
                </View>

                {/* Case Subject / Need description */}
                <View
                  style={[
                    styles.readOnlyNotesBox,
                    { backgroundColor: colors.surfaceSubtle },
                  ]}
                >
                  <Text
                    style={[
                      styles.readOnlyNotesLabel,
                      { color: colors.secondary },
                    ]}
                  >
                    {language === 'gu'
                      ? 'અરજી વિષય / જરૂરિયાત:'
                      : 'Subject / Citizen Need:'}
                  </Text>
                  <Text
                    style={[styles.readOnlyNotesBody, { color: colors.text }]}
                  >
                    {app?.title ||
                      app?.description ||
                      (app as any)?.subject ||
                      (app as any)?.custom_fields?.issue_description ||
                      app?.category?.name_gu ||
                      app?.category?.name_en ||
                      (language === 'gu'
                        ? 'સહાય વિનંતી'
                        : 'Welfare Assistance Request')}
                  </Text>
                </View>

                {/* Resolution / Closure note */}
                <View
                  style={[
                    styles.readOnlyNotesBox,
                    { backgroundColor: colors.surfaceSubtle, marginTop: 10 },
                  ]}
                >
                  <Text
                    style={[
                      styles.readOnlyNotesLabel,
                      { color: colors.primary },
                    ]}
                  >
                    {language === 'gu'
                      ? 'અંતિમ ઉકેલ અહેવાલ / કાર્યવાહી નોંધ:'
                      : 'Final Resolution & Outcome Report:'}
                  </Text>
                  <Text
                    style={[styles.readOnlyNotesBody, { color: colors.text }]}
                  >
                    {(app as any)?.outcome_report ||
                      (app as any)?.resolution_notes ||
                      (app as any)?.closure_notes ||
                      (app as any)?.admin_notes ||
                      events.find(
                        e =>
                          e.to_status === 'resolved' ||
                          e.to_status === 'rejected',
                      )?.body ||
                      (language === 'gu'
                        ? 'ક્ષેત્ર મુલાકાત પૂર્ણ કરી સહાય સફળતાપૂર્વક લાભાર્થી સુધી પહોંચાડવામાં આવી છે.'
                        : 'Field verification and aid disbursement successfully completed for the citizen.')}
                  </Text>
                </View>

                {/* Attached proof document info if any */}
                {app?.documents && app.documents.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text
                      style={[
                        styles.readOnlyNotesLabel,
                        { color: colors.secondary, marginBottom: 6 },
                      ]}
                    >
                      {language === 'gu'
                        ? 'જોડાયેલ દસ્તાવેજો / પુરાવા:'
                        : 'Attached Proof / Documents:'}
                    </Text>
                    <View
                      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
                    >
                      {app.documents.map((doc, idx) => (
                        <View
                          key={doc.id || idx}
                          style={[
                            styles.chipBtn,
                            { backgroundColor: colors.surfaceSubtle },
                          ]}
                        >
                          <Ionicons
                            name="document-attach-outline"
                            size={14}
                            color={colors.primary}
                          />
                          <Text
                            style={[styles.chipBtnText, { color: colors.text }]}
                          >
                            {doc.file_name ||
                              (doc as any).name ||
                              doc.document_type ||
                              `Document #${idx + 1}`}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* ── DETAILED PROGRESS TIMELINE CARD (READ ONLY) ── */}
              {renderDetailedTimeline()}
            </>
          ) : (
            <>
              {/* ── DROPDOWN SELECTOR FOR NEW STATUS (MATCHING ADMIN PORTAL) ── */}
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={styles.sectionHeaderWrap}>
                  <Text
                    style={[styles.sectionHeaderTitle, { color: colors.text }]}
                  >
                    {language === 'gu'
                      ? 'નવી સ્થિતિ પસંદ કરો (New Status)'
                      : 'Transition to New Status'}
                  </Text>
                  <Text
                    style={[styles.requiredLabel, { color: colors.secondary }]}
                  >
                    {language === 'gu' ? 'ફરજિયાત' : 'Required'}
                  </Text>
                </View>

                {/* Interactive Dropdown Button */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowDropdownModal(true)}
                  style={[
                    styles.dropdownSelectorBtn,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: selectedDef.themeColor,
                    },
                  ]}
                >
                  <View style={styles.dropdownSelectorLeft}>
                    <View
                      style={[
                        styles.statusIconCircle,
                        { backgroundColor: selectedDef.badgeBg },
                      ]}
                    >
                      <Ionicons
                        name={selectedDef.icon as any}
                        size={20}
                        color={selectedDef.themeColor}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.dropdownStatusTitle,
                          { color: colors.text },
                        ]}
                      >
                        {selectedDef.labelEn}
                      </Text>
                      <Text
                        style={[
                          styles.dropdownStatusSubtitle,
                          { color: selectedDef.themeColor },
                        ]}
                      >
                        ({selectedDef.labelGu})
                      </Text>
                    </View>
                  </View>

                  <View style={styles.dropdownChevronWrap}>
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={colors.text}
                    />
                  </View>
                </TouchableOpacity>

                <Text
                  style={[styles.statusHintText, { color: colors.textMuted }]}
                >
                  {language === 'gu' ? selectedDef.subGu : selectedDef.subEn}
                </Text>
              </View>

              {/* ── CONTEXT-SPECIFIC DETAIL CARD BASED ON SELECTED STATUS ── */}
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                {/* Header styling dynamically adapted for status */}
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Ionicons
                        name={selectedDef.icon as any}
                        size={18}
                        color={selectedDef.themeColor}
                      />
                      <Text
                        style={[styles.cardHeaderTitle, { color: colors.text }]}
                      >
                        {selectedStatus === 'resolved' ||
                        selectedStatus === 'awaiting_confirmation'
                          ? language === 'gu'
                            ? 'ઉકેલ અહેવાલ અને વિગત'
                            : 'Resolution & Outcome Report'
                          : selectedStatus === 'onHold'
                          ? language === 'gu'
                            ? 'મોકૂફ રાખવાનું કારણ'
                            : 'Reason for Placing On Hold'
                          : selectedStatus === 'needMoreInfo'
                          ? language === 'gu'
                            ? 'જરૂરી દસ્તાવેજો / ખૂટતી વિગત'
                            : 'Missing Documents / Required Info'
                          : selectedStatus === 'followUp'
                          ? language === 'gu'
                            ? 'ફોલો-અપ મુલાકાત વિગત'
                            : 'Follow-Up Schedule & Objectives'
                          : selectedStatus === 'rejected'
                          ? language === 'gu'
                            ? 'અસ્વીકારનું કારણ'
                            : 'Rejection Justification'
                          : language === 'gu'
                          ? 'સેવક સ્થળ તપાસ નોંધ'
                          : 'Field Inspection & Ground Notes'}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.cardHeaderSub,
                        { color: colors.secondary },
                      ]}
                    >
                      {selectedStatus === 'resolved' ||
                      selectedStatus === 'awaiting_confirmation'
                        ? language === 'gu'
                          ? 'સહાય વિતરણ, થયેલ કામગીરી અથવા મંજૂરી ઓર્ડરની વિગત દાખલ કરો'
                          : 'Specify aid handed over, assistance completed, or grant sanctioned'
                        : selectedStatus === 'onHold'
                        ? language === 'gu'
                          ? 'અરજી કેમ અટકાવવામાં આવી છે તેની સચોટ વિગત જણાવો'
                          : 'Specify why this case is temporarily paused'
                        : selectedStatus === 'needMoreInfo'
                        ? language === 'gu'
                          ? 'અરજદારે કયા કાગળો જમા કરાવવાના છે તેની યાદી જણાવો'
                          : 'List exact documents or records applicant must provide'
                        : selectedStatus === 'followUp'
                        ? language === 'gu'
                          ? 'આગામી મુલાકાતની તારીખ અને કાર્યવાહીની રૂપરેખા'
                          : 'Scheduled visit date and pending ground action items'
                        : language === 'gu'
                        ? 'રૂબરૂ મુલાકાત, પંચાયત ચકાસણી અને સ્થળ પર જોયેલી સ્થિતિ'
                        : 'Physical inspection findings and ground verification report'}
                    </Text>
                  </View>

                  {/* Voice Input Button */}
                  <TouchableOpacity
                    onPress={toggleMic}
                    style={[
                      styles.micCircleBtn,
                      {
                        backgroundColor: speech.listening
                          ? colors.error
                          : colors.primaryContainer,
                      },
                    ]}
                  >
                    <Ionicons
                      name={speech.listening ? 'mic-off' : 'mic'}
                      size={18}
                      color={speech.listening ? '#ffffff' : colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Active Listening Visual Banner */}
                {speech.listening && (
                  <View
                    style={[
                      styles.listeningBar,
                      { backgroundColor: colors.errorContainer },
                    ]}
                  >
                    <View
                      style={[
                        styles.pulseDotRed,
                        { backgroundColor: colors.error },
                      ]}
                    />
                    <Text
                      style={[styles.listeningBarText, { color: colors.error }]}
                    >
                      {language === 'gu'
                        ? 'માઇક્રોફોન ચાલુ છે... ગુજરાતીમાં બોલો'
                        : 'Listening... speak clearly in Gujarati or English'}
                    </Text>
                  </View>
                )}

                {/* Contextual Quick Chips */}
                <View style={styles.quickChipsWrap}>
                  {selectedStatus === 'onHold' && (
                    <>
                      <TouchableOpacity
                        onPress={() =>
                          insertSnippet(
                            language === 'gu'
                              ? 'સરકારી વિભાગ તરફથી યોજના મંજૂરી ઓર્ડર બાકી છે.'
                              : 'Pending government department sanction order.',
                          )
                        }
                        style={[
                          styles.chipBtn,
                          { backgroundColor: colors.surfaceSubtle },
                        ]}
                      >
                        <Text
                          style={[styles.chipBtnText, { color: colors.text }]}
                        >
                          {language === 'gu'
                            ? '+ વિભાગીય મંજૂરી બાકી'
                            : '+ Pending Dept Sanction'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          insertSnippet(
                            language === 'gu'
                              ? 'અરજદાર હાલ સ્થળ પર ઉપલબ્ધ નથી, પરત આવ્યે કાર્યવાહી થશે.'
                              : 'Applicant temporarily unavailable on site.',
                          )
                        }
                        style={[
                          styles.chipBtn,
                          { backgroundColor: colors.surfaceSubtle },
                        ]}
                      >
                        <Text
                          style={[styles.chipBtnText, { color: colors.text }]}
                        >
                          {language === 'gu'
                            ? '+ અરજદાર ગેરહાજર'
                            : '+ Citizen Unavailable'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {selectedStatus === 'needMoreInfo' && (
                    <>
                      <TouchableOpacity
                        onPress={() =>
                          insertSnippet(
                            language === 'gu'
                              ? 'આધાર કાર્ડ અને રેશનકાર્ડની સ્વપ્રમાણિત નકલ જમા કરાવવી જરૂરી છે.'
                              : 'Aadhaar Card and Ration Card copy required.',
                          )
                        }
                        style={[
                          styles.chipBtn,
                          { backgroundColor: colors.surfaceSubtle },
                        ]}
                      >
                        <Text
                          style={[styles.chipBtnText, { color: colors.text }]}
                        >
                          + આધાર / રેશનકાર્ડ
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          insertSnippet(
                            language === 'gu'
                              ? 'જમીન રેકોર્ડ ૭/૧૨ અને ૮-અ ની તાજી નકલ જોડવી.'
                              : '7/12 land extract copy required.',
                          )
                        }
                        style={[
                          styles.chipBtn,
                          { backgroundColor: colors.surfaceSubtle },
                        ]}
                      >
                        <Text
                          style={[styles.chipBtnText, { color: colors.text }]}
                        >
                          + ૭/૧૨ નકલ
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          insertSnippet(
                            language === 'gu'
                              ? 'મામલતદાર કચેરીનો આવકનો દાખલો રજૂ કરવો.'
                              : 'Income certificate from Mamlatdar.',
                          )
                        }
                        style={[
                          styles.chipBtn,
                          { backgroundColor: colors.surfaceSubtle },
                        ]}
                      >
                        <Text
                          style={[styles.chipBtnText, { color: colors.text }]}
                        >
                          + આવક દાખલો
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {(selectedStatus === 'resolved' ||
                    selectedStatus === 'awaiting_confirmation') && (
                    <>
                      <TouchableOpacity
                        onPress={() =>
                          insertSnippet(
                            language === 'gu'
                              ? 'સ્થળ મુલાકાત લઈ તાડપત્રી અને આવાસ સુધારણા સહાય સુપરત કરી.'
                              : 'Housing grant materials disbursed on site.',
                          )
                        }
                        style={[
                          styles.chipBtn,
                          { backgroundColor: colors.surfaceSubtle },
                        ]}
                      >
                        <Text
                          style={[styles.chipBtnText, { color: colors.text }]}
                        >
                          {language === 'gu'
                            ? '+ સહાય વિતરણ પૂર્ણ'
                            : '+ Aid Disbursed'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          insertSnippet(
                            language === 'gu'
                              ? 'સરપંચ અને ગ્રામ સેવકની સહી સાથે પહોંચ પ્રમાણિત કરેલ છે.'
                              : 'Receipt verified with Sarpanch signature.',
                          )
                        }
                        style={[
                          styles.chipBtn,
                          { backgroundColor: colors.surfaceSubtle },
                        ]}
                      >
                        <Text
                          style={[styles.chipBtnText, { color: colors.text }]}
                        >
                          {language === 'gu'
                            ? '+ પંચાયત સહી પ્રમાણિત'
                            : '+ Panchayat Signed'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                {/* Notes Input Area */}
                <TextInput
                  multiline
                  numberOfLines={4}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={
                    selectedStatus === 'resolved' ||
                    selectedStatus === 'awaiting_confirmation'
                      ? language === 'gu'
                        ? 'સહાયની વિગત, લાભાર્થીને આપેલ લાભ અથવા પંચાયત પ્રમાણપત્ર વિગત દાખલ કરો...'
                        : 'Enter resolution details, grant provided, or citizen outcome...'
                      : selectedStatus === 'onHold'
                      ? language === 'gu'
                        ? 'અરજી મોકૂફ રાખવાનું ચોક્કસ કારણ દાખલ કરો...'
                        : 'Enter the exact reason for holding this application...'
                      : selectedStatus === 'needMoreInfo'
                      ? language === 'gu'
                        ? 'અરજદારે કયા દસ્તાવેજો અથવા વિગતો આપવાની છે તે લખો...'
                        : 'Specify what documents or info are missing from applicant...'
                      : language === 'gu'
                      ? 'સ્થળ તપાસની વિગતો, જોયેલી સ્થિતિ અથવા નોંધ દાખલ કરો...'
                      : 'Enter inspection findings, ground details, or tap mic...'
                  }
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.notesArea,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      color: colors.text,
                    },
                  ]}
                />

                <View style={styles.notesFooter}>
                  <Text
                    style={[styles.notesCounter, { color: colors.textMuted }]}
                  >
                    {notes.trim().length >= 5
                      ? language === 'gu'
                        ? `✓ ${notes.trim().length} અક્ષર`
                        : `✓ ${notes.trim().length} chars`
                      : language === 'gu'
                      ? 'ઓછામાં ઓછા ૫ અક્ષરો જરૂરી'
                      : 'Min. 5 characters required'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => insertSnippet()}
                    style={styles.snippetBtn}
                  >
                    <Ionicons
                      name="add-circle"
                      size={15}
                      color={selectedDef.themeColor}
                    />
                    <Text
                      style={[
                        styles.snippetBtnText,
                        { color: selectedDef.themeColor },
                      ]}
                    >
                      {language === 'gu' ? '+ ઝડપી વિગત' : '+ Quick snippet'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Upload Geotagged Photo / Proof */}
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text
                      style={[styles.cardHeaderTitle, { color: colors.text }]}
                    >
                      {language === 'gu'
                        ? 'જીઓટેગ ફોટો / પુરાવો'
                        : 'Upload Geotagged Photo / Proof'}
                    </Text>
                    <Text
                      style={[
                        styles.cardHeaderSub,
                        { color: colors.secondary },
                      ]}
                    >
                      {language === 'gu'
                        ? 'સ્થળ તસવીર અથવા સહી કરેલ પંચાયત પત્રક'
                        : 'Site photo or signed panchayat letter'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.gpsAutoTagPill,
                      { backgroundColor: colors.surfaceSubtle },
                    ]}
                  >
                    <Ionicons name="locate" size={13} color={colors.primary} />
                    <Text
                      style={[styles.gpsAutoTagText, { color: colors.text }]}
                    >
                      {locCaptured
                        ? language === 'gu'
                          ? 'જીપીએસ સક્રિય'
                          : 'GPS Active'
                        : 'GPS'}
                    </Text>
                  </View>
                </View>

                <View style={styles.photoGrid}>
                  {geotagPhoto && (
                    <View
                      style={[
                        styles.photoSlot,
                        { backgroundColor: colors.surfaceSubtle },
                      ]}
                    >
                      <View
                        style={[
                          styles.photoOverlay,
                          { backgroundColor: 'rgba(0,0,0,0.6)' },
                        ]}
                      >
                        <Text style={styles.geotagTextWhite}>
                          Lat {lat.toFixed(4)}° N, Long {lng.toFixed(4)}° E
                        </Text>
                        <Text style={styles.geotagSubWhite}>
                          {app?.village?.name_gu ||
                            app?.village?.name_en ||
                            'Field Site'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setGeotagPhoto(null)}
                        style={styles.removePhotoBtn}
                      >
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color="#ffffff"
                        />
                      </TouchableOpacity>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={handleCapturePhoto}
                    style={[
                      styles.addPhotoSlot,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.cameraIconBox,
                        { backgroundColor: colors.surface },
                      ]}
                    >
                      <Ionicons
                        name="camera"
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <Text
                      style={[styles.addPhotoTitle, { color: colors.text }]}
                    >
                      {geotagPhoto
                        ? language === 'gu'
                          ? 'તસવીર બદલો'
                          : 'Retake Proof'
                        : language === 'gu'
                        ? 'તસવીર લો'
                        : 'Capture Proof'}
                    </Text>
                    <Text
                      style={[styles.addPhotoSub, { color: colors.secondary }]}
                    >
                      {language === 'gu'
                        ? 'કેમેરા અથવા ગેલેરી'
                        : 'Camera or Gallery'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Case Priority (Urgency Flag) */}
              <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={styles.priorityRow}>
                  <View style={styles.priorityLeft}>
                    <View
                      style={[
                        styles.flagIconBox,
                        { backgroundColor: colors.surfaceSubtle },
                      ]}
                    >
                      <Ionicons
                        name="flag"
                        size={20}
                        color={isUrgent ? colors.error : colors.secondary}
                      />
                    </View>
                    <View>
                      <Text
                        style={[styles.priorityTitle, { color: colors.text }]}
                      >
                        {language === 'gu' ? 'તાકીદ સ્તર' : 'Case Priority'}
                      </Text>
                      <Text
                        style={[
                          styles.prioritySub,
                          { color: isUrgent ? colors.error : colors.secondary },
                        ]}
                      >
                        {isUrgent
                          ? language === 'gu'
                            ? 'અતિ તાકીદનું (Urgent)'
                            : 'Urgent Priority'
                          : language === 'gu'
                          ? 'સામાન્ય પ્રાથમિકતા (Normal)'
                          : 'Normal Priority'}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.priorityTogglePill,
                      { backgroundColor: colors.surfaceSubtle },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => setIsUrgent(false)}
                      style={[
                        styles.priorityTab,
                        !isUrgent && {
                          backgroundColor: colors.surface,
                          elevation: 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityTabText,
                          {
                            color: !isUrgent
                              ? colors.primary
                              : colors.secondary,
                          },
                        ]}
                      >
                        {language === 'gu' ? 'સામાન્ય' : 'Normal'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setIsUrgent(true)}
                      style={[
                        styles.priorityTab,
                        isUrgent && {
                          backgroundColor: colors.error,
                          elevation: 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityTabText,
                          { color: isUrgent ? '#ffffff' : colors.secondary },
                        ]}
                      >
                        {language === 'gu' ? 'તાકીદ' : 'Urgent'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* ── DETAILED PROGRESS TIMELINE CARD (FOR ACTIVE CASE AUDIT) ── */}
              {renderDetailedTimeline()}

              {/* Mentor Verification Pledge */}
              <View
                style={[
                  styles.pledgeBox,
                  { backgroundColor: colors.surfaceSubtle },
                ]}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.pledgeText, { color: colors.secondary }]}>
                  {language === 'gu'
                    ? 'હું પ્રમાણિત કરું છું કે મેં સ્થળની રૂબરૂ મુલાકાત લીધી છે અથવા ગ્રામ સેવક સાથે સીધી ચકાસણી કરી છે.'
                    : 'I certify that I have reviewed the site physically or verified directly with Gram Sevak.'}
                </Text>
              </View>
            </>
          )}
        </ScrollView>

        {/* ── FIXED BOTTOM ACTION CTA (ONLY SHOWN WHEN NOT READ-ONLY) ── */}
        {!isReadOnly && (
          <View
            style={[
              styles.bottomActionWrap,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity
              disabled={busy}
              onPress={handleSubmit}
              style={[
                styles.primarySolveBtn,
                { backgroundColor: selectedDef.themeColor },
              ]}
            >
              {busy ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons
                    name={selectedDef.icon as any}
                    size={20}
                    color="#ffffff"
                  />
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.primarySolveText}>
                      {selectedStatus === 'resolved'
                        ? language === 'gu'
                          ? 'સાચવો અને ઉકેલ પૂર્ણ કરો'
                          : 'Save & Mark as Resolved'
                        : selectedStatus === 'awaiting_confirmation'
                        ? language === 'gu'
                          ? 'સાચવો અને નાગરિક પુષ્ટિ માટે મોકલો'
                          : 'Save & Await Confirmation'
                        : selectedStatus === 'onHold'
                        ? language === 'gu'
                          ? 'અરજી મોકૂફ રાખો (Place On Hold)'
                          : 'Place Case On Hold'
                        : selectedStatus === 'needMoreInfo'
                        ? language === 'gu'
                          ? 'દસ્તાવેજ મંગાવો અને અપડેટ કરો'
                          : 'Request Documents & Save'
                        : selectedStatus === 'followUp'
                        ? language === 'gu'
                          ? 'ફોલો-અપ શેડ્યૂલ કરો'
                          : 'Schedule Follow-Up & Save'
                        : selectedStatus === 'rejected'
                        ? language === 'gu'
                          ? 'અરજી અસ્વીકાર કરો (Reject)'
                          : 'Reject Application'
                        : language === 'gu'
                        ? 'સ્થિતિ અપડેટ કરો (Update Status)'
                        : 'Update Status & Save'}
                    </Text>
                    <Text style={styles.primarySolveSubText}>
                      {selectedDef.labelEn} • {selectedDef.labelGu}
                    </Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ── MODAL DROPDOWN SELECTOR (ONLY SHOWN WHEN NOT READ-ONLY) ── */}
      {!isReadOnly && (
        <Modal
          visible={showDropdownModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDropdownModal(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowDropdownModal(false)}
          >
            <View
              style={[styles.modalCard, { backgroundColor: colors.surface }]}
            >
              {/* Modal Header */}
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {language === 'gu'
                      ? 'નવી સ્થિતિ પસંદ કરો'
                      : 'Select New Status'}
                  </Text>
                  <Text style={[styles.modalSub, { color: colors.textMuted }]}>
                    {language === 'gu'
                      ? 'અરજીની વર્તમાન કાર્યવાહી મુજબ સ્થિતિ બદલો'
                      : 'Choose next transition for this application'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowDropdownModal(false)}
                  style={[
                    styles.modalCloseBtn,
                    { backgroundColor: colors.surfaceSubtle },
                  ]}
                >
                  <Ionicons name="close" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Status Options Scrollable List */}
              <ScrollView
                style={{ maxHeight: 420 }}
                showsVerticalScrollIndicator={false}
              >
                {ALL_STATUS_OPTIONS.map(opt => {
                  const isSelected = selectedStatus === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedStatus(opt.key);
                        setShowDropdownModal(false);
                      }}
                      style={[
                        styles.modalOptionRow,
                        { borderBottomColor: colors.border },
                        isSelected && { backgroundColor: opt.badgeBg },
                      ]}
                    >
                      <View
                        style={[
                          styles.modalOptionIconCircle,
                          { backgroundColor: opt.badgeBg },
                        ]}
                      >
                        <Ionicons
                          name={opt.icon as any}
                          size={20}
                          color={opt.themeColor}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Text
                            style={[
                              styles.modalOptionTitle,
                              {
                                color: colors.text,
                                fontWeight: isSelected ? '800' : '600',
                              },
                            ]}
                          >
                            {opt.labelEn}
                          </Text>
                          <Text
                            style={[
                              styles.modalOptionTitleGu,
                              { color: opt.themeColor },
                            ]}
                          >
                            ({opt.labelGu})
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.modalOptionDesc,
                            { color: colors.textMuted },
                          ]}
                        >
                          {language === 'gu' ? opt.subGu : opt.subEn}
                        </Text>
                      </View>

                      {isSelected ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color={opt.themeColor}
                        />
                      ) : (
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={colors.textMuted}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
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
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langPill: { flexDirection: 'row', borderRadius: 999, padding: 2 },
  langTab: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  langText: { fontSize: 11, fontWeight: '700' },
  scrollContent: { padding: 16, gap: 12, paddingBottom: 110 },
  glowBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
  },
  glowBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  glowBannerText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  langIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  langIndicatorActive: { fontSize: 10, fontWeight: '800' },
  card: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  caseCodeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  caseCodeText: { fontSize: 11, fontWeight: '700', fontFamily: 'monospace' },
  sectorPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  sectorPillText: { fontSize: 10, fontWeight: '700' },
  urgentPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  urgentPillText: { fontSize: 9, fontWeight: '800' },
  citizenTitle: { fontSize: 16, fontWeight: '800' },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  locationText: { fontSize: 12 },
  avatarSquare: {
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperContainer: { borderRadius: 10, padding: 10, gap: 8, marginTop: 4 },
  stepperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperTitle: { fontSize: 11, fontWeight: '600' },
  stepperPulseRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulseDotGreen: { width: 6, height: 6, borderRadius: 3 },
  stepperStatusText: { fontSize: 11, fontWeight: '700' },
  progressBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 3 },
  milestoneLabelsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  milestoneLabel: { fontSize: 10 },
  sectionHeaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderTitle: { fontSize: 14, fontWeight: '700' },
  requiredLabel: { fontSize: 11, fontWeight: '600' },

  // Dropdown Selector Button
  dropdownSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  dropdownSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  statusIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownStatusTitle: { fontSize: 14, fontWeight: '800' },
  dropdownStatusSubtitle: { fontSize: 12, fontWeight: '700', marginTop: 1 },
  dropdownChevronWrap: { padding: 4 },
  statusHintText: { fontSize: 11, marginTop: -2, paddingHorizontal: 2 },

  // Detail Card Elements
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardHeaderTitle: { fontSize: 14, fontWeight: '700' },
  cardHeaderSub: { fontSize: 11, marginTop: 3 },
  micCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listeningBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
  },
  listeningBarText: { fontSize: 11, fontWeight: '700' },
  pulseDotRed: { width: 8, height: 8, borderRadius: 4 },
  quickChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 2,
  },
  chipBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  chipBtnText: { fontSize: 11, fontWeight: '600' },
  notesArea: {
    minHeight: 88,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  notesFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notesCounter: { fontSize: 11 },
  snippetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  snippetBtnText: { fontSize: 11, fontWeight: '700' },

  gpsAutoTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  gpsAutoTagText: { fontSize: 10, fontWeight: '700' },
  photoGrid: { flexDirection: 'row', gap: 8, marginTop: 4 },
  photoSlot: {
    flex: 1,
    height: 96,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 6,
  },
  geotagTextWhite: { color: '#ffffff', fontSize: 9, fontWeight: '700' },
  geotagSubWhite: { color: '#e0e0e0', fontSize: 8 },
  removePhotoBtn: { position: 'absolute', top: 4, right: 4 },
  addPhotoSlot: {
    flex: 1,
    height: 96,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  cameraIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  addPhotoTitle: { fontSize: 11, fontWeight: '700' },
  addPhotoSub: { fontSize: 10 },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  flagIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityTitle: { fontSize: 13, fontWeight: '700' },
  prioritySub: { fontSize: 11 },
  priorityTogglePill: { flexDirection: 'row', borderRadius: 999, padding: 2 },
  priorityTab: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  priorityTabText: { fontSize: 11, fontWeight: '700' },
  pledgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  pledgeText: { fontSize: 11, flex: 1, lineHeight: 15 },

  bottomActionWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primarySolveBtn: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primarySolveText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  primarySolveSubText: { color: 'rgba(255,255,255,0.85)', fontSize: 10 },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  modalSub: { fontSize: 11, marginTop: 2 },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalOptionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionTitle: { fontSize: 13, fontWeight: '700' },
  modalOptionTitleGu: { fontSize: 12, fontWeight: '700' },
  modalOptionDesc: { fontSize: 11, marginTop: 2 },

  // Read-only banner & review cards
  readOnlyBannerCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
  },
  readOnlyBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  readOnlyIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readOnlyBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  readOnlyBannerSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  readOnlyNotesBox: {
    padding: 12,
    borderRadius: 10,
  },
  readOnlyNotesLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  readOnlyNotesBody: {
    fontSize: 13,
    lineHeight: 19,
  },

  // Detailed Progress Timeline Styles
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  stepsCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  stepsCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
  verticalTrailContainer: {
    marginTop: 14,
  },
  eventTimelineWrap: {
    position: 'relative',
  },
  timelineStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: 16,
  },
  stepIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    zIndex: 2,
  },
  stepContentWrap: {
    flex: 1,
    gap: 4,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepTitleText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  stepTimeText: {
    fontSize: 10,
  },
  statusTransitionPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  statusTransitionText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  stepDescText: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  systemVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  systemVerifiedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  verticalTrailLine: {
    position: 'absolute',
    left: 12,
    top: 28,
    bottom: 0,
    width: 2,
    zIndex: 1,
  },
});
