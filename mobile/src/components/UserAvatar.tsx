import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getInitials, stringToColor } from '../utils/avatarUtils';

interface Props {
  name: string;
  size?: number;
  fontSize?: number;
  backgroundColor?: string;
}

export default function UserAvatar({ name, size = 44, fontSize, backgroundColor }: Props) {
  const bg = backgroundColor ?? stringToColor(name);
  const fs = fontSize ?? Math.round(size * 0.36);
  const radius = size / 2;

  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: radius, backgroundColor: bg },
      ]}
    >
      <Text style={[styles.text, { fontSize: fs }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
});
