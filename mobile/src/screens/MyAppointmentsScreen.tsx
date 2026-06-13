import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../context/ThemeContext';
import { dataService } from '../services/dataService';
import { Appointment, AppointmentStatus } from '../types/models';

// ─── Sabitler ────────────────────────────────────────────────────────────────

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const STATUS_META: Record<
  AppointmentStatus,
  { label: string; icon: IoniconName; colorKey: 'warning' | 'success' | 'error' }
> = {
  [AppointmentStatus.Pending]:  { label: 'Bekliyor',   icon: 'hourglass-outline',        colorKey: 'warning' },
  [AppointmentStatus.Approved]: { label: 'Onaylandı',  icon: 'checkmark-circle-outline', colorKey: 'success' },
  [AppointmentStatus.Rejected]: { label: 'Reddedildi', icon: 'close-circle-outline',     colorKey: 'error'   },
};

const FILTERS = [
  { key: 'all',      label: 'Tümü'      },
  { key: 'pending',  label: 'Bekliyor'  },
  { key: 'approved', label: 'Onaylandı' },
  { key: 'rejected', label: 'Reddedildi'},
] as const;

type FilterKey = typeof FILTERS[number]['key'];

// ─── Yardımcı işlevler ───────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');

function parseIsoLocal(iso: string) {
  const [datePart, timePart = '00:00'] = iso.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm]  = timePart.split(':').map(Number);
  return { y, m, d, hh, mm };
}

function formatDate(iso: string): string {
  const { y, m, d, hh, mm } = parseIsoLocal(iso);
  const dayName = new Date(y, m - 1, d).toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  return `${dayName}, ${pad(hh)}:${pad(mm)}`;
}

// ─── Ekran ───────────────────────────────────────────────────────────────────

export default function MyAppointmentsScreen() {
  const c          = useColors();
  const s          = useMemo(() => makeStyles(c), [c]);
  const navigation = useNavigation();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [filter, setFilter]             = useState<FilterKey>('all');

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dataService.getMyAppointments();
      const sorted = res.data
        .filter(a => {
          const { hh } = parseIsoLocal(a.appointmentDate);
          return hh >= 9 && hh < 17;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAppointments(sorted);
    } catch {
      setError('Randevular yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const filtered = useMemo(() => {
    if (filter === 'all') return appointments;
    const statusMap: Record<FilterKey, AppointmentStatus | null> = {
      all:      null,
      pending:  AppointmentStatus.Pending,
      approved: AppointmentStatus.Approved,
      rejected: AppointmentStatus.Rejected,
    };
    return appointments.filter(a => a.status === statusMap[filter]);
  }, [appointments, filter]);

  // Özet sayaçlar (filtre chiplerinde rozet)
  const counts = useMemo(() => ({
    pending:  appointments.filter(a => a.status === AppointmentStatus.Pending).length,
    approved: appointments.filter(a => a.status === AppointmentStatus.Approved).length,
    rejected: appointments.filter(a => a.status === AppointmentStatus.Rejected).length,
  }), [appointments]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Randevularım</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Filtre şeridi */}
      <View style={s.filterBar}>
        {FILTERS.map(f => {
          const count = f.key !== 'all' ? (counts as any)[f.key] : appointments.length;
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[s.filterChip, active && s.filterChipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[s.filterChipText, active && s.filterChipTextActive]}>
                {f.label}
              </Text>
              {count > 0 && (
                <View style={[s.filterCount, active && s.filterCountActive]}>
                  <Text style={[s.filterCountText, active && s.filterCountTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={s.centerText}>Yükleniyor…</Text>
        </View>
      ) : error ? (
        <View style={s.center}>
          <Ionicons name="wifi-outline" size={40} color={c.textMuted} />
          <Text style={s.centerText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={fetchAppointments}>
            <Text style={s.retryText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={[s.list, filtered.length === 0 && s.listEmpty]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchAppointments}
              tintColor={c.primary}
            />
          }
          ListEmptyComponent={
            <View style={s.center}>
              <Ionicons name="calendar-outline" size={52} color={c.textMuted} />
              <Text style={s.centerText}>
                {filter === 'all' ? 'Henüz randevunuz bulunmuyor.' : 'Bu durumda randevu yok.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => <AppointmentCard item={item} s={s} c={c} />}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Randevu kartı ───────────────────────────────────────────────────────────

function AppointmentCard({ item, s, c }: { item: Appointment; s: any; c: any }) {
  const meta  = STATUS_META[item.status as AppointmentStatus];
  const color = (c as any)[meta.colorKey] ?? '#888';

  return (
    <View style={s.card}>
      {/* Sol renk şeridi */}
      <View style={[s.cardAccent, { backgroundColor: color }]} />

      <View style={s.cardContent}>
        {/* Hoca adı + durum rozeti */}
        <View style={s.cardRow}>
          <View style={s.teacherInfo}>
            <Ionicons name="person-circle-outline" size={18} color={c.primary} />
            <Text style={s.teacherName} numberOfLines={1}>{item.teacherName}</Text>
          </View>
          <View style={[s.statusPill, { backgroundColor: color + '20', borderColor: color + '60' }]}>
            <Ionicons name={meta.icon} size={12} color={color} />
            <Text style={[s.statusLabel, { color }]}>{meta.label}</Text>
          </View>
        </View>

        {/* Tarih */}
        <View style={s.dateRow}>
          <Ionicons name="time-outline" size={14} color={c.textMuted} />
          <Text style={s.dateText}>{formatDate(item.appointmentDate)}</Text>
        </View>

        {/* Açıklama */}
        {item.description ? (
          <Text style={s.desc} numberOfLines={2}>{item.description}</Text>
        ) : null}

        {/* Red detayı */}
        {item.status === AppointmentStatus.Rejected && item.rejectionReason ? (
          <View style={[s.rejectBox, { backgroundColor: color + '10', borderColor: color + '40' }]}>
            <Ionicons name="information-circle-outline" size={15} color={color} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={[s.rejectLabel, { color }]}>Red Sebebi</Text>
              <Text style={s.rejectBody}>{item.rejectionReason}</Text>
              {item.suggestedTime ? (
                <View style={s.suggestRow}>
                  <Ionicons name="calendar-outline" size={12} color={c.primary} />
                  <Text style={[s.suggestText, { color: c.primary }]}>
                    Önerilen: {formatDate(item.suggestedTime)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ─── Stiller ─────────────────────────────────────────────────────────────────

const makeStyles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: c.primary, paddingHorizontal: 16, paddingVertical: 14,
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },

    // Filtre şeridi
    filterBar: {
      flexDirection: 'row', gap: 8, flexWrap: 'wrap',
      paddingHorizontal: 16, paddingVertical: 12,
      backgroundColor: c.surface,
      borderBottomWidth: 1, borderBottomColor: c.border,
    },
    filterChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
      backgroundColor: c.background, borderWidth: 1, borderColor: c.border,
    },
    filterChipActive:    { backgroundColor: c.primary, borderColor: c.primary },
    filterChipText:      { fontSize: 12, fontWeight: '600', color: c.textSecondary },
    filterChipTextActive:{ color: '#fff' },
    filterCount: {
      minWidth: 18, height: 18, borderRadius: 9,
      backgroundColor: c.border,
      justifyContent: 'center', alignItems: 'center',
      paddingHorizontal: 4,
    },
    filterCountActive:     { backgroundColor: 'rgba(255,255,255,0.25)' },
    filterCountText:       { fontSize: 10, fontWeight: '700', color: c.textSecondary },
    filterCountTextActive: { color: '#fff' },

    list:      { padding: 16, gap: 12, paddingBottom: 36 },
    listEmpty: { flex: 1 },

    // Kart
    card: {
      flexDirection: 'row',
      backgroundColor: c.surface, borderRadius: 16,
      borderWidth: 1, borderColor: c.border, overflow: 'hidden',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    cardAccent:  { width: 4 },
    cardContent: { flex: 1, padding: 14, gap: 8 },
    cardRow: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', gap: 8,
    },
    teacherInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
    teacherName: { fontSize: 15, fontWeight: '700', color: c.text, flex: 1 },

    statusPill: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 8, paddingVertical: 4,
      borderRadius: 10, borderWidth: 1,
    },
    statusLabel: { fontSize: 11, fontWeight: '700' },

    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    dateText: { fontSize: 13, color: c.textSecondary },

    desc: { fontSize: 13, color: c.textSecondary, lineHeight: 18 },

    rejectBox: {
      flexDirection: 'row', gap: 8, alignItems: 'flex-start',
      padding: 10, borderRadius: 10, borderWidth: 1, marginTop: 2,
    },
    rejectLabel: { fontSize: 11, fontWeight: '700', marginBottom: 3 },
    rejectBody:  { fontSize: 12, color: c.textSecondary, lineHeight: 17 },
    suggestRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
    suggestText: { fontSize: 12, fontWeight: '600' },

    center: {
      flex: 1, justifyContent: 'center', alignItems: 'center',
      gap: 12, padding: 32,
    },
    centerText: { fontSize: 14, color: c.textMuted, textAlign: 'center' },
    retryBtn:   {
      backgroundColor: c.primary, borderRadius: 10,
      paddingHorizontal: 24, paddingVertical: 10, marginTop: 4,
    },
    retryText: { color: '#fff', fontWeight: '700' },
  });
