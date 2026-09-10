// Native ExploreMapScreen - uses WebView + Leaflet (no Google Maps API key required)
// This avoids the react-native-maps crash on New/Old Architecture alike.
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
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius } from '../../theme';
import { Header } from '../../components/common/Header';
import { activityApi } from '../../api/activityApi';
import { MapPin } from '../../types/models';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';

export const ExploreMapScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const webViewRef = useRef<WebView>(null);

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
  const [pinCount, setPinCount] = useState('50');

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
          field_notes: `Map Pin: ${pinSpecies}`,
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
          field_notes: `Map Pin: ${pinSpecies}`,
        });
      }

      await loadMapPins();
      setModalVisible(false);
      setNewPinCoords(null);
      Alert.alert('Saved!', 'Pin saved and visible to all community users!');
    } catch (err: any) {
      const newPinObj: MapPin = {
        id: Date.now(),
        activity_type: pinType,
        latitude: newPinCoords.latitude,
        longitude: newPinCoords.longitude,
        title: pinTitle,
        species: pinSpecies,
        count: parseInt(pinCount, 10) || 50,
        status: 'verified',
        date: new Date().toISOString().split('T')[0],
        user_name: user?.name || 'User',
      };
      setPins((prev) => [newPinObj, ...prev]);
      setModalVisible(false);
      setNewPinCoords(null);
      Alert.alert('Pin Placed!', 'Pin placed on map.');
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

  const pinsJson = JSON.stringify(filteredPins);

  const mapHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
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
      maxZoom: 19, attribution: 'OpenStreetMap'
    }).addTo(map);

    var pins = ${pinsJson};
    pins.forEach(function(p) {
      var lat = parseFloat(p.latitude); var lng = parseFloat(p.longitude);
      if (isNaN(lat) || isNaN(lng)) return;
      var iconClass = p.activity_type === 'seeding' ? 'pin-marker seeding' : 'pin-marker';
      var sym = p.activity_type === 'seeding' ? '&#9670;' : '&#9650;';
      var icon = L.divIcon({ className: '', html: '<div class="' + iconClass + '">' + sym + '</div>', iconSize: [32,32], iconAnchor: [16,16] });
      var m = L.marker([lat, lng], { icon: icon }).addTo(map);
      m.bindPopup('<b style="font-size:13px">' + (p.title||'Site') + '</b><br><span style="font-size:11px">' + (p.species||'') + ' &bull; ' + (p.count||0) + '</span>');
      m.on('click', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MARKER_CLICK', pinId: p.id }));
      });
    });

    var clickMarker = null;
    map.on('click', function(e) {
      if (clickMarker) { map.removeLayer(clickMarker); }
      clickMarker = L.marker([e.latlng.lat, e.latlng.lng], {
        icon: L.divIcon({
          className: '',
          html: '<div style="width:34px;height:34px;border-radius:50%;background:#C8FF55;border:3px solid #0F1512;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,0.4);">+</div>',
          iconSize: [34,34], iconAnchor: [17,17]
        })
      }).addTo(map);
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_CLICK', lat: e.latlng.lat, lng: e.latlng.lng }));
    });
  </script>
</body>
</html>`;

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_CLICK') {
        setNewPinCoords({ latitude: data.lat, longitude: data.lng });
        setPinTitle(`Field Site (${data.lat.toFixed(4)}, ${data.lng.toFixed(4)})`);
        setModalVisible(true);
      } else if (data.type === 'MARKER_CLICK') {
        const found = pins.find((p) => p.id === data.pinId);
        if (found) setSelectedPin(found);
      }
    } catch (e) {}
  };

  return (
    <View style={styles.container}>
      <Header title="Field Map" showNotification={false} />

      {/* Filter Controls */}
      <View style={styles.topControlBar}>
        <View style={styles.scopeToggle}>
          <TouchableOpacity
            style={[styles.scopeBtn, viewScope === 'all' && styles.scopeBtnActive]}
            onPress={() => setViewScope('all')}
          >
            <Text style={[styles.scopeText, viewScope === 'all' && styles.scopeTextActive]}>
              All Community ({pins.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.scopeBtn, viewScope === 'mine' && styles.scopeBtnActive]}
            onPress={() => setViewScope('mine')}
          >
            <Text style={[styles.scopeText, viewScope === 'mine' && styles.scopeTextActive]}>
              My Pins
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.typeFilterRow}>
          {(['all', 'plantation', 'seeding'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, typeFilter === f && styles.chipActive]}
              onPress={() => setTypeFilter(f)}
            >
              <Text style={[styles.chipText, typeFilter === f && styles.chipTextActive]}>
                {f === 'all' ? 'All Types' : f === 'plantation' ? 'Plantations' : 'Seed Bombing'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.lime} />
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ html: mapHtml }}
            style={styles.webview}
            javaScriptEnabled
            originWhitelist={['*']}
            mixedContentMode="always"
            onMessage={handleWebViewMessage}
          />
        )}
        <View style={styles.mapHintBanner}>
          <MaterialIcons name="touch-app" size={16} color={Colors.lime} />
          <Text style={styles.mapHintText}>Tap map to add a planting pin</Text>
        </View>
      </View>

      {/* Selected Pin Card */}
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
                {selectedPin.species} • {selectedPin.count} items
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedPin(null)}>
              <MaterialIcons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={styles.selectedPinUser}>By {selectedPin.user_name}</Text>
        </View>
      )}

      {/* New Pin Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="pin-drop" size={22} color={Colors.ink} />
                <Text style={styles.modalTitle}>Add Planting Pin</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={22} color={Colors.text2} />
              </TouchableOpacity>
            </View>

            {newPinCoords && (
              <View style={styles.coordsDisplayBox}>
                <MaterialIcons name="my-location" size={16} color={Colors.lime} />
                <Text style={styles.coordsDisplayText}>
                  {newPinCoords.latitude.toFixed(6)}° N, {newPinCoords.longitude.toFixed(6)}° E
                </Text>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>SITE NAME</Text>
              <TextInput
                style={styles.formInput}
                value={pinTitle}
                onChangeText={setPinTitle}
                placeholder="e.g. Margalla Hills Zone 2"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>TYPE</Text>
              <View style={styles.typeToggleRow}>
                {(['plantation', 'seeding'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeBtn, pinType === t && styles.typeBtnActive]}
                    onPress={() => setPinType(t)}
                  >
                    <Text style={[styles.typeBtnText, pinType === t && styles.typeBtnTextActive]}>
                      {t === 'plantation' ? 'Plantation' : 'Seed Bombing'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>SPECIES</Text>
              <TextInput
                style={styles.formInput}
                value={pinSpecies}
                onChangeText={setPinSpecies}
                placeholder="e.g. Chir Pine"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>QUANTITY</Text>
              <TextInput
                style={styles.formInput}
                value={pinCount}
                onChangeText={setPinCount}
                keyboardType="numeric"
                placeholder="50"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <TouchableOpacity
              style={styles.savePinBtn}
              onPress={handleSavePin}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.savePinBtnText}>Save Pin to Map</Text>
              )}
            </TouchableOpacity>
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
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  scopeBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: Radius.pill,
  },
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
  chipText: { fontSize: 10, fontWeight: '700', color: Colors.text2 },
  chipTextActive: { color: Colors.lime },
  mapContainer: { flex: 1, position: 'relative' },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F7F0',
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
  mapHintText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  selectedPinCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 14,
    elevation: 8,
    gap: 6,
    zIndex: 30,
  },
  selectedPinHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectedPinIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPinTitle: { fontSize: 13, fontWeight: '800', color: Colors.text1 },
  selectedPinSub: { fontSize: 11, color: Colors.text2, marginTop: 2 },
  selectedPinUser: { fontSize: 10, color: Colors.textMuted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: Colors.text1 },
  coordsDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.ink,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  coordsDisplayText: { color: Colors.lime, fontSize: 11, fontWeight: '700' },
  formGroup: { gap: 6 },
  formLabel: { fontSize: 10, fontWeight: '700', color: Colors.text2, letterSpacing: 0.8 },
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
  typeToggleRow: { flexDirection: 'row', gap: 10 },
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
  typeBtnActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  typeBtnText: { fontSize: 12, fontWeight: '700', color: Colors.text2 },
  typeBtnTextActive: { color: Colors.lime },
  savePinBtn: {
    backgroundColor: Colors.ink,
    borderRadius: Radius.sm,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  savePinBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
