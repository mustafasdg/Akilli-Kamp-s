import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColors } from '../context/ThemeContext';
import { useTeachers } from '../hooks/useTeachers';
import { Teacher } from '../types/models';
import { AppRootParamList } from '../navigation/RootNavigator';
import UserAvatar from '../components/UserAvatar';

type NavProp = NativeStackNavigationProp<AppRootParamList>;

export default function AcademicsScreen() {
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const navigation = useNavigation<NavProp>();
  const { teachers, isLoading, error, refresh } = useTeachers();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return teachers;
    const q = query.toLowerCase();
    return teachers.filter(
      t =>
        t.name.toLowerCase().includes(q) ||
        (t.department ?? '').toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q),
    );
  }, [teachers, query]);

  if (isLoading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Header query={query} onQuery={setQuery} s={s} c={c} />
        <View style={s.center}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={s.loadingText}>Akademisyenler yükleniyor…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Header query={query} onQuery={setQuery} s={s} c={c} />
        <View style={s.center}>
          <Ionicons name="wifi-outline" size={44} color={c.textMuted} />
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
      <Header query={query} onQuery={setQuery} s={s} c={c} count={filtered.length} />
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={c.primary} />
        }
        ListEmptyComponent={
          <View style={s.center}>
            <Text style={s.emptyEmoji}>{query ? '🔍' : '🎓'}</Text>
            <Text style={s.emptyText}>
              {query ? 'Eşleşen akademisyen bulunamadı.' : 'Henüz akademisyen eklenmemiş.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TeacherCard
            teacher={item}
            onPress={() => navigation.navigate('TeacherProfile', { teacher: item })}
            s={s}
            c={c}
          />
        )}
      />
    </SafeAreaView>
  );
}

// ─── Alt bileşenler ───────────────────────────────────────────────────────────

function Header({
  query, onQuery, s, c, count,
}: {
  query: string; onQuery: (v: string) => void;
  s: ReturnType<typeof makeStyles>; c: any; count?: number;
}) {
  return (
    <View style={s.headerWrap}>
      <View style={s.headerRow}>
        <Text style={s.headerTitle}>Akademisyenler</Text>
        {count !== undefined && (
          <View style={s.countBadge}>
            <Text style={s.countText}>{count}</Text>
          </View>
        )}
      </View>
      <View style={s.searchRow}>
        <Ionicons name="search-outline" size={17} color={c.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder="İsim veya bölüm ara…"
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

function TeacherCard({
  teacher, onPress, s, c,
}: {
  teacher: Teacher; onPress: () => void;
  s: ReturnType<typeof makeStyles>; c: any;
}) {
  const dept = teacher.department ?? inferDepartment(teacher.email);
  // Anlık saat dilimine göre durum (useTeachers hesaplar): müsait → yeşil, değilse → kırmızı
  const available = teacher.currentStatus?.available ?? false;
  const label     = teacher.currentStatus?.label ?? 'Müsait Değil';

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <UserAvatar name={teacher.name} size={52} backgroundColor={c.primary} />

      <View style={s.cardBody}>
        <Text style={s.cardName} numberOfLines={1}>{teacher.name}</Text>
        <Text style={s.cardDept} numberOfLines={1}>{dept}</Text>
        <View style={s.cardFooter}>
          <View
            style={[
              s.availBadge,
              { backgroundColor: available ? c.successLight : c.errorLight },
            ]}
          >
            <View
              style={[
                s.availDot,
                { backgroundColor: available ? c.success : c.error },
              ]}
            />
            <Text
              style={[
                s.availText,
                { color: available ? c.success : c.error },
              ]}
            >
              {label}
            </Text>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={22} color={c.primary} />
    </TouchableOpacity>
  );
}

/** Email'den basit bölüm tahmini (bölüm verisi yoksa) */
function inferDepartment(email: string): string {
  const domain = email.split('@')[0] ?? '';
  if (domain.includes('bilgisayar') || domain.includes('cs')) return 'Bilgisayar Müh.';
  if (domain.includes('elektrik') || domain.includes('ee'))  return 'Elektrik-Elektronik';
  if (domain.includes('makine')   || domain.includes('me'))  return 'Makine Müh.';
  if (domain.includes('insaat')   || domain.includes('ce'))  return 'İnşaat Müh.';
  return 'Akademik Personel';
}

// ─── Stiller ─────────────────────────────────────────────────────────────────

const makeStyles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },

    headerWrap: {
      backgroundColor: c.surface,
      borderBottomWidth: 1, borderBottomColor: c.border,
      paddingBottom: 12,
    },
    headerRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10,
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: c.text },
    countBadge: {
      backgroundColor: c.primaryLight, borderRadius: 12,
      paddingHorizontal: 10, paddingVertical: 3,
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
      backgroundColor: c.surface, borderRadius: 16, padding: 14,
      flexDirection: 'row', alignItems: 'center', gap: 14,
      borderWidth: 1, borderColor: c.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
    },
    cardBody: { flex: 1, gap: 3 },
    cardName: { fontSize: 15, fontWeight: '700', color: c.text },
    cardDept: { fontSize: 13, color: c.textSecondary },
    cardFooter: { flexDirection: 'row', marginTop: 4 },

    availBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
      alignSelf: 'flex-start',
    },
    availDot: { width: 7, height: 7, borderRadius: 4 },
    availText: { fontSize: 11, fontWeight: '600' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 32 },
    loadingText: { fontSize: 14, color: c.textMuted, marginTop: 8 },
    errorTitle: { fontSize: 17, fontWeight: '700', color: c.text },
    errorSub: { fontSize: 14, color: c.textSecondary, textAlign: 'center' },
    retryBtn: {
      marginTop: 8, backgroundColor: c.primary,
      borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10,
    },
    retryText: { color: '#fff', fontWeight: '700' },
    emptyEmoji: { fontSize: 48 },
    emptyText: { fontSize: 15, color: c.textMuted, textAlign: 'center' },
  });
