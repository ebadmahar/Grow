import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';

interface BadgeProps {
  label: string;
  variant?: 'lime' | 'dark' | 'success' | 'warning' | 'info' | 'muted';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'lime', style, textStyle }) => {
  const getBadgeStyle = (): ViewStyle => {
    switch (variant) {
      case 'lime':
        return { backgroundColor: Colors.limeSubtle, borderColor: Colors.limeBorder };
      case 'dark':
        return { backgroundColor: Colors.ink, borderColor: Colors.inkSoft };
      case 'success':
        return { backgroundColor: 'rgba(39, 174, 96, 0.12)', borderColor: 'rgba(39, 174, 96, 0.3)' };
      case 'warning':
        return { backgroundColor: 'rgba(245, 166, 35, 0.12)', borderColor: 'rgba(245, 166, 35, 0.3)' };
      case 'info':
        return { backgroundColor: 'rgba(47, 128, 237, 0.12)', borderColor: 'rgba(47, 128, 237, 0.3)' };
      case 'muted':
      default:
        return { backgroundColor: Colors.surface2, borderColor: Colors.cardBorder };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'lime':
        return { color: Colors.text1 };
      case 'dark':
        return { color: Colors.lime };
      case 'success':
        return { color: Colors.success };
      case 'warning':
        return { color: Colors.warning };
      case 'info':
        return { color: Colors.info };
      case 'muted':
      default:
        return { color: Colors.text2 };
    }
  };

  return (
    <View style={[styles.badge, getBadgeStyle(), style]}>
      <Text style={[styles.text, getTextStyle(), textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    letterSpacing: -0.2,
  },
});
