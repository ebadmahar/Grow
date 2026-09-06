import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'dark' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const getContainerStyle = (): ViewStyle => {
    let base: ViewStyle = styles.base;

    if (size === 'sm') base = { ...base, paddingVertical: 8, paddingHorizontal: 14, borderRadius: Radius.md };
    if (size === 'lg') base = { ...base, paddingVertical: 16, paddingHorizontal: 24, borderRadius: Radius.pill };

    switch (variant) {
      case 'primary':
        return { ...base, backgroundColor: Colors.lime };
      case 'dark':
        return { ...base, backgroundColor: Colors.ink };
      case 'secondary':
        return { ...base, backgroundColor: Colors.surface2 };
      case 'outline':
        return { ...base, backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.cardBorder };
      case 'danger':
        return { ...base, backgroundColor: Colors.danger };
      default:
        return { ...base, backgroundColor: Colors.lime };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
        return styles.textPrimary;
      case 'dark':
        return styles.textDark;
      case 'secondary':
      case 'outline':
        return styles.textSecondary;
      case 'danger':
        return styles.textDark;
      default:
        return styles.textPrimary;
    }
  };

  return (
    <TouchableOpacity
      style={[
        getContainerStyle(),
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.ink : Colors.card} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyle(), textStyle, icon ? { marginLeft: 8 } : null]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  textPrimary: {
    color: Colors.ink,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.heavy,
    letterSpacing: -0.3,
  },
  textDark: {
    color: Colors.card,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    letterSpacing: -0.3,
  },
  textSecondary: {
    color: Colors.text1,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.bold,
    letterSpacing: -0.3,
  },
});
