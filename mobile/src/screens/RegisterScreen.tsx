import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from '../navigation/RootNavigator';
import colors from '../theme/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;
type FormErrors = { name?: string; email?: string; password?: string; confirmPassword?: string };

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
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
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>🎓</Text>
          <Text style={styles.appName}>Akıllı Kampüs</Text>
          <Text style={styles.subtitle}>Yeni hesap oluşturun</Text>
        </View>

        <View style={styles.card}>
          <Field label="Ad Soyad" value={name} onChangeText={v => { setName(v); clear('name'); }}
            placeholder="Adınız Soyadınız" error={errors.name} editable={!isSubmitting} />
          <Field label="E-posta" value={email} onChangeText={v => { setEmail(v); clear('email'); }}
            placeholder="ornek@universite.edu.tr" keyboardType="email-address"
            error={errors.email} editable={!isSubmitting} />
          <Field label="Şifre" value={password} onChangeText={v => { setPassword(v); clear('password'); }}
            placeholder="En az 6 karakter" secureTextEntry textContentType="oneTimeCode"
            error={errors.password} editable={!isSubmitting} />
          <Field label="Şifre Tekrar" value={confirmPassword}
            onChangeText={v => { setConfirmPassword(v); clear('confirmPassword'); }}
            placeholder="••••••••" secureTextEntry textContentType="oneTimeCode"
            error={errors.confirmPassword} editable={!isSubmitting} />

          <TouchableOpacity
            style={[styles.primaryBtn, isSubmitting && styles.btnDisabled]}
            onPress={handleRegister} disabled={isSubmitting} activeOpacity={0.8}
          >
            {isSubmitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>Kayıt Ol</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Zaten hesabınız var mı? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.switchLink}>Giriş Yap</Text>
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
};

function Field({ label, error, textContentType = 'none', ...rest }: FieldProps) {
  return (
    <View style={fs.group}>
      <Text style={fs.label}>{label}</Text>
      <TextInput
        style={[fs.input, error ? fs.inputError : null]}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        // "oneTimeCode" → iOS'ta "Güçlü Parola Kullan" önerisini bastırır
        textContentType={textContentType}
        {...rest}
      />
      {error ? <Text style={fs.error}>{error}</Text> : null}
    </View>
  );
}

const fs = StyleSheet.create({
  group: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  inputError: { borderColor: colors.error },
  error: { fontSize: 12, color: colors.error },
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
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 },

  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 56, marginBottom: 12 },
  appName: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: 0.3 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 6 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    gap: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  switchText: { color: colors.textSecondary, fontSize: 14 },
  switchLink: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
