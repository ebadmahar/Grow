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
import { MaterialIcons } from '@expo/vector-icons';

export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('F-6 / Margalla Zone, Islamabad');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Validation Error', 'Password must be at least 8 characters.');
      return;
    }
    if (!acceptedTerms) {
      Alert.alert('Terms & Privacy Required', 'Please check and accept the Terms & Conditions and Privacy Policy before continuing.');
      return;
    }

    try {
      setLoading(true);
      await register(name, email, password, location);
      navigation.navigate('InterestSelection');
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Adjustable Back Button */}
      <TouchableOpacity
        style={[styles.backBtn, { top: Math.max(insets.top + 8, 16) }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <MaterialIcons name="arrow-back" size={18} color={Colors.text2} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.registerShell,
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
          <Text style={styles.entryKicker}>JOIN THE FIELD</Text>
          <Text style={styles.entryH1}>Make every{"\n"}effort count.</Text>
          <Text style={styles.entrySub}>Set up your field profile in under a minute.</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>FULL NAME</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Your name"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>EMAIL</Text>
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
            <Text style={styles.formLabel}>CREATE PASSWORD</Text>
            <TextInput
              style={styles.formInput}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>ISLAMABAD REGION / SECTOR 📍</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. F-6, Margalla Zone, Islamabad"
              placeholderTextColor={Colors.textMuted}
              value={location}
              onChangeText={setLocation}
            />
          </View>

          {/* Interactive Checkbox */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 }}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name={acceptedTerms ? 'check-box' : 'check-box-outline-blank'}
              size={22}
              color={acceptedTerms ? Colors.ink : Colors.textMuted}
            />
            <Text style={{ flex: 1, fontSize: 12, color: Colors.text2, lineHeight: 18 }}>
              I agree to the{' '}
              <Text
                style={{ color: Colors.ink, fontWeight: '700', textDecorationLine: 'underline' }}
                onPress={() => setShowTermsModal(true)}
              >
                Terms & Conditions
              </Text>{' '}
              and{' '}
              <Text
                style={{ color: Colors.ink, fontWeight: '700', textDecorationLine: 'underline' }}
                onPress={() => setShowTermsModal(true)}
              >
                Privacy Policy
              </Text>.
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={[styles.btnPrimary, !acceptedTerms && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.btnPrimaryText}>Continue Setup</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer Link */}
        <TouchableOpacity
          style={styles.footerLink}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
        >
          <Text style={styles.footerLinkText}>
            Already registered? <Text style={styles.footerLinkSpan}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Terms & Conditions Modal */}
      <Modal visible={showTermsModal} animationType="slide" transparent={false}>
        <View style={{ flex: 1, backgroundColor: Colors.surface, padding: 20, paddingTop: Math.max(insets.top + 16, 32) }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.text1 }}>Terms & Privacy Policy</Text>
            <TouchableOpacity onPress={() => setShowTermsModal(false)}>
              <MaterialIcons name="close" size={24} color={Colors.text1} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text1, marginTop: 10 }}>1. Environmental Field Reporting</Text>
            <Text style={{ fontSize: 13, color: Colors.text2, lineHeight: 20, marginTop: 4 }}>
              By using Grōv, you agree to submit truthful data regarding tree plantation, seed dispersal, and monitoring observations. Submissions are reviewed by Field Coordinators and Admins before points and metrics are officially awarded.
            </Text>

            <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text1, marginTop: 16 }}>2. Data Privacy & Photo Uploads</Text>
            <Text style={{ fontSize: 13, color: Colors.text2, lineHeight: 20, marginTop: 4 }}>
              Photos uploaded as evidence are stored securely and used solely for ecological verification and community progress tracking. Personal credentials and contact information are protected under standard encryption.
            </Text>

            <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.text1, marginTop: 16 }}>3. Community Code of Conduct</Text>
            <Text style={{ fontSize: 13, color: Colors.text2, lineHeight: 20, marginTop: 4 }}>
              Restorers are expected to maintain respectful communication in community drives. Fraudulent submissions or spam reports will result in account suspension.
            </Text>

            <TouchableOpacity
              style={{ backgroundColor: Colors.ink, height: 48, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginTop: 24, marginBottom: 24 }}
              onPress={() => {
                setAcceptedTerms(true);
                setShowTermsModal(false);
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Accept Terms & Close</Text>
            </TouchableOpacity>
          </ScrollView>
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
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  registerShell: {
    paddingHorizontal: 20,
    gap: 24,
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
  termsText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    color: '#6B8A68',
    fontWeight: '600',
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
