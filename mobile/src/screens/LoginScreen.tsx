import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
  ScrollView, Image, Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from '../navigation/RootNavigator';
import { useColors, useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const campusBuilding = require('../../assets/images/campus-building.png');

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const colors = useColors();
  const { isDark } = useTheme();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'E-posta adresi gerekli.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Geçerli bir e-posta girin.';
    if (!password) next.password = 'Şifre gerekli.';
    else if (password.length < 6) next.password = 'Şifre en az 6 karakter olmalı.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      Alert.alert('Giriş Hatası', extractMessage(err, 'E-posta veya şifre hatalı.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Üst başlık ── */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.stripeApp}>
            <Text style={styles.stripeAppBold}>AKILLI </Text>
            <Text style={styles.stripeAppLight}>KAMPÜS</Text>
          </Text>
        </View>

        {/* ── Form alanı (dikeyde ortalı) ── */}
        <View style={styles.formWrap}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Hesabınıza giriş yapın</Text>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Field
              label="E-posta"
              value={email}
              onChangeText={v => { setEmail(v); setErrors(e => ({ ...e, email: undefined })); }}
              placeholder="ornek@universite.edu.tr"
              keyboardType="email-address"
              error={errors.email}
              editable={!isSubmitting}
              colors={colors}
            />
            <Field
              label="Şifre"
              value={password}
              onChangeText={v => { setPassword(v); setErrors(e => ({ ...e, password: undefined })); }}
              placeholder="••••••••"
              secureTextEntry
              error={errors.password}
              editable={!isSubmitting}
              colors={colors}
            />

            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: colors.primary }, isSubmitting && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.loginBtnText}>Giriş Yap</Text>
              }
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotRow}
          >
            <Text style={[styles.link, { color: colors.primary }]}>Şifremi Unuttum</Text>
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={[styles.registerText, { color: colors.textSecondary }]}>
              Hesabınız yok mu?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.link, { color: colors.primary }]}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Alt: Bina çizimi (şeffaf zemin, tema rengiyle) ── */}
        <View style={styles.bannerWrap}>
          <Image
            source={campusBuilding}
            style={[styles.bannerImg, { tintColor: colors.primary }]}
            resizeMode="contain"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ── Field bileşeni ───────────────────────────────────────── */
type FieldProps = {
  label: string; value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  error?: string; editable?: boolean;
  colors: ReturnType<typeof useColors>;
};

function Field({ label, error, colors, ...rest }: FieldProps) {
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
        {...rest}
      />
      {error ? <Text style={[fs.err, { color: colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const fs = StyleSheet.create({
  group: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  err:   { fontSize: 12 },
});

function extractMessage(err: unknown, fallback: string) {
  if (err && typeof err === 'object' && 'response' in err) {
    const d = (err as { response?: { data?: { message?: string } } }).response?.data;
    if (d?.message) return d.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

/* ── Stiller ─────────────────────────────────────────────── */
const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },

  /* Üst lacivert başlık */
  header: {
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 6,
  },
  stripeApp:      { flexDirection: 'row' },
  stripeAppBold:  { color: '#fff', fontSize: 26, fontWeight: '900', letterSpacing: 3 },
  stripeAppLight: { color: 'rgba(255,255,255,0.88)', fontSize: 26, fontWeight: '300', letterSpacing: 3 },

  /* Bina banner (alt, şeffaf zemin) */
  bannerWrap: { width: '100%', alignItems: 'center', paddingBottom: 32 },
  bannerImg: {
    width: width,
    height: width * 0.286,   // görsel oranı 419x120
    opacity: 0.85,
  },

  /* Form (dikeyde ortalı) */
  formWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    gap: 16,
  },
  formTitle: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 4 },

  card: {
    borderRadius: 16, padding: 24, gap: 20,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },

  loginBtn: {
    borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', marginTop: 4,
  },
  btnDisabled:  { opacity: 0.6 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

  forgotRow:    { alignItems: 'center' },
  registerRow:  { flexDirection: 'row', justifyContent: 'center' },
  registerText: { fontSize: 14 },
  link:         { fontSize: 14, fontWeight: '600' },
});
