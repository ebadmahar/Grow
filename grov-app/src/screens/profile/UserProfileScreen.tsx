import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Radius, Typography } from '../../theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { userApi } from '../../api/userApi';
import { resolveImageUrl } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { UserProfileResponseData } from '../../types/api';
import { MaterialIcons } from '@expo/vector-icons';

export const UserProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, logout, refreshProfile } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileResponseData | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    try {
      setRefreshing(true);
      const res = await userApi.getProfile();
      if (res.success) setProfileData(res.data);
    } catch (e) {
      console.warn('Profile fetch error', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

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

  const performLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn('Logout error', e);
    } finally {
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
      }
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out of Grōv?');
      if (confirmed) {
        performLogout();
      }
    } else {
      Alert.alert('Sign Out', 'Are you sure you want to sign out of Grōv?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: performLogout,
        },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Member Profile" showNotification={false} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 90, 100) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchProfile} tintColor={Colors.lime} />}
      >
        {/* Profile Card Header */}
        <Card variant="lime" style={styles.profileCard}>
          <View style={styles.profileHeaderRow}>
            <TouchableOpacity style={styles.avatarCircle} onPress={handleUploadAvatar} activeOpacity={0.8}>
              {user?.avatar_path ? (
                <Image source={{ uri: resolveImageUrl(user.avatar_path) }} style={styles.avatarImg} />
              ) : (
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80' }}
                  style={styles.avatarImg}
                />
              )}
              {uploadingAvatar ? (
                <View style={styles.avatarCameraBadge}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              ) : (
                <View style={styles.avatarCameraBadge}>
                  <MaterialIcons name="photo-camera" size={12} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={styles.nameText}>{user?.name}</Text>
              <Text style={styles.emailText}>{user?.location || 'Islamabad, Pakistan'}</Text>
              <View style={{ marginTop: 6, flexDirection: 'row' }}>
                <Badge
                  label={
                    user?.role === 'admin'
                      ? 'Admin Lead'
                      : user?.role === 'coordinator'
                      ? 'Field Coordinator'
                      : 'Volunteer'
                  }
                  variant="dark"
                />
              </View>
            </View>
          </View>

          {user?.bio ? <Text style={styles.bioText}>{user.bio}</Text> : null}
        </Card>

        {/* Stats Summary Row */}
        <View style={styles.statsRow}>
          <Card style={styles.statBox}>
            <Text style={styles.statVal}>
              {profileData?.stats.total_planted !== undefined && profileData?.stats.total_planted !== null ? profileData.stats.total_planted.toLocaleString() : '0'}
            </Text>
            <Text style={styles.statLabel}>Planted</Text>
          </Card>

          <Card style={styles.statBox}>
            <Text style={styles.statVal}>{profileData?.stats.total_activities ?? 0}</Text>
            <Text style={styles.statLabel}>Activities</Text>
          </Card>

          <Card style={styles.statBox}>
            <Text style={styles.statVal}>{profileData?.stats.rank ? profileData.stats.rank : '-'}</Text>
            <Text style={styles.statLabel}>Regional Rank</Text>
          </Card>
        </View>

        {/* Admin / Coordinator Panel Card */}
        {(user?.role === 'admin' || user?.role === 'coordinator') && (
          <Card onPress={() => navigation.navigate('AdminDashboard')} style={{ backgroundColor: Colors.ink }}>
            <View style={styles.menuRow}>
              <MaterialIcons name="admin-panel-settings" size={20} color={Colors.lime} />
              <Text style={[styles.menuText, { color: '#FFFFFF' }]}>Admin Moderation Panel</Text>
              <MaterialIcons name="chevron-right" size={20} color={Colors.lime} />
            </View>
          </Card>
        )}

        <Card onPress={() => navigation.navigate('AppSettings')}>
          <View style={styles.menuRow}>
            <MaterialIcons name="settings" size={20} color={Colors.ink} />
            <Text style={styles.menuText}>App Settings & Preferences</Text>
            <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
          </View>
        </Card>

        <Card onPress={() => navigation.navigate('InterestSelection', { returnTo: 'back' })}>

          <View style={styles.menuRow}>
            <MaterialIcons name="local-offer" size={20} color={Colors.ink} />
            <Text style={styles.menuText}>Ecological Interests</Text>
            <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
          </View>
        </Card>

        <Card onPress={() => navigation.navigate('Leaderboard')}>
          <View style={styles.menuRow}>
            <MaterialIcons name="emoji-events" size={20} color={Colors.lime} />
            <Text style={styles.menuText}>Regional Leaderboard & Points</Text>
            <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
          </View>
        </Card>

        <Card onPress={() => navigation.navigate('MyActivities')}>
          <View style={styles.menuRow}>
            <MaterialIcons name="history" size={20} color={Colors.ink} />
            <Text style={styles.menuText}>My Activity History</Text>
            <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
          </View>
        </Card>

        <Button
          title="Sign Out of Grōv"
          onPress={handleLogout}
          variant="outline"
          size="lg"
          style={styles.logoutBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 10 },
  profileCard: { marginBottom: 6 },
  profileHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: Colors.ink,
    overflow: 'hidden',
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: 'rgba(15, 21, 18, 0.75)',
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%' },
  nameText: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.heavy, color: Colors.text1 },
  emailText: { fontSize: Typography.sizes.xs, color: Colors.text2, marginTop: 2 },
  bioText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text1,
    marginTop: 12,
    lineHeight: 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.limeBorder,
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statVal: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.heavy, color: Colors.text1 },
  statLabel: { fontSize: 10, fontWeight: Typography.weights.bold, color: Colors.text3, marginTop: 2 },
  sectionTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.heavy, color: Colors.text1, marginTop: 6, marginBottom: 4 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuText: { flex: 1, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.text1 },
  logoutBtn: { marginTop: 16 },
});
