import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Colors, Typography } from '../../theme';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { authApi } from '../../api/authApi';
import { MaterialIcons } from '@expo/vector-icons';

export const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Validation Error', 'Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.forgotPassword({ email });
      Alert.alert('Recovery Link Sent', res.message || 'Check your inbox for password reset instructions.', [
        { text: 'Back to Login', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send recovery link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={20} color={Colors.text2} />
      </TouchableOpacity>

      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter your registered email address to receive a recovery link</Text>

      <View style={styles.form}>
        <Input
          label="Email Address"
          placeholder="name@grov.app"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          icon={<MaterialIcons name="email" size={20} color={Colors.textMuted} />}
        />

        <Button
          title="Send Recovery Link"
          onPress={handleReset}
          loading={loading}
          size="lg"
          style={styles.submitBtn}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.heavy,
    color: Colors.text1,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.text2,
    marginTop: 6,
    marginBottom: 24,
  },
  form: {
    marginTop: 10,
  },
  submitBtn: {
    marginTop: 16,
  },
});
