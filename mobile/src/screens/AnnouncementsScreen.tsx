import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { Announcement } from '../types/models';
import colors from '../theme/colors';

export default function AnnouncementsScreen() {
  const { items, isLoading, isLoadingMore, hasNextPage, totalCount, error, refresh, loadMore } =
    useAnnouncements();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header count={null} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header count={null} />
        <View style={styles.center}>
          <Ionicons name="wifi-outline" size={40} color={colors.textMuted} />
          <Text style={styles.errorTitle}>Bağlantı Hatası</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
            <Text style={styles.retryText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header count={totalCount} />
      <FlatList
        data={items}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.primary} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>Henüz duyuru yok.</Text>
          </View>
        }
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator color={colors.primary} style={{ paddingVertical: 16 }} />
          ) : null
        }
        renderItem={({ item }) => <AnnouncementCard item={item} />}
      />
    </SafeAreaView>
  );
}

// ─── Alt bileşenler ───────────────────────────────────────────────────────────

function Header({ count }: { count: number | null }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Duyurular</Text>
      {count !== null && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

function AnnouncementCard({ item }: { item: Announcement }) {
  const badge = getBadgeStyle(item.kategori);
  const dateStr = new Date(item.tarih).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const timeStr = new Date(item.tarih).toLocaleTimeString('tr-TR', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.text }]}>{item.kategori}</Text>
        </View>
        <View style={styles.dateRow}>
          <Ionicons name="time-outline" size={12} color={colors.textMuted} />
          <Text style={styles.dateText}>{dateStr} · {timeStr}</Text>
        </View>
      </View>

      <Text style={styles.cardTitle}>{item.baslik}</Text>
      <Text style={styles.cardBody}>{item.icerik}</Text>
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getBadgeStyle(kategori: string) {
  const k = (kategori ?? '').toLowerCase();
  if (k.includes('akademik')) return colors.badge.akademik;
  if (k.includes('spor'))     return colors.badge.spor;
  if (k.includes('sosyal'))   return colors.badge.sosyal;
  if (k.includes('duyuru'))   return colors.badge.duyuru;
  return colors.badge.genel;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  countBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3,
  },
  countText: { fontSize: 13, fontWeight: '700', color: colors.primary },

  list: { padding: 16, gap: 12, paddingBottom: 32 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.border,
    gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', flexWrap: 'wrap', gap: 6,
  },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 11, color: colors.textMuted },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, lineHeight: 22 },
  cardBody: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 32 },
  errorTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  errorSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    marginTop: 8, backgroundColor: colors.primary,
    borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 15, color: colors.textMuted },
});
