import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEvents } from '../hooks/useEvents';
import { Event } from '../types/models';
import { useColors } from '../context/ThemeContext';

export default function EventsScreen() {
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const { items, isLoading, isLoadingMore, totalCount, error, refresh, loadMore } = useEvents();
  const [query, setQuery] = useState('');
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);

  const now = useMemo(() => new Date(), []);

  const filtered = useMemo(() => {
    let list = items;
    if (showUpcomingOnly) list = list.filter(e => new Date(e.tarih) >= now);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        e => e.baslik.toLowerCase().includes(q) ||
             e.icerik.toLowerCase().includes(q) ||
             e.kategori.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, query, showUpcomingOnly, now]);

  if (isLoading && !items.length) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Header
          count={null} query={query} onQuery={setQuery}
          showUpcoming={showUpcomingOnly} onToggleUpcoming={() => setShowUpcomingOnly(v => !v)}
          c={c} s={s}
        />
        <View style={s.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Header
          count={null} query={query} onQuery={setQuery}
          showUpcoming={showUpcomingOnly} onToggleUpcoming={() => setShowUpcomingOnly(v => !v)}
          c={c} s={s}
        />
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
      <Header
        count={query || showUpcomingOnly ? filtered.length : totalCount}
        query={query} onQuery={setQuery}
        showUpcoming={showUpcomingOnly} onToggleUpcoming={() => setShowUpcomingOnly(v => !v)}
        c={c} s={s}
      />
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={c.primary} />
        }
        onEndReached={!query && !showUpcomingOnly ? loadMore : undefined}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <View style={s.center}>
            <Text style={s.emptyEmoji}>
              {query ? '🔍' : showUpcomingOnly ? '📅' : '🎉'}
            </Text>
            <Text style={s.emptyText}>
              {query
                ? 'Sonuç bulunamadı.'
                : showUpcomingOnly
                ? 'Yaklaşan etkinlik bulunmuyor.'
                : 'Henüz etkinlik yok.'}
            </Text>
          </View>
        }
        ListFooterComponent={
          isLoadingMore && !query && !showUpcomingOnly
            ? <ActivityIndicator color={c.primary} style={{ paddingVertical: 16 }} />
            : null
        }
        renderItem={({ item }) => <EventCard item={item} now={now} c={c} s={s} />}
      />
    </SafeAreaView>
  );
}

// ─── Alt bileşenler ───────────────────────────────────────────────────────────

function Header({ count, query, onQuery, showUpcoming, onToggleUpcoming, c, s }: any) {
  return (
    <View style={s.headerWrap}>
      <View style={s.headerRow}>
        <View style={s.headerLeft}>
          <View style={s.headerIconWrap}>
            <Ionicons name="calendar-outline" size={20} color={c.primary} />
          </View>
          <View>
            <Text style={s.headerTitle}>Etkinlikler</Text>
            <Text style={s.headerSub}>Kampüs etkinlikleri ve takvim</Text>
          </View>
        </View>
        <View style={s.headerRight}>
          {count !== null && count > 0 && (
            <View style={s.countBadge}>
              <Text style={s.countText}>{count}</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={onToggleUpcoming}
            style={[s.filterBtn, showUpcoming && s.filterBtnActive]}
          >
            <Ionicons
              name={showUpcoming ? 'flash' : 'flash-outline'}
              size={14}
              color={showUpcoming ? '#fff' : c.primary}
            />
            <Text style={[s.filterBtnText, showUpcoming && s.filterBtnTextActive]}>
              Yaklaşan
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={s.searchRow}>
        <Ionicons name="search-outline" size={17} color={c.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="Etkinlik ara..."
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

function EventCard({ item, now, c, s }: { item: Event; now: Date; c: any; s: any }) {
  const date = new Date(item.tarih);
  const isUpcoming = date >= now;
  const isToday = date.toDateString() === now.toDateString();

  const dayStr    = date.toLocaleDateString('tr-TR', { day: 'numeric' });
  const monthStr  = date.toLocaleDateString('tr-TR', { month: 'short' });
  const yearStr   = date.getFullYear().toString();
  const weekday   = date.toLocaleDateString('tr-TR', { weekday: 'short' });
  const timeStr   = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const badge     = getBadgeStyle(item.kategori, c);

  return (
    <View style={[s.card, isUpcoming && s.cardUpcoming, isToday && s.cardToday]}>
      {/* Sol — takvim sütunu */}
      <View style={[s.datePill, isUpcoming ? s.datePillActive : s.datePillPast]}>
        <Text style={[s.datePillWeekday, isUpcoming && s.datePillWeekdayActive]}>
          {weekday}
        </Text>
        <Text style={[s.datePillDay, isUpcoming && s.datePillDayActive]}>{dayStr}</Text>
        <Text style={[s.datePillMonth, isUpcoming && s.datePillMonthActive]}>{monthStr}</Text>
        <Text style={s.datePillYear}>{yearStr}</Text>
      </View>

      {/* Sağ — içerik sütunu */}
      <View style={s.cardContent}>
        <View style={s.cardTop}>
          <View style={[s.badge, { backgroundColor: badge.bg }]}>
            <Text style={[s.badgeText, { color: badge.text }]}>{item.kategori}</Text>
          </View>
          {isToday && (
            <View style={s.todayBadge}>
              <Text style={s.todayBadgeText}>Bugün</Text>
            </View>
          )}
          {isUpcoming && !isToday && (
            <View style={s.upcomingBadge}>
              <Text style={s.upcomingBadgeText}>Yaklaşan</Text>
            </View>
          )}
        </View>

        <Text style={s.cardTitle}>{item.baslik}</Text>
        <Text style={s.cardBody} numberOfLines={2}>{item.icerik}</Text>

        <View style={s.cardFooter}>
          <View style={s.footerRow}>
            <Ionicons name="time-outline" size={13} color={c.textMuted} />
            <Text style={s.footerText}>{timeStr}</Text>
          </View>
          {item.locationId != null && (
            <View style={s.footerRow}>
              <Ionicons name="location-outline" size={13} color={c.textMuted} />
              <Text style={s.footerText}>Konum eklendi</Text>
            </View>
          )}
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: c.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: c.text },
  headerSub: { fontSize: 12, color: c.textSecondary, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countBadge: {
    backgroundColor: c.primaryLight, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  countText: { fontSize: 13, fontWeight: '700', color: c.primary },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: c.primary, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  filterBtnActive: { backgroundColor: c.primary },
  filterBtnText: { fontSize: 12, fontWeight: '600', color: c.primary },
  filterBtnTextActive: { color: '#fff' },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: c.background, borderRadius: 12,
    marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: c.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: c.text, height: 28 },

  list: { padding: 16, gap: 12, paddingBottom: 32 },

  card: {
    backgroundColor: c.surface, borderRadius: 16,
    borderWidth: 1, borderColor: c.border, flexDirection: 'row', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  cardUpcoming: { borderColor: c.primary + '60' },
  cardToday: { borderColor: c.primary, borderWidth: 1.5 },

  // ── Takvim sütunu ──────────────────────────────────────────────────────────
  datePill: {
    width: 60, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: 1,
  },
  datePillActive: { backgroundColor: c.primary },
  datePillPast: { backgroundColor: c.border },

  datePillWeekday: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },
  datePillWeekdayActive: { color: 'rgba(255,255,255,0.85)' },
  datePillDay: { fontSize: 26, fontWeight: '800', color: c.textMuted, lineHeight: 30 },
  datePillDayActive: { color: '#fff' },
  datePillMonth: { fontSize: 11, fontWeight: '600', color: c.textMuted },
  datePillMonthActive: { color: 'rgba(255,255,255,0.9)' },
  datePillYear: { fontSize: 10, color: c.textMuted, marginTop: 2 },

  // ── İçerik sütunu ──────────────────────────────────────────────────────────
  cardContent: { flex: 1, padding: 14, gap: 7 },

  cardTop: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  todayBadge: {
    backgroundColor: c.primary, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  todayBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  upcomingBadge: {
    backgroundColor: c.primaryLight, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  upcomingBadgeText: { fontSize: 11, fontWeight: '600', color: c.primary },

  cardTitle: { fontSize: 15, fontWeight: '700', color: c.text, lineHeight: 21 },
  cardBody: { fontSize: 13, color: c.textSecondary, lineHeight: 19 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, color: c.textMuted },

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
