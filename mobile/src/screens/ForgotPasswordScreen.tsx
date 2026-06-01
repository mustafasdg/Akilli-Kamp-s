import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/RootNavigator';
import apiClient from '../services/apiClient';
import { useColors } from '../context/ThemeContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

type Step = 'email' | 'code';

export default function ForgotPasswordScreen({ navigation }: Props) {
  const c = useColors();
  const s = makeStyles(c);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail]       = useState('');
  const [code, setCode]         = useState('');
  const [newPw, setNewPw]       = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) { Alert.alert('Hata', 'E-posta adresi girin.'); return; }
    try {
      setLoading(true);
      const res = await apiClient.post('/auth/forgot-password', { email: email.trim() });
      // Demo: sunucu kodu yanıtta döndürüyor
      if (res.data?.code) {
        Alert.alert('Demo Modu', `Sıfırlama kodunuz: ${res.data.code}\n\n(Gerçek uygulamada e-posta ile gönderilir)`);
      }
      setStep('code');
    } catch {
      Alert.alert('Hata', 'İstek gönderilemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!code || !newPw || !confirmPw) { Alert.alert('Hata', 'Tüm alanları doldurun.'); return; }
    if (newPw.length < 6) { Alert.alert('Hata', 'Şifre en az 6 karakter olmalı.'); return; }
    if (newPw !== confirmPw) { Alert.alert('Hata', 'Şifreler eşleşmiyor.'); return; }
    try {
      setLoading(true);
      await apiClient.post('/auth/reset-password', {
        email: email.trim(), code, newPassword: newPw,
      });
      Alert.alert('Başarılı', 'Şifreniz sıfırlandı. Giriş yapabilirsiniz.', [
        { text: 'Tamam', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'Şifre sıfırlanamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

          {/* Geri */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={22} color={c.text} />
          </TouchableOpacity>

          {/* Başlık */}
          <View style={s.hero}>
            <Text style={s.heroEmoji}>🔐</Text>
            <Text style={s.title}>Şifremi Unuttum</Text>
            <Text style={s.subtitle}>
              {step === 'email'
                ? 'Kayıtlı e-posta adresinizi girin, sıfırlama kodu gönderelim.'
                : 'E-postanıza gelen kodu ve yeni şifrenizi girin.'}
            </Text>
          </View>

          <View style={s.card}>
            {step === 'email' ? (
              <>
                <InputRow
                  icon="mail-outline" placeholder="E-posta adresi"
                  value={email} onChangeText={setEmail}
                  keyboardType="email-address" c={c}
                />
                <TouchableOpacity
                  style={[s.btn, loading && s.btnDisabled]}
                  onPress={handleSendCode} disabled={loading} activeOpacity={0.8}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.btnText}>Kod Gönder</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <InputRow
                  icon="keypad-outline" placeholder="6 haneli kod"
                  value={code} onChangeText={setCode}
                  keyboardType="number-pad" c={c}
                />
                <InputRow
                  icon="lock-closed-outline" placeholder="Yeni şifre"
                  value={newPw} onChangeText={setNewPw}
                  secureTextEntry={!showPw} c={c}
                  rightIcon={showPw ? 'eye-off-outline' : 'eye-outline'}
                  onRightIcon={() => setShowPw(v => !v)}
                />
                <InputRow
                  icon="lock-closed-outline" placeholder="Yeni şifre (tekrar)"
                  value={confirmPw} onChangeText={setConfirmPw}
                  secureTextEntry={!showPw} c={c}
                />
                <TouchableOpacity
                  style={[s.btn, loading && s.btnDisabled]}
                  onPress={handleReset} disabled={loading} activeOpacity={0.8}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.btnText}>Şifremi Sıfırla</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep('email')} style={s.backLink}>
                  <Text style={[s.backLinkText, { color: c.primary }]}>← Tekrar kod gönder</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InputRow({ icon, placeholder, value, onChangeText, keyboardType, secureTextEntry, rightIcon, onRightIcon, c }: any) {
  const s = makeStyles(c);
  return (
    <View style={s.inputRow}>
      <Ionicons name={icon} size={18} color={c.primary} />
      <TextInput
        style={s.input} value={value} onChangeText={onChangeText}
        placeholder={placeholder} placeholderTextColor={c.textMuted}
        keyboardType={keyboardType} secureTextEntry={secureTextEntry}
        autoCapitalize="none"
      />
      {rightIcon && (
        <TouchableOpacity onPress={onRightIcon}>
          <Ionicons name={rightIcon} size={18} color={c.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (c: ReturnType<typeof useColors>) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  container: { flexGrow: 1, padding: 24 },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: c.surface,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: c.border,
    marginBottom: 24,
  },
  hero: { alignItems: 'center', marginBottom: 32, gap: 8 },
  heroEmoji: { fontSize: 56 },
  title: { fontSize: 26, fontWeight: '800', color: c.text },
  subtitle: { fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 21 },

  card: {
    backgroundColor: c.surface, borderRadius: 16, padding: 20,
    gap: 16, borderWidth: 1, borderColor: c.border,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: c.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 4,
    backgroundColor: c.surfaceAlt,
  },
  input: { flex: 1, height: 44, fontSize: 15, color: c.text },

  btn: {
    backgroundColor: c.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  backLink: { alignItems: 'center' },
  backLinkText: { fontSize: 14, fontWeight: '600' },
});
