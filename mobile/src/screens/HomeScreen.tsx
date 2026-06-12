import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useHomeData } from '../hooks/useHomeData';
import { useMenus } from '../hooks/useMenus';
import { useWeather, getWeatherDescription } from '../hooks/useWeather';
import { useNews } from '../hooks/useNews';
import { useEvents } from '../hooks/useEvents';
import { Announcement, News, Event } from '../types/models';
import { useColors } from '../context/ThemeContext';
import colors from '../theme/colors';
import { AppTabParamList } from '../navigation/AppTabs';
import { AppRootParamList } from '../navigation/RootNavigator';
import UserAvatar from '../components/UserAvatar';
import { formatName } from '../utils/avatarUtils';
import { useNotifications } from '../hooks/useNotifications';

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList>,
  NativeStackNavigationProp<AppRootParamList>
>;

export default function HomeScreen() {
  const { user } = useAuth();
  const colors = useColors();
  const navigation = useNavigation<NavProp>();
  useNotifications();
  const { announcements, locations, isLoading, error, refresh } = useHomeData();
  const { items: menuItems, loading: menuLoading, refresh: refreshMenus } = useMenus();
  const todayMenu = useMemo(() => {
    const today = new Date().toDateString();
    return (
      menuItems.find(m => new Date(m.tarih).toDateString() === today) ??
      menuItems[menuItems.length - 1] ??
      null
    );
  }, [menuItems]);
  const { weather } = useWeather(37.7648, 30.5566);
  const { items: newsItems, isLoading: newsLoading } = useNews();
  const { items: eventItems, isLoading: eventsLoading } = useEvents();

  const upcomingEvents = useMemo(
    () => eventItems.filter(e => new Date(e.tarih) >= new Date()).slice(0, 3),
    [eventItems],
  );

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';
  const dateStr = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const { label: weatherLabel, emoji: weatherEmoji } = weather
    ? getWeatherDescription(weather.weathercode)
    : { label: '—', emoji: '🌤️' };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading || menuLoading}
            onRefresh={() => { refresh(); refreshMenus(); }}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── 1. Header ────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
            <UserAvatar name={user?.name ?? '?'} size={46} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.greeting} numberOfLines={1}>{greeting} 👋</Text>
            <Text style={styles.userName} numberOfLines={1}>{formatName(user?.name ?? '')}</Text>
          </View>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => navigation.navigate('Announcements')}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ── 2. Hava Durumu Şeridi ─────────────────────────────*/}
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

          <TouchableOpacity
            style={[styles.squareCard, styles.menuCard]}
            onPress={() => navigation.navigate('Menu')}
            activeOpacity={0.85}
          >
            <Text style={styles.squareEmoji}>🍽️</Text>
            <Text style={styles.squareTitle}>Bugünün{'\n'}Menüsü</Text>
            {todayMenu ? (
              <View style={styles.menuSnippet}>
                <Text style={styles.menuSnippetText} numberOfLines={1}>{todayMenu.yemek_1}</Text>
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

        {/* ── 4. Duyurular ─────────────────────────────────────*/}
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
              onPress={() => navigation.navigate('AnnouncementDetail', { item: a })}
              activeOpacity={0.85}
            >
              <AnnouncementCard item={a} colors={colors} />
            </TouchableOpacity>
          ))
        )}

        {/* ── 5. Kampüs Haberleri ──────────────────────────────*/}
        <SectionHeader
          title="Kampüs Haberleri"
          icon="newspaper-outline"
          onSeeAll={() => navigation.navigate('News')}
        />

        {newsLoading && !newsItems.length ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
        ) : newsItems.length === 0 ? (
          <EmptyCard text="Henüz haber yok." />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hScroll}
          >
            {newsItems.slice(0, 5).map(n => (
              <TouchableOpacity
                key={n.id}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('News')}
              >
                <NewsPreviewCard item={n} />
              </TouchableOpacity>
            ))}
            {/* Son kart: Tümünü Gör */}
            <TouchableOpacity
              style={styles.seeAllCard}
              onPress={() => navigation.navigate('News')}
              activeOpacity={0.85}
            >
              <View style={styles.seeAllCardIcon}>
                <Ionicons name="arrow-forward" size={22} color="#fff" />
              </View>
              <Text style={styles.seeAllCardText}>Tümünü{'\n'}Gör</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ── 6. Yaklaşan Etkinlikler ──────────────────────────*/}
        <SectionHeader
          title="Yaklaşan Etkinlikler"
          icon="calendar-outline"
          onSeeAll={() => navigation.navigate('Events')}
        />

        {eventsLoading && !eventItems.length ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
        ) : upcomingEvents.length === 0 ? (
          <EmptyCard text="Yaklaşan etkinlik bulunmuyor." />
        ) : (
          upcomingEvents.map(e => (
            <TouchableOpacity
              key={e.id}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Events')}
            >
              <EventPreviewCard item={e} />
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

function AnnouncementCard({ item, colors }: { item: Announcement; colors: any }) {
  const badge = getBadgeStyle(item.kategori, colors);
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

function NewsPreviewCard({ item }: { item: News }) {
  const badge = getBadgeStyle(item.kategori, colors);
  const dateStr = new Date(item.tarih).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'short',
  });
  const isRecent = (Date.now() - new Date(item.tarih).getTime()) < 7 * 24 * 60 * 60 * 1000;

  return (
    <View style={styles.newsCard}>
      {/* Lacivert aksanlı üst şerit */}
      <View style={styles.newsCardBar} />
      <View style={styles.newsCardBody}>
        <View style={styles.newsCardTop}>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{item.kategori}</Text>
          </View>
          {isRecent && (
            <View style={styles.newPill}>
              <Text style={styles.newPillText}>Yeni</Text>
            </View>
          )}
        </View>
        <Text style={styles.newsCardTitle} numberOfLines={3}>{item.baslik}</Text>
        <View style={styles.newsCardFooter}>
          <Ionicons name="time-outline" size={11} color={colors.textMuted} />
          <Text style={styles.newsCardDate}>{dateStr}</Text>
        </View>
      </View>
    </View>
  );
}

function EventPreviewCard({ item }: { item: Event }) {
  const date = new Date(item.tarih);
  const isToday = date.toDateString() === new Date().toDateString();
  const dayStr   = date.toLocaleDateString('tr-TR', { day: 'numeric' });
  const monthStr = date.toLocaleDateString('tr-TR', { month: 'short' });
  const timeStr  = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  const badge    = getBadgeStyle(item.kategori, colors);

  return (
    <View style={[styles.eventCard, isToday && styles.eventCardToday]}>
      {/* Sol — mini takvim */}
      <View style={[styles.eventDatePill, isToday && styles.eventDatePillToday]}>
        <Text style={[styles.eventDay, isToday && styles.eventDayToday]}>{dayStr}</Text>
        <Text style={[styles.eventMonth, isToday && styles.eventMonthToday]}>{monthStr}</Text>
      </View>

      {/* Sağ — içerik */}
      <View style={styles.eventContent}>
        <View style={styles.eventTop}>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>{item.kategori}</Text>
          </View>
          {isToday && (
            <View style={styles.todayPill}>
              <Text style={styles.todayPillText}>Bugün</Text>
            </View>
          )}
        </View>
        <Text style={styles.eventTitle} numberOfLines={2}>{item.baslik}</Text>
        <View style={styles.eventMeta}>
          <Ionicons name="time-outline" size={12} color={colors.textMuted} />
          <Text style={styles.eventMetaText}>{timeStr}</Text>
          {item.locationId != null && (
            <>
              <Ionicons name="location-outline" size={12} color={colors.textMuted} />
              <Text style={styles.eventMetaText}>Konum eklendi</Text>
            </>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
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

function getBadgeStyle(kategori: string, c: any) {
  const k = (kategori ?? '').toLowerCase();
  if (k.includes('akademik')) return c.badge.akademik;
  if (k.includes('spor'))     return c.badge.spor;
  if (k.includes('sosyal'))   return c.badge.sosyal;
  if (k.includes('duyuru'))   return c.badge.duyuru;
  return c.badge.genel;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { paddingBottom: 40, gap: 12 },

  // ── 1. Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerCenter: { flex: 1 },
  greeting:  { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  userName:  { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 1 },
  bellBtn: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.primaryLight,
  },

  // ── 2. Hava durumu
  weatherStrip: {
    marginHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E3F0FB',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: '#C5DDF2',
    shadowColor: '#1E3A5F', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  weatherEmoji: { fontSize: 22 },
  weatherInfo: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  weatherTemp: { fontSize: 16, fontWeight: '800', color: '#15324F' },
  weatherLabel: { fontSize: 13, color: '#3A5A7A' },
  weatherDivider: { width: 1, height: 16, backgroundColor: '#B3CFE8', marginHorizontal: 2 },
  weatherWind: { fontSize: 13, color: '#3A5A7A' },
  weatherCity: { fontSize: 13, color: '#5A7A98', flex: 1, textAlign: 'right' },

  // ── 3. Yan yana kartlar
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

  // ── 4. Duyurular
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

  // ── 5. Haber önizleme kartları (yatay scroll)
  hScroll: {
    paddingHorizontal: 20, gap: 10, paddingBottom: 4,
  },
  newsCard: {
    width: 170, backgroundColor: colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    shadowColor: '#1E3A5F', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  newsCardBar: { height: 4, backgroundColor: colors.primary },
  newsCardBody: { padding: 12, gap: 8 },
  newsCardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  newPill: {
    backgroundColor: colors.primary, borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  newPillText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  newsCardTitle: { fontSize: 13, fontWeight: '700', color: colors.text, lineHeight: 18 },
  newsCardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  newsCardDate: { fontSize: 11, color: colors.textMuted },

  seeAllCard: {
    width: 90, backgroundColor: colors.primary, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 20,
    shadowColor: '#1E3A5F', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  seeAllCardIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  seeAllCardText: {
    fontSize: 12, fontWeight: '700', color: '#fff', textAlign: 'center', lineHeight: 17,
  },

  // ── 6. Etkinlik önizleme kartları (dikey)
  eventCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: colors.border,
    marginHorizontal: 20,
    shadowColor: '#1E3A5F', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 5, elevation: 2,
  },
  eventCardToday: {
    borderColor: colors.primary, borderWidth: 1.5,
    backgroundColor: colors.primaryLight + '30',
  },

  eventDatePill: {
    width: 50, borderRadius: 10, paddingVertical: 8,
    backgroundColor: colors.border,
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  eventDatePillToday: { backgroundColor: colors.primary },
  eventDay: { fontSize: 22, fontWeight: '800', color: colors.textSecondary, lineHeight: 26 },
  eventDayToday: { color: '#fff' },
  eventMonth: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  eventMonthToday: { color: 'rgba(255,255,255,0.85)' },

  eventContent: { flex: 1, gap: 5 },
  eventTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  todayPill: {
    backgroundColor: colors.primary, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  todayPillText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  eventTitle: { fontSize: 14, fontWeight: '700', color: colors.text, lineHeight: 19 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventMetaText: { fontSize: 11, color: colors.textMuted },
});
