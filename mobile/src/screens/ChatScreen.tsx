import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../hooks/useMessages';
import { Message } from '../types/models';
import { AppRootParamList } from '../navigation/RootNavigator';

type ChatRouteProp = RouteProp<AppRootParamList, 'Chat'>;

/** Randevu talebi mesajlarını tanımlamak için önek */
const APPOINTMENT_PREFIX = '[RANDEVU_TALEBI]';

export default function ChatScreen() {
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute<ChatRouteProp>();
  const { teacher } = route.params;

  const { messages, isLoading, isSending, error, sendMessage, refresh } =
    useMessages(teacher.id);

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList<Message>>(null);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    try {
      await sendMessage(text);
    } catch {
      Alert.alert('Hata', 'Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    }
  }, [inputText, sendMessage]);

  const handleAppointmentRequest = useCallback(async () => {
    const dateStr = new Date().toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    const content = `${APPOINTMENT_PREFIX} ${dateStr} tarihinde randevu talebinde bulundum.`;
    try {
      await sendMessage(content);
    } catch {
      Alert.alert('Hata', 'Randevu talebi gönderilemedi.');
    }
  }, [sendMessage]);

  // FlatList için mesajları ters çevir (en yeni altta)
  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <Text style={s.headerName} numberOfLines={1}>{teacher.name}</Text>
          <Text style={s.headerSub}>{teacher.department ?? 'Akademik Personel'}</Text>
        </View>
        <TouchableOpacity style={s.refreshBtn} onPress={refresh}>
          <Ionicons name="refresh-outline" size={22} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* ── Mesaj listesi ────────────────────────────────────────── */}
        {isLoading ? (
          <View style={s.center}>
            <ActivityIndicator color={c.primary} size="large" />
          </View>
        ) : error ? (
          <View style={s.center}>
            <Ionicons name="wifi-outline" size={36} color={c.textMuted} />
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={refresh}>
              <Text style={s.retryText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={reversedMessages}
            inverted
            keyExtractor={item => String(item.id)}
            contentContainerStyle={s.msgList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <Text style={s.emptyEmoji}>💬</Text>
                <Text style={s.emptyText}>
                  Henüz mesaj yok. İlk mesajı siz gönderin!
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isOwn={item.senderId === user?.id}
                s={s}
                c={c}
              />
            )}
          />
        )}

        {/* ── Randevu Talep Et butonu ──────────────────────────────── */}
        <TouchableOpacity
          style={s.appointmentBtn}
          onPress={handleAppointmentRequest}
          activeOpacity={0.85}
          disabled={isSending}
        >
          <Ionicons name="calendar-outline" size={18} color="#fff" />
          <Text style={s.appointmentBtnText}>Randevu Talep Et</Text>
        </TouchableOpacity>

        {/* ── Mesaj yazma alanı ────────────────────────────────────── */}
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
            style={[s.sendBtn, { opacity: inputText.trim() && !isSending ? 1 : 0.4 }]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
            activeOpacity={0.8}
          >
            {isSending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="send" size={18} color="#fff" />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Mesaj balonu ─────────────────────────────────────────────────────────────

function MessageBubble({
  message, isOwn, s, c,
}: {
  message: Message; isOwn: boolean;
  s: ReturnType<typeof makeStyles>; c: any;
}) {
  const isAppointment = message.content.startsWith(APPOINTMENT_PREFIX);
  const displayContent = isAppointment
    ? message.content.replace(APPOINTMENT_PREFIX, '').trim()
    : message.content;

  const timeStr = new Date(message.timestamp).toLocaleTimeString('tr-TR', {
    hour: '2-digit', minute: '2-digit',
  });

  if (isAppointment) {
    return (
      <View style={[s.bubbleWrap, isOwn ? s.ownWrap : s.otherWrap]}>
        <View style={[s.appointmentBubble, isOwn && s.appointmentBubbleOwn]}>
          <View style={s.appointmentIcon}>
            <Ionicons name="calendar" size={20} color="#1E3A5F" />
          </View>
          <View style={s.appointmentMeta}>
            <Text style={s.appointmentLabel}>Randevu Talebi</Text>
            <Text style={s.appointmentDate}>{displayContent}</Text>
          </View>
        </View>
        <Text style={[s.timeText, isOwn ? s.timeOwn : s.timeOther]}>{timeStr}</Text>
      </View>
    );
  }

  return (
    <View style={[s.bubbleWrap, isOwn ? s.ownWrap : s.otherWrap]}>
      <View style={[s.bubble, isOwn ? s.ownBubble : s.otherBubble]}>
        <Text style={[s.bubbleText, isOwn ? s.ownText : s.otherText]}>
          {displayContent}
        </Text>
      </View>
      <View style={[s.timeRow, isOwn ? s.timeRowOwn : s.timeRowOther]}>
        <Text style={[s.timeText, isOwn ? s.timeOwn : s.timeOther]}>{timeStr}</Text>
        {isOwn && (
          <Ionicons
            name={message.isRead ? 'checkmark-done' : 'checkmark'}
            size={13}
            color={message.isRead ? c.primary : c.textMuted}
          />
        )}
      </View>
    </View>
  );
}

// ─── Stiller ─────────────────────────────────────────────────────────────────

const makeStyles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    flex:  { flex: 1 },

    // Header
    header: {
      backgroundColor: '#1E3A5F',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      gap: 10,
    },
    backBtn:  { padding: 4 },
    refreshBtn: { padding: 4 },
    headerInfo: { flex: 1 },
    headerName: { fontSize: 16, fontWeight: '700', color: '#fff' },
    headerSub:  { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },

    // Liste
    msgList: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 6,
    },

    // Balon
    bubbleWrap: { maxWidth: '80%', gap: 2 },
    ownWrap:    { alignSelf: 'flex-end', alignItems: 'flex-end' },
    otherWrap:  { alignSelf: 'flex-start', alignItems: 'flex-start' },

    bubble: {
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    ownBubble:   {
      backgroundColor: '#1E3A5F',
      borderBottomRightRadius: 4,
    },
    otherBubble: {
      backgroundColor: c.surface,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: c.border,
    },
    bubbleText: { fontSize: 14.5, lineHeight: 21 },
    ownText:    { color: '#FFFFFF' },
    otherText:  { color: c.text },

    timeRow:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
    timeRowOwn:  { justifyContent: 'flex-end' },
    timeRowOther:{ justifyContent: 'flex-start' },
    timeText:    { fontSize: 11 },
    timeOwn:     { color: c.textMuted },
    timeOther:   { color: c.textMuted },

    // Randevu balonu
    appointmentBubble: {
      backgroundColor: '#EFF6FF',
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: '#BFDBFE',
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    appointmentBubbleOwn: {
      backgroundColor: '#DBEAFE',
      borderColor: '#93C5FD',
    },
    appointmentIcon: {
      width: 38, height: 38, borderRadius: 10,
      backgroundColor: '#BFDBFE',
      justifyContent: 'center', alignItems: 'center',
    },
    appointmentMeta: { flex: 1 },
    appointmentLabel: { fontSize: 12, fontWeight: '700', color: '#1E3A5F' },
    appointmentDate:  { fontSize: 12, color: '#475569', marginTop: 2 },

    // Randevu talep butonu
    appointmentBtn: {
      backgroundColor: '#1E3A5F',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginHorizontal: 14,
      marginBottom: 6,
      paddingVertical: 12,
      borderRadius: 14,
    },
    appointmentBtnText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },

    // Input bar
    inputBar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
      paddingHorizontal: 14,
      paddingTop: 8,
      paddingBottom: 12,
      backgroundColor: c.surface,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 120,
      backgroundColor: c.background,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 16,
      paddingVertical: 9,
      fontSize: 14.5,
      color: c.text,
    },
    sendBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: '#1E3A5F',
      justifyContent: 'center', alignItems: 'center',
    },

    // Genel
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 32 },
    errorText: { fontSize: 14, color: c.textSecondary, textAlign: 'center' },
    retryBtn: {
      backgroundColor: c.primary, borderRadius: 10,
      paddingHorizontal: 24, paddingVertical: 10,
    },
    retryText:  { color: '#fff', fontWeight: '700' },
    emptyWrap:  { alignItems: 'center', gap: 10, paddingTop: 60, paddingHorizontal: 32 },
    emptyEmoji: { fontSize: 48 },
    emptyText:  { fontSize: 14, color: c.textMuted, textAlign: 'center', lineHeight: 22 },
  });
