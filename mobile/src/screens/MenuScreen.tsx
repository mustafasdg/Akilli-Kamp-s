import React from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMenus } from '../hooks/useMenus';
import { Menu } from '../types/models';
import colors from '../theme/colors';

export default function MenuScreen() {
  const { items, isLoading, isLoadingMore, error, refresh, loadMore } = useMenus();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header />
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
      <Header />
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
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyText}>Henüz menü eklenmemiş.</Text>
          </View>
        }
        ListFooterComponent={
          isLoadingMore
            ? <ActivityIndicator color={colors.primary} style={{ paddingVertical: 16 }} />
            : null
        }
        renderItem={({ item, index }) => <MenuCard item={item} isToday={index === 0} />}
      />
    </SafeAreaView>
  );
}

// ─── Alt bileşenler ───────────────────────────────────────────────────────────

function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Yemekhane</Text>
      <Text style={styles.headerSub}>Günlük yemek listesi</Text>
    </View>
  );
}

function MenuCard({ item, isToday }: { item: Menu; isToday: boolean }) {
  const foods = [item.yemek_1, item.yemek_2, item.yemek_3, item.yemek_4].filter(Boolean);

  const date = new Date(item.tarih);
  const today = new Date();
  const isActuallyToday = date.toDateString() === today.toDateString();

  const dateStr = date.toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <View style={[styles.card, isActuallyToday && styles.cardToday]}>
      {/* Kart başlığı */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={isActuallyToday ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.cardDate, isActuallyToday && styles.cardDateToday]}>
            {dateStr}
          </Text>
        </View>
        {isActuallyToday && (
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>Bugün</Text>
          </View>
        )}
      </View>

      {/* Yemek listesi */}
      <View style={styles.foodList}>
        {foods.map((food, i) => (
          <View key={i} style={styles.foodRow}>
            <View style={[styles.foodDot, isActuallyToday && styles.foodDotToday]} />
            <Text style={styles.foodText}>{food}</Text>
          </View>
        ))}
      </View>

      {/* Alt bilgi — kalori */}
      <View style={styles.cardFooter}>
        <View style={styles.calRow}>
          <Ionicons name="flame" size={15} color={colors.warning} />
          <Text style={styles.calText}>{item.kalori} kcal</Text>
        </View>
        <View style={styles.portionRow}>
          <Ionicons name="restaurant-outline" size={13} color={colors.textMuted} />
          <Text style={styles.portionText}>{foods.length} çeşit</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  headerSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  list: { padding: 16, gap: 12, paddingBottom: 32 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border,
    gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  cardToday: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    shadowOpacity: 0.08,
  },

  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardDate: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  cardDateToday: { color: colors.primary, fontWeight: '700' },

  todayBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
  },
  todayBadgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  foodList: { gap: 9 },
  foodRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  foodDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
  foodDotToday: { backgroundColor: colors.primary },
  foodText: { fontSize: 15, color: colors.text, flex: 1, lineHeight: 21 },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10,
  },
  calRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  calText: { fontSize: 14, fontWeight: '700', color: colors.warning },
  portionRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  portionText: { fontSize: 13, color: colors.textMuted },

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
