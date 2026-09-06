import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  icon,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textMuted}
          {...props}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text2,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  iconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text1,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: Typography.sizes.xs,
    color: Colors.danger,
    marginTop: 4,
    fontWeight: Typography.weights.medium,
  },
});
