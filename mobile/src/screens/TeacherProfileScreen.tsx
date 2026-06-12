import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
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
import { TeacherSchedule, AppointmentStatus } from '../types/models';
import UserAvatar from '../components/UserAvatar';

type NavProp   = NativeStackNavigationProp<AppRootParamList>;
type RoutePropT = RouteProp<AppRootParamList, 'TeacherProfile'>;

const DAY_LABELS = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
const DAY_FULL   = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const WEEKDAYS   = [1, 2, 3, 4, 5]; // Pazartesi–Cuma

function nextOccurrence(dayOfWeek: number, startHour: number): Date {
  const now  = new Date();
  const today = now.getDay();
  let daysAhead = dayOfWeek - today;
  if (daysAhead < 0 || (daysAhead === 0 && now.getHours() >= startHour)) {
    daysAhead += 7;
  }
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

  const [schedules, setSchedules]         = useState<TeacherSchedule[]>([]);
  const [loadingSlots, setLoadingSlots]   = useState(true);
  const [selectedDay, setSelectedDay]     = useState<number>(1);

  const [modalVisible, setModalVisible]   = useState(false);
  const [selectedSlot, setSelectedSlot]   = useState<TeacherSchedule | null>(null);
  const [description, setDescription]     = useState('');
  const [submitting, setSubmitting]       = useState(false);

  const fetchSchedules = useCallback(async () => {
    setLoadingSlots(true);
    try {
      const res = await dataService.getTeacherSchedules(teacher.id);
      setSchedules(res.data);
    } catch {
      setSchedules([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [teacher.id]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const daySlots = useMemo(
    () => schedules
      .filter(s => s.dayOfWeek === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [schedules, selectedDay],
  );

  const handleSlotPress = (slot: TeacherSchedule) => {
    if (!slot.isAvailable) return;
    setSelectedSlot(slot);
    setDescription('');
    setModalVisible(true);
  };

  const handleRequestAppointment = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    try {
      const date = nextOccurrence(selectedSlot.dayOfWeek, parseInt(selectedSlot.startTime.split(':')[0], 10));
      await dataService.createAppointment({
        teacherId:       teacher.id,
        scheduleId:      selectedSlot.id,
        appointmentDate: date.toISOString(),
        description:     description.trim(),
      });
      setModalVisible(false);
      Alert.alert('Randevu İsteği Gönderildi', `${teacher.name} adlı hocaya randevu isteğiniz iletildi.`);
      fetchSchedules();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Randevu oluşturulamadı.';
      Alert.alert('Hata', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const slotLabel = (slot: TeacherSchedule) => {
    const sh = slot.startTime.substring(0, 5);
    const eh = slot.endTime.substring(0, 5);
    return `${sh} – ${eh}`;
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>Akademisyen Profili</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Chat', { teacher })}
          hitSlop={12}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Profil Kartı */}
        <View style={s.profileCard}>
          <UserAvatar name={teacher.name} size={72} backgroundColor={c.primary} />
          <Text style={s.name}>{teacher.name}</Text>
          {teacher.officeLocation ? (
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
        </View>

        {/* Randevu Takvimi */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Randevu Takvimi</Text>

          {/* Gün sekmeleri */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.dayTabs}
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

          {/* Slotlar */}
          {loadingSlots ? (
            <ActivityIndicator color={c.primary} style={{ marginTop: 24 }} />
          ) : daySlots.length === 0 ? (
            <View style={s.emptySlots}>
              <Ionicons name="calendar-outline" size={36} color={c.textMuted} />
              <Text style={s.emptySlotsText}>Bu gün için program eklenmemiş.</Text>
            </View>
          ) : (
            <View style={s.slotGrid}>
              {daySlots.map(slot => (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    s.slotBtn,
                    slot.isAvailable ? s.slotAvailable : s.slotTaken,
                  ]}
                  onPress={() => handleSlotPress(slot)}
                  disabled={!slot.isAvailable}
                  activeOpacity={slot.isAvailable ? 0.75 : 1}
                >
                  <Text style={[
                    s.slotText,
                    { color: slot.isAvailable ? c.primary : c.textMuted },
                  ]}>
                    {slotLabel(slot)}
                  </Text>
                  {!slot.isAvailable && (
                    <Text style={s.slotTakenLabel}>Dolu</Text>
                  )}
                </TouchableOpacity>
              ))}
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
    safe:  { flex: 1, backgroundColor: c.background },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: c.primary, paddingHorizontal: 16, paddingVertical: 14,
    },
    headerTitle: { flex: 1, color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'center', marginHorizontal: 8 },

    scroll: { paddingBottom: 40 },

    profileCard: {
      backgroundColor: c.surface, margin: 16, borderRadius: 20, padding: 24,
      alignItems: 'center', gap: 10,
      borderWidth: 1, borderColor: c.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    name: { fontSize: 18, fontWeight: '800', color: c.text, textAlign: 'center' },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    infoText: { fontSize: 13, color: c.textSecondary },
    bio: { fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 20 },
    researchWrap: { alignSelf: 'stretch', backgroundColor: c.background, borderRadius: 10, padding: 12, marginTop: 4 },
    researchLabel: { fontSize: 11, fontWeight: '700', color: c.primary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    researchText: { fontSize: 13, color: c.textSecondary, lineHeight: 19 },

    section: { marginHorizontal: 16 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: c.text, marginBottom: 14 },

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
      width: '47%', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8,
      alignItems: 'center', borderWidth: 1.5,
    },
    slotAvailable: { backgroundColor: c.primaryLight ?? '#EEF2FF', borderColor: c.primary },
    slotTaken: { backgroundColor: c.surface, borderColor: c.border },
    slotText: { fontSize: 14, fontWeight: '700' },
    slotTakenLabel: { fontSize: 10, color: c.textMuted, marginTop: 2 },

    emptySlots: { alignItems: 'center', paddingVertical: 32, gap: 10 },
    emptySlotsText: { fontSize: 14, color: c.textMuted },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modalCard: {
      backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, gap: 14,
    },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: c.text },
    modalSlotInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.background, borderRadius: 10, padding: 10 },
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
