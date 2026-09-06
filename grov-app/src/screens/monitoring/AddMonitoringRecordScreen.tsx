import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { monitoringApi } from '../../api/monitoringApi';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';

export const AddMonitoringRecordScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { activityId } = route.params;
  const [observed, setObserved] = useState('96');
  const [established, setEstablished] = useState('82');
  const [surviving, setSurviving] = useState('78');
  const [dead, setDead] = useState('4');
  const [condition, setCondition] = useState('Good');
  const [notes, setNotes] = useState('');
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
    const obsNum = parseInt(observed, 10);
    const estNum = parseInt(established, 10);
    const survNum = parseInt(surviving, 10);
    const deadNum = parseInt(dead, 10);

    if (isNaN(obsNum) || isNaN(estNum) || isNaN(survNum) || isNaN(deadNum)) {
      Alert.alert('Validation Error', 'Please enter valid numerical counts.');
      return;
    }

    if (estNum > obsNum || survNum > obsNum || deadNum > obsNum) {
      Alert.alert('Validation Error', 'Established, surviving, and dead counts cannot exceed observed count.');
      return;
    }

    try {
      setLoading(true);
      const res = await monitoringApi.submitRecord({
        activity_id: activityId,
        observation_date: new Date().toISOString().split('T')[0],
        observed_count: obsNum,
        established_count: estNum,
        surviving_count: survNum,
        dead_count: deadNum,
        condition,
        notes,
        photos,
      });

      if (res.success) {
        Alert.alert('Success', 'Monitoring record submitted successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit monitoring record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Add Monitoring Record" showBack onBack={() => navigation.goBack()} showNotification={false} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Field Growth Observation</Text>
        <Text style={styles.subHeading}>Record survival rate, root establishment, and health condition</Text>

        <Input label="Total Plants / Seeds Observed" value={observed} onChangeText={setObserved} keyboardType="numeric" />
        <Input label="Established Count" value={established} onChangeText={setEstablished} keyboardType="numeric" />
        <Input label="Surviving Count" value={surviving} onChangeText={setSurviving} keyboardType="numeric" />
        <Input label="Dead Count" value={dead} onChangeText={setDead} keyboardType="numeric" />

        <Text style={styles.label}>Health Condition</Text>
        <View style={styles.conditionRow}>
          {['Good', 'Fair', 'Poor', 'Unknown'].map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.condChip, condition === item ? styles.condActive : null]}
              onPress={() => setCondition(item)}
            >
              <Text style={[styles.condText, condition === item ? styles.condTextActive : null]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Observation Photos</Text>
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

        <Input
          label="Field Observation Notes"
          placeholder="Note down rainfall, foliage density, pest signs..."
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={setNotes}
          style={{ height: 70, textAlignVertical: 'top' }}
        />

        <Button title="Submit Observation" onPress={handleSubmit} loading={loading} size="lg" style={styles.submitBtn} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 90 },
  heading: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.heavy, color: Colors.text1 },
  subHeading: { fontSize: Typography.sizes.xs, color: Colors.text2, marginTop: 4, marginBottom: 16 },
  label: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.text2, marginBottom: 8 },
  conditionRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  condChip: { flex: 1, paddingVertical: 10, borderRadius: Radius.md, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center' },
  condActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  condText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.text2 },
  condTextActive: { color: Colors.lime },
  photoContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  photoThumb: { width: 64, height: 64, borderRadius: Radius.md },
  addPhotoBtn: { width: 64, height: 64, borderRadius: Radius.md, backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  submitBtn: { marginTop: 16 },
});
