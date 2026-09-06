import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';

export const ProfileSetupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [location, setLocation] = useState(user?.location || 'Islamabad, Pakistan');
  const [bio, setBio] = useState(user?.bio || '');
  const [role, setRole] = useState<'volunteer' | 'coordinator'>(user?.role === 'coordinator' ? 'coordinator' : 'volunteer');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar_path || null);
  const [loading, setLoading] = useState(false);

  const handlePickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Gallery permission is needed to select an avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleCompleteSetup = async () => {
    try {
      setLoading(true);

      if (avatarUri && !avatarUri.startsWith('http')) {
        await userApi.uploadAvatar(avatarUri);
      }

      const res = await userApi.updateProfile({
        location,
        bio,
        role,
      });

      if (res.success) {
        updateUser(res.data);
        navigation.replace('MainApp');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to complete profile setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Complete Profile</Text>
      <Text style={styles.subtitle}>Set your restoration role, region, and profile picture</Text>

      <View style={styles.avatarSection}>
        <TouchableOpacity style={styles.avatarPicker} onPress={handlePickAvatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
          ) : (
            <MaterialIcons name="camera-alt" size={28} color={Colors.lime} />
          )}
        </TouchableOpacity>
        <Text style={styles.avatarLabel}>Tap to upload avatar</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.roleLabel}>Select Restoration Role</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleCard, role === 'volunteer' ? styles.roleCardActive : null]}
            onPress={() => setRole('volunteer')}
          >
            <MaterialIcons name="eco" size={24} color={role === 'volunteer' ? Colors.ink : Colors.text3} />
            <Text style={[styles.roleTitle, role === 'volunteer' ? styles.roleTitleActive : null]}>Field Volunteer</Text>
            <Text style={styles.roleSub}>Participate in drives & log activities</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, role === 'coordinator' ? styles.roleCardActive : null]}
            onPress={() => setRole('coordinator')}
          >
            <MaterialIcons name="groups" size={24} color={role === 'coordinator' ? Colors.ink : Colors.text3} />
            <Text style={[styles.roleTitle, role === 'coordinator' ? styles.roleTitleActive : null]}>Field Lead</Text>
            <Text style={styles.roleSub}>Organize tasks & verify submissions</Text>
          </TouchableOpacity>
        </View>

        <Input
          label="Primary Region / City"
          placeholder="Islamabad, Pakistan"
          value={location}
          onChangeText={setLocation}
          icon={<MaterialIcons name="location-on" size={20} color={Colors.textMuted} />}
        />

        <Input
          label="Restorer Bio"
          placeholder="Tell community members about your ecology background..."
          multiline
          numberOfLines={3}
          value={bio}
          onChangeText={setBio}
          style={{ height: 80, textAlignVertical: 'top' }}
        />

        <Button
          title="Finish Setup"
          onPress={handleCompleteSetup}
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
  avatarSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  avatarPicker: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.lime,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.text3,
    marginTop: 8,
  },
  form: {
    marginTop: 16,
  },
  roleLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text2,
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  roleCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.lg,
    padding: 14,
  },
  roleCardActive: {
    backgroundColor: Colors.lime,
    borderColor: Colors.lime,
  },
  roleTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text1,
    marginTop: 8,
  },
  roleTitleActive: {
    color: Colors.ink,
  },
  roleSub: {
    fontSize: 10,
    color: Colors.text3,
    marginTop: 2,
  },
  submitBtn: {
    marginTop: 20,
  },
});
