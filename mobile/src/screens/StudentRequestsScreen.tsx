import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day  = d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
  const time = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time}`;
}

export default function StudentRequestsScreen() {
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dataService.getMyAppointments();
      const sorted = [...res.data].sort(
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

  const handleUpdateStatus = async (id: number, status: AppointmentStatus) => {
    const label = status === AppointmentStatus.Approved ? 'onaylanacak' : 'reddedilecek';
    Alert.alert(
      'Randevu Güncelle',
      `Bu randevu ${label}. Emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: status === AppointmentStatus.Approved ? 'Onayla' : 'Reddet',
          style: status === AppointmentStatus.Rejected ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await dataService.updateAppointmentStatus(id, status);
              await fetchAppointments();
            } catch {
              Alert.alert('Hata', 'Durum güncellenemedi.');
            }
          },
        },
      ],
    );
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
            onApprove={() => handleUpdateStatus(item.id, AppointmentStatus.Approved)}
            onReject={()  => handleUpdateStatus(item.id, AppointmentStatus.Rejected)}
            s={s}
            c={c}
          />
        )}
      />
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
  });
