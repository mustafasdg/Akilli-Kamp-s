import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Modal, Alert, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useColors } from '../context/ThemeContext';
import { dataService } from '../services/dataService';
import { TeacherSchedule, Appointment, AppointmentStatus } from '../types/models';

const DAY_FULL  = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const WEEKDAYS  = [1, 2, 3, 4, 5];

const isWorkHour = (t: string) => { const h = parseInt(t.split(':')[0], 10); return h >= 9 && h < 17; };

type SlotState = 'musait' | 'randevulu' | 'ders' | 'ekders';

export default function TeacherDashboardScreen() {
  const c          = useColors();
  const s          = useMemo(() => makeStyles(c), [c]);
  const navigation = useNavigation();
  const { user }   = useAuth();

  const [schedules,    setSchedules]    = useState<TeacherSchedule[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedDay,  setSelectedDay]  = useState<number>(1);

  // EkDers ekleme formu
  const [ekDersModal,       setEkDersModal]       = useState(false);
  const [targetSlot,        setTargetSlot]        = useState<TeacherSchedule | null>(null);
  const [formCourseName,    setFormCourseName]    = useState('');
  const [formClassLocation, setFormClassLocation] = useState('');
  const [saving,            setSaving]            = useState(false);

  // Ders detay modalı (read-only)
  const [detailSlot, setDetailSlot] = useState<TeacherSchedule | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [schedRes, apptRes] = await Promise.all([
        dataService.getTeacherSchedules(user.id),
        dataService.getMyAppointments(),
      ]);
      setSchedules(schedRes.data);
      setAppointments(apptRes.data);
    } catch {
      Alert.alert('Hata', 'Program bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const daySlots = useMemo(
    () => schedules
      .filter(sc => sc.dayOfWeek === selectedDay && isWorkHour(sc.startTime))
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [schedules, selectedDay],
  );

  const slotAppointment = useCallback(
    (slotId: number): Appointment | undefined =>
      appointments.find(
        a => a.scheduleId === slotId &&
             (a.status === AppointmentStatus.Pending || a.status === AppointmentStatus.Approved),
      ),
    [appointments],
  );

  const getSlotState = useCallback(
    (slot: TeacherSchedule): SlotState => {
      if (slot.type === 'Ders')   return 'ders';
      if (slot.type === 'EkDers') return 'ekders';
      if (slotAppointment(slot.id)) return 'randevulu';
      return 'musait';
    },
    [slotAppointment],
  );

  // "+" butonuna basıldığında: EkDers formunu bu slot için aç
  const openEkDersForm = (slot: TeacherSchedule) => {
    setTargetSlot(slot);
    setFormCourseName('');
    setFormClassLocation('');
    setEkDersModal(true);
  };

  const handleMarkAsEkDers = async () => {
    if (!targetSlot) return;
    if (!formCourseName.trim()) {
      Alert.alert('Uyarı', 'Ders adı boş bırakılamaz.');
      return;
    }
    setSaving(true);
    try {
      await dataService.markSlotAsEkDers(targetSlot.id, {
        courseName:    formCourseName.trim(),
        classLocation: formClassLocation.trim() || undefined,
      });
      setEkDersModal(false);
      await fetchAll();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Ek ders eklenemedi.';
      Alert.alert('Hata', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleResetSlot = (slot: TeacherSchedule) => {
    Alert.alert(
      'Ek Dersi Kaldır',
      `"${slot.courseName ?? 'Ek Ders'}" dersini kaldırıp bu saati Müsait yapmak istiyor musunuz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Evet, Müsait Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await dataService.resetSlot(slot.id);
              await fetchAll();
            } catch (err: any) {
              Alert.alert('Hata', err?.response?.data?.message ?? 'İşlem başarısız.');
            }
          },
        },
      ],
    );
  };

  const renderSlotCard = (slot: TeacherSchedule) => {
    const state = getSlotState(slot);
    const appt  = slotAppointment(slot.id);
    const timeLabel = `${slot.startTime.substring(0, 5)} – ${slot.endTime.substring(0, 5)}`;

    const cardStyle = [
      s.slotCard,
      state === 'ders'      && s.slotCardDers,
      state === 'ekders'    && s.slotCardEkDers,
      state === 'randevulu' && s.slotCardRandevulu,
    ];

    const badgeLabel =
      state === 'ders'      ? 'Sabit Ders' :
      state === 'ekders'    ? 'Ek Ders'    :
      state === 'randevulu' ? 'Randevulu'  :
                              'Müsait';

    const badgeStyle = [
      s.badge,
      state === 'ders'      && s.badgeDers,
      state === 'ekders'    && s.badgeEkDers,
      state === 'randevulu' && s.badgeRandevulu,
      state === 'musait'    && s.badgeMüsait,
    ];

    const iconName: any =
      state === 'ders'      ? 'book-outline'          :
      state === 'ekders'    ? 'clipboard-outline'      :
      state === 'randevulu' ? 'person-circle-outline'  :
                              'checkmark-circle-outline';

    const iconColor =
      state === 'ders'      ? c.primary  :
      state === 'ekders'    ? '#7C3AED'  :
      state === 'randevulu' ? c.warning  :
                              c.success;

    return (
      <View key={slot.id} style={cardStyle}>
        {/* Üst satır: ikon + saat + badge + aksiyon butonu */}
        <View style={s.slotRow}>
          <View style={s.slotTimeBox}>
            <Ionicons name={iconName} size={16} color={iconColor} />
            <Text style={[s.slotTime, { color: iconColor }]}>{timeLabel}</Text>
          </View>

          <View style={s.slotRowRight}>
            <Text style={badgeStyle}>{badgeLabel}</Text>

            {/* Müsait → "+" ile EkDers ekle */}
            {state === 'musait' && (
              <TouchableOpacity
                onPress={() => openEkDersForm(slot)}
                hitSlop={10}
                style={s.actionBtn}
              >
                <Ionicons name="add-circle-outline" size={22} color="#7C3AED" />
              </TouchableOpacity>
            )}

            {/* EkDers → "×" ile Müsait'e sıfırla */}
            {state === 'ekders' && (
              <TouchableOpacity
                onPress={() => handleResetSlot(slot)}
                hitSlop={10}
                style={s.actionBtn}
              >
                <Ionicons name="close-circle-outline" size={22} color={c.error} />
              </TouchableOpacity>
            )}

            {/* Ders → detay için bilgi ikonu */}
            {state === 'ders' && (
              <TouchableOpacity
                onPress={() => setDetailSlot(slot)}
                hitSlop={10}
                style={s.actionBtn}
              >
                <Ionicons name="information-circle-outline" size={22} color={c.primary} />
              </TouchableOpacity>
            )}
            {/* Randevulu → aksiyon yok */}
          </View>
        </View>

        {/* Ders / EkDers ek bilgisi */}
        {(state === 'ders' || state === 'ekders') && slot.courseName ? (
          <View style={s.courseInfo}>
            <Text style={s.courseNameText}>{slot.courseName}</Text>
            {slot.classLocation ? (
              <View style={s.locationRow}>
                <Ionicons name="location-outline" size={12} color={c.textMuted} />
                <Text style={s.locationText}>{slot.classLocation}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Randevulu slot → öğrenci bilgisi */}
        {state === 'randevulu' && appt ? (
          <View style={s.apptInfo}>
            <Ionicons
              name={appt.status === AppointmentStatus.Approved ? 'checkmark-circle-outline' : 'hourglass-outline'}
              size={14}
              color={appt.status === AppointmentStatus.Approved ? c.success : c.warning}
            />
            <Text style={s.apptInfoText} numberOfLines={1}>
              {appt.studentName}
              {' — '}
              {appt.status === AppointmentStatus.Approved ? 'Onaylı' : 'Bekliyor'}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Ders Programı Yönetimi</Text>
        <TouchableOpacity onPress={fetchAll} hitSlop={12}>
          <Ionicons name="refresh-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Gün sekmeleri */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.dayTabs}
        style={s.dayTabsWrap}
      >
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

      {/* Açıklama satırı */}
      <View style={s.legendRow}>
        <View style={s.legendItem}>
          <Ionicons name="add-circle-outline" size={14} color="#7C3AED" />
          <Text style={s.legendText}>EkDers ekle</Text>
        </View>
        <View style={s.legendItem}>
          <Ionicons name="close-circle-outline" size={14} color={c.error} />
          <Text style={s.legendText}>EkDers kaldır</Text>
        </View>
        <View style={s.legendItem}>
          <Ionicons name="information-circle-outline" size={14} color={c.primary} />
          <Text style={s.legendText}>Ders detayı</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={c.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {daySlots.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="calendar-outline" size={42} color={c.textMuted} />
              <Text style={s.emptyText}>{DAY_FULL[selectedDay]} için program eklenmemiş.</Text>
            </View>
          ) : (
            daySlots.map(slot => renderSlotCard(slot))
          )}
        </ScrollView>
      )}

      {/* ── EkDers Ekleme Formu ─────────────────────────────────────────── */}
      <Modal visible={ekDersModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>Ek Ders / Etkinlik Ekle</Text>
                {targetSlot ? (
                  <Text style={s.modalSubtitle}>
                    {DAY_FULL[targetSlot.dayOfWeek]}  •  {targetSlot.startTime.substring(0, 5)} – {targetSlot.endTime.substring(0, 5)}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity onPress={() => setEkDersModal(false)}>
                <Ionicons name="close" size={22} color={c.text} />
              </TouchableOpacity>
            </View>

            <Text style={s.formLabel}>Ders Adı *</Text>
            <TextInput
              style={s.formInput}
              placeholder="Örn: Veri Yapıları Tekrar Dersi"
              placeholderTextColor={c.textMuted}
              value={formCourseName}
              onChangeText={setFormCourseName}
              maxLength={100}
            />

            <Text style={s.formLabel}>Sınıf / Konum</Text>
            <TextInput
              style={s.formInput}
              placeholder="Örn: A-202"
              placeholderTextColor={c.textMuted}
              value={formClassLocation}
              onChangeText={setFormClassLocation}
              maxLength={60}
            />

            <TouchableOpacity
              style={[s.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleMarkAsEkDers}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.saveBtnText}>Ekle</Text>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Ders Detay Modalı (read-only) ──────────────────────────────── */}
      <Modal visible={!!detailSlot} transparent animationType="fade">
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setDetailSlot(null)}
        >
          <View style={s.detailCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Sabit Ders Bilgisi</Text>
              <TouchableOpacity onPress={() => setDetailSlot(null)}>
                <Ionicons name="close" size={22} color={c.text} />
              </TouchableOpacity>
            </View>
            {detailSlot && (
              <>
                <View style={s.detailRow}>
                  <Ionicons name="book-outline" size={18} color={c.primary} />
                  <Text style={s.detailValue}>{detailSlot.courseName ?? '—'}</Text>
                </View>
                <View style={s.detailRow}>
                  <Ionicons name="time-outline" size={18} color={c.primary} />
                  <Text style={s.detailValue}>
                    {DAY_FULL[detailSlot.dayOfWeek]}{'  '}{detailSlot.startTime.substring(0, 5)} – {detailSlot.endTime.substring(0, 5)}
                  </Text>
                </View>
                {detailSlot.classLocation ? (
                  <View style={s.detailRow}>
                    <Ionicons name="location-outline" size={18} color={c.primary} />
                    <Text style={s.detailValue}>{detailSlot.classLocation}</Text>
                  </View>
                ) : null}
                <Text style={s.detailNote}>
                  Bu ders sistem tarafından tanımlanmıştır ve değiştirilemez.
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>
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

    dayTabsWrap: { flexGrow: 0 },
    dayTabs: { gap: 8, padding: 16, paddingBottom: 8 },
    dayTab: {
      paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
      backgroundColor: c.surface, borderWidth: 1, borderColor: c.border,
    },
    dayTabActive: { backgroundColor: c.primary, borderColor: c.primary },
    dayTabText: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
    dayTabTextActive: { color: '#fff' },

    legendRow: {
      flexDirection: 'row', gap: 16, paddingHorizontal: 16, paddingBottom: 8,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendText: { fontSize: 11, color: c.textMuted },

    list: { padding: 16, gap: 10, paddingBottom: 40 },

    // ── Slot kartları ──────────────────────────────────────────────────
    slotCard: {
      backgroundColor: c.surface, borderRadius: 14, padding: 14,
      borderWidth: 1.5, borderColor: c.border, gap: 8,
    },
    slotCardDers:      { borderColor: c.primary, backgroundColor: c.primaryLight },
    slotCardEkDers:    { borderColor: '#7C3AED', backgroundColor: '#F5F3FF' },
    slotCardRandevulu: { borderColor: c.warning, backgroundColor: c.warningLight },

    slotRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    slotRowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    slotTimeBox:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
    slotTime:     { fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
    actionBtn:    { padding: 2 },

    badge: {
      fontSize: 11, fontWeight: '700',
      paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: 20, overflow: 'hidden',
      color: c.textSecondary, backgroundColor: c.border,
    },
    badgeDers:      { backgroundColor: c.primary, color: '#fff' },
    badgeEkDers:    { backgroundColor: '#7C3AED', color: '#fff' },
    badgeRandevulu: { backgroundColor: c.warning, color: '#fff' },
    badgeMüsait:    { backgroundColor: c.success, color: '#fff' },

    courseInfo:     { gap: 3 },
    courseNameText: { fontSize: 13, fontWeight: '700', color: c.text },
    locationRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
    locationText:   { fontSize: 12, color: c.textMuted },

    apptInfo: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5,
      backgroundColor: c.background,
    },
    apptInfoText: { fontSize: 12, fontWeight: '600', color: c.text, flex: 1 },

    empty:     { alignItems: 'center', paddingVertical: 36, gap: 10 },
    emptyText: { fontSize: 14, color: c.textMuted },
    center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // ── Modaller ortak ─────────────────────────────────────────────────
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modalCard: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, gap: 4,
    },
    modalHeader: {
      flexDirection: 'row', alignItems: 'flex-start',
      justifyContent: 'space-between', marginBottom: 12,
    },
    modalTitle:    { fontSize: 17, fontWeight: '700', color: c.text },
    modalSubtitle: { fontSize: 13, color: c.textMuted, marginTop: 2 },

    // ── EkDers formu ───────────────────────────────────────────────────
    formLabel: {
      fontSize: 13, fontWeight: '600', color: c.textSecondary,
      marginBottom: 6, marginTop: 10,
    },
    formInput: {
      backgroundColor: c.background, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 10,
      fontSize: 14, color: c.text, borderWidth: 1, borderColor: c.border,
    },
    saveBtn: {
      backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 14,
      alignItems: 'center', marginTop: 18,
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    // ── Ders detay modalı ──────────────────────────────────────────────
    detailCard: {
      backgroundColor: c.surface, borderRadius: 20,
      margin: 32, padding: 24, gap: 14,
    },
    detailRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
    detailValue: { fontSize: 15, color: c.text, fontWeight: '600', flex: 1 },
    detailNote: { fontSize: 12, color: c.textMuted, fontStyle: 'italic', marginTop: 4 },
  });
