import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal, TextInput, Alert,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColors } from '../context/ThemeContext';
import { AppRootParamList } from '../navigation/RootNavigator';
import { dataService } from '../services/dataService';
import { TeacherSchedule, AppointmentStatus, Appointment } from '../types/models';
import UserAvatar from '../components/UserAvatar';

type NavProp    = NativeStackNavigationProp<AppRootParamList>;
type RoutePropT = RouteProp<AppRootParamList, 'TeacherProfile'>;

const DAY_FULL   = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MONTH_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const WEEKDAYS   = [1, 2, 3, 4, 5];

function nextDateLabel(dayOfWeek: number): string {
  const today = new Date();
  const diff = (dayOfWeek - today.getDay() + 7) % 7;
  const d = new Date(today);
  d.setDate(d.getDate() + diff);
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

const WORK_START_HOUR = 9;
const WORK_END_HOUR   = 17;

const slotHour = (timeStr: string) => parseInt(timeStr.split(':')[0], 10);
const isWorkHour = (timeStr: string) => {
  const h = slotHour(timeStr);
  return h >= WORK_START_HOUR && h < WORK_END_HOUR;
};

function toLocalIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
}

function nextOccurrence(dayOfWeek: number, startHour: number): Date {
  const now   = new Date();
  const today = now.getDay();
  let daysAhead = dayOfWeek - today;
  if (daysAhead < 0 || (daysAhead === 0 && now.getHours() >= startHour)) daysAhead += 7;
  const d = new Date(now);
  d.setDate(d.getDate() + daysAhead);
  d.setHours(startHour, 0, 0, 0);
  return d;
}

export default function TeacherProfileScreen() {
  const c          = useColors();
  const s          = useMemo(() => makeStyles(c), [c]);
  const navigation = useNavigation<NavProp>();
  const route      = useRoute<RoutePropT>();
  const { teacher } = route.params;

  const [schedules, setSchedules]           = useState<TeacherSchedule[]>([]);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [loadingSlots, setLoadingSlots]     = useState(true);
  const [selectedDay, setSelectedDay]       = useState<number>(1);
  const initialDaySet                       = useRef(false);
  const [now, setNow]                       = useState(() => new Date());

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TeacherSchedule | null>(null);
  const [description, setDescription]   = useState('');
  const [submitting, setSubmitting]     = useState(false);

  // Saati her dakika güncelle
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoadingSlots(true);
    try {
      const [schedRes, apptRes] = await Promise.all([
        dataService.getTeacherSchedules(teacher.id),
        dataService.getMyAppointments(),
      ]);
      setSchedules(schedRes.data);
      setMyAppointments(apptRes.data.filter((a: Appointment) => a.teacherId === teacher.id));
    } catch {
      setSchedules([]);
      setMyAppointments([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [teacher.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // İlk yüklemede Müsait slotu olan ilk günü seç
  useEffect(() => {
    if (initialDaySet.current || schedules.length === 0) return;
    const firstAvailable = WEEKDAYS.find(d =>
      schedules.some(sl => sl.dayOfWeek === d && sl.type === 'Müsait' && sl.isAvailable)
    );
    if (firstAvailable !== undefined) setSelectedDay(firstAvailable);
    initialDaySet.current = true;
  }, [schedules]);

  const currentDayOfWeek = now.getDay();
  const currentHour      = now.getHours();

  const daySlots = useMemo(
    () => schedules
      .filter(sl => sl.dayOfWeek === selectedDay && isWorkHour(sl.startTime))
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [schedules, selectedDay],
  );

  // Öğrencinin bu slota ait kendi randevusu (varsa) — "Senin talebin" etiketi için
  const myApptForSlot = useCallback(
    (slot: TeacherSchedule) => myAppointments.find(a => a.scheduleId === slot.id),
    [myAppointments],
  );

  const getSlotState = useCallback(
    (slot: TeacherSchedule): 'available' | 'pending' | 'taken' | 'inClass' => {
      if (slot.type === 'Ders' || slot.type === 'EkDers') return 'inClass';

      // 1) Önce öğrencinin kendi randevusu (anlık tazelik için /appointments/mine'dan)
      const myAppt = myApptForSlot(slot);
      if (myAppt?.status === AppointmentStatus.Pending)  return 'pending';
      if (myAppt?.status === AppointmentStatus.Approved) return 'taken';

      // 2) Backend'in hesapladığı yetkili durum (diğer öğrenciler + AI talepleri dahil)
      if (slot.status === 'Pending') return 'pending';
      if (slot.status === 'Booked')  return 'taken';

      // 3) Geriye dönük uyumluluk: status alanı yoksa eski isAvailable bayrağına düş
      if (!slot.isAvailable) return 'taken';
      return 'available';
    },
    [myApptForSlot],
  );

  const isNowSlot = useCallback(
    (slot: TeacherSchedule) => {
      if (slot.dayOfWeek !== currentDayOfWeek) return false;
      const sh = slotHour(slot.startTime);
      const eh = slotHour(slot.endTime);
      return currentHour >= sh && currentHour < eh;
    },
    [currentDayOfWeek, currentHour],
  );

  // Hocanın şu anki genel durumunu hesapla (profil kartı için)
  const currentTeacherStatus = useMemo(() => {
    const nowSlot = schedules.find(slot =>
      slot.dayOfWeek === currentDayOfWeek &&
      currentHour >= slotHour(slot.startTime) &&
      currentHour < slotHour(slot.endTime) &&
      isWorkHour(slot.startTime),
    );
    if (!nowSlot) return null;
    if (nowSlot.type === 'Ders' || nowSlot.type === 'EkDers')
      return { text: 'Şu an Derste', color: c.primary };
    if (!nowSlot.isAvailable)
      return { text: 'Şu an Dolu', color: c.textMuted };
    return { text: 'Şu an Müsait', color: c.success };
  }, [schedules, currentDayOfWeek, currentHour, c]);

  const handleSlotPress = (slot: TeacherSchedule) => {
    if (getSlotState(slot) !== 'available') return;
    setSelectedSlot(slot);
    setDescription('');
    setModalVisible(true);
  };

  const handleRequestAppointment = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      const date = nextOccurrence(selectedSlot.dayOfWeek, slotHour(selectedSlot.startTime));
      await dataService.createAppointment({
        teacherId:       teacher.id,
        scheduleId:      selectedSlot.id,
        appointmentDate: toLocalIso(date),
        description:     description.trim(),
      });
      setModalVisible(false);
      Alert.alert('Randevu İsteği Gönderildi', `${teacher.name} adlı hocaya randevu isteğiniz iletildi.`);
      fetchAll();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Randevu oluşturulamadı. Lütfen tekrar deneyin.';
      Alert.alert('Hata', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const slotLabel = (slot: TeacherSchedule) =>
    `${slot.startTime.substring(0, 5)} - ${slot.endTime.substring(0, 5)}`;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>Akademisyen Profili</Text>
        {/* Sağ üst mesaj butonu kaldırıldı; başlığın ortalı kalması için boş alan bırakıldı. */}
        <View style={s.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Profil Kartı */}
        <View style={s.profileCard}>
          <UserAvatar name={teacher.name} size={120} backgroundColor={c.primary} imageUrl={teacher.profileImageUrl} />
          <Text style={s.name}>{teacher.name}</Text>

          {/* Uzmanlık alanı */}
          {teacher.specialty ? (
            <Text style={s.specialty}>{teacher.specialty}</Text>
          ) : null}

          {/* Oda numarası (yoksa ofis konumuna düşer) */}
          {teacher.roomNumber ? (
            <View style={s.infoRow}>
              <Ionicons name="business-outline" size={15} color={c.textMuted} />
              <Text style={s.infoText}>Oda: {teacher.roomNumber}</Text>
            </View>
          ) : teacher.officeLocation ? (
            <View style={s.infoRow}>
              <Ionicons name="location-outline" size={15} color={c.textMuted} />
              <Text style={s.infoText}>{teacher.officeLocation}</Text>
            </View>
          ) : null}

          {teacher.bio ? (
            <Text style={s.bio}>{teacher.bio}</Text>
          ) : null}

          {teacher.researchAreas ? (
            <View style={s.researchWrap}>
              <Text style={s.researchLabel}>Araştırma Alanları</Text>
              <Text style={s.researchText}>{teacher.researchAreas}</Text>
            </View>
          ) : null}

          {/* Anlık durum bandı */}
          {currentTeacherStatus ? (
            <View style={[
              s.statusBanner,
              { borderColor: currentTeacherStatus.color, backgroundColor: currentTeacherStatus.color + '18' },
            ]}>
              <View style={[s.statusDot, { backgroundColor: currentTeacherStatus.color }]} />
              <Text style={[s.statusText, { color: currentTeacherStatus.color }]}>
                {currentTeacherStatus.text}
              </Text>
            </View>
          ) : null}

          {/* Mesaj Gönder butonu */}
          <TouchableOpacity
            style={s.msgBtn}
            onPress={() => navigation.navigate('Chat', { teacher })}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={17} color="#fff" />
            <Text style={s.msgBtnText}>Mesaj Gönder</Text>
          </TouchableOpacity>
        </View>

        {/* Randevu Takvimi */}
        <View style={s.section}>
          <View style={s.sectionTitleRow}>
            <Text style={s.sectionTitle}>Randevu Takvimi</Text>
            <View style={s.datePill}>
              <Ionicons name="calendar-outline" size={12} color={c.primary} />
              <Text style={s.datePillText}>{nextDateLabel(selectedDay)}</Text>
            </View>
          </View>

          {/* Gün sekmeleri */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dayTabs}>
            {WEEKDAYS.map(d => (
              <TouchableOpacity
                key={d}
                style={[s.dayTab, selectedDay === d && s.dayTabActive]}
                onPress={() => setSelectedDay(d)}
              >
                <Text style={[s.dayTabText, selectedDay === d && s.dayTabTextActive]}>
                  {DAY_FULL[d]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Slotlar */}
          {loadingSlots ? (
            <ActivityIndicator color={c.primary} style={{ marginTop: 24 }} />
          ) : daySlots.length === 0 ? (
            <View style={s.emptySlots}>
              <Ionicons name="calendar-outline" size={36} color={c.textMuted} />
            </View>
          ) : (
            <View style={s.slotGrid}>
              {daySlots.map(slot => {
                const state       = getSlotState(slot);
                const isNow       = isNowSlot(slot);
                const isClickable = state === 'available';
                const isMinePending =
                  state === 'pending' &&
                  myApptForSlot(slot)?.status === AppointmentStatus.Pending;

                const iconName =
                  state === 'available' ? 'time-outline'        :
                  state === 'pending'   ? 'hourglass-outline'   :
                  state === 'inClass'   ? 'book-outline'        :
                                          'close-circle-outline';

                const iconColor =
                  state === 'available' ? c.success  :
                  state === 'pending'   ? c.warning   :
                  state === 'inClass'   ? c.primary   :
                                          c.textMuted;

                // "Şu an ..." etiketi yalnızca mevcut saat dilimine ait slotta gösterilir
                const badgeText =
                  isNow
                    ? (state === 'available' ? 'Şu an Müsait' :
                       state === 'inClass'   ? 'Şu an Derste' :
                                               'Şu an Dolu')
                    : (state === 'available' ? 'Müsait'   :
                       state === 'pending'   ? 'Bekliyor' :
                       state === 'inClass'   ? 'Derste'   :
                                               'Dolu');

                return (
                  <TouchableOpacity
                    key={slot.id}
                    style={[
                      s.slotBtn,
                      state === 'available' ? s.slotAvailable :
                      state === 'pending'   ? s.slotPending   :
                      state === 'inClass'   ? s.slotInClass   :
                                              s.slotTaken,
                      isNow && s.slotNow,
                    ]}
                    onPress={() => handleSlotPress(slot)}
                    disabled={!isClickable}
                    activeOpacity={isClickable ? 0.7 : 1}
                  >
                    <Ionicons name={iconName} size={16} color={iconColor} style={{ marginBottom: 4 }} />
                    <Text style={[
                      s.slotText,
                      state === 'available' ? s.slotAvailableText :
                      state === 'pending'   ? s.slotPendingText   :
                      state === 'inClass'   ? s.slotInClassText   :
                                              s.slotTakenText,
                    ]}>
                      {slotLabel(slot)}
                    </Text>
                    <Text style={[
                      s.slotBadge,
                      isNow && s.slotBadgeNow,
                      state === 'available' ? s.slotBadgeAvailable :
                      state === 'pending'   ? s.slotBadgePending   :
                      state === 'inClass'   ? s.slotBadgeInClass   :
                                              s.slotBadgeTaken,
                    ]}>
                      {badgeText}
                    </Text>
                    {isMinePending ? (
                      <Text style={s.slotMineHint} numberOfLines={1}>Senin talebin</Text>
                    ) : null}
                    {state === 'inClass' && slot.courseName ? (
                      <Text style={s.slotCourseHint} numberOfLines={1}>{slot.courseName}</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Randevu İstek Modalı */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Randevu İste</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={c.text} />
              </TouchableOpacity>
            </View>

            {selectedSlot && (
              <View style={s.modalSlotInfo}>
                <Ionicons name="time-outline" size={16} color={c.primary} />
                <Text style={s.modalSlotText}>
                  {DAY_FULL[selectedSlot.dayOfWeek]}  •  {slotLabel(selectedSlot)}
                </Text>
              </View>
            )}

            <Text style={s.modalLabel}>Açıklama (isteğe bağlı)</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Görüşme konusunu kısaca belirtin…"
              placeholderTextColor={c.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={500}
            />

            <TouchableOpacity
              style={[s.modalBtn, submitting && { opacity: 0.6 }]}
              onPress={handleRequestAppointment}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.modalBtnText}>Randevu İste</Text>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: c.primary, paddingHorizontal: 16, paddingVertical: 14,
    },
    headerTitle: {
      flex: 1, color: '#fff', fontSize: 17, fontWeight: '700',
      textAlign: 'center', marginHorizontal: 8,
    },
    // Sağdaki mesaj ikonu kaldırıldı; başlığı ortalı tutmak için ok ile aynı genişlikte boşluk.
    headerSpacer: { width: 24 },

    scroll: { paddingBottom: 40 },

    profileCard: {
      backgroundColor: c.surface, margin: 16, borderRadius: 20, padding: 24,
      alignItems: 'center', gap: 10,
      borderWidth: 1, borderColor: c.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    name: { fontSize: 18, fontWeight: '800', color: c.text, textAlign: 'center' },
    specialty: { fontSize: 14, fontWeight: '700', color: c.primary, textAlign: 'center' },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    infoText: { fontSize: 13, color: c.textSecondary },
    bio: { fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 20 },
    researchWrap: {
      alignSelf: 'stretch', backgroundColor: c.background,
      borderRadius: 10, padding: 12, marginTop: 4,
    },
    researchLabel: {
      fontSize: 11, fontWeight: '700', color: c.primary,
      marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    researchText: { fontSize: 13, color: c.textSecondary, lineHeight: 19 },

    // Anlık durum bandı (profil kartı altı)
    statusBanner: {
      flexDirection: 'row', alignItems: 'center', gap: 7,
      paddingHorizontal: 14, paddingVertical: 7,
      borderRadius: 20, borderWidth: 1.5, marginTop: 4,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: 13, fontWeight: '700' },

    // Mesaj butonu (profil kartı içi)
    msgBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 7,
      backgroundColor: c.primary, borderRadius: 22,
      paddingHorizontal: 20, paddingVertical: 10, marginTop: 6, alignSelf: 'stretch',
      justifyContent: 'center',
    },
    msgBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

    section: { marginHorizontal: 16 },
    sectionTitleRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: 14,
    },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: c.text },
    datePill: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: c.primaryLight, borderRadius: 12,
      paddingHorizontal: 10, paddingVertical: 4,
    },
    datePillText: { fontSize: 12, fontWeight: '700', color: c.primary },

    dayTabs: { gap: 8, paddingBottom: 14 },
    dayTab: {
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
    },
    dayTabActive: { backgroundColor: c.primary, borderColor: c.primary },
    dayTabText: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
    dayTabTextActive: { color: '#fff' },

    slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    slotBtn: {
      width: '47%', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 8,
      alignItems: 'center', borderWidth: 1.5,
    },
    // Aktif (şu anki) slot için ekstra vurgu
    slotNow: {
      borderWidth: 2.5,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.14, shadowRadius: 6, elevation: 5,
    },
    slotAvailable: { backgroundColor: c.successLight, borderColor: c.success },
    slotPending:   { backgroundColor: c.warningLight, borderColor: c.warning, opacity: 0.9 },
    slotTaken:     { backgroundColor: c.surface, borderColor: c.border, opacity: 0.55 },
    slotInClass:   { backgroundColor: c.primaryLight, borderColor: c.primary, opacity: 0.85 },

    slotText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },
    slotAvailableText: { color: '#065F46' },
    slotPendingText:   { color: '#92400E' },
    slotTakenText:     { color: c.textMuted },
    slotInClassText:   { color: c.primary },

    slotBadge:    { fontSize: 10, fontWeight: '600', marginTop: 4, letterSpacing: 0.3 },
    slotBadgeNow: { fontSize: 11, fontWeight: '800' },
    slotBadgeAvailable: { color: c.success },
    slotBadgePending:   { color: c.warning },
    slotBadgeTaken:     { color: c.textMuted },
    slotBadgeInClass:   { color: c.primary },

    slotCourseHint: { fontSize: 9, color: c.primary, marginTop: 2, textAlign: 'center', opacity: 0.8 },
    slotMineHint:   { fontSize: 9, color: c.warning, marginTop: 2, textAlign: 'center', fontWeight: '700' },

    emptySlots: { alignItems: 'center', paddingVertical: 32 },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modalCard: {
      backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, gap: 14,
    },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: c.text },
    modalSlotInfo: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: c.background, borderRadius: 10, padding: 10,
    },
    modalSlotText: { fontSize: 14, fontWeight: '600', color: c.text },
    modalLabel: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
    modalInput: {
      backgroundColor: c.background, borderRadius: 12, padding: 12,
      fontSize: 14, color: c.text, minHeight: 80, textAlignVertical: 'top',
      borderWidth: 1, borderColor: c.border,
    },
    modalBtn: {
      backgroundColor: c.primary, borderRadius: 14, paddingVertical: 14,
      alignItems: 'center', marginTop: 4,
    },
    modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  });
