import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useColors } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../hooks/useMessages';
import { dataService } from '../services/dataService';
import { Message, AppointmentInfo, AppointmentStatus } from '../types/models';
import { AppRootParamList } from '../navigation/RootNavigator';

type ChatRouteProp = RouteProp<AppRootParamList, 'Chat'>;

export default function ChatScreen() {
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const { user } = useAuth();
  const navigation = useNavigation();
  const route = useRoute<ChatRouteProp>();
  const { teacher } = route.params;

  const isTeacher = user?.role === 'teacher';

  const { messages, isLoading, isSending, error, sendMessage, refresh } =
    useMessages(teacher.id);

  const [inputText, setInputText]       = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  // Reddetme modalı (sebep / önerilen saat)
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason]             = useState('');
  const [rejectApptId, setRejectApptId]             = useState<number | null>(null);
  const flatListRef = useRef<FlatList<Message>>(null);

  // Geri dönüş: yığında önceki ekran varsa ona dön, yoksa ana sekmelere düş (çıkmaz sokak yok)
  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('MainTabs' as never);
  }, [navigation]);

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

  // Hoca: randevuyu onayla → ApproveAppointment (status = Approved) → ekranı yenile
  const handleApprove = useCallback((appointmentId: number) => {
    Alert.alert(
      'Randevuyu Onayla',
      'Bu randevu talebini kabul etmek istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kabul Et',
          onPress: async () => {
            setActionLoading(true);
            try {
              await dataService.updateAppointmentStatus(appointmentId, AppointmentStatus.Approved);
              await refresh();
            } catch {
              Alert.alert('Hata', 'Randevu onaylanamadı. Lütfen tekrar deneyin.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  }, [refresh]);

  // Hoca: "Reddet"e basınca hemen API'ye gitme — önce sebep modalını aç
  const handleReject = useCallback((appointmentId: number) => {
    setRejectApptId(appointmentId);
    setRejectReason('');
    setRejectModalVisible(true);
  }, []);

  // Modal onayı: sebebi (önerilen saat dahil) komuta ekleyip API'ye gönder, sonra yenile
  const submitReject = useCallback(async () => {
    if (rejectApptId == null) return;
    setActionLoading(true);
    try {
      await dataService.updateAppointmentStatus(
        rejectApptId,
        AppointmentStatus.Rejected,
        rejectReason.trim() || undefined,
      );
      setRejectModalVisible(false);
      setRejectApptId(null);
      await refresh();
    } catch {
      Alert.alert('Hata', 'Randevu reddedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setActionLoading(false);
    }
  }, [rejectApptId, rejectReason, refresh]);

  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={handleBack} hitSlop={10}>
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
                isTeacher={isTeacher}
                onApprove={handleApprove}
                onReject={handleReject}
                actionLoading={actionLoading}
                s={s}
                c={c}
              />
            )}
          />
        )}

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

      {/* ── Reddetme Sebebi Modalı ───────────────────────────────── */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Randevuyu Reddet</Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={c.text} />
              </TouchableOpacity>
            </View>
            <Text style={s.modalLabel}>Reddetme sebebi / önerilen saat</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Örn: Şu an toplantıdayım, yarın 14:00 uygun."
              placeholderTextColor={c.textMuted}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
              maxLength={300}
            />
            <TouchableOpacity
              style={[s.modalRejectBtn, actionLoading && { opacity: 0.6 }]}
              onPress={submitReject}
              disabled={actionLoading}
              activeOpacity={0.85}
            >
              {actionLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.modalRejectBtnText}>Reddet ve Gönder</Text>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Mesaj Balonu ─────────────────────────────────────────────────────────────

function MessageBubble({
  message, isOwn, isTeacher, onApprove, onReject, actionLoading, s, c,
}: {
  message: Message;
  isOwn: boolean;
  isTeacher: boolean;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  actionLoading: boolean;
  s: ReturnType<typeof makeStyles>;
  c: any;
}) {
  const timeStr = new Date(message.timestamp).toLocaleTimeString('tr-TR', {
    hour: '2-digit', minute: '2-digit',
  });

  // ── Sistem mesajı + randevu verisi varsa: interaktif Randevu Kartı ──
  if (message.isSystemMessage && message.relatedAppointment) {
    return (
      <AppointmentCard
        appt={message.relatedAppointment}
        isTeacher={isTeacher}
        onApprove={onApprove}
        onReject={onReject}
        actionLoading={actionLoading}
        timeStr={timeStr}
        s={s}
        c={c}
      />
    );
  }

  // ── Normal metin balonu ──────────────────────────────────────────
  return (
    <View style={[s.bubbleWrap, isOwn ? s.ownWrap : s.otherWrap]}>
      <View style={[s.bubble, isOwn ? s.ownBubble : s.otherBubble]}>
        <Text style={[s.bubbleText, isOwn ? s.ownText : s.otherText]}>
          {message.content}
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

// ─── İnteraktif Randevu Kartı ──────────────────────────────────────────────────

function AppointmentCard({
  appt, isTeacher, onApprove, onReject, actionLoading, timeStr, s, c,
}: {
  appt: AppointmentInfo;
  isTeacher: boolean;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  actionLoading: boolean;
  timeStr: string;
  s: ReturnType<typeof makeStyles>;
  c: any;
}) {
  const apptDate = new Date(appt.appointmentDate);

  // Onaylanmış / reddedilmiş durum rozeti
  const statusInfo =
    appt.status === AppointmentStatus.Approved ? { label: '✅ Kabul Edildi', color: c.success } :
    appt.status === AppointmentStatus.Rejected ? { label: '❌ Reddedildi',  color: c.error } :
                                                  { label: '⏳ Bekliyor',     color: c.warning };

  // Yalnızca HOCA + Pending durumda aksiyon butonları çizilir
  const canAct = isTeacher && appt.status === AppointmentStatus.Pending;

  return (
    <View style={s.cardWrap}>
      <View style={s.apptCard}>
        {/* Başlık */}
        <View style={s.apptCardHeader}>
          <View style={s.apptIconBox}>
            <Ionicons name="calendar" size={20} color={c.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.apptCardTitle}>Randevu Talebi</Text>
            <Text style={s.apptCardSub}>{appt.studentName} → {appt.teacherName}</Text>
          </View>
        </View>

        {/* Tarih */}
        <View style={s.apptRow}>
          <Ionicons name="calendar-outline" size={14} color={c.textMuted} />
          <Text style={s.apptRowText}>
            {apptDate.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
        </View>

        {/* Saat */}
        <View style={s.apptRow}>
          <Ionicons name="time-outline" size={14} color={c.textMuted} />
          <Text style={s.apptRowText}>
            {apptDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Açıklama */}
        {appt.description ? (
          <View style={s.apptRow}>
            <Ionicons name="chatbox-outline" size={14} color={c.textMuted} />
            <Text style={s.apptRowText} numberOfLines={3}>{appt.description}</Text>
          </View>
        ) : null}

        {/* Aksiyonlar (hoca + pending) veya durum rozeti */}
        {canAct ? (
          <View style={s.apptActions}>
            <TouchableOpacity
              style={[s.apptActionBtn, s.approveBtn, actionLoading && { opacity: 0.6 }]}
              onPress={() => onApprove(appt.id)}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text style={s.apptActionBtnText}>Kabul Et</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.apptActionBtn, s.rejectCardBtn, actionLoading && { opacity: 0.6 }]}
              onPress={() => onReject(appt.id)}
              disabled={actionLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle-outline" size={16} color="#fff" />
              <Text style={s.apptActionBtnText}>Reddet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.statusWrap}>
            <View style={[s.statusPill, { backgroundColor: statusInfo.color + '22', borderColor: statusInfo.color }]}>
              <Text style={[s.statusPillText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
            </View>
            {appt.status === AppointmentStatus.Rejected && appt.rejectionReason ? (
              <Text style={s.rejectReasonText}>Sebep: {appt.rejectionReason}</Text>
            ) : null}
          </View>
        )}
      </View>
      <Text style={s.cardTime}>{timeStr}</Text>
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
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      gap: 10,
    },
    backBtn:    { padding: 4 },
    refreshBtn: { padding: 4 },
    headerInfo: { flex: 1 },
    headerName: { fontSize: 16, fontWeight: '700', color: '#fff' },
    headerSub:  { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 1 },

    msgList: { paddingHorizontal: 14, paddingVertical: 12, gap: 6 },

    bubbleWrap: { maxWidth: '85%', gap: 2 },
    ownWrap:    { alignSelf: 'flex-end',   alignItems: 'flex-end' },
    otherWrap:  { alignSelf: 'flex-start', alignItems: 'flex-start' },

    bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
    ownBubble: {
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

    timeRow:      { flexDirection: 'row', alignItems: 'center', gap: 3 },
    timeRowOwn:   { justifyContent: 'flex-end' },
    timeRowOther: { justifyContent: 'flex-start' },
    timeText:     { fontSize: 11 },
    timeOwn:      { color: c.textMuted },
    timeOther:    { color: c.textMuted },

    // ── İnteraktif Randevu Kartı
    cardWrap: { alignSelf: 'center', alignItems: 'center', maxWidth: '92%', gap: 2, marginVertical: 4 },
    cardTime: { fontSize: 10, color: c.textMuted, marginTop: 2 },
    apptCard: {
      backgroundColor: c.surface,
      borderRadius: 16, borderWidth: 1.5, borderColor: c.primary + '55',
      padding: 14, gap: 10, minWidth: 260,
    },
    apptCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    apptIconBox: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: c.primaryLight,
      justifyContent: 'center', alignItems: 'center',
    },
    apptCardTitle: { fontSize: 13, fontWeight: '800', color: c.text },
    apptCardSub:   { fontSize: 11, color: c.textMuted, marginTop: 2 },

    apptRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
    apptRowText: { fontSize: 13, color: c.textSecondary, flex: 1, lineHeight: 18 },

    apptActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
    apptActionBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', gap: 5,
      borderRadius: 10, paddingVertical: 9,
    },
    approveBtn:    { backgroundColor: c.success },
    rejectCardBtn: { backgroundColor: c.error },
    apptActionBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

    statusWrap: { gap: 6, alignItems: 'flex-start' },
    statusPill: {
      alignSelf: 'flex-start',
      borderRadius: 10, borderWidth: 1,
      paddingHorizontal: 12, paddingVertical: 6, marginTop: 2,
    },
    statusPillText: { fontSize: 13, fontWeight: '800' },
    rejectReasonText: { fontSize: 12.5, color: c.error, lineHeight: 17 },

    // ── Input bar
    inputBar: {
      flexDirection: 'row', alignItems: 'flex-end', gap: 8,
      paddingHorizontal: 14, paddingTop: 8, paddingBottom: 12,
      backgroundColor: c.surface,
      borderTopWidth: 1, borderTopColor: c.border,
    },
    input: {
      flex: 1, minHeight: 40, maxHeight: 120,
      backgroundColor: c.background,
      borderRadius: 20, borderWidth: 1, borderColor: c.border,
      paddingHorizontal: 16, paddingVertical: 9,
      fontSize: 14.5, color: c.text,
    },
    sendBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: '#1E3A5F',
      justifyContent: 'center', alignItems: 'center',
    },

    // ── Reddetme modalı
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modalCard: {
      backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, gap: 14,
    },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: c.text },
    modalLabel: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
    modalInput: {
      backgroundColor: c.background, borderRadius: 12, padding: 12,
      fontSize: 14, color: c.text, minHeight: 80, textAlignVertical: 'top',
      borderWidth: 1, borderColor: c.border,
    },
    modalRejectBtn: {
      backgroundColor: c.error, borderRadius: 14, paddingVertical: 14,
      alignItems: 'center', marginTop: 4,
    },
    modalRejectBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 32 },
    errorText:  { fontSize: 14, color: c.textSecondary, textAlign: 'center' },
    retryBtn:   { backgroundColor: c.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
    retryText:  { color: '#fff', fontWeight: '700' },
    emptyWrap:  { alignItems: 'center', gap: 10, paddingTop: 60, paddingHorizontal: 32 },
    emptyEmoji: { fontSize: 48 },
    emptyText:  { fontSize: 14, color: c.textMuted, textAlign: 'center', lineHeight: 22 },
  });
