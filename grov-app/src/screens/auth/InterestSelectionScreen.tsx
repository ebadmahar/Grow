import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';
import { Button } from '../../components/common/Button';
import { userApi } from '../../api/userApi';
import { Interest } from '../../types/models';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * InterestSelectionScreen
 *
 * Used in two contexts:
 *  1. Onboarding (after Register) → returnTo is NOT set → go to ProfileSetup
 *  2. Profile edit (from UserProfileScreen) → returnTo = 'back' → go back
 *
 * Pass { returnTo: 'back' } in route.params when navigating from Profile:
 *   navigation.navigate('InterestSelection', { returnTo: 'back' })
 */
export const InterestSelectionScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Determine context — onboarding vs profile edit
  const isProfileEdit = route?.params?.returnTo === 'back';

  useEffect(() => {
    fetchInterests();
  }, []);

  const fetchInterests = async () => {
    try {
      setLoading(true);
      const res = await userApi.getInterests();
      if (res.success) {
        setInterests(res.data.interests);
        setSelectedIds(res.data.selected_ids || []);
      }
    } catch (err: any) {
      console.warn('Failed to load interests', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await userApi.updateInterests(selectedIds);

      if (isProfileEdit) {
        // Return to whichever screen called us (Profile)
        navigation.goBack();
      } else {
        // Onboarding flow — continue to profile setup
        navigation.navigate('ProfileSetup');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update interests');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Back button shown only in profile-edit mode */}
      {isProfileEdit && (
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.text1} />
        </TouchableOpacity>
      )}

      <Text style={styles.title}>
        {isProfileEdit ? 'My Interests' : 'What drive interests you?'}
      </Text>
      <Text style={styles.subtitle}>
        {isProfileEdit
          ? 'Update the ecological activity areas you are interested in'
          : 'Select the ecological activity areas you want to participate in'}
      </Text>

      {loading ? (
        <ActivityIndicator color={Colors.lime} size="large" style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.chipsContainer}>
          {interests.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.chip, isSelected ? styles.chipSelected : null]}
                onPress={() => toggleInterest(item.id)}
                activeOpacity={0.8}
              >
                <MaterialIcons
                  name={isSelected ? 'check-circle' : 'add-circle-outline'}
                  size={18}
                  color={isSelected ? Colors.ink : Colors.text3}
                />
                <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : null]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Button
        title={isProfileEdit ? 'Save Interests' : 'Continue to Profile Setup'}
        onPress={handleSave}
        loading={saving}
        size="lg"
        style={styles.submitBtn}
      />
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
    marginBottom: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
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
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 8,
  },
  chipSelected: {
    backgroundColor: Colors.lime,
    borderColor: Colors.lime,
  },
  chipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text2,
  },
  chipTextSelected: {
    color: Colors.ink,
  },
  submitBtn: {
    marginTop: 32,
  },
});
