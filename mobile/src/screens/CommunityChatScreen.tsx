import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  HubConnection, HubConnectionBuilder, HubConnectionState, HttpTransportType,
} from '@microsoft/signalr';
import { useColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { communityService } from '../services/communityService';
import { API_HOST } from '../services/apiClient';
import { CommunityMessage } from '../types/Community';
import { AppRootParamList } from '../navigation/RootNavigator';

type CommunityChatRoute = RouteProp<AppRootParamList, 'CommunityChat'>;
type ConnState = 'connecting' | 'connected' | 'disconnected';

// Gönderen adına tutarlı bir renk ata (WhatsApp grup sohbeti tarzı)
const NAME_COLORS = ['#E5447F', '#7C3AED', '#0EA5E9', '#16A34A', '#EA580C', '#0891B2', '#DB2777', '#65A30D'];
const colorForSender = (senderId: number) => NAME_COLORS[senderId % NAME_COLORS.length];

export default function CommunityChatScreen() {
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const navigation = useNavigation();
  const route = useRoute<CommunityChatRoute>();
  const { communityId, name } = route.params;

  const { user, token } = useAuth();

  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [connState, setConnState] = useState<ConnState>('connecting');

  const connectionRef = useRef<HubConnection | null>(null);

  // ── Geçmiş mesajlar + canlı SignalR bağlantısı ──────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const connection = new HubConnectionBuilder()
      .withUrl(`http://${API_HOST}:5206/hubs/community`, {
        accessTokenFactory: () => token ?? '',
        transport: HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect()
      .build();
    connectionRef.current = connection;

    // Yeni mesaj geldiğinde (listede yoksa) anında ekle
    connection.on('ReceiveMessage', (msg: CommunityMessage) => {
      if (!isMounted) return;
      setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
    });

    connection.onreconnecting(() => { if (isMounted) setConnState('connecting'); });
    connection.onreconnected(async () => {
      if (isMounted) setConnState('connected');
      try { await connection.invoke('JoinGroup', communityId); } catch { /* yok say */ }
    });
    connection.onclose(() => { if (isMounted) setConnState('disconnected'); });

    const init = async () => {
      // 1) Geçmiş mesajları çek
      try {
        const history = await communityService.getCommunityMessages(communityId);
        if (isMounted) setMessages(history);
      } catch {
        if (isMounted) setError('Mesajlar yüklenemedi.');
      } finally {
        if (isMounted) setLoading(false);
      }

      // 2) Canlı bağlantıyı kur ve gruba katıl
      try {
        if (isMounted) setConnState('connecting');
        await connection.start();
        await connection.invoke('JoinGroup', communityId);
        if (isMounted) setConnState('connected');
      } catch {
        if (isMounted) setConnState('disconnected');
      }
    };

    init();

    // ── Çıkışta (unmount): gruptan çık + bağlantıyı kapat ─────────────────────
    return () => {
      isMounted = false;
      const conn = connectionRef.current;
      connectionRef.current = null;
      if (!conn) return;
      (async () => {
        try {
          if (conn.state === HubConnectionState.Connected) {
            await conn.invoke('LeaveGroup', communityId);
          }
        } catch { /* yok say */ }
        try { await conn.stop(); } catch { /* yok say */ }
      })();
    };
  }, [communityId, token]);

  // ── Mesaj gönder (SignalR → backend kaydeder ve gruba yayar) ────────────────
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    const conn = connectionRef.current;
    if (!text) return;
    if (!conn || conn.state !== HubConnectionState.Connected) return;

    setInputText('');
    try {
      setSending(true);
      await conn.invoke('SendMessage', communityId, text);
      // Mesaj, sunucudan "ReceiveMessage" event'i ile geri gelince listeye eklenir.
    } catch {
      setInputText(text); // gönderilemezse metni geri koy
    } finally {
      setSending(false);
    }
  }, [inputText, communityId]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('MainTabs' as never);
  }, [navigation]);

  // Inverted liste için ters çevir (en yeni mesaj en altta görünür)
  const reversed = useMemo(() => [...messages].reverse(), [messages]);

  const connLabel =
    connState === 'connected' ? 'çevrimiçi'
    : connState === 'connecting' ? 'bağlanıyor…'
    : 'çevrimdışı';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Header (grup adı) ─────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={handleBack} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={s.headerAvatar}>
          <Text style={s.headerAvatarText}>{(name?.charAt(0) || '#').toUpperCase()}</Text>
        </View>
        <View style={s.headerInfo}>
          <Text style={s.headerName} numberOfLines={1}>{name}</Text>
          <View style={s.headerStatusRow}>
            <View style={[s.statusDot, {
              backgroundColor: connState === 'connected' ? '#4ADE80'
                : connState === 'connecting' ? '#FBBF24' : '#F87171',
            }]} />
            <Text style={s.headerSub}>{connLabel}</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color={c.primary} /></View>
        ) : error ? (
          <View style={s.center}>
            <Ionicons name="wifi-outline" size={36} color={c.textMuted} />
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={reversed}
            inverted
            keyExtractor={item => String(item.id)}
            contentContainerStyle={s.msgList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <Text style={s.emptyEmoji}>💬</Text>
                <Text style={s.emptyText}>Henüz mesaj yok. İlk mesajı sen gönder!</Text>
              </View>
            }
            renderItem={({ item }) => (
              <MessageBubble message={item} isOwn={item.senderId === user?.id} s={s} c={c} />
            )}
          />
        )}

        {/* ── Mesaj yazma alanı ────────────────────────────────────────── */}
        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            placeholder="Mesaj yaz…"
            placeholderTextColor={c.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[s.sendBtn, { opacity: inputText.trim() && !sending ? 1 : 0.4 }]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.8}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Mesaj Balonu ─────────────────────────────────────────────────────────────
function MessageBubble({
  message, isOwn, s, c,
}: {
  message: CommunityMessage;
  isOwn: boolean;
  s: ReturnType<typeof makeStyles>;
  c: ReturnType<typeof useColors>;
}) {
  const time = new Date(message.sentAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return (
    <View style={[s.bubbleWrap, isOwn ? s.ownWrap : s.otherWrap]}>
      <View style={[s.bubble, isOwn ? s.ownBubble : s.otherBubble]}>
        {!isOwn && (
          <Text style={[s.senderName, { color: colorForSender(message.senderId) }]} numberOfLines={1}>
            {message.senderName}
          </Text>
        )}
        <Text style={[s.bubbleText, isOwn ? s.ownText : s.otherText]}>{message.content}</Text>
        <Text style={[s.time, isOwn ? s.ownTime : s.otherTime]}>{time}</Text>
      </View>
    </View>
  );
}

const makeStyles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },

    header: {
      backgroundColor: '#1E3A5F',
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 12, gap: 10,
    },
    backBtn: { padding: 4 },
    headerAvatar: {
      width: 38, height: 38, borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.18)',
      justifyContent: 'center', alignItems: 'center',
    },
    headerAvatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
    headerInfo: { flex: 1 },
    headerName: { fontSize: 16, fontWeight: '700', color: '#fff' },
    headerStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },

    msgList: { paddingHorizontal: 14, paddingVertical: 12, gap: 7 },

    bubbleWrap: { maxWidth: '82%' },
    ownWrap: { alignSelf: 'flex-end' },
    otherWrap: { alignSelf: 'flex-start' },

    bubble: { borderRadius: 16, paddingHorizontal: 12, paddingTop: 7, paddingBottom: 5, minWidth: 90 },
    ownBubble: { backgroundColor: '#1E3A5F', borderBottomRightRadius: 4 },
    otherBubble: { backgroundColor: c.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: c.border },
    senderName: { fontSize: 12.5, fontWeight: '700', marginBottom: 2 },
    bubbleText: { fontSize: 14.5, lineHeight: 20 },
    ownText: { color: '#FFFFFF' },
    otherText: { color: c.text },
    time: { fontSize: 10, alignSelf: 'flex-end', marginTop: 2 },
    ownTime: { color: 'rgba(255,255,255,0.6)' },
    otherTime: { color: c.textMuted },

    inputBar: {
      flexDirection: 'row', alignItems: 'flex-end', gap: 8,
      paddingHorizontal: 14, paddingTop: 8, paddingBottom: 12,
      backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border,
    },
    input: {
      flex: 1, minHeight: 40, maxHeight: 120,
      backgroundColor: c.background, borderRadius: 20, borderWidth: 1, borderColor: c.border,
      paddingHorizontal: 16, paddingVertical: 9, fontSize: 14.5, color: c.text,
    },
    sendBtn: {
      width: 40, height: 40, borderRadius: 20, backgroundColor: '#1E3A5F',
      justifyContent: 'center', alignItems: 'center',
    },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 32 },
    errorText: { fontSize: 14, color: c.textSecondary, textAlign: 'center' },
    // inverted FlatList içeriği ters döndüğü için boş durumu geri çeviriyoruz
    emptyWrap: { alignItems: 'center', gap: 10, paddingTop: 60, paddingHorizontal: 32, transform: [{ scaleY: -1 }] },
    emptyEmoji: { fontSize: 48 },
    emptyText: { fontSize: 14, color: c.textMuted, textAlign: 'center', lineHeight: 22 },
  });
