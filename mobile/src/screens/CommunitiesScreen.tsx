import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { communityService } from '../services/communityService';
import { Community } from '../types/Community';
import CommunityCard from '../components/CommunityCard';
import { useColors } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppRootParamList } from '../navigation/RootNavigator';

type TabKey = 'discover' | 'my';
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export default function CommunitiesScreen() {
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const navigation = useNavigation<NativeStackNavigationProp<AppRootParamList>>();

  const [tab, setTab] = useState<TabKey>('discover');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const load = useCallback(
    async (showSpinner = true) => {
      try {
        setError(null);
        if (showSpinner) setLoading(true);
        const data =
          tab === 'discover'
            ? await communityService.getDiscoverCommunities()
            : await communityService.getMyCommunities();
        setCommunities(data);
      } catch (e) {
        setError('Topluluklar yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [tab],
  );

  // Sekme her değiştiğinde ilgili listeyi yükle
  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(false);
  }, [load]);

  const handleJoin = useCallback(
    async (id: number) => {
      try {
        setJoiningId(id);
        await communityService.joinCommunity(id);
        // Katıldıktan sonra Keşfet listesini tazele → katılınan grup listeden düşer
        await load(false);
        Alert.alert('Tebrikler! 🎉', 'Topluluğa başarıyla katıldınız.');
      } catch (e) {
        Alert.alert('Hata', 'Topluluğa katılırken bir sorun oluştu. Lütfen tekrar deneyin.');
      } finally {
        setJoiningId(null);
      }
    },
    [load],
  );

  const handleChat = useCallback(
    (community: Community) => {
      navigation.navigate('CommunityChat', { communityId: community.id, name: community.name });
    },
    [navigation],
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.headerWrap}>
        <Text style={s.headerTitle}>Topluluklar</Text>

        {/* Keşfet / Topluluklarım geçişi */}
        <View style={s.toggleWrap}>
          {(['discover', 'my'] as const).map((key) => {
            const active = tab === key;
            const label = key === 'discover' ? 'Keşfet' : 'Topluluklarım';
            const iconName: IoniconName =
              key === 'discover'
                ? active ? 'compass' : 'compass-outline'
                : active ? 'people' : 'people-outline';
            return (
              <TouchableOpacity
                key={key}
                style={[s.toggleBtn, active && s.toggleBtnActive]}
                onPress={() => setTab(key)}
                activeOpacity={0.85}
              >
                <Ionicons name={iconName} size={16} color={active ? '#fff' : c.textSecondary} />
                <Text style={[s.toggleText, active && s.toggleTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : error ? (
        <View style={s.center}>
          <Ionicons name="wifi-outline" size={40} color={c.textMuted} />
          <Text style={s.errorTitle}>Bağlantı Hatası</Text>
          <Text style={s.errorSub}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => load()}>
            <Text style={s.retryText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={communities}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[s.list, communities.length === 0 && s.listEmpty]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
          }
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={s.emptyEmoji}>{tab === 'discover' ? '🔍' : '👥'}</Text>
              <Text style={s.emptyText}>
                {tab === 'discover'
                  ? 'Şu an katılabileceğin yeni topluluk yok.'
                  : 'Henüz bir topluluğa katılmadın.'}
              </Text>
              {tab === 'my' && (
                <TouchableOpacity style={s.emptyCta} onPress={() => setTab('discover')} activeOpacity={0.85}>
                  <Ionicons name="compass-outline" size={16} color="#fff" />
                  <Text style={s.emptyCtaText}>Toplulukları Keşfet</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <CommunityCard
              community={item}
              isDiscover={tab === 'discover'}
              joining={joiningId === item.id}
              onJoin={() => handleJoin(item.id)}
              onChat={() => handleChat(item)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },

    headerWrap: {
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      paddingTop: 16,
      paddingBottom: 12,
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: c.text, paddingHorizontal: 20 },

    toggleWrap: {
      flexDirection: 'row',
      backgroundColor: c.background,
      borderRadius: 12,
      padding: 4,
      marginHorizontal: 16,
      marginTop: 14,
      gap: 4,
    },
    toggleBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 9,
    },
    toggleBtnActive: {
      backgroundColor: c.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 3,
      elevation: 2,
    },
    toggleText: { fontSize: 14, fontWeight: '700', color: c.textSecondary },
    toggleTextActive: { color: '#fff' },

    list: { padding: 16, gap: 12, paddingBottom: 32 },
    listEmpty: { flexGrow: 1, justifyContent: 'center' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 32 },
    errorTitle: { fontSize: 17, fontWeight: '700', color: c.text },
    errorSub: { fontSize: 14, color: c.textSecondary, textAlign: 'center' },
    retryBtn: {
      marginTop: 8,
      backgroundColor: c.primary,
      borderRadius: 10,
      paddingHorizontal: 24,
      paddingVertical: 10,
    },
    retryText: { color: '#fff', fontWeight: '700' },

    emptyEmoji: { fontSize: 48 },
    emptyText: { fontSize: 15, color: c.textMuted, textAlign: 'center' },
    emptyCta: {
      marginTop: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: c.primary,
      borderRadius: 10,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    emptyCtaText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  });
