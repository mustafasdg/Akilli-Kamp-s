import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Modal, Image,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColors } from '../context/ThemeContext';
import apiClient from '../services/apiClient';
import { communityService } from '../services/communityService';
import { Announcement } from '../types/models';
import { Community } from '../types/Community';
import { AppRootParamList } from '../navigation/RootNavigator';

interface PagedResult {
  items: Announcement[];
  totalCount: number;
  totalPages: number;
  page: number;
}

type AdminTab = 'announcements' | 'communities';
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const KATEGORILER = ['Akademik', 'Etkinlik', 'Spor', 'Sosyal', 'Kariyer', 'Uluslararası', 'Genel'];

export default function AdminScreen() {
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);
  const navigation = useNavigation<NativeStackNavigationProp<AppRootParamList>>();

  const [tab, setTab] = useState<AdminTab>('announcements');
  const [query, setQuery] = useState('');

  // ── Duyurular ───────────────────────────────────────────────────────────────
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ── Topluluklar ─────────────────────────────────────────────────────────────
  const [communities, setCommunities] = useState<Community[]>([]);
  const [commLoading, setCommLoading] = useState(true);

  // ── Düzenleme modalı (oluşturma artık ayrı ekranda) ─────────────────────────
  const [modalVisible, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [fBaslik, setFBaslik] = useState('');
  const [fKategori, setFKategori] = useState('Akademik');
  const [fIcerik, setFIcerik] = useState('');

  const loadAnnouncements = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const res = await apiClient.get<PagedResult>(`/admin/announcements?page=${p}&pageSize=20`);
      setItems(res.data.items);
      setTotal(res.data.totalCount);
      setTotalPages(res.data.totalPages);
      setPage(p);
    } catch {
      Alert.alert('Hata', 'Duyurular yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCommunities = useCallback(async () => {
    try {
      setCommLoading(true);
      const data = await communityService.getAllCommunities();
      setCommunities(data);
    } catch {
      Alert.alert('Hata', 'Topluluklar yüklenemedi.');
    } finally {
      setCommLoading(false);
    }
  }, []);

  // İlk açılış + sekme değişimi → aktif sekmeyi yükle
  useEffect(() => {
    if (tab === 'announcements') loadAnnouncements(1);
    else loadCommunities();
  }, [tab, loadAnnouncements, loadCommunities]);

  // Oluşturma ekranından geri dönünce aktif sekmeyi tazele
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      if (tab === 'announcements') loadAnnouncements(1);
      else loadCommunities();
    });
    return unsub;
  }, [navigation, tab, loadAnnouncements, loadCommunities]);

  const filteredAnnouncements = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(a => a.baslik.toLowerCase().includes(q) || a.kategori.toLowerCase().includes(q));
  }, [items, query]);

  const filteredCommunities = useMemo(() => {
    if (!query.trim()) return communities;
    const q = query.toLowerCase();
    return communities.filter(
      x => x.name.toLowerCase().includes(q) || (x.description ?? '').toLowerCase().includes(q),
    );
  }, [communities, query]);

  // ── Akıllı FAB: aktif sekmeye göre ilgili oluşturma ekranına git ────────────
  const handleFab = useCallback(() => {
    if (tab === 'announcements') navigation.navigate('CreateAnnouncement');
    else navigation.navigate('CreateCommunity');
  }, [tab, navigation]);

  const openEdit = (item: Announcement) => {
    setEditId(item.id);
    setFBaslik(item.baslik);
    setFKategori(item.kategori);
    setFIcerik(item.icerik);
    setModal(true);
  };

  const handleSave = async () => {
    if (!fBaslik.trim() || !fIcerik.trim()) {
      Alert.alert('Hata', 'Başlık ve içerik zorunludur.');
      return;
    }
    try {
      setSaving(true);
      const body = { baslik: fBaslik.trim(), kategori: fKategori, icerik: fIcerik.trim() };
      if (editId) await apiClient.put(`/admin/announcements/${editId}`, body);
      setModal(false);
      loadAnnouncements(page);
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'Kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: Announcement) => {
    Alert.alert(
      'Duyuruyu Sil',
      `"${item.baslik}" başlıklı duyuruyu silmek istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/admin/announcements/${item.id}`);
              loadAnnouncements(page);
            } catch {
              Alert.alert('Hata', 'Silinemedi.');
            }
          },
        },
      ],
    );
  };

  const handleDeleteCommunity = (community: Community) => {
    Alert.alert(
      'Topluluğu Sil',
      'Bu topluluğu silmek istediğinize emin misiniz? Tüm mesajlar silinecektir.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive',
          onPress: async () => {
            try {
              await communityService.deleteCommunity(community.id);
              loadCommunities();
            } catch {
              Alert.alert('Hata', 'Topluluk silinemedi.');
            }
          },
        },
      ],
    );
  };

  const activeLoading = tab === 'announcements' ? loading : commLoading;
  const subtitle = tab === 'announcements' ? `${totalCount} duyuru` : `${communities.length} topluluk`;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Header ───────────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.headerIcon}>
          <Ionicons name="shield-checkmark" size={20} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Kontrol Merkezi</Text>
          <Text style={s.headerSub}>{subtitle}</Text>
        </View>
      </View>

      {/* ── Segmented Control (Duyurular / Topluluklar) ──────────── */}
      <View style={s.toggleWrap}>
        {(['announcements', 'communities'] as const).map((key) => {
          const active = tab === key;
          const label = key === 'announcements' ? 'Duyurular' : 'Topluluklar';
          const iconName: IoniconName =
            key === 'announcements'
              ? active ? 'megaphone' : 'megaphone-outline'
              : active ? 'people' : 'people-outline';
          return (
            <TouchableOpacity
              key={key}
              style={[s.toggleBtn, active && s.toggleBtnActive]}
              onPress={() => { setTab(key); setQuery(''); }}
              activeOpacity={0.85}
            >
              <Ionicons name={iconName} size={16} color={active ? '#fff' : c.textSecondary} />
              <Text style={[s.toggleText, active && s.toggleTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Arama ────────────────────────────────────────────────── */}
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={16} color={c.textMuted} />
        <TextInput
          style={s.searchInput}
          placeholder={tab === 'announcements' ? 'Duyuru ara...' : 'Topluluk ara...'}
          placeholderTextColor={c.textMuted}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={16} color={c.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Liste ────────────────────────────────────────────────── */}
      {activeLoading ? (
        <View style={s.center}><ActivityIndicator size="large" color={c.primary} /></View>
      ) : tab === 'announcements' ? (
        <FlatList
          data={filteredAnnouncements}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={{ fontSize: 40 }}>📭</Text>
              <Text style={s.emptyText}>{query ? 'Sonuç bulunamadı.' : 'Henüz duyuru yok.'}</Text>
            </View>
          }
          ListFooterComponent={
            totalPages > 1 && !query ? (
              <View style={s.pagination}>
                <TouchableOpacity
                  style={[s.pageBtn, page <= 1 && s.pageBtnDisabled]}
                  onPress={() => loadAnnouncements(page - 1)} disabled={page <= 1}
                >
                  <Ionicons name="chevron-back" size={16} color={page <= 1 ? c.textMuted : c.primary} />
                </TouchableOpacity>
                <Text style={s.pageInfo}>{page} / {totalPages}</Text>
                <TouchableOpacity
                  style={[s.pageBtn, page >= totalPages && s.pageBtnDisabled]}
                  onPress={() => loadAnnouncements(page + 1)} disabled={page >= totalPages}
                >
                  <Ionicons name="chevron-forward" size={16} color={page >= totalPages ? c.textMuted : c.primary} />
                </TouchableOpacity>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardTop}>
                <View style={[s.badge, { backgroundColor: badgeBg(item.kategori, c) }]}>
                  <Text style={[s.badgeText, { color: badgeColor(item.kategori, c) }]}>{item.kategori}</Text>
                </View>
                <Text style={s.dateText}>
                  {new Date(item.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              <Text style={s.cardTitle} numberOfLines={2}>{item.baslik}</Text>
              <Text style={s.cardBody} numberOfLines={2}>{item.icerik}</Text>
              <View style={s.cardActions}>
                <TouchableOpacity style={s.editBtn} onPress={() => openEdit(item)} activeOpacity={0.8}>
                  <Ionicons name="create-outline" size={15} color={c.primary} />
                  <Text style={[s.actionText, { color: c.primary }]}>Düzenle</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item)} activeOpacity={0.8}>
                  <Ionicons name="trash-outline" size={15} color={c.error} />
                  <Text style={[s.actionText, { color: c.error }]}>Sil</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={filteredCommunities}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={{ fontSize: 40 }}>👥</Text>
              <Text style={s.emptyText}>{query ? 'Sonuç bulunamadı.' : 'Henüz topluluk yok.'}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.commCard}>
              <View style={s.commTop}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={s.commAvatar} />
                ) : (
                  <View style={[s.commAvatar, s.commAvatarPlaceholder]}>
                    <Text style={s.commAvatarText}>{(item.name.trim().charAt(0) || '?').toUpperCase()}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={s.commName} numberOfLines={1}>{item.name}</Text>
                  {item.description ? (
                    <Text style={s.commDesc} numberOfLines={1}>{item.description}</Text>
                  ) : null}
                  <View style={s.commMetaRow}>
                    <Ionicons name="people" size={12} color={c.textMuted} />
                    <Text style={s.commMeta}>{item.memberCount} üye</Text>
                  </View>
                </View>
              </View>
              <View style={s.cardActions}>
                <TouchableOpacity
                  style={s.editBtn}
                  onPress={() => navigation.navigate('EditCommunity', {
                    id: item.id, name: item.name, description: item.description, imageUrl: item.imageUrl,
                  })}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create-outline" size={15} color={c.primary} />
                  <Text style={[s.actionText, { color: c.primary }]}>Düzenle</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.deleteBtn} onPress={() => handleDeleteCommunity(item)} activeOpacity={0.8}>
                  <Ionicons name="trash-outline" size={15} color={c.error} />
                  <Text style={[s.actionText, { color: c.error }]}>Sil</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* ── Akıllı FAB (her zaman üstte, primary renk) ───────────── */}
      <TouchableOpacity style={s.fab} onPress={handleFab} activeOpacity={0.85}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* ── Düzenleme Modalı ─────────────────────────────────────── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalOverlay}>
            <View style={s.modal}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>✏️ Duyuruyu Düzenle</Text>
                <TouchableOpacity onPress={() => setModal(false)} style={s.modalClose}>
                  <Ionicons name="close" size={20} color={c.text} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={s.modalBody} keyboardShouldPersistTaps="handled">
                <Text style={s.formLabel}>Başlık *</Text>
                <TextInput
                  style={s.formInput}
                  value={fBaslik}
                  onChangeText={setFBaslik}
                  placeholder="Duyuru başlığı..."
                  placeholderTextColor={c.textMuted}
                  multiline
                />

                <Text style={s.formLabel}>Kategori *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {KATEGORILER.map(k => (
                      <TouchableOpacity
                        key={k}
                        style={[s.catChip, fKategori === k && s.catChipActive]}
                        onPress={() => setFKategori(k)}
                      >
                        <Text style={[s.catChipText, fKategori === k && s.catChipTextActive]}>{k}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                <Text style={s.formLabel}>İçerik *</Text>
                <TextInput
                  style={[s.formInput, s.formTextarea]}
                  value={fIcerik}
                  onChangeText={setFIcerik}
                  placeholder="Duyuru içeriği..."
                  placeholderTextColor={c.textMuted}
                  multiline
                  textAlignVertical="top"
                />
              </ScrollView>

              <View style={s.modalFooter}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setModal(false)}>
                  <Text style={s.cancelBtnText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.saveBtn, saving && { opacity: 0.6 }]}
                  onPress={handleSave} disabled={saving} activeOpacity={0.8}
                >
                  {saving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.saveBtnText}>Güncelle</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function badgeBg(kat: string, c: ReturnType<typeof useColors>) {
  const k = kat.toLowerCase();
  if (k.includes('akademik')) return c.badge.akademik.bg;
  if (k.includes('spor'))     return c.badge.spor.bg;
  if (k.includes('sosyal'))   return c.badge.sosyal.bg;
  return c.badge.genel.bg;
}
function badgeColor(kat: string, c: ReturnType<typeof useColors>) {
  const k = kat.toLowerCase();
  if (k.includes('akademik')) return c.badge.akademik.text;
  if (k.includes('spor'))     return c.badge.spor.text;
  if (k.includes('sosyal'))   return c.badge.sosyal.text;
  return c.badge.genel.text;
}

const makeStyles = (c: ReturnType<typeof useColors>) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border,
  },
  headerIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: c.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: c.text },
  headerSub: { fontSize: 13, color: c.textMuted, marginTop: 2 },

  // ── Segmented control ──────────────────────────────────────────────────────
  toggleWrap: {
    flexDirection: 'row', backgroundColor: c.surfaceAlt, borderRadius: 12,
    padding: 4, marginHorizontal: 16, marginTop: 12, gap: 4,
    borderWidth: 1, borderColor: c.border,
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 9,
  },
  toggleBtnActive: {
    backgroundColor: c.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12, shadowRadius: 3, elevation: 2,
  },
  toggleText: { fontSize: 14, fontWeight: '700', color: c.textSecondary },
  toggleTextActive: { color: '#fff' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 12, paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: c.surface, borderRadius: 10, borderWidth: 1, borderColor: c.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: c.text, height: 26 },

  list: { padding: 12, gap: 10, paddingBottom: 96 },

  // ── Duyuru kartı ───────────────────────────────────────────────────────────
  card: {
    backgroundColor: c.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: c.border, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  dateText: { fontSize: 11, color: c.textMuted },
  cardTitle: { fontSize: 15, fontWeight: '700', color: c.text, lineHeight: 21 },
  cardBody: { fontSize: 13, color: c.textSecondary, lineHeight: 19 },
  cardActions: { flexDirection: 'row', gap: 8, paddingTop: 4, borderTopWidth: 1, borderTopColor: c.borderLight },
  editBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: c.primaryLight, borderRadius: 8, paddingVertical: 7,
  },
  deleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: c.errorLight, borderRadius: 8, paddingVertical: 7,
  },
  actionText: { fontSize: 13, fontWeight: '600' },

  // ── Topluluk kartı ─────────────────────────────────────────────────────────
  commCard: {
    backgroundColor: c.surface, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: c.border, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 2,
  },
  commTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  commAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: c.primaryLight },
  commAvatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  commAvatarText: { fontSize: 19, fontWeight: '800', color: c.primary },
  commName: { fontSize: 15, fontWeight: '700', color: c.text },
  commDesc: { fontSize: 12.5, color: c.textSecondary, marginTop: 1 },
  commMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  commMeta: { fontSize: 12, color: c.textMuted, fontWeight: '500' },

  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, paddingVertical: 16 },
  pageBtn: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: c.surface,
    borderWidth: 1, borderColor: c.border, justifyContent: 'center', alignItems: 'center',
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageInfo: { fontSize: 14, fontWeight: '600', color: c.text },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 32 },
  emptyText: { fontSize: 15, color: c.textMuted },

  // ── Akıllı FAB ─────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute', right: 20, bottom: 24,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: c.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 8, zIndex: 10,
  },

  // ── Modal ──────────────────────────────────────────────────────────────────
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: c.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, borderBottomWidth: 1, borderBottomColor: c.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: c.text },
  modalClose: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: c.background,
    justifyContent: 'center', alignItems: 'center',
  },
  modalBody: { padding: 20, gap: 4 },
  formLabel: { fontSize: 13, fontWeight: '600', color: c.textSecondary, marginBottom: 6 },
  formInput: {
    borderWidth: 1.5, borderColor: c.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: c.text, backgroundColor: c.surfaceAlt, marginBottom: 16,
  },
  formTextarea: { minHeight: 100, textAlignVertical: 'top' },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: c.background, borderWidth: 1.5, borderColor: c.border,
  },
  catChipActive: { backgroundColor: c.primary, borderColor: c.primary },
  catChipText: { fontSize: 13, fontWeight: '600', color: c.textSecondary },
  catChipTextActive: { color: '#fff' },
  modalFooter: {
    flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: c.border,
  },
  cancelBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 12,
    backgroundColor: c.background, borderWidth: 1, borderColor: c.border, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: c.textSecondary },
  saveBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: c.primary, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
