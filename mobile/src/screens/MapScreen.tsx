import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Callout, Region, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useLocations } from '../hooks/useLocations';
import { Location } from '../types/models';
import colors from '../theme/colors';

const INITIAL_REGION: Region = {
  latitude: 37.7964,
  longitude: 30.5371,
  latitudeDelta: 0.088,
  longitudeDelta: 0.032,
};

export default function MapScreen() {
  const { locations, isLoading, isMock } = useLocations();
  const mapRef = useRef<MapView>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const flyTo = (loc: Location) => {
    setSelectedId(loc.id);
    mapRef.current?.animateToRegion(
      { latitude: loc.enlem, longitude: loc.boylam, latitudeDelta: 0.004, longitudeDelta: 0.004 },
      500,
    );
  };

  const resetView = () => {
    setSelectedId(null);
    mapRef.current?.animateToRegion(INITIAL_REGION, 600);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Başlık ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Kampüs Haritası</Text>
          {!isLoading && (
            <View style={styles.countPill}>
              <Text style={styles.countText}>{locations.length} bina</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.resetBtn} onPress={resetView} activeOpacity={0.8}>
          <Ionicons name="locate-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isMock && (
        <View style={styles.mockBanner}>
          <Ionicons name="information-circle-outline" size={14} color={colors.warning} />
          <Text style={styles.mockText}>Örnek veriler — backend bağlantısı yok</Text>
        </View>
      )}

      {/* ── Harita — flex:1 ile tüm boş alanı kaplar ──────── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsCompass
        showsScale
        rotateEnabled={false}
      >
        {locations.map(loc => (
          <Marker
            key={loc.id}
            coordinate={{ latitude: loc.enlem, longitude: loc.boylam }}
            pinColor={selectedId === loc.id ? colors.primary : '#EF4444'}
            onPress={() => setSelectedId(loc.id)}
          >
            <Callout tooltip={false}>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{loc.binaAdi}</Text>
                {loc.aciklama ? (
                  <Text style={styles.calloutDesc}>{loc.aciklama}</Text>
                ) : null}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* ── Alt bina listesi — haritanın altında, OVERLAY DEĞİL */}
      <View style={styles.bottomPanel}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ padding: 12 }} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipList}
          >
            {locations.map(loc => (
              <TouchableOpacity
                key={loc.id}
                style={[styles.chip, selectedId === loc.id && styles.chipActive]}
                onPress={() => flyTo(loc)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="business-outline"
                  size={13}
                  color={selectedId === loc.id ? '#fff' : colors.primary}
                />
                <Text
                  style={[styles.chipText, selectedId === loc.id && styles.chipTextActive]}
                  numberOfLines={1}
                >
                  {loc.binaAdi}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Başlık
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  countPill: {
    backgroundColor: colors.primaryLight, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  countText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  resetBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },

  // Mock banner
  mockBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.warningLight,
    paddingHorizontal: 16, paddingVertical: 7,
    borderBottomWidth: 1, borderBottomColor: colors.warning,
  },
  mockText: { fontSize: 12, color: colors.warning, fontWeight: '500' },

  // Harita — tüm kalan alanı kaplar
  map: { flex: 1 },

  // Alt panel — haritanın ALTINDA, overlay değil
  bottomPanel: {
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingVertical: 10,
  },
  chipList: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: colors.primary,
    maxWidth: 200,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  chipTextActive: { color: '#fff' },

  // Callout
  callout: {
    minWidth: 160, maxWidth: 220,
    padding: 10, gap: 4,
  },
  calloutTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  calloutDesc: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
});
