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
import { AppNotification } from '../types/models';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

export default function NotificationsScreen() {
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const navigation = useNavigation();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading]             = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dataService.getMyNotifications();
      setNotifications(res.data);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handlePress = async (item: AppNotification) => {
    if (item.isRead) return;
    // Optimistic: önce yerelde okundu işaretle, sonra API
    setNotifications(prev =>
      prev.map(n => (n.id === item.id ? { ...n, isRead: true } : n)),
    );
    try {
      await dataService.markNotificationRead(item.id);
    } catch {
      // Sessizce geç — sonraki yenilemede sunucu durumu geçerli olur
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Bildirimler</Text>
        <View style={{ width: 24 }}>
          {unreadCount > 0 && (
            <View style={s.unreadBadge}>
              <Text style={s.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchNotifications} tintColor={c.primary} />
          }
          ListEmptyComponent={
            <View style={s.center}>
              <Ionicons name="notifications-off-outline" size={46} color={c.textMuted} />
              <Text style={s.emptyText}>Henüz bildiriminiz yok.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.card, !item.isRead && s.cardUnread]}
              onPress={() => handlePress(item)}
              activeOpacity={0.8}
            >
              <View style={[s.iconWrap, { backgroundColor: item.isRead ? c.background : c.errorLight }]}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={item.isRead ? c.textMuted : c.error}
                />
              </View>
              <View style={s.cardBody}>
                <View style={s.cardTopRow}>
                  <Text style={[s.cardTitle, !item.isRead && { fontWeight: '800' }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {!item.isRead && <View style={s.dot} />}
                </View>
                <Text style={s.cardText}>{item.body}</Text>
                <Text style={s.cardTime}>{timeAgo(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
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
    headerTitle: { flex: 1, color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'center', marginHorizontal: 8 },
    unreadBadge: {
      backgroundColor: c.error, borderRadius: 10, minWidth: 20, height: 20,
      justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5,
    },
    unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

    list: { padding: 16, gap: 10, paddingBottom: 32, flexGrow: 1 },

    card: {
      flexDirection: 'row', gap: 12,
      backgroundColor: c.surface, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: c.border,
    },
    cardUnread: { borderColor: c.primary, borderWidth: 1.5 },
    iconWrap: {
      width: 40, height: 40, borderRadius: 20,
      justifyContent: 'center', alignItems: 'center',
    },
    cardBody: { flex: 1, gap: 4 },
    cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: c.text },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.primary },
    cardText: { fontSize: 13, color: c.textSecondary, lineHeight: 19 },
    cardTime: { fontSize: 11, color: c.textMuted, marginTop: 2 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 32 },
    emptyText: { fontSize: 14, color: c.textMuted },
  });
