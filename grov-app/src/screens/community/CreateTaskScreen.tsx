import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { communityApi } from '../../api/communityApi';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';

export const CreateTaskScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [activityType, setActivityType] = useState('Tree Plantation');
  const [siteName, setSiteName] = useState('Margalla Trail 3');
  const [latitude, setLatitude] = useState('33.7381');
  const [longitude, setLongitude] = useState('73.0650');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('07:00:00');
  const [maxVolunteers, setMaxVolunteers] = useState('30');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePickCover = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]?.uri) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title || !siteName || !date || !startTime || !description) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await communityApi.createTask({
        title,
        activity_type: activityType,
        site_name: siteName,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        date,
        start_time: startTime,
        max_volunteers: parseInt(maxVolunteers, 10),
        description,
        cover_image: coverImage || undefined,
      });

      if (res.success) {
        Alert.alert('Success', 'Community restoration drive organized!', [
          { text: 'View Drive', onPress: () => navigation.replace('TaskDetails', { id: res.data.id }) },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create community task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Organize Community Drive" showBack onBack={() => navigation.goBack()} showNotification={false} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Input label="Drive Title" placeholder="Margalla Trail Plantation" value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Drive Activity Type</Text>
        <View style={styles.typeRow}>
          {['Tree Plantation', 'Seed Bombing', 'Monitoring Visit', 'Site Survey'].map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.typeChip, activityType === item ? styles.typeActive : null]}
              onPress={() => setActivityType(item)}
            >
              <Text style={[styles.typeText, activityType === item ? styles.typeTextActive : null]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input label="Site Location Name" value={siteName} onChangeText={setSiteName} />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Input label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Start Time (HH:MM:SS)" value={startTime} onChangeText={setStartTime} />
          </View>
        </View>

        <Input label="Volunteer Capacity Limit" value={maxVolunteers} onChangeText={setMaxVolunteers} keyboardType="numeric" />

        <Input
          label="Drive Description & Instructions"
          placeholder="Meeting point, tools to bring, refreshment arrangements..."
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
          style={{ height: 90, textAlignVertical: 'top' }}
        />

        <Button title="Publish Drive Event" onPress={handleSubmit} loading={loading} size="lg" style={styles.submitBtn} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 90 },
  label: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.text2, marginBottom: 8 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder },
  typeActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  typeText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.text2 },
  typeTextActive: { color: Colors.lime },
  row: { flexDirection: 'row', gap: 12 },
  submitBtn: { marginTop: 16 },
});
