import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMenus } from '../hooks/useMenus';
import { useFavoriteMenus } from '../hooks/useFavoriteMenus';
import { Menu } from '../types/models';
import { useColors } from '../context/ThemeContext';

export default function MenuScreen() {
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const { items, isLoading, isLoadingMore, error, refresh, loadMore } = useMenus();
  const { toggle, isFavorite } = useFavoriteMenus();
  const [query, setQuery] = useState('');
  const [showFavOnly, setShowFavOnly] = useState(false);

  const filtered = useMemo(() => {
    let list = items;
    if (showFavOnly) list = list.filter(m => isFavorite(m.id));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(m =>
        [m.yemek_1, m.yemek_2, m.yemek_3, m.yemek_4].some(y => y?.toLowerCase().includes(q))
      );
    }
    return list;
  }, [items, query, showFavOnly, isFavorite]);

  if (isLoading && !items.length) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Header query={query} onQuery={setQuery} showFav={showFavOnly} onToggleFav={() => setShowFavOnly(v => !v)} c={c} s={s} />
        <View style={s.center}><ActivityIndicator size="large" color={c.primary} /></View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Header query={query} onQuery={setQuery} showFav={showFavOnly} onToggleFav={() => setShowFavOnly(v => !v)} c={c} s={s} />
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
      <Header query={query} onQuery={setQuery} showFav={showFavOnly} onToggleFav={() => setShowFavOnly(v => !v)} c={c} s={s} />
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={c.primary} />}
        onEndReached={!query && !showFavOnly ? loadMore : undefined}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <View style={s.center}>
            <Text style={s.emptyEmoji}>{showFavOnly ? '❤️' : query ? '🔍' : '🍽️'}</Text>
            <Text style={s.emptyText}>
              {showFavOnly ? 'Henüz favori eklenmedi.' : query ? 'Sonuç bulunamadı.' : 'Henüz menü eklenmemiş.'}
            </Text>
          </View>
        }
        ListFooterComponent={
          isLoadingMore && !query && !showFavOnly
            ? <ActivityIndicator color={c.primary} style={{ paddingVertical: 16 }} />
            : null
        }
        renderItem={({ item }) => (
          <MenuCard
            item={item}
            isFav={isFavorite(item.id)}
            onToggleFav={() => toggle(item.id)}
            c={c} s={s}
          />
        )}
      />
    </SafeAreaView>
  );
}

// ─── Alt bileşenler ───────────────────────────────────────────────────────────

function Header({ query, onQuery, showFav, onToggleFav, c, s }: any) {
  return (
    <View style={s.headerWrap}>
      <View style={s.headerRow}>
        <View>
          <Text style={s.headerTitle}>Yemekhane</Text>
          <Text style={s.headerSub}>Günlük yemek listesi</Text>
        </View>
        <TouchableOpacity
          onPress={onToggleFav}
          style={[s.favFilterBtn, showFav && s.favFilterBtnActive]}
        >
          <Ionicons name={showFav ? 'heart' : 'heart-outline'} size={16} color={showFav ? '#fff' : c.error} />
          <Text style={[s.favFilterText, showFav && { color: '#fff' }]}>Favoriler</Text>
        </TouchableOpacity>
      </View>
      <View style={s.searchRow}>
        <Ionicons name="search-outline" size={17} color={c.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="Yemek ara..."
          placeholderTextColor={c.textMuted}
          value={query}
          onChangeText={onQuery}
          returnKeyType="search"
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

function MenuCard({ item, isFav, onToggleFav, c, s }: { item: Menu; isFav: boolean; onToggleFav: () => void; c: any; s: any }) {
  const foods = [item.yemek_1, item.yemek_2, item.yemek_3, item.yemek_4].filter(Boolean);
  const date = new Date(item.tarih);
  const isActuallyToday = date.toDateString() === new Date().toDateString();
  const dateStr = date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <View style={[s.card, isActuallyToday && s.cardToday]}>
      <View style={s.cardHeader}>
        <View style={s.cardHeaderLeft}>
          <Ionicons name="calendar-outline" size={14} color={isActuallyToday ? c.primary : c.textMuted} />
          <Text style={[s.cardDate, isActuallyToday && s.cardDateToday]}>{dateStr}</Text>
        </View>
        <View style={s.cardHeaderRight}>
          {isActuallyToday && (
            <View style={s.todayBadge}><Text style={s.todayBadgeText}>Bugün</Text></View>
          )}
          <TouchableOpacity onPress={onToggleFav} style={s.favBtn} activeOpacity={0.7}>
            <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={20} color={isFav ? c.error : c.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.foodList}>
        {foods.map((food, i) => (
          <View key={i} style={s.foodRow}>
            <View style={[s.foodDot, isActuallyToday && s.foodDotToday]} />
            <Text style={s.foodText}>{food}</Text>
          </View>
        ))}
      </View>

      <View style={s.cardFooter}>
        <View style={s.calRow}>
          <Ionicons name="flame" size={15} color={c.warning} />
          <Text style={s.calText}>{item.kalori} kcal</Text>
        </View>
        <View style={s.portionRow}>
          <Ionicons name="restaurant-outline" size={13} color={c.textMuted} />
          <Text style={s.portionText}>{foods.length} çeşit</Text>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (c: ReturnType<typeof useColors>) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },

  headerWrap: {
    backgroundColor: c.surface,
    borderBottomWidth: 1, borderBottomColor: c.border, paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: c.text },
  headerSub: { fontSize: 13, color: c.textSecondary, marginTop: 2 },

  favFilterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: c.error, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  favFilterBtnActive: { backgroundColor: c.error },
  favFilterText: { fontSize: 13, fontWeight: '600', color: c.error },

  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: c.background, borderRadius: 12,
    marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: c.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: c.text, height: 28 },

  list: { padding: 16, gap: 12, paddingBottom: 32 },

  card: {
    backgroundColor: c.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: c.border, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  cardToday: { borderColor: c.primary, borderWidth: 1.5 },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardDate: { fontSize: 13, color: c.textSecondary, fontWeight: '500', flexShrink: 1 },
  cardDateToday: { color: c.primary, fontWeight: '700' },

  todayBadge: {
    backgroundColor: c.primaryLight, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  todayBadgeText: { fontSize: 12, fontWeight: '700', color: c.primary },
  favBtn: { padding: 2 },

  foodList: { gap: 9 },
  foodRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  foodDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.textMuted },
  foodDotToday: { backgroundColor: c.primary },
  foodText: { fontSize: 15, color: c.text, flex: 1, lineHeight: 21 },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: c.border, paddingTop: 10,
  },
  calRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  calText: { fontSize: 14, fontWeight: '700', color: c.warning },
  portionRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  portionText: { fontSize: 13, color: c.textMuted },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 32 },
  errorTitle: { fontSize: 17, fontWeight: '700', color: c.text },
  errorSub: { fontSize: 14, color: c.textSecondary, textAlign: 'center' },
  retryBtn: { marginTop: 8, backgroundColor: c.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryText: { color: '#fff', fontWeight: '700' },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 15, color: c.textMuted },
});
