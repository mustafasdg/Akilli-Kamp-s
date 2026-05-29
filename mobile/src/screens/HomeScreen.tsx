import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { useHomeData } from '../hooks/useHomeData';
import { useWeather, getWeatherDescription } from '../hooks/useWeather';
import { Announcement, Menu } from '../types/models';
import colors from '../theme/colors';
import { AppTabParamList } from '../navigation/AppTabs';

type NavProp = BottomTabNavigationProp<AppTabParamList>;

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<NavProp>();
  const { announcements, todayMenu, locations, isLoading, error, refresh } = useHomeData();
  const { weather } = useWeather(37.7648, 30.5566);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';
  const dateStr = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const { label: weatherLabel, emoji: weatherEmoji } = weather
    ? getWeatherDescription(weather.weathercode)
    : { label: '—', emoji: '🌤️' };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        {/* ── 1. Header ──────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.date}>{dateStr}</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
        </View>

        {/* ── 2. Hava Durumu Şeridi ──────────────────────────── */}
        <View style={styles.weatherStrip}>
          <Text style={styles.weatherEmoji}>{weatherEmoji}</Text>
          <View style={styles.weatherInfo}>
            <Text style={styles.weatherTemp}>
              {weather ? `${Math.round(weather.temperature)}°C` : '--°C'}
            </Text>
            <Text style={styles.weatherLabel}>{weatherLabel}</Text>
          </View>
          <View style={styles.weatherDivider} />
          <Ionicons name="arrow-up-circle-outline" size={15} color={colors.primary} />
          <Text style={styles.weatherWind}>
            {weather ? `${Math.round(weather.windspeed)} km/s` : '-- km/s'}
          </Text>
          <View style={styles.weatherDivider} />
          <Ionicons name="location-outline" size={15} color={colors.textMuted} />
          <Text style={styles.weatherCity}>Isparta</Text>
        </View>

        {/* ── 3. Harita + Menü Kartları (yan yana) ─────────────*/}
        <View style={styles.cardRow}>
          {/* Harita */}
          <TouchableOpacity
            style={[styles.squareCard, styles.mapCard]}
            onPress={() => navigation.navigate('Map')}
            activeOpacity={0.85}
          >
            <Text style={styles.squareEmoji}>🗺️</Text>
            <Text style={styles.squareTitle}>Kampüs{'\n'}Haritası</Text>
            <View style={styles.squareBadge}>
              <Text style={styles.squareBadgeText}>{locations.length} bina</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} style={styles.squareArrow} />
          </TouchableOpacity>

          {/* Menü */}
          <TouchableOpacity
            style={[styles.squareCard, styles.menuCard]}
            onPress={() => navigation.navigate('Menu')}
            activeOpacity={0.85}
          >
            <Text style={styles.squareEmoji}>🍽️</Text>
            <Text style={styles.squareTitle}>Bugünün{'\n'}Menüsü</Text>
            {todayMenu ? (
              <View style={styles.menuSnippet}>
                <Text style={styles.menuSnippetText} numberOfLines={1}>
                  {todayMenu.yemek_1}
                </Text>
                <Text style={styles.menuKcal}>🔥 {todayMenu.kalori} kcal</Text>
              </View>
            ) : (
              <View style={styles.squareBadge}>
                <Text style={styles.squareBadgeText}>Menüye git</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={14} color={colors.primary} style={styles.squareArrow} />
          </TouchableOpacity>
        </View>

        {/* ── 4. Duyurular ───────────────────────────────────── */}
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="wifi-outline" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <SectionHeader
          title="Son Duyurular"
          icon="megaphone-outline"
          onSeeAll={() => navigation.navigate('Announcements')}
        />

        {isLoading && !announcements.length ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
        ) : announcements.length === 0 ? (
          <EmptyCard text="Henüz duyuru yok." />
        ) : (
          announcements.map(a => (
            <TouchableOpacity
              key={a.id}
              onPress={() => navigation.navigate('Announcements')}
              activeOpacity={0.85}
            >
              <AnnouncementCard item={a} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Alt bileşenler ───────────────────────────────────────────────────────────

function SectionHeader({
  title, icon, onSeeAll,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onSeeAll?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={17} color={colors.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} style={styles.seeAll}>
          <Text style={styles.seeAllText}>Tümü</Text>
          <Ionicons name="chevron-forward" size={13} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function AnnouncementCard({ item }: { item: Announcement }) {
  const badge = getBadgeStyle(item.kategori);
  const dateStr = new Date(item.tarih).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short',
  });
  return (
    <View style={styles.annCard}>
      <View style={styles.annTop}>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.text }]}>{item.kategori}</Text>
        </View>
        <Text style={styles.annDate}>{dateStr}</Text>
      </View>
      <Text style={styles.annTitle} numberOfLines={2}>{item.baslik}</Text>
      <Text style={styles.annBody} numberOfLines={2}>{item.icerik}</Text>
    </View>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <View style={[styles.annCard, { alignItems: 'center', paddingVertical: 24 }]}>
      <Text style={{ fontSize: 14, color: colors.textMuted }}>{text}</Text>
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
  container: { paddingBottom: 32, gap: 12 },

  // 1. Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4,
  },
  greeting:  { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  userName:  { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 2 },
  date:      { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },

  // 2. Hava durumu şeridi
  weatherStrip: {
    marginHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  weatherEmoji: { fontSize: 22 },
  weatherInfo: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  weatherTemp: { fontSize: 16, fontWeight: '800', color: colors.text },
  weatherLabel: { fontSize: 13, color: colors.textSecondary },
  weatherDivider: { width: 1, height: 16, backgroundColor: colors.border, marginHorizontal: 2 },
  weatherWind: { fontSize: 13, color: colors.textSecondary },
  weatherCity: { fontSize: 13, color: colors.textMuted, flex: 1, textAlign: 'right' },

  // 3. Yan yana kartlar
  cardRow: { flexDirection: 'row', gap: 12, marginHorizontal: 20 },
  squareCard: {
    flex: 1, borderRadius: 16, padding: 16, minHeight: 150,
    borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    gap: 6,
  },
  mapCard:  { backgroundColor: colors.surface },
  menuCard: { backgroundColor: colors.surface },

  squareEmoji: { fontSize: 28 },
  squareTitle: { fontSize: 14, fontWeight: '700', color: colors.text, lineHeight: 20 },
  squareBadge: {
    alignSelf: 'flex-start', backgroundColor: colors.primaryLight,
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  squareBadgeText: { fontSize: 11, fontWeight: '600', color: colors.primary },
  squareArrow: { position: 'absolute', top: 12, right: 12 },

  menuSnippet: { gap: 3 },
  menuSnippetText: { fontSize: 12, color: colors.textSecondary },
  menuKcal: { fontSize: 12, fontWeight: '600', color: colors.warning },

  // 4. Duyurular
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.errorLight, borderRadius: 10,
    padding: 12, marginHorizontal: 20,
  },
  errorText: { fontSize: 13, color: colors.error },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    marginTop: 4, marginHorizontal: 20,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  annCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.border, gap: 8,
    marginHorizontal: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  annTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  annDate: { fontSize: 11, color: colors.textMuted },
  annTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  annBody: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
});
