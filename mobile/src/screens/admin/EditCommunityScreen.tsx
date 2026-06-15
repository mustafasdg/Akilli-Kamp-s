import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColors } from '../../context/ThemeContext';
import { communityService } from '../../services/communityService';
import { AppRootParamList } from '../../navigation/RootNavigator';

type EditCommunityRoute = RouteProp<AppRootParamList, 'EditCommunity'>;

export default function EditCommunityScreen() {
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const navigation = useNavigation<NativeStackNavigationProp<AppRootParamList>>();
  const route = useRoute<EditCommunityRoute>();
  const { id, name: initialName, description: initialDesc, imageUrl: initialImage } = route.params;

  // Mevcut verilerle ön-doldurma (pre-fill)
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDesc);
  const [imageUrl, setImageUrl] = useState(initialImage ?? '');
  const [saving, setSaving] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const trimmedUrl = imageUrl.trim();
  const showPreview = trimmedUrl.length > 0 && !previewError;

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedDesc = description.trim();

    // ── Zorunlu alan kontrolleri ──────────────────────────────────────────────
    if (!trimmedName) { Alert.alert('Eksik Bilgi', 'Topluluk adı zorunludur.'); return; }
    if (trimmedName.length < 3) { Alert.alert('Geçersiz Ad', 'Topluluk adı en az 3 karakter olmalı.'); return; }
    if (!trimmedDesc) { Alert.alert('Eksik Bilgi', 'Topluluk açıklaması zorunludur.'); return; }

    try {
      setSaving(true);
      await communityService.updateCommunity(id, {
        name: trimmedName,
        description: trimmedDesc,
        imageUrl: trimmedUrl || undefined,
      });
      Alert.alert('Başarılı! 🎉', 'Topluluk güncellendi.', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'Topluluk güncellenemedi. Lütfen tekrar deneyin.');
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
          <Text style={s.headerTitle}>Topluluğu Düzenle</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Kapak önizleme ──────────────────────────────────── */}
          <View style={s.previewWrap}>
            {showPreview ? (
              <Image
                source={{ uri: trimmedUrl }}
                style={s.previewImage}
                onError={() => setPreviewError(true)}
              />
            ) : (
              <View style={s.previewPlaceholder}>
                <Ionicons name="image-outline" size={34} color={c.textMuted} />
                <Text style={s.previewHint}>
                  {previewError ? 'Görsel yüklenemedi, URL’yi kontrol edin' : 'Kapak fotoğrafı önizlemesi'}
                </Text>
              </View>
            )}
          </View>

          {/* ── Form ────────────────────────────────────────────── */}
          <View style={s.form}>
            {/* Topluluk Adı */}
            <View style={s.labelRow}>
              <Text style={s.label}>Topluluk Adı <Text style={s.req}>*</Text></Text>
              <Text style={s.counter}>{name.length}/150</Text>
            </View>
            <View style={s.inputRow}>
              <Ionicons name="people-outline" size={18} color={c.primary} style={s.inputIcon} />
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholder="örn. Kodlama Kulübü"
                placeholderTextColor={c.textMuted}
                maxLength={150}
                returnKeyType="next"
              />
            </View>

            {/* Açıklama */}
            <View style={s.labelRow}>
              <Text style={s.label}>Açıklama <Text style={s.req}>*</Text></Text>
              <Text style={s.counter}>{description.length}/1000</Text>
            </View>
            <TextInput
              style={s.textarea}
              value={description}
              onChangeText={setDescription}
              placeholder="Topluluğun amacını ve kimlere hitap ettiğini kısaca anlat..."
              placeholderTextColor={c.textMuted}
              maxLength={1000}
              multiline
              textAlignVertical="top"
            />

            {/* Kapak Fotoğrafı URL'si */}
            <View style={s.labelRow}>
              <Text style={s.label}>Kapak Fotoğrafı URL’si</Text>
              <Text style={s.optional}>opsiyonel</Text>
            </View>
            <View style={s.inputRow}>
              <Ionicons name="link-outline" size={18} color={c.primary} style={s.inputIcon} />
              <TextInput
                style={s.input}
                value={imageUrl}
                onChangeText={(t) => { setImageUrl(t); setPreviewError(false); }}
                placeholder="https://..."
                placeholderTextColor={c.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                maxLength={500}
                returnKeyType="done"
              />
            </View>
          </View>
        </ScrollView>

        {/* ── Footer: Kaydet ─────────────────────────────────────── */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.submitBtn, saving && s.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={19} color="#fff" />
                <Text style={s.submitText}>Değişiklikleri Kaydet</Text>
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
    container: { paddingBottom: 24 },

    previewWrap: {
      height: 160, marginHorizontal: 20, marginTop: 20,
      borderRadius: 16, backgroundColor: c.surfaceAlt,
      borderWidth: 1, borderColor: c.border,
      justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
    },
    previewImage: { width: '100%', height: '100%' },
    previewPlaceholder: { justifyContent: 'center', alignItems: 'center', gap: 8, padding: 16 },
    previewHint: { fontSize: 13, color: c.textMuted, textAlign: 'center' },

    form: { padding: 20, paddingTop: 8, gap: 2 },

    labelRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 6, marginTop: 12,
    },
    label: { fontSize: 13, fontWeight: '700', color: c.textSecondary },
    req: { color: c.error },
    counter: { fontSize: 11, color: c.textMuted },
    optional: { fontSize: 11, color: c.textMuted, fontStyle: 'italic' },

    inputRow: {
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 1.5, borderColor: c.border, borderRadius: 12,
      backgroundColor: c.surface, paddingHorizontal: 12,
    },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, fontSize: 15, color: c.text, paddingVertical: 12 },
    textarea: {
      minHeight: 110, fontSize: 15, color: c.text,
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
