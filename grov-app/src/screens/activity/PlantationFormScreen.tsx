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

export const PlantationFormScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('5');
  const [siteName, setSiteName] = useState('Margalla Hills Zone 1');
  const [latitude, setLatitude] = useState('33.7381');
  const [longitude, setLongitude] = useState('73.0650');
  const [plantingMethod, setPlantingMethod] = useState('Pit Planting');
  const [fieldNotes, setFieldNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

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

  const handleFetchGps = async () => {
    try {
      setGpsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to capture site coordinates.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLatitude(String(loc.coords.latitude.toFixed(5)));
      setLongitude(String(loc.coords.longitude.toFixed(5)));
    } catch (e: any) {
      Alert.alert('GPS Error', e.message || 'Failed to capture GPS location.');
    } finally {
      setGpsLoading(false);
    }
  };

  const handlePickPhoto = async () => {
    if (photos.length >= 5) {
      Alert.alert('Limit Reached', 'You can attach up to 5 evidence photos.');
      return;
    }

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
        if (!camPerm.granted) {
          Alert.alert('Permission Required', 'Permission is needed to attach photo evidence.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      }

      if (result && !result.canceled && result.assets[0]?.uri) {
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (e: any) {
      console.warn('Photo picker error', e);
      Alert.alert('Photo Upload Error', 'Could not open image picker.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedSpeciesId || !quantity || !siteName || !latitude || !longitude) {
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
      const res = await activityApi.logPlantation({
        species_id: selectedSpeciesId,
        quantity_planted: parseInt(quantity, 10),
        date: new Date().toISOString().split('T')[0],
        site_name: siteName,
        latitude: lat,
        longitude: lon,
        planting_method: plantingMethod,
        field_notes: fieldNotes,
        photos,
      });

      if (res.success) {
        navigation.replace('PlantationConfirm', { activity: res.data });
      }
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to log plantation activity.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={styles.container}>
      <Header title="Tree Plantation Drive" showBack onBack={() => navigation.goBack()} showNotification={false} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.label}>Select Native Tree Species</Text>
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
          label="Number of Saplings Planted"
          placeholder="120"
          keyboardType="numeric"
          value={quantity}
          onChangeText={setQuantity}
          icon={<MaterialIcons name="format-list-numbered" size={20} color={Colors.textMuted} />}
        />

        <Input
          label="Restoration Site Name"
          placeholder="Margalla Hills Zone 1"
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

        <Button
          title={gpsLoading ? 'Capturing GPS...' : 'Auto-Capture Current GPS'}
          onPress={handleFetchGps}
          variant="secondary"
          size="sm"
          style={styles.gpsBtn}
          icon={<MaterialIcons name="my-location" size={16} color={Colors.ink} />}
        />

        <Text style={styles.label}>Planting Method</Text>
        <View style={styles.methodRow}>
          {['Pit Planting', 'Trench Planting', 'Mound Planting', 'Aerial Planting'].map((method) => (
            <TouchableOpacity
              key={method}
              style={[styles.methodChip, plantingMethod === method ? styles.methodActive : null]}
              onPress={() => setPlantingMethod(method)}
            >
              <Text style={[styles.methodText, plantingMethod === method ? styles.methodTextActive : null]}>{method}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Photo Evidence (Max 5)</Text>
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

        <Input
          label="Field Notes & Soil Observations"
          placeholder="Describe soil moisture, slope orientation, weather conditions..."
          multiline
          numberOfLines={3}
          value={fieldNotes}
          onChangeText={setFieldNotes}
          style={{ height: 70, textAlignVertical: 'top' }}
        />

        <Button
          title="Submit Plantation Log"
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
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 90,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text2,
    marginBottom: 8,
    marginTop: 4,
  },
  speciesScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  speciesCard: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginRight: 10,
  },
  speciesCardSelected: {
    backgroundColor: Colors.lime,
    borderColor: Colors.lime,
  },
  speciesName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text1,
  },
  speciesTextSelected: {
    color: Colors.ink,
  },
  speciesSci: {
    fontSize: 10,
    fontStyle: 'italic',
    color: Colors.text3,
  },
  gpsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gpsBtn: {
    marginBottom: 16,
  },
  methodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  methodChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  methodActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  methodText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.text2,
  },
  methodTextActive: {
    color: Colors.lime,
  },
  photoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  photoThumb: {
    width: 70,
    height: 70,
    borderRadius: Radius.md,
  },
  addPhotoBtn: {
    width: 70,
    height: 70,
    borderRadius: Radius.md,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 9,
    fontWeight: Typography.weights.bold,
    color: Colors.lime,
    marginTop: 2,
  },
  submitBtn: {
    marginTop: 16,
  },
});
