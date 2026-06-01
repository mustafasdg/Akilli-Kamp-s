import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import colors from '../theme/colors';
import UserAvatar from '../components/UserAvatar';
import { formatName } from '../utils/avatarUtils';
import { AppRootParamList } from '../navigation/RootNavigator';

export default function EditProfileScreen() {
  const { user, updateUser } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AppRootParamList>>();

  // İsim güncelleme state
  const [name, setName] = useState(user?.name ?? '');
  const [nameLoading, setNameLoading] = useState(false);

  // Şifre değiştirme state
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [pwLoading, setPwLoading]   = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── İsim güncelle ──────────────────────────────────────────────────────────
  const handleSaveName = async () => {
    const trimmed = name.trim();
    if (!trimmed) { Alert.alert('Hata', 'Ad soyad boş olamaz.'); return; }
    if (trimmed === user?.name) { Alert.alert('Bilgi', 'İsim değiştirilmedi.'); return; }

    try {
      setNameLoading(true);
      const updated = await authService.updateProfile(trimmed);
      updateUser(updated);
      Alert.alert('Başarılı', 'İsminiz güncellendi.');
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'İsim güncellenemedi.');
    } finally {
      setNameLoading(false);
    }
  };

  // ── Şifre değiştir ─────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('Hata', 'Tüm şifre alanlarını doldurun.'); return;
    }
    if (newPw.length < 6) {
      Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalı.'); return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor.'); return;
    }

    try {
      setPwLoading(true);
      await authService.changePassword(currentPw, newPw);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      Alert.alert('Başarılı', 'Şifreniz başarıyla değiştirildi.');
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'Şifre değiştirilemedi.');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profili Düzenle</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

          {/* ── Avatar önizleme ─────────────────────────────── */}
          <View style={styles.avatarSection}>
            <UserAvatar name={formatName(name.trim() || user?.name || '?')} size={80} />
            <Text style={styles.avatarHint}>Avatar isminize göre otomatik güncellenir</Text>
          </View>

          {/* ── Ad Soyad ────────────────────────────────────── */}
          <SectionLabel title="Ad Soyad" />
          <View style={styles.card}>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ad Soyad"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                returnKeyType="done"
              />
            </View>
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, nameLoading && styles.btnDisabled]}
            onPress={handleSaveName}
            activeOpacity={0.8}
            disabled={nameLoading}
          >
            {nameLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>İsmi Kaydet</Text>
                </>
            }
          </TouchableOpacity>

          {/* ── Şifre Değiştir ───────────────────────────────── */}
          <SectionLabel title="Şifre Değiştir" />
          <View style={styles.card}>
            <PasswordRow
              label="Mevcut Şifre"
              value={currentPw}
              onChangeText={setCurrentPw}
              show={showCurrent}
              onToggle={() => setShowCurrent(v => !v)}
              returnKeyType="next"
            />
            <View style={styles.divider} />
            <PasswordRow
              label="Yeni Şifre"
              value={newPw}
              onChangeText={setNewPw}
              show={showNew}
              onToggle={() => setShowNew(v => !v)}
              returnKeyType="next"
            />
            <View style={styles.divider} />
            <PasswordRow
              label="Yeni Şifre (Tekrar)"
              value={confirmPw}
              onChangeText={setConfirmPw}
              show={showConfirm}
              onToggle={() => setShowConfirm(v => !v)}
              returnKeyType="done"
            />
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, styles.pwBtn, pwLoading && styles.btnDisabled]}
            onPress={handleChangePassword}
            activeOpacity={0.8}
            disabled={pwLoading}
          >
            {pwLoading
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="lock-closed-outline" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>Şifreyi Değiştir</Text>
                </>
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Alt bileşenler ───────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

function PasswordRow({
  label, value, onChangeText, show, onToggle, returnKeyType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  returnKeyType?: 'next' | 'done';
}) {
  return (
    <View style={styles.inputRow}>
      <Ionicons name="lock-closed-outline" size={18} color={colors.primary} style={styles.inputIcon} />
      <TextInput
        style={[styles.input, { flex: 1 }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={!show}
        returnKeyType={returnKeyType}
        autoCapitalize="none"
      />
      <TouchableOpacity onPress={onToggle} style={styles.eyeBtn} activeOpacity={0.7}>
        <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: colors.background,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },

  avatarSection: {
    alignItems: 'center', paddingVertical: 24,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: 8,
  },
  avatarHint: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },

  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginTop: 24, marginBottom: 8, marginHorizontal: 20,
  },

  card: {
    marginHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: colors.borderLight, marginLeft: 50 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 4,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1, height: 46,
    fontSize: 15, color: colors.text,
  },
  eyeBtn: { padding: 8 },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 14, paddingVertical: 14,
  },
  pwBtn: { backgroundColor: '#7C3AED' },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
