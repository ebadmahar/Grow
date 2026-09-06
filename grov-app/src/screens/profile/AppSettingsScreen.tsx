import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';

export const AppSettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout, refreshProfile } = useAuth();

  // Profile Edit State
  const [name, setName] = useState(user?.name || '');
  const [location, setLocation] = useState(user?.location || 'Islamabad, Pakistan');
  const [bio, setBio] = useState(user?.bio || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Settings Toggles State
  const [reminders, setReminders] = useState(user?.settings_json?.monitoring_reminders ?? true);
  const [goalUpdates, setGoalUpdates] = useState(user?.settings_json?.goal_progress ?? true);
  const [taskAlerts, setTaskAlerts] = useState(user?.settings_json?.community_tasks ?? true);
  const [highAccuracyGps, setHighAccuracyGps] = useState(user?.settings_json?.high_accuracy_gps ?? true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleUploadAvatar = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      let result;
      if (perm.granted) {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const camPerm = await ImagePicker.requestCameraPermissionsAsync();
        if (!camPerm.granted) {
          Alert.alert('Permission Required', 'Permission needed to upload avatar photo.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      }

      if (result && !result.canceled && result.assets[0]?.uri) {
        setUploadingAvatar(true);
        const res = await userApi.uploadAvatar(result.assets[0].uri);
        if (res.success) {
          await refreshProfile();
          Alert.alert('Profile Picture Updated!', 'Your avatar has been updated successfully.');
        }
      }
    } catch (e: any) {
      console.warn('Avatar upload error', e);
      Alert.alert('Upload Failed', e.message || 'Could not update profile picture.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }
    try {
      setSavingProfile(true);
      const res = await userApi.updateProfile({
        name,
        location,
        bio,
      });
      if (res.success) {
        await refreshProfile();
        Alert.alert('Profile Updated', 'Your personal details have been updated successfully.');
      }
    } catch (e: any) {
      Alert.alert('Update Failed', e.message || 'Failed to update profile details');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleToggle = async (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    try {
      await userApi.updateSettings({ [key]: value });
    } catch (e) {
      console.warn('Settings update error', e);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'Are you sure? This action will permanently remove your account data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Account',
        style: 'destructive',
        onPress: async () => {
          try {
            await userApi.deleteAccount();
            await logout();
            navigation.replace('Welcome');
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to delete account');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="Account & App Settings" showBack onBack={() => navigation.goBack()} showNotification={false} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Member Profile Details Editor */}
        <Text style={styles.sectionTitle}>Edit Profile Details</Text>
        <Card style={styles.profileEditCard}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>FULL NAME</Text>
            <TextInput
              style={styles.formInput}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>ISLAMABAD REGION / SECTOR 📍</Text>
            <TextInput
              style={styles.formInput}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. F-6 / Margalla Zone, Islamabad"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>BIO / FIELD EXPERIENCE</Text>
            <TextInput
              style={[styles.formInput, { height: 70, textAlignVertical: 'top' }]}
              value={bio}
              onChangeText={setBio}
              multiline
              placeholder="Brief bio or conservation interest..."
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveProfileBtn, { backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 4 }]}
            onPress={handleUploadAvatar}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? (
              <ActivityIndicator color={Colors.ink} size="small" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialIcons name="add-a-photo" size={16} color={Colors.ink} />
                <Text style={[styles.saveProfileBtnText, { color: Colors.ink }]}>Upload New Profile Picture</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveProfileBtn}
            onPress={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialIcons name="check-circle" size={16} color="#FFFFFF" />
                <Text style={styles.saveProfileBtnText}>Save Profile Details</Text>
              </View>
            )}
          </TouchableOpacity>
        </Card>

        {/* Push Notifications & Reminders */}
        <Text style={styles.sectionTitle}>Push Notifications & Reminders</Text>

        <Card>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Monitoring Reminders</Text>
              <Text style={styles.settingSub}>Alert when sapling observation is due</Text>
            </View>
            <Switch
              value={reminders}
              onValueChange={(val) => handleToggle('monitoring_reminders', val, setReminders)}
              trackColor={{ false: Colors.surface2, true: Colors.lime }}
              thumbColor={Colors.ink}
            />
          </View>
        </Card>

        <Card>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Monthly Goal Progress</Text>
              <Text style={styles.settingSub}>Weekly community target updates</Text>
            </View>
            <Switch
              value={goalUpdates}
              onValueChange={(val) => handleToggle('goal_progress', val, setGoalUpdates)}
              trackColor={{ false: Colors.surface2, true: Colors.lime }}
              thumbColor={Colors.ink}
            />
          </View>
        </Card>

        <Card>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Community Task Invites</Text>
              <Text style={styles.settingSub}>Notifications for drives nearby</Text>
            </View>
            <Switch
              value={taskAlerts}
              onValueChange={(val) => handleToggle('community_tasks', val, setTaskAlerts)}
              trackColor={{ false: Colors.surface2, true: Colors.lime }}
              thumbColor={Colors.ink}
            />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Location & Performance</Text>

        <Card>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>High-Accuracy GPS Tracking</Text>
              <Text style={styles.settingSub}>Use fine GPS coordinates for site mapping</Text>
            </View>
            <Switch
              value={highAccuracyGps}
              onValueChange={(val) => handleToggle('high_accuracy_gps', val, setHighAccuracyGps)}
              trackColor={{ false: Colors.surface2, true: Colors.lime }}
              thumbColor={Colors.ink}
            />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <Button title="Permanently Delete Account" onPress={handleDeleteAccount} variant="danger" size="md" style={{ marginTop: 8 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 90, gap: 8 },
  sectionTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.heavy, color: Colors.text1, marginTop: 12, marginBottom: 4 },
  profileEditCard: { gap: 12, marginBottom: 8 },
  formGroup: { gap: 4 },
  formLabel: { fontSize: 10, fontWeight: '700', color: Colors.text3, letterSpacing: 0.5 },
  formInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: Typography.sizes.sm,
    color: Colors.text1,
  },
  saveProfileBtn: {
    backgroundColor: Colors.ink,
    borderRadius: Radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveProfileBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.text1 },
  settingSub: { fontSize: Typography.sizes.xs, color: Colors.text2, marginTop: 2 },
});
