import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { reportApi } from '../../api/reportApi';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';

export const ReportActivityScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [siteName, setSiteName] = useState('Margalla Hills Zone 2');
  const [category, setCategory] = useState('Pest / Disease');
  const [severity, setSeverity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePickPhoto = async () => {
    if (photos.length >= 5) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]?.uri) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const handleSubmit = async () => {
    if (!siteName || !description) {
      Alert.alert('Validation Error', 'Please enter site name and description.');
      return;
    }

    try {
      setLoading(true);
      const res = await reportApi.submitReport({
        site_name: siteName,
        category,
        severity,
        description,
        photos,
      });

      if (res.success) {
        Alert.alert('Report Submitted', 'Environmental threat report submitted for admin verification.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Report Ecological Threat" showBack onBack={() => navigation.goBack()} showNotification={false} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Input label="Affected Site Location" value={siteName} onChangeText={setSiteName} />

        <Text style={styles.label}>Threat Category</Text>
        <View style={styles.chipGrid}>
          {['Pest / Disease', 'Fire Risk', 'Illegal Dumping', 'Illegal Cutting', 'Flooding / Erosion', 'Other'].map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, category === item ? styles.chipActive : null]}
              onPress={() => setCategory(item)}
            >
              <Text style={[styles.chipText, category === item ? styles.chipTextActive : null]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Severity Level</Text>
        <View style={styles.severityRow}>
          {(['Low', 'Medium', 'High'] as const).map((sev) => (
            <TouchableOpacity
              key={sev}
              style={[styles.sevBtn, severity === sev ? styles.sevActive : null]}
              onPress={() => setSeverity(sev)}
            >
              <Text style={[styles.sevText, severity === sev ? styles.sevTextActive : null]}>{sev}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Detailed Threat Description"
          placeholder="Describe symptoms, scale of damage, immediate risks..."
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
          style={{ height: 90, textAlignVertical: 'top' }}
        />

        <Text style={styles.label}>Photo Evidence</Text>
        <View style={styles.photoContainer}>
          {photos.map((uri, idx) => (
            <Image key={idx} source={{ uri }} style={styles.photoThumb} />
          ))}
          {photos.length < 5 ? (
            <TouchableOpacity style={styles.addPhotoBtn} onPress={handlePickPhoto}>
              <MaterialIcons name="camera-alt" size={24} color={Colors.lime} />
            </TouchableOpacity>
          ) : null}
        </View>

        <Button title="Submit Environmental Report" onPress={handleSubmit} loading={loading} size="lg" style={styles.submitBtn} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 90 },
  label: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.text2, marginBottom: 8 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder },
  chipActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  chipText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.text2 },
  chipTextActive: { color: Colors.lime },
  severityRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  sevBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center' },
  sevActive: { backgroundColor: Colors.danger, borderColor: Colors.danger },
  sevText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.text2 },
  sevTextActive: { color: Colors.card },
  photoContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  photoThumb: { width: 64, height: 64, borderRadius: Radius.md },
  addPhotoBtn: { width: 64, height: 64, borderRadius: Radius.md, backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  submitBtn: { marginTop: 16 },
});
