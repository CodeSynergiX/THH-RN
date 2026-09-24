import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { WorkflowStage } from '../../models/application.model';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NODE_WIDTH = 84;
const CONNECTOR_WIDTH = 32;

// Fallback baseline stages if not supplied by API
const DEFAULT_WORKFLOW_STAGES: WorkflowStage[] = [
  {
    key: 'received',
    name_en: 'Received',
    name_gu: 'નવી અરજી',
    headline_en: 'Application Received',
    headline_gu: 'અરજી સફળતાપૂર્વક નોંધાઈ',
    desc_en: 'Application registered on portal and queued for desk review.',
    desc_gu: 'અરજી પોર્ટલ પર નોંધાઈ છે અને સમીક્ષા માટે કતારમાં છે.',
    icon: 'document-text-outline',
  },
  {
    key: 'verification',
    name_en: 'Verification',
    name_gu: 'ચકાસણી',
    headline_en: 'In Verification & Inspection',
    headline_gu: 'ચકાસણી અને સ્થળ તપાસ',
    desc_en: 'Document verification and eligibility check underway.',
    desc_gu: 'દસ્તાવેજો અને પાત્રતાની વિગતો ચકાસવામાં આવી રહી છે.',
    icon: 'shield-checkmark-outline',
  },
  {
    key: 'categorised',
    name_en: 'Categorised',
    name_gu: 'વર્ગીકૃત',
    headline_en: 'Desk Categorised',
    headline_gu: 'વિભાગીય વર્ગીકરણ',
    desc_en: 'Application categorised and routed to the welfare department.',
    desc_gu: 'અરજી સંબંધિત કલ્યાણ વિભાગમાં વર્ગીકૃત કરવામાં આવી છે.',
    icon: 'grid-outline',
  },
  {
    key: 'assigned',
    name_en: 'Mentor Assigned',
    name_gu: 'સેવક ફાળવણી',
    headline_en: 'Assigned to Field Mentor',
    headline_gu: 'ક્ષેત્ર સેવકને સોંપેલ',
    desc_en: 'Assigned to local field mentor for on-ground seva.',
    desc_gu: 'સ્થાનિક ક્ષેત્ર સેવકને સ્થળ સહાય માટે સોંપવામાં આવેલ છે.',
    icon: 'person-outline',
  },
  {
    key: 'assistance',
    name_en: 'Assistance',
    name_gu: 'સહાય સેવા',
    headline_en: 'Assistance Active',
    headline_gu: 'સહાય પૂરી પાડવાની કામગીરી',
    desc_en: 'Relief support and welfare scheme delivery underway.',
    desc_gu: 'સ્થળ પર સહાય અને કલ્યાણકારી લાભ પહોંચાડવાની કામગીરી ચાલુ છે.',
    icon: 'hand-left-outline',
  },
  {
    key: 'followUp',
    name_en: 'Follow-Up',
    name_gu: 'ફોલો-અપ',
    headline_en: 'Follow-Up Scheduled',
    headline_gu: 'ફોલો-અપ શેડ્યૂલ',
    desc_en: 'Follow-up review and progress consultation scheduled.',
    desc_gu: 'સ્થિતિ ચકાસણી માટે ફોલો-અપ શેડ્યૂલ કરેલ છે.',
    icon: 'calendar-outline',
  },
  {
    key: 'awaiting_confirmation',
    name_en: 'Confirmation',
    name_gu: 'અરજદાર પુષ્ટિ',
    headline_en: 'Awaiting Confirmation',
    headline_gu: 'અરજદાર દ્વારા પુષ્ટિ બાકી',
    desc_en: 'Assistance delivered. Please review and confirm resolution.',
    desc_gu: 'સહાય પહોંચાડાઈ છે. કૃપા કરીને તપાસીને પુષ્ટિ કરો.',
    icon: 'checkmark-circle-outline',
  },
  {
    key: 'resolved',
    name_en: 'Resolved',
    name_gu: 'સફળતાપૂર્વક પૂર્ણ',
    headline_en: 'Case Resolved & Closed',
    headline_gu: 'કેસ સફળતાપૂર્વક પૂર્ણ થયો',
    desc_en: 'Application has been successfully resolved and sanctioned.',
    desc_gu: 'અરજી સફળતાપૂર્વક પૂર્ણ કરવામાં આવી છે.',
    icon: 'checkmark-done-circle-outline',
  },
];

const getNormalizedStatus = (status: string): string => {
  const s = (status || '').toLowerCase().replace(/[-_]/g, '');
  if (['resolved', 'closed', 'solved'].includes(s)) return 'resolved';
  if (['followup'].includes(s)) return 'followUp';
  if (['onhold'].includes(s)) return 'onHold';
  if (['needmoreinfo', 'needinfo'].includes(s)) return 'needMoreInfo';
  if (['inverification', 'verification'].includes(s)) return 'verification';
  if (['awaitingconfirmation'].includes(s)) return 'awaiting_confirmation';
  return status;
};

export interface ArchedTimelineDialProps {
  status: string;
  language: 'en' | 'gu';
  stages?: WorkflowStage[];
  assigneeName?: string;
  hideAlertBox?: boolean;
  onSelectStage?: (stage: WorkflowStage, index: number) => void;
}

export const ArchedTimelineDial: React.FC<ArchedTimelineDialProps> = ({
  status,
  language,
  stages,
  assigneeName,
  hideAlertBox = false,
  onSelectStage,
}) => {
  const isGu = language === 'gu';
  const scrollRef = useRef<any>(null);

  // Use dynamic stages from API or fallback to default
  const activeStages: WorkflowStage[] = React.useMemo(() => {
    if (stages && Array.isArray(stages) && stages.length > 0) {
      return stages;
    }
    const list = [...DEFAULT_WORKFLOW_STAGES];
    const norm = getNormalizedStatus(status);
    if (norm === 'needMoreInfo') {
      list.splice(2, 0, {
        key: 'needMoreInfo',
        name_en: 'Need Info',
        name_gu: 'વિગત જરૂરી',
        headline_en: 'Additional Details Needed',
        headline_gu: 'વધારાની વિગત જરૂરી',
        desc_en: 'Additional documents or details requested from applicant.',
        desc_gu: 'અરજી આગળ વધારવા માટે વધારાના પુરાવા જરૂરી છે.',
        icon: 'help-circle-outline',
      });
    } else if (norm === 'onHold') {
      list.splice(2, 0, {
        key: 'onHold',
        name_en: 'On Hold',
        name_gu: 'મોકૂફ રાખેલ',
        headline_en: 'Case On Hold',
        headline_gu: 'અરજી મોકૂફ રાખવામાં આવી છે',
        desc_en:
          'Application temporarily on hold pending departmental decision.',
        desc_gu: 'વિભાગીય નિર્ણય પેન્ડિંગ હોવાથી અરજી હાલ મોકૂફ છે.',
        icon: 'pause-circle-outline',
      });
    } else if (norm === 'rejected') {
      list.push({
        key: 'rejected',
        name_en: 'Rejected',
        name_gu: 'અસ્વીકાર',
        headline_en: 'Application Rejected',
        headline_gu: 'અરજી અસ્વીકાર કરવામાં આવી',
        desc_en: 'Application does not meet required eligibility norms.',
        desc_gu: 'નિયમો અનુસાર અરજી મંજૂર થઈ શકી નથી.',
        icon: 'close-circle-outline',
      });
    }
    return list;
  }, [stages, status]);

  // Find active stage index
  const normalizedStatus = getNormalizedStatus(status);
  const activeIndex = React.useMemo(() => {
    const idx = activeStages.findIndex(
      s => getNormalizedStatus(s.key) === normalizedStatus,
    );
    if (idx !== -1) return idx;
    // Fallback status mapping
    if (['received'].includes(normalizedStatus)) return 0;
    if (['verification', 'categorised'].includes(normalizedStatus)) return 1;
    if (['assigned', 'assistance'].includes(normalizedStatus)) return 3;
    if (['resolved', 'closed'].includes(normalizedStatus))
      return activeStages.length - 1;
    return 0;
  }, [activeStages, normalizedStatus]);

  const [selectedIdx, setSelectedIdx] = useState<number>(activeIndex);

  // Sync selected index when activeIndex changes
  useEffect(() => {
    setSelectedIdx(activeIndex);
  }, [activeIndex]);

  // Auto-scroll to active node on mount / status change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef.current && activeIndex >= 0) {
        const itemStep = NODE_WIDTH + CONNECTOR_WIDTH;
        const targetX = Math.max(
          0,
          activeIndex * itemStep - (SCREEN_WIDTH / 2 - NODE_WIDTH / 2 - 24),
        );
        scrollRef.current.scrollTo({ x: targetX, animated: true });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [activeIndex]);

  const selectedStage =
    activeStages[selectedIdx] || activeStages[activeIndex] || activeStages[0];
  const isResolved =
    normalizedStatus === 'resolved' || activeIndex === activeStages.length - 1;

  // Custom alert description based on assignee
  const stageName = isGu
    ? selectedStage.name_gu || (selectedStage as any).nameGu
    : selectedStage.name_en || (selectedStage as any).nameEn;

  const stageHeadline = isGu
    ? selectedStage.headline_gu ||
      (selectedStage as any).headlineGu ||
      stageName
    : selectedStage.headline_en ||
      (selectedStage as any).headlineEn ||
      stageName;

  let messageDesc = isGu
    ? selectedStage.desc_gu || (selectedStage as any).descGu || ''
    : selectedStage.desc_en || (selectedStage as any).descEn || '';

  if (
    (selectedStage.key === 'assigned' || selectedStage.key === 'assistance') &&
    assigneeName
  ) {
    messageDesc = isGu
      ? `સેવક ${assigneeName} ને સ્થળ તપાસ અને સહાય કાર્ય માટે સોંપેલ છે.`
      : `Assigned to field mentor ${assigneeName} for on-ground assistance.`;
  }

  // Visual Alert box styling
  let alertIcon = 'information-circle';
  let alertColor = '#146338';
  let alertBg = '#F0FDF4';

  if (selectedStage.key === 'needMoreInfo' || selectedStage.key === 'onHold') {
    alertIcon = 'alert-circle';
    alertColor = '#EA580C';
    alertBg = '#FFF7ED';
  } else if (selectedStage.key === 'rejected') {
    alertIcon = 'close-circle';
    alertColor = '#DC2626';
    alertBg = '#FEF2F2';
  } else if (selectedStage.key === 'resolved') {
    alertIcon = 'checkmark-done-circle';
    alertColor = '#16A34A';
    alertBg = '#DCFCE7';
  } else if (selectedIdx < activeIndex) {
    alertIcon = 'checkmark-circle';
    alertColor = '#15803D';
    alertBg = '#F0FDF4';
  }

  const handleStagePress = (stage: WorkflowStage, index: number) => {
    setSelectedIdx(index);
    if (onSelectStage) {
      onSelectStage(stage, index);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Header: Title, Slidable Hint & Stage Counter */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>
            {isGu ? 'અરજી પ્રગતિ સમયરેખા' : 'PROCESS TIMELINE'}
          </Text>
          <View style={styles.swipeHintBadge}>
            <Ionicons name="swap-horizontal" size={12} color="#6B7280" />
            <Text style={styles.swipeHintText}>
              {isGu ? 'સરકાવો' : 'Swipe'}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.stageBadge,
            { backgroundColor: isResolved ? '#DCFCE7' : '#F0FDF4' },
          ]}
        >
          <Text
            style={[
              styles.stageBadgeText,
              { color: isResolved ? '#16A34A' : '#146338' },
            ]}
          >
            {isGu
              ? `તબક્કો ${activeIndex + 1} / ${activeStages.length}`
              : `Stage ${activeIndex + 1} of ${activeStages.length}`}
          </Text>
        </View>
      </View>

      {/* 2. Slidable Horizontal Stepper Track */}
      <View style={styles.stepperWrapper}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled
        >
          {activeStages.map((stage, idx) => {
            const isCompleted =
              idx < activeIndex ||
              (isResolved && idx === activeStages.length - 1);
            const isActive = idx === activeIndex && !isResolved;
            const isSelected = idx === selectedIdx;
            const isLast = idx === activeStages.length - 1;

            const name = isGu
              ? stage.name_gu || (stage as any).nameGu
              : stage.name_en || (stage as any).nameEn;

            const iconName =
              stage.icon ||
              (isCompleted
                ? 'checkmark'
                : isActive
                ? 'play'
                : 'ellipse-outline');

            return (
              <React.Fragment key={stage.key || idx}>
                {/* Node Item */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleStagePress(stage, idx)}
                  style={[
                    styles.nodeColumn,
                    isSelected && styles.nodeColumnSelected,
                  ]}
                >
                  {/* Circle Node Graphic */}
                  {isCompleted ? (
                    <View style={styles.nodeDone}>
                      <Ionicons name="checkmark" size={14} color="#ffffff" />
                    </View>
                  ) : isActive ? (
                    <View style={styles.nodeActiveOuter}>
                      <View style={styles.nodeActiveInner}>
                        <Ionicons
                          name={iconName.replace('-outline', '') as any}
                          size={13}
                          color="#ffffff"
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.nodePending}>
                      <Text style={styles.nodePendingNumber}>{idx + 1}</Text>
                    </View>
                  )}

                  {/* Stage Label */}
                  <Text
                    style={[
                      styles.nodeLabel,
                      isActive && styles.nodeLabelActive,
                      isCompleted && styles.nodeLabelDone,
                      isSelected && styles.nodeLabelSelected,
                    ]}
                    numberOfLines={2}
                  >
                    {name}
                  </Text>

                  {/* Status Indicator Pill */}
                  <View
                    style={[
                      styles.statusPill,
                      isActive
                        ? styles.statusPillActive
                        : isCompleted
                        ? styles.statusPillDone
                        : styles.statusPillPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isActive
                          ? styles.statusPillTextActive
                          : isCompleted
                          ? styles.statusPillTextDone
                          : styles.statusPillTextPending,
                      ]}
                    >
                      {isActive
                        ? isGu
                          ? 'ચાલુ'
                          : 'Active'
                        : isCompleted
                        ? isGu
                          ? 'સંપન્ન'
                          : 'Done'
                        : isGu
                        ? 'બાકી'
                        : 'Pending'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Connecting Line Segment between nodes */}
                {!isLast && (
                  <View style={styles.connectorWrap}>
                    <View
                      style={[
                        styles.connectorLine,
                        idx < activeIndex
                          ? styles.connectorLineDone
                          : styles.connectorLinePending,
                      ]}
                    />
                  </View>
                )}
              </React.Fragment>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Dynamic Notification Alert Box */}
      {!hideAlertBox && (
        <View style={[styles.alertBox, { backgroundColor: alertBg }]}>
          <View
            style={[
              styles.alertIconWrap,
              { backgroundColor: `${alertColor}20` },
            ]}
          >
            <Ionicons name={alertIcon as any} size={16} color={alertColor} />
          </View>
          <View style={styles.alertTextWrap}>
            <Text style={[styles.alertHeadline, { color: alertColor }]}>
              {stageHeadline}
            </Text>
            {messageDesc ? (
              <Text style={styles.alertDescription}>{messageDesc}</Text>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#9CA3AF',
  },
  swipeHintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 999,
  },
  swipeHintText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#6B7280',
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  stageBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  stepperWrapper: {
    marginHorizontal: -4,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  nodeColumn: {
    width: NODE_WIDTH,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 8,
  },
  nodeColumnSelected: {
    backgroundColor: '#F9FAFB',
  },
  nodeDone: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  nodeActiveOuter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#146338',
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#146338',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  nodeActiveInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#146338',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodePending: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodePendingNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  nodeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    minHeight: 28,
    lineHeight: 14,
    paddingHorizontal: 2,
  },
  nodeLabelActive: {
    fontWeight: '800',
    color: '#146338',
  },
  nodeLabelDone: {
    color: '#15803D',
    fontWeight: '700',
  },
  nodeLabelSelected: {
    color: '#111827',
  },
  statusPill: {
    marginTop: 3,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 999,
  },
  statusPillActive: {
    backgroundColor: '#DCFCE7',
    borderWidth: 0.5,
    borderColor: '#86EFAC',
  },
  statusPillDone: {
    backgroundColor: '#F0FDF4',
  },
  statusPillPending: {
    backgroundColor: '#F3F4F6',
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '700',
  },
  statusPillTextActive: {
    color: '#146338',
  },
  statusPillTextDone: {
    color: '#16A34A',
  },
  statusPillTextPending: {
    color: '#9CA3AF',
  },
  connectorWrap: {
    width: CONNECTOR_WIDTH,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectorLine: {
    width: '100%',
    height: 3,
    borderRadius: 2,
  },
  connectorLineDone: {
    backgroundColor: '#16A34A',
  },
  connectorLinePending: {
    backgroundColor: '#E5E7EB',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  alertIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  alertTextWrap: {
    flex: 1,
  },
  alertHeadline: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  alertDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: '#374151',
  },
});
