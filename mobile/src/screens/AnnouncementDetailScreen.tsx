import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppRootParamList } from '../navigation/RootNavigator';
import { useColors } from '../context/ThemeContext';

type Props = NativeStackScreenProps<AppRootParamList, 'AnnouncementDetail'>;

export default function AnnouncementDetailScreen({ route, navigation }: Props) {
  const { item } = route.params;
  const c = useColors();
  const s = makeStyles(c);

  const badge = getBadgeStyle(item.kategori, c);
  const dateStr = new Date(item.tarih).toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const timeStr = new Date(item.tarih).toLocaleTimeString('tr-TR', {
    hour: '2-digit', minute: '2-digit',
  });

  const handleShare = async () => {
    await Share.share({
      message: `${item.baslik}\n\n${item.icerik}`,
      title: item.baslik,
    });
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={c.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>Duyuru Detayı</Text>
        <TouchableOpacity onPress={handleShare} style={s.shareBtn}>
          <Ionicons name="share-outline" size={22} color={c.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {/* Kategori + Tarih */}
        <View style={s.meta}>
          <View style={[s.badge, { backgroundColor: badge.bg }]}>
            <Text style={[s.badgeText, { color: badge.text }]}>{item.kategori}</Text>
          </View>
          <View style={s.dateRow}>
            <Ionicons name="time-outline" size={13} color={c.textMuted} />
            <Text style={s.dateText}>{dateStr} · {timeStr}</Text>
          </View>
        </View>

        {/* Başlık */}
        <Text style={s.title}>{item.baslik}</Text>

        {/* Ayırıcı */}
        <View style={s.divider} />

        {/* İçerik */}
        <Text style={s.body}>{item.icerik}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function getBadgeStyle(kategori: string, c: ReturnType<typeof useColors>) {
  const k = (kategori ?? '').toLowerCase();
  if (k.includes('akademik')) return c.badge.akademik;
  if (k.includes('spor'))     return c.badge.spor;
  if (k.includes('sosyal'))   return c.badge.sosyal;
  if (k.includes('duyuru'))   return c.badge.duyuru;
  return c.badge.genel;
}

const makeStyles = (c: ReturnType<typeof useColors>) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: c.surface,
    borderBottomWidth: 1, borderBottomColor: c.border,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: c.background,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: c.text, flex: 1, textAlign: 'center' },
  shareBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: c.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },

  container: { padding: 20, gap: 16, paddingBottom: 40 },

  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 },
  badge: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateText: { fontSize: 12, color: c.textMuted },

  title: { fontSize: 22, fontWeight: '800', color: c.text, lineHeight: 30 },

  divider: { height: 1, backgroundColor: c.border },

  body: { fontSize: 16, color: c.textSecondary, lineHeight: 26 },
});
