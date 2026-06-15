import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Community } from '../types/Community';
import { useColors } from '../context/ThemeContext';

interface Props {
  community: Community;
  /** true → Keşfet (Katıl butonu) · false → Topluluklarım (Sohbete Git butonu) */
  isDiscover: boolean;
  onJoin?: () => void;
  onChat?: () => void;
  /** Katıl isteği sürerken butonda spinner gösterir. */
  joining?: boolean;
}

export default function CommunityCard({ community, isDiscover, onJoin, onChat, joining = false }: Props) {
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);

  const initials = community.name.trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={s.card}>
      <View style={s.topRow}>
        {community.imageUrl ? (
          <Image source={{ uri: community.imageUrl }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, s.avatarPlaceholder]}>
            <Text style={s.avatarInitials}>{initials}</Text>
          </View>
        )}

        <View style={s.info}>
          <Text style={s.name} numberOfLines={1}>{community.name}</Text>
          <View style={s.memberRow}>
            <Ionicons name="people" size={13} color={c.textMuted} />
            <Text style={s.memberText}>{community.memberCount} üye</Text>
          </View>
        </View>

        {isDiscover ? (
          <TouchableOpacity
            style={[s.btn, s.joinBtn, joining && s.btnDisabled]}
            onPress={onJoin}
            disabled={joining}
            activeOpacity={0.85}
          >
            {joining ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={s.btnText}>Katıl</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[s.btn, s.chatBtn]} onPress={onChat} activeOpacity={0.85}>
            <Ionicons name="chatbubbles" size={15} color="#fff" />
            <Text style={s.btnText}>Sohbete Git</Text>
          </TouchableOpacity>
        )}
      </View>

      {community.description ? (
        <Text style={s.description} numberOfLines={2}>{community.description}</Text>
      ) : null}
    </View>
  );
}

const makeStyles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      gap: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },

    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.primaryLight },
    avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
    avatarInitials: { fontSize: 20, fontWeight: '800', color: c.primary },

    info: { flex: 1, gap: 3 },
    name: { fontSize: 16, fontWeight: '700', color: c.text },
    memberRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    memberText: { fontSize: 12, color: c.textMuted, fontWeight: '500' },

    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 8,
      minWidth: 92,
    },
    btnDisabled: { opacity: 0.7 },
    joinBtn: { backgroundColor: c.success },
    chatBtn: { backgroundColor: c.primary },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    description: { fontSize: 13, color: c.textSecondary, lineHeight: 19 },
  });
