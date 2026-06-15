import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DailyMenu } from '../types/Menu';
import { useColors } from '../context/ThemeContext';

interface Props {
  menu: DailyMenu;
}

export default function MenuCard({ menu }: Props) {
  const c = useColors();
  const s = useMemo(() => makeStyles(c), [c]);

  const dateStr = new Date(menu.date).toLocaleDateString('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <View style={s.card}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Ionicons name="restaurant" size={18} color="#fff" />
          <Text style={s.headerTitle}>Bugünün Menüsü</Text>
        </View>
        {!menu.isClosed && (
          <View style={s.caloriePill}>
            <Ionicons name="flame" size={13} color={c.primary} />
            <Text style={s.calorieText}>{menu.totalCalories} kcal</Text>
          </View>
        )}
      </View>

      <View style={s.dateRow}>
        <Ionicons name="calendar-outline" size={14} color={c.primary} />
        <Text style={s.dateText}>{dateStr}</Text>
      </View>

      {menu.isClosed ? (
        <View style={s.closedBody}>
          <View style={s.closedIconCircle}>
            <Ionicons name="cafe-outline" size={28} color={c.warning} />
          </View>
          <Text style={s.closedTitle}>Tatil</Text>
          {menu.closingMessage ? (
            <Text style={s.closedMessage}>{menu.closingMessage}</Text>
          ) : null}
        </View>
      ) : (
        <View style={s.itemList}>
          {menu.items.map((item, index) => (
            <View
              key={item.id}
              style={[s.itemRow, index === menu.items.length - 1 && s.itemRowLast]}
            >
              <View style={s.categoryBadge}>
                <Text style={s.categoryText}>{item.category}</Text>
              </View>
              <Text style={s.itemName}>{item.name}</Text>
              <Text style={s.itemCal}>{item.calories} kcal</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const makeStyles = (c: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: c.primary,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: c.primary,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
    caloriePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#fff',
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    calorieText: { fontSize: 13, fontWeight: '700', color: c.primary },

    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    dateText: { fontSize: 13, fontWeight: '600', color: c.primary },

    itemList: {},
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 11,
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    itemRowLast: { borderBottomWidth: 0 },
    categoryBadge: {
      backgroundColor: c.primaryLight,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
      minWidth: 82,
      alignItems: 'center',
    },
    categoryText: { fontSize: 11, fontWeight: '700', color: c.primary },
    itemName: { flex: 1, fontSize: 14, fontWeight: '500', color: c.text },
    itemCal: { fontSize: 12, color: c.textMuted },

    // ─── Kapalı (tatil) durumu ──────────────────────────────────────────────
    closedBody: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
      paddingHorizontal: 24,
      gap: 10,
    },
    closedIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: c.warningLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    closedTitle: { fontSize: 20, fontWeight: '800', color: c.warning, letterSpacing: 0.5 },
    closedMessage: { fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 20 },
  });
