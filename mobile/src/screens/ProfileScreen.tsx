import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTheme, useColors } from '../context/ThemeContext';
import UserAvatar from '../components/UserAvatar';
import { formatName } from '../utils/avatarUtils';
import { AppRootParamList } from '../navigation/RootNavigator';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation<NativeStackNavigationProp<AppRootParamList>>();

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istiyor musunuz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
      ]
    );
  };

  const roleInfo = getRoleInfo(user?.role ?? '');

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── Hero alanı ─────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.avatarWrapper}>
            <UserAvatar name={user?.name ?? '?'} size={84} backgroundColor={colors.primary} />
            <TouchableOpacity
              style={styles.editBadge}
              onPress={() => navigation.navigate('EditProfile')}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil" size={13} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{formatName(user?.name ?? '')}</Text>
          <View style={styles.emailRow}>
            <Ionicons name="mail-outline" size={14} color={colors.textMuted} />
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <View style={[styles.roleBadge, { backgroundColor: roleInfo.bg }]}>
            <Ionicons name={roleInfo.icon} size={13} color={roleInfo.color} />
            <Text style={[styles.roleText, { color: roleInfo.color }]}>{roleInfo.label}</Text>
          </View>
        </View>

        {/* ── Hesap Bilgileri ────────────────────────────────── */}
        <SectionLabel title="Hesap Bilgileri" />
        <View style={styles.card}>
          <InfoRow
            icon="calendar-outline"
            label="Üyelik Tarihi"
            value={joinDate}
          />
          <Divider />
          <InfoRow
            icon="person-outline"
            label="Ad Soyad"
            value={formatName(user?.name ?? '—')}
          />
          <Divider />
          <InfoRow
            icon="at-outline"
            label="E-posta"
            value={user?.email ?? '—'}
          />
          <Divider />
          <InfoRow
            icon="ribbon-outline"
            label="Rol"
            value={roleInfo.label}
          />
          <Divider />
          <ActionRow
            icon="create-outline"
            label="Profili Düzenle"
            onPress={() => navigation.navigate('EditProfile')}
          />
        </View>

        {/* ── Uygulama ───────────────────────────────────────── */}
        <SectionLabel title="Uygulama" />
        <View style={styles.card}>
          {/* Dark Mode toggle */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconBox}>
                <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={17} color={colors.primary} />
              </View>
              <Text style={styles.rowLabel}>Karanlık Tema</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <Divider />
          <ActionRow icon="notifications-outline" label="Bildirimler" />
          <Divider />
          <ActionRow icon="information-circle-outline" label="Hakkında" />
          <Divider />
          <InfoRow icon="code-slash-outline" label="Sürüm" value="1.0.0" />
        </View>

        {/* ── Çıkış ──────────────────────────────────────────── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Rol yardımcısı ──────────────────────────────────────────────────────────

type RoleInfo = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  bg: string;
};

function getRoleInfo(role: string): RoleInfo {
  const r = role.toLowerCase();
  if (r.includes('admin') || r.includes('yönetici'))
    return { label: 'Yönetici', icon: 'shield-checkmark-outline', color: '#7C3AED', bg: '#EDE9FE' };
  if (r.includes('academic') || r.includes('akademi') || r.includes('teacher') || r.includes('öğretim'))
    return { label: 'Akademisyen', icon: 'library-outline', color: '#065F46', bg: '#D1FAE5' };
  return { label: 'Öğrenci', icon: 'school-outline', color: '#1E3A5F', bg: '#D6E4F0' };
}

// ─── Alt bileşenler ───────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  const c = useColors(); const s = makeStyles(c);
  return <Text style={s.sectionLabel}>{title}</Text>;
}

function Divider() {
  const c = useColors(); const s = makeStyles(c);
  return <View style={s.divider} />;
}

function InfoRow({
  icon, label, value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  const c = useColors(); const s = makeStyles(c);
  return (
    <View style={s.row}>
      <View style={s.rowLeft}>
        <View style={s.iconBox}>
          <Ionicons name={icon} size={17} color={c.primary} />
        </View>
        <Text style={s.rowLabel}>{label}</Text>
      </View>
      <Text style={s.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function ActionRow({
  icon, label, onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress?: () => void;
}) {
  const c = useColors();
  const styles = makeStyles(c);
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.rowLeft}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={17} color={c.primary} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const makeStyles = (c: ReturnType<typeof useColors>) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  container: { paddingBottom: 40 },

  hero: {
    alignItems: 'center', paddingTop: 32, paddingBottom: 28,
    backgroundColor: c.surface,
    borderBottomWidth: 1, borderBottomColor: c.border, gap: 6,
  },
  avatarWrapper: { position: 'relative', marginBottom: 8 },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: c.primary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: c.surface,
  },
  name: { fontSize: 22, fontWeight: '700', color: c.text },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  email: { fontSize: 14, color: c.textSecondary },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginTop: 4,
  },
  roleText: { fontSize: 12, fontWeight: '700' },

  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: c.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginTop: 24, marginBottom: 8, marginHorizontal: 20,
  },

  card: {
    marginHorizontal: 20, backgroundColor: c.surface,
    borderRadius: 14, borderWidth: 1, borderColor: c.border,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  divider: { height: 1, backgroundColor: c.borderLight, marginLeft: 56 },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: c.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  rowLabel: { fontSize: 15, color: c.text, fontWeight: '500' },
  rowValue: { fontSize: 14, color: c.textSecondary, maxWidth: '45%', textAlign: 'right' },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 28,
    backgroundColor: c.surface,
    borderRadius: 14, paddingVertical: 15,
    borderWidth: 1.5, borderColor: c.error,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: c.error },
});
