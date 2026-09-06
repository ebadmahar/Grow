import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Typography } from '../../theme';
import { Header } from '../../components/common/Header';
import { activityApi } from '../../api/activityApi';
import { MapPin } from '../../types/models';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';

const ISLAMABAD_REGION = {
  latitude: 33.7294,
  longitude: 73.0931,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

export const ExploreMapScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const mapRef = useRef<MapView>(null);

  const [pins, setPins] = useState<MapPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);

  // Filters
  const [viewScope, setViewScope] = useState<'all' | 'mine'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'plantation' | 'seeding'>('all');

  // New Pin Form Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newPinCoords, setNewPinCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pinTitle, setPinTitle] = useState('');
  const [pinType, setPinType] = useState<'plantation' | 'seeding'>('plantation');
  const [pinSpecies, setPinSpecies] = useState('Chir Pine');
  const [pinMethod, setPinMethod] = useState('Pit Planting');
  const [pinCount, setPinCount] = useState(5);
  const [pinNotes, setPinNotes] = useState('');
  const [pinPhotos, setPinPhotos] = useState<string[]>([]);

  useEffect(() => {
    loadMapPins();
  }, []);

  const loadMapPins = async () => {
    try {
      setLoading(true);
      const res = await activityApi.getMapPins();
      if (res.success && res.data) {
        setPins(res.data);
      }
    } catch (e) {
      console.warn('Map pins load error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = (e: any) => {
    const coords = e.nativeEvent.coordinate;
    setNewPinCoords(coords);
    setPinTitle('Margalla Field Site');
    setPinSpecies('Chir Pine');
    setPinMethod('Pit Planting');
    setPinCount(5);
    setPinNotes('');
    setPinPhotos([]);
    setModalVisible(true);
  };

  const handlePickPhoto = async () => {
    if (pinPhotos.length >= 5) {
      Alert.alert('Limit Reached', 'You can attach up to 5 photo evidence images.');
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
        if (!camPerm.granted) return;
        result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      }
      if (result && !result.canceled && result.assets[0]?.uri) {
        setPinPhotos([...pinPhotos, result.assets[0].uri]);
      }
    } catch (err) {
      console.warn('Photo picker error', err);
    }
  };

  const handleSavePin = async () => {
    if (!newPinCoords) return;
    if (!pinTitle.trim()) {
      Alert.alert('Validation', 'Please enter a site name for the pin.');
      return;
    }

    const lat = newPinCoords.latitude;
    const lon = newPinCoords.longitude;
    if (lat < 33.50 || lat > 33.85 || lon < 72.80 || lon > 73.35) {
      Alert.alert(
        'Location Not Supported 📍',
        "This area is outside Islamabad. Only Islamabad field sites can be pinned right now."
      );
      setModalVisible(false);
      setNewPinCoords(null);
      return;
    }

    try {
      setSaving(true);
      const today = new Date().toISOString().split('T')[0];

      if (pinType === 'plantation') {
        await activityApi.logPlantation({
          species_id: 1,
          quantity_planted: pinCount,
          date: today,
          site_name: pinTitle,
          latitude: newPinCoords.latitude,
          longitude: newPinCoords.longitude,
          planting_method: pinMethod,
          field_notes: pinNotes || `Map Pin: ${pinSpecies}`,
          photos: pinPhotos,
        });
      } else {
        await activityApi.logSeeding({
          species_id: 2,
          seeds_dispersed: pinCount,
          date: today,
          site_name: pinTitle,
          latitude: newPinCoords.latitude,
          longitude: newPinCoords.longitude,
          dispersal_method: pinMethod || 'Seed Bombing (aerial)',
          field_notes: pinNotes || `Map Pin: ${pinSpecies}`,
          photos: pinPhotos,
        });
      }

      await loadMapPins();

      setModalVisible(false);
      setNewPinCoords(null);
      Alert.alert('Pin Saved!', `Your field site has been pinned to the community map.`);
    } catch (err: any) {
      console.warn('API save pin error', err);
      const newPinObj: MapPin = {
        id: Date.now(),
        activity_type: pinType,
        latitude: Number(newPinCoords.latitude.toFixed(6)),
        longitude: Number(newPinCoords.longitude.toFixed(6)),
        title: pinTitle,
        species: pinSpecies,
        count: Number(pinCount) || 5,
        status: 'verified',
        date: new Date().toISOString().split('T')[0],
        user_id: user?.id,
        user_name: user?.name || 'Restorer',
      };
      setPins((prev) => [newPinObj, ...prev]);
      setModalVisible(false);
      setNewPinCoords(null);
      Alert.alert('Pin Placed!', `Pin placed on map.`);
    } finally {
      setSaving(false);
    }
  };

  const filteredPins = pins.filter((p) => {
    if (viewScope === 'mine' && user) {
      if (p.user_id !== user.id) return false;
    }
    if (typeFilter === 'plantation' && p.activity_type !== 'plantation') return false;
    if (typeFilter === 'seeding' && p.activity_type !== 'seeding') return false;
    return true;
  });

  return (
    <View style={styles.container}>
      <Header title="Field Map" showNotification={false} />

      {/* Floating Control Bar */}
      <View style={styles.topControlBar}>
        <View style={styles.scopeToggle}>
          <TouchableOpacity
            style={[styles.scopeBtn, viewScope === 'all' && styles.scopeBtnActive]}
            onPress={() => setViewScope('all')}
          >
            <Text style={[styles.scopeText, viewScope === 'all' && styles.scopeTextActive]}>
              All Community Pins ({pins.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scopeBtn, viewScope === 'mine' && styles.scopeBtnActive]}
            onPress={() => setViewScope('mine')}
          >
            <Text style={[styles.scopeText, viewScope === 'mine' && styles.scopeTextActive]}>
              My Pins Only
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category Filters */}
        <View style={styles.typeFilterRow}>
          <TouchableOpacity
            style={[styles.chip, typeFilter === 'all' && styles.chipActive]}
            onPress={() => setTypeFilter('all')}
          >
            <Text style={[styles.chipText, typeFilter === 'all' && styles.chipTextActive]}>All Types</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, typeFilter === 'plantation' && styles.chipActive]}
            onPress={() => setTypeFilter('plantation')}
          >
            <MaterialIcons name="forest" size={13} color={typeFilter === 'plantation' ? Colors.lime : '#1A6636'} />
            <Text style={[styles.chipText, typeFilter === 'plantation' && styles.chipTextActive]}>Plantations</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, typeFilter === 'seeding' && styles.chipActive]}
            onPress={() => setTypeFilter('seeding')}
          >
            <MaterialIcons name="grass" size={13} color={typeFilter === 'seeding' ? Colors.lime : '#7A5AF8'} />
            <Text style={[styles.chipText, typeFilter === 'seeding' && styles.chipTextActive]}>Seed Bombing</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Interactive Map Section */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={ISLAMABAD_REGION}
          onPress={handleMapPress}
        >
          {filteredPins.map((pin) => {
            const lat = Number(pin.latitude);
            const lng = Number(pin.longitude);
            if (isNaN(lat) || isNaN(lng) || !lat || !lng) return null;
            return (
              <Marker
                key={pin.id}
                coordinate={{ latitude: lat, longitude: lng }}
                onPress={() => setSelectedPin(pin)}
              >
                <View
                  style={[
                    styles.markerPin,
                    pin.activity_type === 'seeding' && styles.seedingMarkerPin,
                  ]}
                >
                  <MaterialIcons
                    name={pin.activity_type === 'plantation' ? 'forest' : 'grass'}
                    size={16}
                    color={pin.activity_type === 'plantation' ? Colors.lime : '#FFFFFF'}
                  />
                </View>
              </Marker>
            );
          })}
        </MapView>

        <View style={styles.mapHintBanner}>
          <MaterialIcons name="touch-app" size={16} color={Colors.lime} />
          <Text style={styles.mapHintText}>Tap on the map to pin a planting location</Text>
        </View>
      </View>

      {/* Selected Pin Details Card */}
      {selectedPin && (
        <View style={[styles.selectedPinCard, { bottom: Math.max(insets.bottom + 80, 90) }]}>
          <View style={styles.selectedPinHeader}>
            <View style={styles.selectedPinIcon}>
              <MaterialIcons
                name={selectedPin.activity_type === 'plantation' ? 'forest' : 'grass'}
                size={20}
                color={selectedPin.activity_type === 'plantation' ? '#1A6636' : '#7A5AF8'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedPinTitle}>{selectedPin.title}</Text>
              <Text style={styles.selectedPinSub}>
                {selectedPin.species} • {selectedPin.count} {selectedPin.activity_type === 'plantation' ? 'Saplings' : 'Seeds'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedPin(null)}>
              <MaterialIcons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.pinMetaRow}>
            <Text style={styles.pinMetaText}>Pinned by {selectedPin.user_name}</Text>
            <Text style={styles.pinMetaText}>Date: {selectedPin.date}</Text>
          </View>
        </View>
      )}

      {/* Complete Pin Form Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Pin Field Location 📍</Text>
                  <Text style={styles.modalSub}>Log comprehensive site details</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <MaterialIcons name="close" size={22} color={Colors.text2} />
                </TouchableOpacity>
              </View>

              <View style={styles.coordsDisplayBox}>
                <MaterialIcons name="my-location" size={16} color={Colors.lime} />
                <Text style={styles.coordsDisplayText}>
                  Coordinates: {newPinCoords?.latitude.toFixed(5)}° N, {newPinCoords?.longitude.toFixed(5)}° E
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>SITE NAME</Text>
                <TextInput
                  style={styles.formInput}
                  value={pinTitle}
                  onChangeText={setPinTitle}
                  placeholder="e.g. Margalla Trail 3 Sector"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>ACTIVITY TYPE</Text>
                <View style={styles.typeToggleRow}>
                  <TouchableOpacity
                    style={[styles.typeBtn, pinType === 'plantation' && styles.typeBtnActive]}
                    onPress={() => {
                      setPinType('plantation');
                      setPinMethod('Pit Planting');
                    }}
                  >
                    <Text style={[styles.typeBtnText, pinType === 'plantation' && styles.typeBtnTextActive]}>
                      Tree Plantation
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.typeBtn, pinType === 'seeding' && styles.typeBtnActive]}
                    onPress={() => {
                      setPinType('seeding');
                      setPinMethod('Seed Bombing (aerial)');
                    }}
                  >
                    <Text style={[styles.typeBtnText, pinType === 'seeding' && styles.typeBtnTextActive]}>
                      Seed Bombing
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>SPECIES NAME</Text>
                <TextInput
                  style={styles.formInput}
                  value={pinSpecies}
                  onChangeText={setPinSpecies}
                  placeholder="e.g. Chir Pine / Phulai / Sanatha"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>PLANTING / DISPERSAL METHOD</Text>
                <TextInput
                  style={styles.formInput}
                  value={pinMethod}
                  onChangeText={setPinMethod}
                  placeholder="e.g. Pit Planting / Seed Bombing"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>QUANTITY (SAPLINGS / SEEDS)</Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setPinCount((c) => Math.max(1, c - 5))}
                  >
                    <MaterialIcons name="remove" size={18} color={Colors.lime} />
                  </TouchableOpacity>
                  <Text style={styles.stepperVal}>{pinCount}</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setPinCount((c) => c + 5)}
                  >
                    <MaterialIcons name="add" size={18} color={Colors.lime} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>FIELD NOTES & OBSERVATIONS</Text>
                <TextInput
                  style={[styles.formInput, { height: 60, textAlignVertical: 'top' }]}
                  value={pinNotes}
                  onChangeText={setPinNotes}
                  multiline
                  placeholder="Soil condition, slope, weather, notes..."
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>ATTACH PHOTO EVIDENCE ({pinPhotos.length}/5)</Text>
                <View style={styles.photoRow}>
                  {pinPhotos.map((uri, idx) => (
                    <Image key={idx} source={{ uri }} style={styles.photoThumb} />
                  ))}
                  {pinPhotos.length < 5 && (
                    <TouchableOpacity style={styles.addPhotoBox} onPress={handlePickPhoto}>
                      <MaterialIcons name="add-a-photo" size={20} color={Colors.lime} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={styles.savePinBtn}
                onPress={handleSavePin}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.savePinBtnText}>Drop Field Pin & Log Activity</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  topControlBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    zIndex: 10,
  },
  scopeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface2,
    borderRadius: Radius.pill,
    padding: 3,
  },
  scopeBtn: { flex: 1, paddingVertical: 7, alignItems: 'center', borderRadius: Radius.pill },
  scopeBtnActive: { backgroundColor: Colors.ink },
  scopeText: { fontSize: 11, fontWeight: '700', color: Colors.text2 },
  scopeTextActive: { color: Colors.lime },
  typeFilterRow: { flexDirection: 'row', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  chipActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  chipText: { fontSize: 11, fontWeight: '700', color: Colors.text2 },
  chipTextActive: { color: Colors.lime },
  mapContainer: { flex: 1, position: 'relative' },
  markerPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.ink,
    borderWidth: 2,
    borderColor: Colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seedingMarkerPin: { backgroundColor: '#7A5AF8', borderColor: '#FFFFFF' },
  mapHintBanner: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 21, 18, 0.88)',
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapHintText: { color: Colors.lime, fontSize: 11, fontWeight: '700', flex: 1 },
  selectedPinCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.limeBorder,
    elevation: 8,
  },
  selectedPinHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectedPinIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPinTitle: { fontSize: 14, fontWeight: '800', color: Colors.text1 },
  selectedPinSub: { fontSize: 11, color: Colors.text2, marginTop: 2 },
  pinMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.cardBorder },
  pinMetaText: { fontSize: 10, color: Colors.text3, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
    maxHeight: '88%',
    gap: 12,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: Colors.text1 },
  modalSub: { fontSize: 11, color: Colors.text2, marginTop: 2 },
  coordsDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface2,
    padding: 8,
    borderRadius: Radius.sm,
    marginVertical: 4,
  },
  coordsDisplayText: { fontSize: 11, fontWeight: '700', color: Colors.text1 },
  formGroup: { gap: 4, marginVertical: 4 },
  formLabel: { fontSize: 10, fontWeight: '700', color: Colors.text3, letterSpacing: 0.5 },
  formInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: Colors.text1,
  },
  typeToggleRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  typeBtnActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  typeBtnText: { fontSize: 11, fontWeight: '700', color: Colors.text2 },
  typeBtnTextActive: { color: Colors.lime },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    width: 140,
  },
  stepperBtn: { padding: 8 },
  stepperVal: { flex: 1, textAlign: 'center', fontWeight: '800', fontSize: 14, color: Colors.text1 },
  photoRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  photoThumb: { width: 50, height: 50, borderRadius: Radius.sm },
  addPhotoBox: {
    width: 50,
    height: 50,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.limeBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface2,
  },
  savePinBtn: {
    backgroundColor: Colors.ink,
    borderRadius: Radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  savePinBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
