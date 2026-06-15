import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColors } from '../../context/ThemeContext';
import apiClient from '../../services/apiClient';
import { AppRootParamList } from '../../navigation/RootNavigator';

const KATEGORILER = ['Akademik', 'Etkinlik', 'Spor', 'Sosyal', 'Kariyer', 'Uluslararası', 'Genel'];

export default function CreateAnnouncementScreen() {
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const navigation = useNavigation<NativeStackNavigationProp<AppRootParamList>>();

  const [baslik, setBaslik] = useState('');
  const [kategori, setKategori] = useState('Akademik');
  const [icerik, setIcerik] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    const b = baslik.trim();
    const i = icerik.trim();

    // ── Zorunlu alan kontrolleri ──────────────────────────────────────────────
    if (!b) { Alert.alert('Eksik Bilgi', 'Başlık zorunludur.'); return; }
    if (!i) { Alert.alert('Eksik Bilgi', 'İçerik zorunludur.'); return; }

    try {
      setSaving(true);
      await apiClient.post('/admin/announcements', { baslik: b, kategori, icerik: i });
      Alert.alert('Başarılı! 🎉', 'Duyuru yayınlandı.', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'Duyuru oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={c.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Yeni Duyuru</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Başlık */}
          <View style={s.labelRow}>
            <Text style={s.label}>Başlık <Text style={s.req}>*</Text></Text>
            <Text style={s.counter}>{baslik.length}/200</Text>
          </View>
          <View style={s.inputRow}>
            <Ionicons name="megaphone-outline" size={18} color={c.primary} style={s.inputIcon} />
            <TextInput
              style={s.input}
              value={baslik}
              onChangeText={setBaslik}
              placeholder="Duyuru başlığı..."
              placeholderTextColor={c.textMuted}
              maxLength={200}
              returnKeyType="next"
            />
          </View>

          {/* Kategori */}
          <Text style={[s.label, { marginTop: 18, marginBottom: 8 }]}>Kategori</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={s.chipRow}>
              {KATEGORILER.map((k) => {
                const active = kategori === k;
                return (
                  <TouchableOpacity
                    key={k}
                    style={[s.chip, active && s.chipActive]}
                    onPress={() => setKategori(k)}
                    activeOpacity={0.85}
                  >
                    <Text style={[s.chipText, active && s.chipTextActive]}>{k}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* İçerik */}
          <View style={[s.labelRow, { marginTop: 18 }]}>
            <Text style={s.label}>İçerik <Text style={s.req}>*</Text></Text>
            <Text style={s.counter}>{icerik.length}</Text>
          </View>
          <TextInput
            style={s.textarea}
            value={icerik}
            onChangeText={setIcerik}
            placeholder="Duyuru içeriğini buraya yaz..."
            placeholderTextColor={c.textMuted}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>

        {/* ── Footer: Yayınla ────────────────────────────────────── */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.submitBtn, saving && s.btnDisabled]}
            onPress={handleCreate}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={s.submitText}>Duyuruyu Yayınla</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 12, paddingVertical: 10,
      backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border,
    },
    backBtn: {
      width: 38, height: 38, borderRadius: 10, backgroundColor: c.background,
      justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: c.text },

    scroll: { flex: 1 },
    container: { padding: 20, paddingBottom: 24 },

    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    label: { fontSize: 13, fontWeight: '700', color: c.textSecondary },
    req: { color: c.error },
    counter: { fontSize: 11, color: c.textMuted },

    inputRow: {
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 1.5, borderColor: c.border, borderRadius: 12,
      backgroundColor: c.surface, paddingHorizontal: 12,
    },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, fontSize: 15, color: c.text, paddingVertical: 12 },

    chipRow: { flexDirection: 'row', gap: 8, paddingRight: 8 },
    chip: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
      backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.border,
    },
    chipActive: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
    chipTextActive: { color: '#fff' },

    textarea: {
      minHeight: 160, fontSize: 15, color: c.text,
      borderWidth: 1.5, borderColor: c.border, borderRadius: 12,
      backgroundColor: c.surface, paddingHorizontal: 12, paddingVertical: 12,
    },

    footer: {
      padding: 16, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.surface,
    },
    submitBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: c.primary, borderRadius: 14, paddingVertical: 15,
    },
    btnDisabled: { opacity: 0.6 },
    submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  });
