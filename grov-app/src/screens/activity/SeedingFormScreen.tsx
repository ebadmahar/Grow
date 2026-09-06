import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { speciesApi } from '../../api/speciesApi';
import { activityApi } from '../../api/activityApi';
import { Species } from '../../types/models';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';

export const SeedingFormScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<number | null>(null);
  const [seedsCount, setSeedsCount] = useState('500');
  const [siteName, setSiteName] = useState('G-11 Margalla Trail');
  const [latitude, setLatitude] = useState('33.7020');
  const [longitude, setLongitude] = useState('73.1250');
  const [dispersalMethod, setDispersalMethod] = useState('Seed Bombing (aerial)');
  const [coverageArea, setCoverageArea] = useState('2000');
  const [fieldNotes, setFieldNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSpecies();
  }, []);

  const fetchSpecies = async () => {
    try {
      const res = await speciesApi.getSpeciesList();
      if (res.success && res.data.length > 0) {
        setSpeciesList(res.data);
        setSelectedSpeciesId(res.data[0].id);
      }
    } catch (e) {
      console.warn('Species load error', e);
    }
  };

  const handlePickPhoto = async () => {
    if (photos.length >= 5) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      let result;
      if (perm.granted) {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
        });
      } else {
        const camPerm = await ImagePicker.requestCameraPermissionsAsync();
        if (!camPerm.granted) return;
        result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      }
      if (result && !result.canceled && result.assets[0]?.uri) {
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (e) {
      console.warn('Photo picker error', e);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSpeciesId || !seedsCount || !siteName || !latitude || !longitude) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    // Client-side Islamabad bounding box pre-check
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (lat < 33.50 || lat > 33.85 || lon < 72.80 || lon > 73.35) {
      Alert.alert(
        'Location Not Supported 📍',
        "This location is currently not supported. We're working on it 👀 — only Islamabad is available right now."
      );
      return;
    }

    try {
      setLoading(true);
      const res = await activityApi.logSeeding({
        species_id: selectedSpeciesId,
        seeds_dispersed: parseInt(seedsCount, 10),
        date: new Date().toISOString().split('T')[0],
        site_name: siteName,
        latitude: lat,
        longitude: lon,
        dispersal_method: dispersalMethod,
        coverage_area_sqm: coverageArea ? parseInt(coverageArea, 10) : undefined,
        field_notes: fieldNotes,
        photos,
      });

      if (res.success) {
        navigation.replace('SeedingConfirm', { activity: res.data });
      }
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to log seeding activity.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <Header title="Seed Bombing & Dispersal" showBack onBack={() => navigation.goBack()} showNotification={false} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.label}>Select Seed Species</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.speciesScroll}>
          {speciesList.map((item) => {
            const isSelected = selectedSpeciesId === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.speciesCard, isSelected ? styles.speciesCardSelected : null]}
                onPress={() => setSelectedSpeciesId(item.id)}
              >
                <Text style={[styles.speciesName, isSelected ? styles.speciesTextSelected : null]}>{item.common_name}</Text>
                <Text style={styles.speciesSci}>{item.scientific_name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Input
          label="Total Seeds Dispersed"
          placeholder="500"
          keyboardType="numeric"
          value={seedsCount}
          onChangeText={setSeedsCount}
          icon={<MaterialIcons name="grain" size={20} color={Colors.textMuted} />}
        />

        <Input
          label="Dispersal Site Name"
          placeholder="G-11 Margalla Trail"
          value={siteName}
          onChangeText={setSiteName}
          icon={<MaterialIcons name="place" size={20} color={Colors.textMuted} />}
        />

        <View style={styles.gpsRow}>
          <View style={{ flex: 1 }}>
            <Input label="Latitude" value={latitude} onChangeText={setLatitude} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Longitude" value={longitude} onChangeText={setLongitude} keyboardType="numeric" />
          </View>
        </View>

        <Text style={styles.label}>Dispersal Method</Text>
        <View style={styles.methodRow}>
          {['Hand Broadcasting', 'Seed Bombing (aerial)', 'Seed Drill', 'Hydroseeding'].map((method) => (
            <TouchableOpacity
              key={method}
              style={[styles.methodChip, dispersalMethod === method ? styles.methodActive : null]}
              onPress={() => setDispersalMethod(method)}
            >
              <Text style={[styles.methodText, dispersalMethod === method ? styles.methodTextActive : null]}>{method}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Estimated Coverage Area (sq. meters)"
          placeholder="2000"
          keyboardType="numeric"
          value={coverageArea}
          onChangeText={setCoverageArea}
        />

        <Text style={styles.label}>Photo Evidence</Text>
        <View style={styles.photoContainer}>
          {photos.map((uri, idx) => (
            <Image key={idx} source={{ uri }} style={styles.photoThumb} />
          ))}
          {photos.length < 5 ? (
            <TouchableOpacity style={styles.addPhotoBtn} onPress={handlePickPhoto}>
              <MaterialIcons name="camera-alt" size={24} color={Colors.lime} />
              <Text style={styles.addPhotoText}>Take Photo</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Button
          title="Submit Seed Bombing Log"
          onPress={handleSubmit}
          loading={loading}
          size="lg"
          style={styles.submitBtn}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 90 },
  label: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.text2, marginBottom: 8 },
  speciesScroll: { flexDirection: 'row', marginBottom: 16 },
  speciesCard: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.lg, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder, marginRight: 10 },
  speciesCardSelected: { backgroundColor: Colors.lime, borderColor: Colors.lime },
  speciesName: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.text1 },
  speciesTextSelected: { color: Colors.ink },
  speciesSci: { fontSize: 10, fontStyle: 'italic', color: Colors.text3 },
  gpsRow: { flexDirection: 'row', gap: 12 },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  methodChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder },
  methodActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  methodText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.text2 },
  methodTextActive: { color: Colors.lime },
  photoContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  photoThumb: { width: 70, height: 70, borderRadius: Radius.md },
  addPhotoBtn: { width: 70, height: 70, borderRadius: Radius.md, backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  addPhotoText: { fontSize: 9, fontWeight: Typography.weights.bold, color: Colors.lime, marginTop: 2 },
  submitBtn: { marginTop: 16 },
});
