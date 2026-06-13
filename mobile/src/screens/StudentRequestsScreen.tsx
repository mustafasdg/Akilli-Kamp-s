import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../context/ThemeContext';
import { dataService } from '../services/dataService';
import { Appointment, AppointmentStatus } from '../types/models';
import UserAvatar from '../components/UserAvatar';

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  [AppointmentStatus.Pending]:  'Bekliyor',
  [AppointmentStatus.Approved]: 'Onaylandı',
  [AppointmentStatus.Rejected]: 'Reddedildi',
};

const STATUS_COLOR = (c: any): Record<AppointmentStatus, string> => ({
  [AppointmentStatus.Pending]:  c.warning  ?? '#F59E0B',
  [AppointmentStatus.Approved]: c.success  ?? '#10B981',
  [AppointmentStatus.Rejected]: c.error    ?? '#EF4444',
});

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * ISO string'ini timezone dönüşümü YAPMADAN bileşenlerine ayırır.
 * "2026-06-15T09:00:00" → { y, m, d, hh, mm } — saat olduğu gibi korunur.
 */
function parseIsoLocal(iso: string): { y: number; m: number; d: number; hh: number; mm: number } {
  const [datePart, timePart = '00:00'] = iso.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm] = timePart.split(':').map(Number);
  return { y, m, d, hh, mm };
}

/** Backend'in gönderdiği saati olduğu gibi gösterir — new Date(iso) ile UTC kayması yok */
function formatDate(iso: string): string {
  const { y, m, d, hh, mm } = parseIsoLocal(iso);
  // Date sadece gün/ay adı için yerel bileşenlerle kurulur; saat string'den gelir
  const dayName = new Date(y, m - 1, d).toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  return `${dayName}, ${pad(hh)}:${pad(mm)}`;
}

/** "HH..." saatini string'den okur */
function appointmentHour(iso: string): number {
  return parseIsoLocal(iso).hh;
}

/** Yerel duvar saatini Z'siz ISO formatına çevirir (backend Kind=Unspecified alır) */
function toLocalIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

/** Randevu tarihinden sonraki 3 hafta içi günü aynı saatle önerir */
function suggestionOptions(iso: string): { label: string; value: string }[] {
  const { y, m, d: day, hh, mm } = parseIsoLocal(iso);
  const cursor = new Date(y, m - 1, day, hh, mm); // yerel bileşenlerden kuruldu, kayma yok
  const options: { label: string; value: string }[] = [];
  while (options.length < 3) {
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getDay() === 0 || cursor.getDay() === 6) continue; // hafta sonunu atla
    options.push({
      label: cursor.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' }) +
             ` ${pad(cursor.getHours())}:${pad(cursor.getMinutes())}`,
      value: toLocalIso(cursor),
    });
  }
  return options;
}

export default function StudentRequestsScreen() {
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  // Reddetme modalı
  const [rejectTarget, setRejectTarget]   = useState<Appointment | null>(null);
  const [rejectReason, setRejectReason]   = useState('');
  const [suggestedTime, setSuggestedTime] = useState<string | null>(null);
  const [submitting, setSubmitting]       = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dataService.getMyAppointments();
      // Mesai dışı (09:00 - 17:00 aralığı dışı) hiçbir kayıt ekrana gelmez
      const sorted = res.data
        .filter(a => {
          const h = appointmentHour(a.appointmentDate);
          return h >= 9 && h < 17;
        })
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      setAppointments(sorted);
    } catch {
      setError('Randevular yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const handleApprove = (id: number) => {
    Alert.alert(
      'Randevuyu Onayla',
      'Bu randevu onaylanacak. Emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Onayla',
          onPress: async () => {
            try {
              await dataService.updateAppointmentStatus(id, AppointmentStatus.Approved);
              await fetchAppointments();
            } catch {
              Alert.alert('Hata', 'Durum güncellenemedi.');
            }
          },
        },
      ],
    );
  };

  // Reddet → sebep + önerilen saat modalı aç
  const openRejectModal = (appt: Appointment) => {
    setRejectTarget(appt);
    setRejectReason('');
    setSuggestedTime(null);
  };

  const handleRejectSubmit = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen red sebebini belirtin.');
      return;
    }
    setSubmitting(true);
    try {
      await dataService.updateAppointmentStatus(
        rejectTarget.id,
        AppointmentStatus.Rejected,
        rejectReason.trim(),
        suggestedTime ?? undefined,
      );
      setRejectTarget(null);
      await fetchAppointments();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Durum güncellenemedi.';
      Alert.alert('Hata', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const pending  = appointments.filter(a => a.status === AppointmentStatus.Pending);
  const others   = appointments.filter(a => a.status !== AppointmentStatus.Pending);

  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Header s={s} />
        <View style={s.center}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={s.loadingText}>Randevular yükleniyor…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Header s={s} />
        <View style={s.center}>
          <Ionicons name="wifi-outline" size={44} color={c.textMuted} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={fetchAppointments}>
            <Text style={s.retryText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Header s={s} count={pending.length} />
      <FlatList
        data={[...pending, ...others]}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchAppointments} tintColor={c.primary} />
        }
        ListEmptyComponent={
          <View style={s.center}>
            <Ionicons name="calendar-outline" size={48} color={c.textMuted} />
            <Text style={s.emptyText}>Henüz randevu talebi yok.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <AppointmentCard
            item={item}
            onApprove={() => handleApprove(item.id)}
            onReject={()  => openRejectModal(item)}
            s={s}
            c={c}
          />
        )}
      />

      {/* Reddetme modalı: sebep + önerilen yeni saat */}
      <Modal visible={rejectTarget !== null} transparent animationType="slide">
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Randevuyu Reddet</Text>
              <TouchableOpacity onPress={() => setRejectTarget(null)}>
                <Ionicons name="close" size={22} color={c.text} />
              </TouchableOpacity>
            </View>

            {rejectTarget && (
              <View style={s.modalInfo}>
                <Ionicons name="person-outline" size={15} color={c.primary} />
                <Text style={s.modalInfoText}>
                  {rejectTarget.studentName} • {formatDate(rejectTarget.appointmentDate)}
                </Text>
              </View>
            )}

            <Text style={s.modalLabel}>Red Sebebi *</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Örn: Bu saatte bölüm kurulu toplantım var…"
              placeholderTextColor={c.textMuted}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
              maxLength={500}
            />

            <Text style={s.modalLabel}>Yeni Saat Öner (isteğe bağlı)</Text>
            <View style={s.suggestRow}>
              {rejectTarget && suggestionOptions(rejectTarget.appointmentDate).map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.suggestChip, suggestedTime === opt.value && s.suggestChipActive]}
                  onPress={() =>
                    setSuggestedTime(prev => (prev === opt.value ? null : opt.value))
                  }
                >
                  <Text style={[
                    s.suggestChipText,
                    suggestedTime === opt.value && s.suggestChipTextActive,
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[s.rejectSubmitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleRejectSubmit}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : (
                  <>
                    <Ionicons name="send-outline" size={16} color="#fff" />
                    <Text style={s.rejectSubmitText}>Reddet ve Gönder</Text>
                  </>
                )
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function Header({ s, count }: { s: any; count?: number }) {
  const c = useColors();
  return (
    <View style={s.headerWrap}>
      <View style={s.headerRow}>
        <Text style={s.headerTitle}>Randevu Talepleri</Text>
        {count !== undefined && count > 0 && (
          <View style={[s.badge, { backgroundColor: c.warning ?? '#F59E0B' }]}>
            <Text style={s.badgeText}>{count}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function AppointmentCard({
  item, onApprove, onReject, s, c,
}: {
  item: Appointment;
  onApprove: () => void;
  onReject: () => void;
  s: any; c: any;
}) {
  const isPending  = item.status === AppointmentStatus.Pending;
  const statusColor = STATUS_COLOR(c)[item.status];

  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <UserAvatar name={item.studentName} size={44} backgroundColor={c.primary} />
        <View style={s.cardBody}>
          <Text style={s.studentName}>{item.studentName}</Text>
          <Text style={s.dateText}>{formatDate(item.appointmentDate)}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: statusColor + '22' }]}>
          <Text style={[s.statusText, { color: statusColor }]}>
            {STATUS_LABEL[item.status as AppointmentStatus]}
          </Text>
        </View>
      </View>

      {item.description ? (
        <Text style={s.description} numberOfLines={2}>{item.description}</Text>
      ) : null}

      {item.status === AppointmentStatus.Rejected && item.rejectionReason ? (
        <View style={s.rejectInfo}>
          <Text style={s.rejectInfoText}>
            Sebep: {item.rejectionReason}
            {item.suggestedTime ? `\nÖnerilen saat: ${formatDate(item.suggestedTime)}` : ''}
          </Text>
        </View>
      ) : null}

      {isPending && (
        <View style={s.actions}>
          <TouchableOpacity style={s.approveBtn} onPress={onApprove}>
            <Ionicons name="checkmark-circle-outline" size={17} color="#fff" />
            <Text style={s.approveBtnText}>Onayla</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.rejectBtn} onPress={onReject}>
            <Ionicons name="close-circle-outline" size={17} color={c.error ?? '#EF4444'} />
            <Text style={[s.rejectBtnText, { color: c.error ?? '#EF4444' }]}>Reddet</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const makeStyles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },

    headerWrap: {
      backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border,
      paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: c.text },
    badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
    badgeText: { fontSize: 13, fontWeight: '700', color: '#fff' },

    list: { padding: 16, gap: 12, paddingBottom: 32 },

    card: {
      backgroundColor: c.surface, borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: c.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
      gap: 10,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cardBody: { flex: 1, gap: 3 },
    studentName: { fontSize: 15, fontWeight: '700', color: c.text },
    dateText: { fontSize: 12, color: c.textSecondary },
    statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
    statusText: { fontSize: 11, fontWeight: '700' },

    description: { fontSize: 13, color: c.textSecondary, lineHeight: 18 },

    actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    approveBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, backgroundColor: c.primary, borderRadius: 10, paddingVertical: 10,
    },
    approveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    rejectBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, backgroundColor: c.surface, borderRadius: 10, paddingVertical: 10,
      borderWidth: 1.5, borderColor: c.error ?? '#EF4444',
    },
    rejectBtnText: { fontWeight: '700', fontSize: 14 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 32 },
    loadingText: { fontSize: 14, color: c.textMuted },
    errorText: { fontSize: 14, color: c.textSecondary, textAlign: 'center' },
    retryBtn: { backgroundColor: c.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
    retryText: { color: '#fff', fontWeight: '700' },
    emptyText: { fontSize: 15, color: c.textMuted, textAlign: 'center' },

    rejectInfo: {
      backgroundColor: c.errorLight, borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 8,
    },
    rejectInfoText: { fontSize: 12, color: c.error, lineHeight: 18 },

    // Reddetme modalı
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modalCard: {
      backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, gap: 12,
    },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: c.text },
    modalInfo: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: c.background, borderRadius: 10, padding: 10,
    },
    modalInfoText: { flex: 1, fontSize: 13, fontWeight: '600', color: c.text },
    modalLabel: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
    modalInput: {
      backgroundColor: c.background, borderRadius: 12, padding: 12,
      fontSize: 14, color: c.text, minHeight: 76, textAlignVertical: 'top',
      borderWidth: 1, borderColor: c.border,
    },
    suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    suggestChip: {
      borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
      backgroundColor: c.background, borderWidth: 1, borderColor: c.border,
    },
    suggestChipActive: { backgroundColor: c.primaryLight, borderColor: c.primary },
    suggestChipText: { fontSize: 12, fontWeight: '600', color: c.textSecondary },
    suggestChipTextActive: { color: c.primary },
    rejectSubmitBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: c.error, borderRadius: 14, paddingVertical: 14, marginTop: 4,
    },
    rejectSubmitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  });
