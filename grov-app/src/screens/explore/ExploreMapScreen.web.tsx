import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius } from '../../theme';
import { Header } from '../../components/common/Header';
import { activityApi } from '../../api/activityApi';
import { useAuth } from '../../context/AuthContext';
import { MapPin } from '../../types/models';
import { MaterialIcons } from '@expo/vector-icons';

export const ExploreMapScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [pins, setPins] = useState<MapPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewScope, setViewScope] = useState<'all' | 'mine'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'plantation' | 'seeding'>('all');

  // New Pin Modal State
  const [newPinCoords, setNewPinCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pinTitle, setPinTitle] = useState('');
  const [pinSpecies, setPinSpecies] = useState('Chir Pine');
  const [pinCount, setPinCount] = useState('50');
  const [pinType, setPinType] = useState<'plantation' | 'seeding'>('plantation');
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Selected Pin Details
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);

  useEffect(() => {
    loadMapPins();
  }, []);

  // Listen for Leaflet Map Click events on Web
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'MAP_CLICK') {
        const { lat, lng } = event.data;
        setNewPinCoords({ latitude: lat, longitude: lng });
        setPinTitle(`Islamabad Field Site (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        setModalVisible(true);
      } else if (event.data && event.data.type === 'MARKER_CLICK') {
        const pinId = event.data.pinId;
        const found = pins.find((p) => p.id === pinId);
        if (found) setSelectedPin(found);
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [pins]);

  const loadMapPins = async () => {
    try {
      setLoading(true);
      const res = await activityApi.getMapPins();
      if (res.success && res.data) {
        setPins(res.data);
      }
    } catch (e) {
      console.warn('Load map pins error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePin = async () => {
    if (!newPinCoords || !pinTitle) {
      Alert.alert('Validation', 'Please enter a location name for the pin.');
      return;
    }

    try {
      setSaving(true);
      const today = new Date().toISOString().split('T')[0];
      const qty = parseInt(pinCount, 10) || 50;

      if (pinType === 'plantation') {
        await activityApi.logPlantation({
          species_id: 1,
          quantity_planted: qty,
          date: today,
          site_name: pinTitle,
          latitude: newPinCoords.latitude,
          longitude: newPinCoords.longitude,
          planting_method: 'Pit Planting',
          field_notes: `Map Pin dropped on Islamabad Map: ${pinSpecies}`,
        });
      } else {
        await activityApi.logSeeding({
          species_id: 2,
          seeds_dispersed: qty,
          date: today,
          site_name: pinTitle,
          latitude: newPinCoords.latitude,
          longitude: newPinCoords.longitude,
          dispersal_method: 'Seed Bombing (aerial)',
          field_notes: `Map Pin dropped on Islamabad Map: ${pinSpecies}`,
        });
      }

      // Reload all community map pins directly from database
      await loadMapPins();

      setModalVisible(false);
      setNewPinCoords(null);
      Alert.alert('Saved to Database!', `Pin saved to database and now visible to all community users!`);
    } catch (err: any) {
      console.warn('API pin save failed, adding to local map state', err);
      const newPinObj: MapPin = {
        id: Date.now(),
        activity_type: pinType,
        latitude: Number(newPinCoords.latitude.toFixed(6)),
        longitude: Number(newPinCoords.longitude.toFixed(6)),
        title: pinTitle,
        species: pinSpecies,
        count: parseInt(pinCount, 10) || 50,
        status: 'verified',
        date: new Date().toISOString().split('T')[0],
        user_name: user?.name || 'Ebad Mahar',
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

  // Generate Leaflet Interactive Map HTML with community database pins & click handler
  const pinsJson = JSON.stringify(filteredPins);
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #F4F7F0; }
        .pin-marker {
          width: 32px; height: 32px; border-radius: 50%;
          background: #0F1512; border: 2.5px solid #C8FF55;
          display: flex; align-items: center; justify-content: center;
          color: #C8FF55; font-weight: bold; font-family: sans-serif;
          box-shadow: 0 4px 12px rgba(0,0,0,0.35); cursor: pointer;
        }
        .pin-marker.seeding { background: #7A5AF8; border-color: #FFFFFF; }
        .leaflet-popup-content-wrapper {
          background: rgba(255,255,255,0.96) !important;
          border-radius: 12px !important;
          font-family: sans-serif !important;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: true }).setView([33.7294, 73.0931], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        var pins = ${pinsJson};
        pins.forEach(function(p) {
          var iconClass = p.activity_type === 'seeding' ? 'pin-marker seeding' : 'pin-marker';
          var symbolSvg = p.activity_type === 'seeding'
            ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="5"/><path d="M12 2v5M12 17v5"/></svg>'
            : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L4 14h5v7h6v-7h5z"/></svg>';
          var customIcon = L.divIcon({
            className: '',
            html: '<div class="' + iconClass + '">' + symbolSvg + '</div>',
            iconSize: [32, 32], iconAnchor: [16, 16]
          });

          var marker = L.marker([p.latitude, p.longitude], { icon: customIcon }).addTo(map);
          marker.bindPopup('<b style="font-size:13px;color:#0F1512;">' + p.title + '</b><br><span style="font-size:11px;color:#3A5040;">' + p.species + ' • ' + p.count + ' items</span><br><span style="font-size:10px;color:#9DAF9A;">By ' + p.user_name + '</span>');
          marker.on('click', function() {
            window.parent.postMessage({ type: 'MARKER_CLICK', pinId: p.id }, '*');
          });
        });

        var clickMarker = null;
        map.on('click', function(e) {
          var lat = e.latlng.lat.toFixed(6);
          var lng = e.latlng.lng.toFixed(6);

          if (clickMarker) { map.removeLayer(clickMarker); }
          clickMarker = L.marker([e.latlng.lat, e.latlng.lng], {
            icon: L.divIcon({
              className: '',
              html: '<div style="width:34px;height:34px;border-radius:50%;background:#C8FF55;border:3px solid #0F1512;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,0.4);"><svg width="16" height="16" viewBox="0 0 24 24" fill="#0F1512"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>',
              iconSize: [34, 34], iconAnchor: [17, 17]
            })
          }).addTo(map);

          window.parent.postMessage({ type: 'MAP_CLICK', lat: parseFloat(lat), lng: parseFloat(lng) }, '*');
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <Header title="Field Map" showNotification={false} />

      {/* Floating Control Bar: Scope & Type */}
      <View style={styles.topControlBar}>
        {/* Scope Toggle: All Pins vs My Pins */}
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

      {/* Full Interactive Leaflet OpenStreetMap Container */}
      <View style={styles.mapContainer}>
        {/* @ts-ignore */}
        <iframe
          title="Interactive Islamabad OpenStreetMap"
          srcDoc={mapHtml}
          width="100%"
          height="100%"
          style={{ border: 0, flex: 1, width: '100%', height: '100%' }}
        />

        <View style={styles.mapHintBanner}>
          <MaterialIcons name="touch-app" size={16} color={Colors.lime} />
          <Text style={styles.mapHintText}>Tap on the map to pin a planting location</Text>
        </View>
      </View>

      {/* Selected Pin Floating Summary Card */}
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

          <View style={styles.selectedPinDetailsRow}>
            <Text style={styles.selectedPinCoords}>
              Lat: {selectedPin.latitude} | Lng: {selectedPin.longitude}
            </Text>
            <Text style={styles.selectedPinUser}>Logged by {selectedPin.user_name}</Text>
          </View>
        </View>
      )}

      {/* Modal for Creating New Pin */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <MaterialIcons name="pin-drop" size={22} color={Colors.ink} />
                <Text style={styles.modalTitle}>Set Pin on Islamabad Map</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={22} color={Colors.text2} />
              </TouchableOpacity>
            </View>

            {/* Display Auto-Detected Lat/Long Coordinates */}
            <View style={styles.coordsDisplayBox}>
              <MaterialIcons name="my-location" size={16} color={Colors.lime} />
              <Text style={styles.coordsDisplayText}>
                Map Coordinates: {newPinCoords?.latitude.toFixed(6)}° N, {newPinCoords?.longitude.toFixed(6)}° E
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>LOCATION / SITE NAME</Text>
              <TextInput
                style={styles.formInput}
                value={pinTitle}
                onChangeText={setPinTitle}
                placeholder="e.g. Margalla Hills Zone 2"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>ACTIVITY TYPE</Text>
              <View style={styles.typeToggleRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, pinType === 'plantation' && styles.typeBtnActive]}
                  onPress={() => setPinType('plantation')}
                >
                  <Text style={[styles.typeBtnText, pinType === 'plantation' && styles.typeBtnTextActive]}>
                    Tree Plantation
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeBtn, pinType === 'seeding' && styles.typeBtnActive]}
                  onPress={() => setPinType('seeding')}
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
                placeholder="e.g. Chir Pine / Phulai"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>QUANTITY PLANTED / SEEDED</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.cardBorder }}>
                <TouchableOpacity
                  style={{ padding: 12, backgroundColor: Colors.card, borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }}
                  onPress={() => {
                    const cur = parseInt(pinCount, 10) || 5;
                    if (cur > 1) setPinCount(String(cur - 1));
                  }}
                >
                  <MaterialIcons name="remove" size={20} color={Colors.lime} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.formInput, { flex: 1, textAlign: 'center', borderWidth: 0 }]}
                  value={pinCount}
                  onChangeText={setPinCount}
                  keyboardType="numeric"
                  placeholder="5"
                />
                <TouchableOpacity
                  style={{ padding: 12, backgroundColor: Colors.card, borderTopRightRadius: 6, borderBottomRightRadius: 6 }}
                  onPress={() => {
                    const cur = parseInt(pinCount, 10) || 5;
                    setPinCount(String(cur + 1));
                  }}
                >
                  <MaterialIcons name="add" size={20} color={Colors.lime} />
                </TouchableOpacity>
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
                <Text style={styles.savePinBtnText}>Save Pin</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
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
  scopeBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: Radius.pill,
  },
  scopeBtnActive: {
    backgroundColor: Colors.ink,
  },
  scopeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text2,
  },
  scopeTextActive: {
    color: Colors.lime,
  },
  typeFilterRow: {
    flexDirection: 'row',
    gap: 6,
  },
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
  chipActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text2,
  },
  chipTextActive: {
    color: Colors.lime,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapHintBanner: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(15, 21, 18, 0.90)',
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 20,
  },
  mapHintText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  selectedPinCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    gap: 8,
    zIndex: 30,
  },
  selectedPinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedPinIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPinTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text1,
  },
  selectedPinSub: {
    fontSize: 11,
    color: Colors.text2,
    marginTop: 2,
  },
  selectedPinDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  selectedPinCoords: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text3,
  },
  selectedPinUser: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text1,
  },
  coordsDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.ink,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  coordsDisplayText: {
    color: Colors.lime,
    fontSize: 11,
    fontWeight: '700',
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text2,
    letterSpacing: 0.8,
  },
  formInput: {
    height: 44,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 12,
    fontSize: 13,
    color: Colors.text1,
    backgroundColor: Colors.surface,
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    height: 40,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  typeBtnActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text2,
  },
  typeBtnTextActive: {
    color: Colors.lime,
  },
  savePinBtn: {
    backgroundColor: Colors.ink,
    borderRadius: Radius.sm,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  savePinBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
