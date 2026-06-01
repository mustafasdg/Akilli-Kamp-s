import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

type Variant = 'full' | 'compact' | 'header' | 'splash';

interface Props {
  variant?: Variant;
  color?: string;
  textColor?: string;
}

const logoFull       = require('../../assets/images/logo-full.png');        // amblem + yazı dikey
const logoIcon       = require('../../assets/images/logo-icon.png');        // sadece amblem
const logoHorizontal = require('../../assets/images/logo-horizontal.png');  // amblem + yazı yatay

export default function UniversityLogo({
  variant = 'full',
  color = '#1E3A5F',
  textColor,
}: Props) {
  const tc = textColor ?? color;

  /* ────────────────────────────────────────────────────────────
     HEADER  →  Ana sayfa üst barı  (logo-icon + metin)
  ──────────────────────────────────────────────────────────── */
  if (variant === 'header') {
    return (
      <View style={s.headerRow}>
        <Image source={logoIcon} style={s.headerIcon} resizeMode="contain" />
        <View style={s.headerTexts}>
          <Text style={[s.headerUni, { color }]}>ISUBÜ</Text>
          <Text style={[s.headerAppName, { color }]}>
            Akıllı <Text style={s.headerAppBold}>Kampüs</Text>
          </Text>
        </View>
      </View>
    );
  }

  /* ────────────────────────────────────────────────────────────
     COMPACT  →  Kayıt ekranı  (logo-horizontal küçük + başlık)
  ──────────────────────────────────────────────────────────── */
  if (variant === 'compact') {
    return (
      <View style={s.centerCol}>
        <View style={s.logoBg}>
          <Image source={logoHorizontal} style={s.compactImg} resizeMode="contain" />
        </View>
        <View style={s.appTitleRow}>
          <Text style={[s.appTitleThin, { color: tc }]}>Akıllı </Text>
          <Text style={[s.appTitleBold, { color }]}>Kampüs</Text>
        </View>
      </View>
    );
  }

  /* ────────────────────────────────────────────────────────────
     FULL / SPLASH  →  Giriş, Onboarding
     Logo beyaz kartın içinde, altında büyük "Akıllı Kampüs"
  ──────────────────────────────────────────────────────────── */
  const isSplash = variant === 'splash';

  return (
    <View style={s.centerCol}>
      {/* Beyaz kart — logonun kendi beyaz zemini için */}
      <View style={[s.logoCard, isSplash && s.logoCardLg]}>
        <Image
          source={logoFull}
          style={isSplash ? s.splashImg : s.fullImg}
          resizeMode="contain"
        />
      </View>

      {/* AKILLI KAMPÜS ana başlık */}
      <View style={s.appTitleRow}>
        <Text style={[s.mainThin, { color: tc, fontSize: isSplash ? 30 : 26 }]}>Akıllı </Text>
        <Text style={[s.mainBold, { color,   fontSize: isSplash ? 30 : 26 }]}>Kampüs</Text>
      </View>

      {/* İnce yatay çizgi */}
      <View style={[s.rule, { backgroundColor: color }]} />

      {/* Alt yazı */}
      <Text style={[s.sub, { color: tc }]}>
        Isparta Uygulamalı Bilimler Üniversitesi
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  centerCol: { alignItems: 'center', gap: 8 },

  /* Logo beyaz kart */
  logoBg: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 4,
  },
  logoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  logoCardLg: { padding: 20, borderRadius: 24 },

  fullImg:   { width: 140, height: 140 },
  splashImg: { width: 170, height: 170 },
  compactImg: { width: 190, height: 64 },

  /* AKILLI KAMPÜS başlık */
  appTitleRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  appTitleThin: { fontSize: 20, fontWeight: '300', letterSpacing: 1 },
  appTitleBold: { fontSize: 20, fontWeight: '800', letterSpacing: 1 },

  mainThin: { fontWeight: '300', letterSpacing: 1.5 },
  mainBold: { fontWeight: '900', letterSpacing: 1.5 },

  /* Çizgi + alt yazı */
  rule: { width: 52, height: 2, borderRadius: 2, opacity: 0.5, marginVertical: 2 },
  sub:  { fontSize: 11, fontWeight: '400', opacity: 0.65, letterSpacing: 0.2 },

  /* Header varyantı */
  headerRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon:   { width: 36, height: 36 },
  headerTexts:  { gap: 1 },
  headerUni:    { fontSize: 10, fontWeight: '600', opacity: 0.55, letterSpacing: 1.2 },
  headerAppName:{ fontSize: 15, fontWeight: '400', letterSpacing: 0.3 },
  headerAppBold:{ fontWeight: '900' },
});
