import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../context/ThemeContext';
import { useChat, ChatMsg } from '../context/ChatContext';

export default function AiAssistantScreen() {
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const navigation = useNavigation();

  // Mesajlar, yüklenme durumu ve gönderim artık global ChatContext'te yaşıyor →
  // ekran unmount olsa bile (sayfa geçişi) sohbet korunur, sadece reload'da sıfırlanır.
  const { messages, isLoading, sendMessage, clearChat } = useChat();

  const [inputText, setInputText] = useState('');
  const listRef = useRef<FlatList<ChatMsg>>(null);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || isLoading) return;
    setInputText('');
    sendMessage(text);
  }, [inputText, isLoading, sendMessage]);

  // "Yeni Sohbet": onaylanınca context sohbeti temizler + oturumu döndürür.
  const handleClearChat = useCallback(() => {
    Alert.alert(
      'Yeni Sohbet',
      'Sohbet geçmişi temizlensin mi?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Evet', style: 'destructive', onPress: clearChat },
      ],
    );
  }, [clearChat]);

  // Inverted FlatList → en yeni mesaj altta görünür; veriyi ters çevirip veririz.
  const reversed = useMemo(() => [...messages].reverse(), [messages]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={s.headerIconBox}>
          <Ionicons name="sparkles" size={18} color="#fff" />
        </View>
        <View style={s.headerInfo}>
          <Text style={s.headerName}>Kampüs Asistanı</Text>
          <Text style={s.headerSub}>Yapay zeka • hocalar & programlar</Text>
        </View>
        <TouchableOpacity
          style={s.clearBtn}
          onPress={handleClearChat}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Yeni sohbet — geçmişi temizle"
        >
          <Ionicons name="trash-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Mesaj listesi ────────────────────────────────────────── */}
        <FlatList
          ref={listRef}
          data={reversed}
          inverted
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          // inverted listte header en altta görünür → "yazıyor" göstergesi en altta
          ListHeaderComponent={isLoading ? <TypingIndicator s={s} c={c} /> : null}
          renderItem={({ item }) => <Bubble msg={item} s={s} />}
        />

        {/* ── Mesaj yazma alanı ────────────────────────────────────── */}
        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            placeholder="Asistana sor…"
            placeholderTextColor={c.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[s.sendBtn, { opacity: inputText.trim() && !isLoading ? 1 : 0.4 }]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
            activeOpacity={0.8}
          >
            {isLoading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Mesaj Balonu ─────────────────────────────────────────────────────────────

function Bubble({ msg, s }: { msg: ChatMsg; s: ReturnType<typeof makeStyles> }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[s.bubbleWrap, isUser ? s.ownWrap : s.otherWrap]}>
      <View style={[s.bubble, isUser ? s.ownBubble : s.otherBubble, msg.isError && s.errorBubble]}>
        <Text style={[s.bubbleText, isUser ? s.ownText : s.otherText, msg.isError && s.errorTextStyle]}>
          {msg.content}
        </Text>
      </View>
      {/* Geliştirme görünürlüğü: ajanın kullandığı araçlar */}
      {msg.toolsCalled && msg.toolsCalled.length > 0 ? (
        <Text style={s.toolsText}>🔧 Kullanılan araç: {msg.toolsCalled.join(', ')}</Text>
      ) : null}
    </View>
  );
}

function TypingIndicator({ s, c }: { s: ReturnType<typeof makeStyles>; c: any }) {
  return (
    <View style={[s.bubbleWrap, s.otherWrap]}>
      <View style={[s.bubble, s.otherBubble, s.typingBubble]}>
        <ActivityIndicator size="small" color={c.primary} />
        <Text style={s.typingText}>Asistan yazıyor…</Text>
      </View>
    </View>
  );
}

// ─── Stiller ─────────────────────────────────────────────────────────────────

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
    clearBtn: { padding: 4 },
    headerIconBox: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.18)',
      justifyContent: 'center', alignItems: 'center',
    },
    headerInfo: { flex: 1 },
    headerName: { fontSize: 16, fontWeight: '700', color: '#fff' },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },

    list: { paddingHorizontal: 14, paddingVertical: 12, gap: 8 },

    bubbleWrap: { maxWidth: '88%', gap: 3 },
    ownWrap: { alignSelf: 'flex-end', alignItems: 'flex-end' },
    otherWrap: { alignSelf: 'flex-start', alignItems: 'flex-start' },

    bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
    ownBubble: { backgroundColor: '#1E3A5F', borderBottomRightRadius: 4 },
    otherBubble: {
      backgroundColor: c.surface, borderBottomLeftRadius: 4,
      borderWidth: 1, borderColor: c.border,
    },
    errorBubble: { backgroundColor: c.errorLight, borderColor: c.error },
    bubbleText: { fontSize: 14.5, lineHeight: 21 },
    ownText: { color: '#FFFFFF' },
    otherText: { color: c.text },
    errorTextStyle: { color: c.error },

    toolsText: { fontSize: 10.5, color: c.textMuted, fontStyle: 'italic', paddingHorizontal: 4 },

    typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    typingText: { fontSize: 13, color: c.textSecondary },

    inputBar: {
      flexDirection: 'row', alignItems: 'flex-end', gap: 8,
      paddingHorizontal: 14, paddingTop: 8, paddingBottom: 12,
      backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border,
    },
    input: {
      flex: 1, minHeight: 40, maxHeight: 120,
      backgroundColor: c.background, borderRadius: 20,
      borderWidth: 1, borderColor: c.border,
      paddingHorizontal: 16, paddingVertical: 9,
      fontSize: 14.5, color: c.text,
    },
    sendBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: '#1E3A5F',
      justifyContent: 'center', alignItems: 'center',
    },
  });
