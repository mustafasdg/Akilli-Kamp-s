import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColors } from '../context/ThemeContext';
import { AppRootParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<AppRootParamList>;

/**
 * Dashboard'larda sağ-altta sabit duran, AI Kampüs Asistanını açan FAB.
 * `bottom` ile tab bar / safe-area'ya göre dikey konum ayarlanır.
 */
export default function AiAssistantFab({ bottom = 24 }: { bottom?: number }) {
  const c = useColors();
  const navigation = useNavigation<Nav>();

  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: c.primary, bottom }]}
      onPress={() => navigation.navigate('AiAssistant')}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Kampüs Asistanı"
    >
      <Ionicons name="sparkles" size={24} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
});
