import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius } from '../../theme';
import { GrovMark } from '../../components/common/GrovMark';
import { useAuth } from '../../context/AuthContext';
import { getCustomBackendUrl, setCustomBackendUrl } from '../../api/client';
import { MaterialIcons } from '@expo/vector-icons';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@grov.app');
  const [password, setPassword] = useState('password');
  const [totpCode, setTotpCode] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [loading, setLoading] = useState(false);

  // Server Settings Modal State
  const [showServerModal, setShowServerModal] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState('');
  const [testingServer, setTestingServer] = useState(false);

  const openServerSettings = async () => {
    const current = await getCustomBackendUrl();
    setServerUrlInput(current);
    setShowServerModal(true);
  };

  const handleTestAndSaveServer = async () => {
    if (!serverUrlInput.trim()) {
      Alert.alert('Validation Error', 'Please enter a server IP or URL.');
      return;
    }
    try {
      setTestingServer(true);
      let target = serverUrlInput.trim();
      if (!target.startsWith('http://') && !target.startsWith('https://')) {
        target = `http://${target}`;
      }
      if (!target.endsWith('/api/v1')) {
        target = target.replace(/\/+$/, '') + '/api/v1';
      }
      const pingRes = await fetch(`${target}/ping`);
      if (pingRes.ok) {
        await setCustomBackendUrl(target);
        setShowServerModal(false);
        Alert.alert('Success', `Backend server connected successfully at:\n${target}`);
      } else {
        Alert.alert('Connection Failed', `Server returned HTTP ${pingRes.status}`);
      }
    } catch (e: any) {
      Alert.alert(
        'Connection Error',
        `Could not reach ${serverUrlInput}.\n\nEnsure your device is connected to the same Wi-Fi as your computer and port 8000 is open.`
      );
    } finally {
      setTestingServer(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await login(email, password, show2FA ? totpCode : undefined);

      if (res && res.requires_2fa) {
        setShow2FA(true);
        Alert.alert('2FA Security Check', 'Admin account detected. Enter 6-digit Google Authenticator OTP code.');
        return;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: 'MainApp' }],
      });
    } catch (err: any) {
      Alert.alert('Authentication Failed', err.message || 'Invalid password or email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Adjustable Back & Server Settings Buttons */}
      <View style={[styles.topBar, { top: Math.max(insets.top + 8, 16) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <MaterialIcons name="arrow-back" size={18} color={Colors.text2} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.serverBtn}
          onPress={openServerSettings}
          activeOpacity={0.8}
        >
          <MaterialIcons name="settings" size={18} color={Colors.text2} />
          <Text style={styles.serverBtnText}>Server IP</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.loginShell,
          {
            paddingTop: Math.max(insets.top + 52, 60),
            paddingBottom: Math.max(insets.bottom + 24, 32),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Block */}
        <View style={styles.headerBlock}>
          <View style={styles.entryMark}>
            <GrovMark size={24} color={Colors.lime} strokeWidth={2} />
          </View>
          <Text style={styles.entryKicker}>FIELD SPACE</Text>
          <Text style={styles.entryH1}>Good to{"\n"}see you.</Text>
          <Text style={styles.entrySub}>Pick up where your restoration work left off.</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.formInput}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.formGroup}>
            <View style={styles.forgotRow}>
              <Text style={styles.formLabel}>PASSWORD</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotLink}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.formInput}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Google Authenticator 2FA Input Step for Admin */}
          {show2FA && (
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>GOOGLE AUTHENTICATOR (6-DIGIT 2FA CODE)</Text>
              <TextInput
                style={[styles.formInput, { borderColor: Colors.lime, backgroundColor: '#FAFDF6' }]}
                placeholder="123456"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                maxLength={6}
                value={totpCode}
                onChangeText={setTotpCode}
              />
            </View>
          )}

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.btnPrimaryText}>
                {show2FA ? 'Verify 2FA & Sign In' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Link */}
        <TouchableOpacity
          style={styles.footerLink}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.8}
        >
          <Text style={styles.footerLinkText}>
            Don't have an account? <Text style={styles.footerLinkSpan}>Register</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Server IP Settings Modal */}
      <Modal
        visible={showServerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowServerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <MaterialIcons name="dns" size={24} color={Colors.lime} />
              <Text style={styles.modalTitle}>Server Backend IP</Text>
            </View>
            <Text style={styles.modalSub}>
              Enter your local computer IP address (e.g. 192.168.1.10) running the Laravel PHP server.
            </Text>
            
            <TextInput
              style={styles.modalInput}
              value={serverUrlInput}
              onChangeText={setServerUrlInput}
              placeholder="http://192.168.1.10:8000/api/v1"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowServerModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleTestAndSaveServer}
                disabled={testingServer}
              >
                {testingServer ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>Test & Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    position: 'relative',
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  serverBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 21, 18, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text1,
  },
  modalSub: {
    fontSize: 13,
    color: Colors.text2,
    lineHeight: 18,
  },
  modalInput: {
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    fontSize: 13,
    color: Colors.text1,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text2,
  },
  modalSaveBtn: {
    backgroundColor: Colors.ink,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.sm,
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.lime,
  },
  scroll: {
    flex: 1,
  },
  loginShell: {
    paddingHorizontal: 20,
    gap: 28,
  },
  headerBlock: {
    gap: 10,
  },
  entryMark: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  entryKicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: '#6B8A68',
    textTransform: 'uppercase',
  },
  entryH1: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1.4,
    lineHeight: 38,
    color: Colors.text1,
  },
  entrySub: {
    fontSize: 14,
    color: '#6B8A68',
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text2,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  forgotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  forgotLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B8A68',
  },
  formInput: {
    width: '100%',
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    fontSize: 14,
    color: Colors.text1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: 2,
  },
  btnPrimary: {
    backgroundColor: Colors.ink,
    borderRadius: Radius.sm,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  footerLink: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  footerLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B8A68',
  },
  footerLinkSpan: {
    color: Colors.text1,
    fontWeight: '700',
  },
});
