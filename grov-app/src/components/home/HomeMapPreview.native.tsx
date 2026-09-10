import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { MapPin } from '../../types/models';

export interface HomeMapPreviewProps {
  mapPins: MapPin[];
  mapPreviewHtml?: string;
}

export const HomeMapPreview: React.FC<HomeMapPreviewProps> = ({ mapPins, mapPreviewHtml }) => {
  // Build Leaflet map HTML with pins
  const pinsJson = JSON.stringify(
    mapPins
      .map((p) => ({
        lat: Number(p.latitude),
        lng: Number(p.longitude),
        title: p.title || 'Site',
        type: p.activity_type || '',
        count: p.count ?? 0,
      }))
      .filter((p) => !isNaN(p.lat) && !isNaN(p.lng) && p.lat && p.lng)
  );

  const html = mapPreviewHtml || `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #F4F7F0; }
    .pin-marker {
      width: 26px; height: 26px; border-radius: 50%;
      background: #0F1512; border: 2px solid #C8FF55;
      display: flex; align-items: center; justify-content: center;
      color: #C8FF55; font-weight: bold; font-family: sans-serif; font-size: 11px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([33.7294, 73.0931], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    var pins = ${pinsJson};
    pins.forEach(function(p) {
      var icon = L.divIcon({ className: '', html: '<div class="pin-marker">' + (p.count || '') + '</div>', iconSize: [26, 26] });
      L.marker([p.lat, p.lng], { icon: icon }).bindPopup('<b>' + p.title + '</b><br>' + p.count + ' ' + p.type).addTo(map);
    });
  </script>
</body>
</html>`;

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        javaScriptEnabled={true}
        originWhitelist={['*']}
        mixedContentMode="always"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%' },
  webview: { flex: 1 },
});
