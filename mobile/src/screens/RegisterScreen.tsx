import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from '../navigation/RootNavigator';
import { useColors, useTheme } from '../context/ThemeContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;
type FormErrors = { name?: string; email?: string; password?: string; confirmPassword?: string };

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const colors = useColors();
  const { isDark } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const clear = (k: keyof FormErrors) => setErrors(e => ({ ...e, [k]: undefined }));

  const validate = () => {
    const next: FormErrors = {};
    if (!name.trim() || name.trim().length < 2) next.name = 'Ad en az 2 karakter olmalı.';
    if (!email.trim()) next.email = 'E-posta adresi gerekli.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Geçerli bir e-posta girin.';
    if (!password) next.password = 'Şifre gerekli.';
    else if (password.length < 6) next.password = 'Şifre en az 6 karakter olmalı.';
    if (!confirmPassword) next.confirmPassword = 'Şifreyi tekrar girin.';
    else if (password !== confirmPassword) next.confirmPassword = 'Şifreler eşleşmiyor.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (err) {
      Alert.alert('Kayıt Hatası', extractMessage(err, 'Kayıt başarısız. Lütfen tekrar deneyin.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Hesap Oluştur</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Yeni hesap oluşturun</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Field label="Ad Soyad" value={name} onChangeText={v => { setName(v); clear('name'); }}
            placeholder="Adınız Soyadınız" error={errors.name} editable={!isSubmitting} colors={colors} />
          <Field label="E-posta" value={email} onChangeText={v => { setEmail(v); clear('email'); }}
            placeholder="ornek@universite.edu.tr" keyboardType="email-address"
            error={errors.email} editable={!isSubmitting} colors={colors} />
          <Field label="Şifre" value={password} onChangeText={v => { setPassword(v); clear('password'); }}
            placeholder="En az 6 karakter" secureTextEntry textContentType="oneTimeCode"
            error={errors.password} editable={!isSubmitting} colors={colors} />
          <Field label="Şifre Tekrar" value={confirmPassword}
            onChangeText={v => { setConfirmPassword(v); clear('confirmPassword'); }}
            placeholder="••••••••" secureTextEntry textContentType="oneTimeCode"
            error={errors.confirmPassword} editable={!isSubmitting} colors={colors} />

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }, isSubmitting && styles.btnDisabled]}
            onPress={handleRegister} disabled={isSubmitting} activeOpacity={0.8}
          >
            {isSubmitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>Kayıt Ol</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.switchRow}>
          <Text style={[styles.switchText, { color: colors.textSecondary }]}>Zaten hesabınız var mı? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.switchLink, { color: colors.primary }]}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FieldProps = {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address'; error?: string; editable?: boolean;
  textContentType?: 'none' | 'emailAddress' | 'oneTimeCode';
  colors: ReturnType<typeof useColors>;
};

function Field({ label, error, textContentType = 'none', colors, ...rest }: FieldProps) {
  return (
    <View style={fs.group}>
      <Text style={[fs.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[fs.input, {
          backgroundColor: colors.surfaceAlt,
          borderColor: error ? colors.error : colors.border,
          color: colors.text,
        }]}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType={textContentType}
        {...rest}
      />
      {error ? <Text style={[fs.error, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const fs = StyleSheet.create({
  group: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  error: { fontSize: 12 },
});

function extractMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    const d = (err as { response?: { data?: { message?: string } } }).response?.data;
    if (d?.message) return d.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  header: { alignItems: 'center', marginBottom: 28, gap: 6 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: { fontSize: 14, marginTop: 2 },
  card: {
    borderRadius: 16, padding: 24, gap: 20,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  primaryBtn: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  switchText: { fontSize: 14 },
  switchLink: { fontSize: 14, fontWeight: '600' },
});
