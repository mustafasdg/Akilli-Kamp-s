import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNews } from '../hooks/useNews';
import { News } from '../types/models';
import { useColors } from '../context/ThemeContext';

export default function NewsScreen() {
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const { items, isLoading, isLoadingMore, totalCount, error, refresh, loadMore } = useNews();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      n => n.baslik.toLowerCase().includes(q) ||
           n.icerik.toLowerCase().includes(q) ||
           n.kategori.toLowerCase().includes(q)
    );
  }, [items, query]);

  if (isLoading && !items.length) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Header count={null} query={query} onQuery={setQuery} c={c} s={s} />
        <View style={s.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Header count={null} query={query} onQuery={setQuery} c={c} s={s} />
        <View style={s.center}>
          <Ionicons name="wifi-outline" size={40} color={c.textMuted} />
          <Text style={s.errorTitle}>Bağlantı Hatası</Text>
          <Text style={s.errorSub}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={refresh}>
            <Text style={s.retryText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Header count={query ? filtered.length : totalCount} query={query} onQuery={setQuery} c={c} s={s} />
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={c.primary} />
        }
        onEndReached={query ? undefined : loadMore}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <View style={s.center}>
            <Text style={s.emptyEmoji}>{query ? '🔍' : '📰'}</Text>
            <Text style={s.emptyText}>{query ? 'Sonuç bulunamadı.' : 'Henüz haber yok.'}</Text>
          </View>
        }
        ListFooterComponent={
          isLoadingMore && !query
            ? <ActivityIndicator color={c.primary} style={{ paddingVertical: 16 }} />
            : null
        }
        renderItem={({ item }) => <NewsCard item={item} c={c} s={s} />}
      />
    </SafeAreaView>
  );
}

// ─── Alt bileşenler ───────────────────────────────────────────────────────────

function Header({ count, query, onQuery, c, s }: any) {
  return (
    <View style={s.headerWrap}>
      <View style={s.headerRow}>
        <View style={s.headerLeft}>
          <View style={s.headerIconWrap}>
            <Ionicons name="newspaper-outline" size={20} color={c.primary} />
          </View>
          <View>
            <Text style={s.headerTitle}>Haberler</Text>
            <Text style={s.headerSub}>Kampüs haberleri ve gündem</Text>
          </View>
        </View>
        {count !== null && count > 0 && (
          <View style={s.countBadge}>
            <Text style={s.countText}>{count}</Text>
          </View>
        )}
      </View>
      <View style={s.searchRow}>
        <Ionicons name="search-outline" size={17} color={c.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="Haber ara..."
          placeholderTextColor={c.textMuted}
          value={query}
          onChangeText={onQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => onQuery('')}>
            <Ionicons name="close-circle" size={17} color={c.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function NewsCard({ item, c, s }: { item: News; c: any; s: any }) {
  const badge = getBadgeStyle(item.kategori, c);
  const date = new Date(item.tarih);
  const dateStr = date.toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const isRecent = (Date.now() - date.getTime()) < 7 * 24 * 60 * 60 * 1000;

  return (
    <View style={s.card}>
      <View style={s.cardAccent} />
      <View style={s.cardInner}>
        <View style={s.cardTop}>
          <View style={[s.badge, { backgroundColor: badge.bg }]}>
            <Text style={[s.badgeText, { color: badge.text }]}>{item.kategori}</Text>
          </View>
          <View style={s.cardTopRight}>
            {isRecent && (
              <View style={s.newBadge}>
                <Text style={s.newBadgeText}>Yeni</Text>
              </View>
            )}
            <View style={s.dateRow}>
              <Ionicons name="time-outline" size={12} color={c.textMuted} />
              <Text style={s.dateText}>{dateStr}</Text>
            </View>
          </View>
        </View>
        <Text style={s.cardTitle}>{item.baslik}</Text>
        <Text style={s.cardBody} numberOfLines={3}>{item.icerik}</Text>
        <View style={s.cardFooter}>
          <Ionicons name="chevron-forward-circle-outline" size={14} color={c.primary} />
          <Text style={s.readMoreText}>Devamını oku</Text>
        </View>
      </View>
    </View>
  );
}

function getBadgeStyle(kategori: string, c: any) {
  const k = (kategori ?? '').toLowerCase();
  if (k.includes('akademik')) return c.badge.akademik;
  if (k.includes('spor'))     return c.badge.spor;
  if (k.includes('sosyal'))   return c.badge.sosyal;
  if (k.includes('duyuru'))   return c.badge.duyuru;
  return c.badge.genel;
}

const makeStyles = (c: ReturnType<typeof useColors>) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },

  headerWrap: {
    backgroundColor: c.surface,
    borderBottomWidth: 1, borderBottomColor: c.border,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: c.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: c.text },
  headerSub: { fontSize: 12, color: c.textSecondary, marginTop: 1 },
  countBadge: {
    backgroundColor: c.primaryLight, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  countText: { fontSize: 13, fontWeight: '700', color: c.primary },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: c.background, borderRadius: 12,
    marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: c.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: c.text, height: 28 },

  list: { padding: 16, gap: 12, paddingBottom: 32 },

  card: {
    backgroundColor: c.surface, borderRadius: 14,
    borderWidth: 1, borderColor: c.border, flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  cardAccent: { width: 4, backgroundColor: c.primary },
  cardInner: { flex: 1, padding: 14, gap: 8 },

  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', flexWrap: 'wrap', gap: 6,
  },
  cardTopRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  newBadge: {
    backgroundColor: c.primary, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  newBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dateText: { fontSize: 11, color: c.textMuted },

  cardTitle: { fontSize: 15, fontWeight: '700', color: c.text, lineHeight: 21 },
  cardBody: { fontSize: 13, color: c.textSecondary, lineHeight: 19 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  readMoreText: { fontSize: 12, fontWeight: '600', color: c.primary },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 32 },
  errorTitle: { fontSize: 17, fontWeight: '700', color: c.text },
  errorSub: { fontSize: 14, color: c.textSecondary, textAlign: 'center' },
  retryBtn: {
    marginTop: 8, backgroundColor: c.primary,
    borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 15, color: c.textMuted },
});
