import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColors } from '../context/ThemeContext';
import { dataService } from '../services/dataService';
import { ConversationSummary, Teacher } from '../types/models';
import { AppRootParamList } from '../navigation/RootNavigator';
import UserAvatar from '../components/UserAvatar';

type NavProp = NativeStackNavigationProp<AppRootParamList>;

function timeLabel(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);

  if (diffDays === 0)
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Dün';
  if (diffDays < 7)
    return d.toLocaleDateString('tr-TR', { weekday: 'short' });
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export default function TeacherMessagesScreen() {
  const c          = useColors();
  const s          = useMemo(() => makeStyles(c), [c]);
  const navigation = useNavigation<NavProp>();
  const route      = useRoute();
  // Bu ekran hem "Sohbetler" sekmesi hem de stack'e itilen 'TeacherMessages' olarak kullanılır.
  // Yalnızca stack örneğinde geri butonu göster (sekmede gereksiz / çıkmaz sokak değil).
  const showBack   = route.name === 'TeacherMessages';

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await dataService.getTeacherConversations();
      setConversations(res.data ?? []);
      setError(null);
    } catch {
      setError('Sohbetler yüklenemedi.');
      setConversations([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchConversations().finally(() => setLoading(false));
  }, [fetchConversations]);

  // Ekran odaklandığında listeyi yenile (Chat'ten dönünce sayım güncellenir)
  useFocusEffect(
    useCallback(() => {
      if (!loading) fetchConversations();
    }, [fetchConversations, loading]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, [fetchConversations]);

  const openChat = useCallback((conv: ConversationSummary) => {
    const pseudoTeacher: Teacher = {
      id: conv.partnerId,
      name: conv.partnerName,
      email: '',
      role: 'student',
      department: 'Öğrenci',
    };
    navigation.navigate('Chat', { teacher: pseudoTeacher });
  }, [navigation]);

  const renderItem = ({ item }: { item: ConversationSummary }) => {
    const hasUnread  = item.unreadCount > 0;
    const hasMessage = item.lastMessage && item.lastMessage.trim().length > 0;

    return (
      <TouchableOpacity style={s.row} onPress={() => openChat(item)} activeOpacity={0.7}>
        <UserAvatar name={item.partnerName} size={48} backgroundColor={c.primary} />

        <View style={s.rowBody}>
          <View style={s.rowTop}>
            <Text style={[s.name, hasUnread && s.nameUnread]} numberOfLines={1}>
              {item.partnerName}
            </Text>
            {item.lastMessageTime ? (
              <Text style={s.time}>{timeLabel(item.lastMessageTime)}</Text>
            ) : null}
          </View>

          <View style={s.rowBottom}>
            <Text
              style={[s.preview, hasUnread ? s.previewUnread : !hasMessage && s.previewMuted]}
              numberOfLines={1}
            >
              {hasMessage ? item.lastMessage : 'Sohbet başlat'}
            </Text>
            {hasUnread && (
              <View style={s.badge}>
                <Text style={s.badgeText}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        {showBack && (
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={s.headerBack}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
        )}
        <Text style={s.headerTitle}>Sohbetler</Text>
        <TouchableOpacity onPress={handleRefresh} hitSlop={12}>
          <Ionicons name="refresh-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : error ? (
        <View style={s.center}>
          <Ionicons name="wifi-outline" size={40} color={c.textMuted} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={handleRefresh}>
            <Text style={s.retryText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => String(item.partnerId)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          contentContainerStyle={conversations.length === 0 ? s.emptyContainer : undefined}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.primary} />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="chatbubbles-outline" size={52} color={c.textMuted} />
              <Text style={s.emptyTitle}>Henüz öğrenci yok</Text>
              <Text style={s.emptySubtitle}>
                Randevu alan veya mesaj gönderen öğrenciler burada görünecek.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    safe:   { flex: 1, backgroundColor: c.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: c.primary, paddingHorizontal: 16, paddingVertical: 14,
    },
    headerBack: { marginRight: 10 },
    headerTitle: {
      flex: 1, color: '#fff', fontSize: 20, fontWeight: '800',
    },

    row: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 16, paddingVertical: 14,
      backgroundColor: c.surface,
    },
    rowBody: { flex: 1, gap: 4 },
    rowTop:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

    name:        { fontSize: 15, fontWeight: '600', color: c.text, flex: 1 },
    nameUnread:  { fontWeight: '800' },
    time:        { fontSize: 12, color: c.textMuted, marginLeft: 8 },

    preview:       { fontSize: 13, color: c.textSecondary, flex: 1 },
    previewUnread: { color: c.text, fontWeight: '600' },
    previewMuted:  { color: c.textMuted, fontStyle: 'italic' },

    badge: {
      minWidth: 20, height: 20, borderRadius: 10,
      backgroundColor: c.primary,
      justifyContent: 'center', alignItems: 'center',
      paddingHorizontal: 5, marginLeft: 8,
    },
    badgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },

    separator:      { height: 1, backgroundColor: c.borderLight ?? c.border, marginLeft: 76 },

    errorText: { fontSize: 14, color: c.textSecondary, textAlign: 'center' },
    retryBtn:  { backgroundColor: c.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
    retryText: { color: '#fff', fontWeight: '700' },

    emptyContainer: { flex: 1 },
    empty: {
      flex: 1, justifyContent: 'center', alignItems: 'center',
      gap: 10, paddingHorizontal: 40,
    },
    emptyTitle:    { fontSize: 17, fontWeight: '700', color: c.text },
    emptySubtitle: { fontSize: 14, color: c.textMuted, textAlign: 'center', lineHeight: 21 },
  });
