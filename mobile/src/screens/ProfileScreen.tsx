import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

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

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : '—';

  // Baş harflerden avatar rengi üret (sabit ama kişiye özgü hissettirsin)
  const avatarColor = stringToColor(user?.name ?? '');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── Hero alanı ─────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>
              {getInitials(user?.name ?? '?')}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <View style={styles.emailRow}>
            <Ionicons name="mail-outline" size={14} color={colors.textMuted} />
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <View style={styles.memberBadge}>
            <Ionicons name="school-outline" size={13} color={colors.primary} />
            <Text style={styles.memberText}>Akıllı Kampüs Üyesi</Text>
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
            value={user?.name ?? '—'}
          />
          <Divider />
          <InfoRow
            icon="at-outline"
            label="E-posta"
            value={user?.email ?? '—'}
          />
        </View>

        {/* ── Uygulama ───────────────────────────────────────── */}
        <SectionLabel title="Uygulama" />
        <View style={styles.card}>
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

// ─── Alt bileşenler ───────────────────────────────────────────────────────────

function SectionLabel({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

function Divider() {
  return <View style={styles.divider} />;
}

function InfoRow({
  icon, label, value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={17} color={colors.primary} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function ActionRow({
  icon, label,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
}) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7}>
      <View style={styles.rowLeft}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={17} color={colors.primary} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function stringToColor(str: string): string {
  const palette = [
    '#1D4ED8', '#0F766E', '#7C3AED', '#B45309',
    '#0369A1', '#BE185D', '#15803D', '#C2410C',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: 40 },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: 32, paddingBottom: 28,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: 6,
  },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  avatarText: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  email: { fontSize: 14, color: colors.textSecondary },
  memberBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.primaryLight,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    marginTop: 4,
  },
  memberText: { fontSize: 12, fontWeight: '600', color: colors.primary },

  // Section label
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginTop: 24, marginBottom: 8, marginHorizontal: 20,
  },

  // Card
  card: {
    marginHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  divider: { height: 1, backgroundColor: colors.borderLight, marginLeft: 56 },

  // Row
  row: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  rowLabel: { fontSize: 15, color: colors.text, fontWeight: '500' },
  rowValue: { fontSize: 14, color: colors.textSecondary, maxWidth: '45%', textAlign: 'right' },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 20, marginTop: 28,
    backgroundColor: colors.surface,
    borderRadius: 14, paddingVertical: 15,
    borderWidth: 1.5, borderColor: colors.error,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: colors.error },
});
