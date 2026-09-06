import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors, Radius, Shadows } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[] | null;
  onPress?: () => void;
  variant?: 'default' | 'lime' | 'dark' | 'glass';
}

export const Card: React.FC<CardProps> = ({ children, style, onPress, variant = 'default' }) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'lime':
        return { backgroundColor: Colors.limeSubtle, borderColor: Colors.limeBorder };
      case 'dark':
        return { backgroundColor: Colors.ink, borderColor: 'rgba(255,255,255,0.08)' };
      case 'glass':
        return { backgroundColor: 'rgba(255,255,255,0.85)', borderColor: Colors.cardBorder };
      default:
        return { backgroundColor: Colors.card, borderColor: Colors.cardBorder };
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.card, getVariantStyle(), style]}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, getVariantStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    ...Shadows.sm,
  },
});
