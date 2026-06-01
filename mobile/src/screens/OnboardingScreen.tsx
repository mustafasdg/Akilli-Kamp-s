import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '../context/ThemeContext';
import UniversityLogo from '../components/UniversityLogo';

const { width } = Dimensions.get('window');
export const ONBOARDING_KEY = 'onboarding_done';

const SLIDES = [
  {
    key: '1',
    emoji: '🏛️',
    title: 'ISUBÜ Akıllı\nKampüs\'e Hoş Geldin',
    body: 'Isparta Uygulamalı Bilimler Üniversitesi\'nin resmi mobil uygulaması. Kampüs hayatın artık daha kolay.',
    bg: '#1E3A5F',
  },
  {
    key: '2',
    emoji: '📢',
    title: 'Anlık Duyurular',
    body: 'Akademik takvim, sınav tarihleri ve üniversite etkinliklerini anında öğren. Hiçbir duyuruyu kaçırma.',
    bg: '#0F766E',
  },
  {
    key: '3',
    emoji: '🍽️',
    title: 'Günlük Yemek\nMenüsü',
    body: 'SDÜ Yemekhane\'nin günlük menüsünü gör, favorilerini kaydet ve kalori takibi yap.',
    bg: '#7C3AED',
  },
  {
    key: '4',
    emoji: '🗺️',
    title: 'Kampüs Haritası',
    body: 'SDÜ ve ISUBÜ kampüsündeki 15 gerçek konumu keşfet. Derslik, kantin, kütüphane hepsi elininin altında.',
    bg: '#B45309',
  },
];

interface Props { onDone: () => void }

export default function OnboardingScreen({ onDone }: Props) {
  const c = useColors();
  const [current, setCurrent] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (current < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: current + 1 });
      setCurrent(current + 1);
    }
  };

  const handleDone = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onDone();
  };

  const isLast = current === SLIDES.length - 1;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: SLIDES[current].bg }]}>
      <View style={styles.skipRow}>
        <TouchableOpacity onPress={handleDone} style={styles.skipBtn}>
          <Text style={styles.skipText}>Atla</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyExtractor={i => i.key}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            {item.key === '1' ? (
              <UniversityLogo variant="full" color="#fff" textColor="rgba(255,255,255,0.85)" />
            ) : (
              <Text style={styles.emoji}>{item.emoji}</Text>
            )}
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === current && styles.dotActive]}
          />
        ))}
      </View>

      {/* Buton */}
      <View style={styles.btnArea}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={isLast ? handleDone : handleNext}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextBtnText, { color: SLIDES[current].bg }]}>
            {isLast ? 'Başlayalım 🚀' : 'Devam'}
          </Text>
          {!isLast && <Ionicons name="arrow-forward" size={18} color={SLIDES[current].bg} />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  skipRow: { alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 8 },
  skipBtn: { padding: 8 },
  skipText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },

  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 20,
    gap: 20,
  },
  emoji: { fontSize: 80 },
  title: {
    fontSize: 28, fontWeight: '800', color: '#fff',
    textAlign: 'center', lineHeight: 36,
  },
  body: {
    fontSize: 16, color: 'rgba(255,255,255,0.85)',
    textAlign: 'center', lineHeight: 24,
  },

  dotsRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    paddingVertical: 24,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: '#fff', width: 24,
  },

  btnArea: { paddingHorizontal: 24, paddingBottom: 32 },
  nextBtn: {
    backgroundColor: '#fff',
    borderRadius: 16, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  nextBtnText: { fontSize: 17, fontWeight: '800' },
});
