import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { HomeMapPreview } from '../../components/home/HomeMapPreview';
import { Colors, Radius } from '../../theme';
import { Header } from '../../components/common/Header';
import { activityApi } from '../../api/activityApi';
import { goalApi } from '../../api/goalApi';
import { weatherApi, AqiData } from '../../api/weatherApi';
import { useAuth } from '../../context/AuthContext';
import { Activity, MapPin } from '../../types/models';
import { MonthlyGoalData, ExploreStatsData } from '../../types/api';
import { MaterialIcons } from '@expo/vector-icons';

export const HomeDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [stats, setStats] = useState<ExploreStatsData | null>(null);
  const [monthlyGoal, setMonthlyGoal] = useState<MonthlyGoalData | null>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [mapPins, setMapPins] = useState<MapPin[]>([]);
  const [aqiData, setAqiData] = useState<AqiData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, goalRes, actRes, aqiRes, pinsRes] = await Promise.all([
        activityApi.getExploreStats(),
        goalApi.getMonthlyGoal(),
        activityApi.getMyActivities(),
        weatherApi.getIslamabadAqi(),
        activityApi.getMapPins(),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (goalRes.success) setMonthlyGoal(goalRes.data);
      if (actRes.success) setRecentActivities(actRes.data.slice(0, 3));
      if (aqiRes.success && aqiRes.data) setAqiData(aqiRes.data);
      if (pinsRes.success) setMapPins(pinsRes.data);
    } catch (e) {
      console.warn('Dashboard fetch error', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const totalPlanted = stats?.total_planted !== undefined && stats?.total_planted !== null ? stats.total_planted.toLocaleString() : '0';
  const activeSites = stats?.active_sites !== undefined && stats?.active_sites !== null ? stats.active_sites.toString() : '0';

  const mapPreviewHtml = `
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
        var map = L.map('map', { zoomControl: false, dragging: false, touchZoom: false, scrollWheelZoom: false }).setView([33.7294, 73.0931], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

        ${mapPins.map((p) => `
          L.marker([${p.latitude}, ${p.longitude}], {
            icon: L.divIcon({ className: '', html: '<div class="pin-marker">${p.activity_type === 'plantation' ? '🌲' : '🌱'}</div>', iconSize: [26, 26], iconAnchor: [13, 13] })
          }).addTo(map);
        `).join('')}
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <Header
        onNotificationPress={() => navigation.navigate('Notifications')}
        onProfilePress={() => navigation.navigate('ProfileTab')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 90, 100) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadDashboardData} tintColor={Colors.lime} />
        }
      >
        <View style={styles.heroStatCard}>
          <View style={styles.glowCircle} />

          <View style={styles.heroHeaderRow}>
            <View style={styles.heroLocation}>
              <MaterialIcons name="location-on" size={12} color={Colors.lime} />
              <Text style={styles.heroLocationText}>MARGALLA HILLS ZONE</Text>
            </View>

            <View style={styles.aqiBadge}>
              <View style={styles.aqiDot} />
              <Text style={styles.aqiText}>
                AQI {aqiData?.aqi ?? '--'}
              </Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Community Restoration{"\n"}in Action</Text>
          <Text style={styles.heroSub}>
            {stats?.daily_recorded ?? 0} saplings & seeds recorded today across Islamabad sectors.
          </Text>

          <View style={styles.heroStatsGrid}>
            <View style={styles.heroStatCell}>
              <Text style={styles.heroStatValue}>{totalPlanted}</Text>
              <Text style={styles.heroStatLabel}>Planted</Text>
            </View>
            <View style={styles.heroStatCell}>
              <Text style={styles.heroStatValue}>{activeSites}</Text>
              <Text style={styles.heroStatLabel}>Active Sites</Text>
            </View>
            <View style={styles.heroStatCell}>
              <Text style={styles.heroStatValue}>
                {stats?.co2_offset_kg ? (stats.co2_offset_kg >= 1000 ? `${(stats.co2_offset_kg / 1000).toFixed(1)}T` : `${stats.co2_offset_kg}kg`) : '0kg'}
              </Text>
              <Text style={styles.heroStatLabel}>CO₂ Offset</Text>
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <TouchableOpacity
            style={[styles.actionChip, styles.actionChipPrimary]}
            onPress={() => navigation.navigate('PlantationForm')}
            activeOpacity={0.85}
          >
            <MaterialIcons name="forest" size={15} color={Colors.lime} />
            <Text style={styles.actionChipPrimaryText}>Log Plantation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionChip, styles.actionChipSecondary]}
            onPress={() => navigation.navigate('SeedingForm')}
            activeOpacity={0.85}
          >
            <MaterialIcons name="grass" size={15} color="#7A5AF8" />
            <Text style={styles.actionChipSecondaryText}>Seed Bombing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionChip, styles.actionChipSecondary]}
            onPress={() => navigation.navigate('ReportActivity')}
            activeOpacity={0.85}
          >
            <MaterialIcons name="flag" size={15} color="#E53935" />
            <Text style={styles.actionChipSecondaryText}>Report Issue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionChip, styles.actionChipSecondary]}
            onPress={() => navigation.navigate('ReportBugSuggestion')}
            activeOpacity={0.85}
          >
            <MaterialIcons name="bug-report" size={15} color="#F59E0B" />
            <Text style={styles.actionChipSecondaryText}>Report Bug / Idea</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionChip, styles.actionChipSecondary]}
            onPress={() => navigation.navigate('ExploreTab')}
            activeOpacity={0.85}
          >
            <MaterialIcons name="visibility" size={15} color="#0891B2" />
            <Text style={styles.actionChipSecondaryText}>Monitor Sites</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Live Restoration Map</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ExploreTab')}>
              <Text style={styles.sectionLink}>Open Full Map</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.mapWrap}
            onPress={() => navigation.navigate('ExploreTab')}
            activeOpacity={0.9}
          >
            <HomeMapPreview mapPins={mapPins} mapPreviewHtml={mapPreviewHtml} />

            <View style={styles.mapOverlay}>
              <View style={styles.mapBadge}>
                <MaterialIcons name="my-location" size={14} color={Colors.ink} />
                <Text style={styles.mapBadgeText}>{activeSites} Active Field Sites in Islamabad</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Field Activities</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyActivities')}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardContainer}>
            {recentActivities.length > 0 ? (
              recentActivities.map((act, index) => {
                const count =
                  act.activity_type === 'plantation'
                    ? act.plantation?.quantity_planted ?? 0
                    : act.seeding?.seeds_dispersed ?? 0;

                return (
                  <TouchableOpacity
                    key={act.id || index}
                    style={styles.activityRow}
                    onPress={() => navigation.navigate('ActivityDetails', { id: act.id })}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.activityIcon,
                        { backgroundColor: act.activity_type === 'plantation' ? '#EAF9EF' : '#F3E8FF' },
                      ]}
                    >
                      <MaterialIcons
                        name={act.activity_type === 'plantation' ? 'forest' : 'grass'}
                        size={20}
                        color={act.activity_type === 'plantation' ? '#1A6636' : '#7A5AF8'}
                      />
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityName}>{act.location?.name || 'Restoration Site'}</Text>
                      <Text style={styles.activityMeta}>
                        {act.location?.name ? `${act.location.name} • ${act.status === 'verified' ? 'Verified' : 'Pending Verification'}` : 'Margalla Field Zone'}
                      </Text>
                      <View style={styles.badgeWrap}>
                        <View style={act.activity_type === 'plantation' ? styles.badgeGreen : styles.badgeNeutral}>
                          <Text
                            style={
                              act.activity_type === 'plantation' ? styles.badgeGreenText : styles.badgeNeutralText
                            }
                          >
                            {act.activity_type === 'plantation' ? `+${count} Saplings` : `${count} Seeds`}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyWrap}>
                <MaterialIcons name="nature-people" size={24} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No field activities logged yet. Drop a pin on the map!</Text>
              </View>
            )}
          </View>
        </View>
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
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  heroStatCard: {
    backgroundColor: Colors.ink,
    borderRadius: Radius.lg,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  glowCircle: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.limeGlow,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  heroLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroLocationText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.lime,
    letterSpacing: 1,
  },
  aqiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  aqiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.lime,
  },
  aqiText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 12,
    color: '#9DAF9A',
    lineHeight: 18,
    marginBottom: 18,
  },
  heroStatsGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 14,
  },
  heroStatCell: {
    flex: 1,
  },
  heroStatValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.lime,
  },
  heroStatLabel: {
    fontSize: 10,
    color: '#9DAF9A',
    marginTop: 2,
  },
  chipsRow: {
    gap: 8,
    paddingRight: 16,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
  },
  actionChipPrimary: {
    backgroundColor: Colors.ink,
  },
  actionChipPrimaryText: {
    color: Colors.lime,
    fontSize: 12,
    fontWeight: '700',
  },
  actionChipSecondary: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  actionChipSecondaryText: {
    color: Colors.text1,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionWrap: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text1,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text2,
  },
  mapWrap: {
    height: 180,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  nativeMapPlaceholder: {
    flex: 1,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nativeMapText: {
    color: Colors.lime,
    fontSize: 12,
    fontWeight: '800',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  mapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.lime,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  mapBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.ink,
  },
  cardContainer: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 14,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  activityIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text1,
  },
  activityMeta: {
    fontSize: 11,
    color: Colors.text3,
    marginTop: 2,
  },
  badgeWrap: {
    flexDirection: 'row',
    marginTop: 4,
  },
  badgeGreen: {
    backgroundColor: '#EAF9EF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  badgeGreenText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A6636',
  },
  badgeNeutral: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  badgeNeutralText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7A5AF8',
  },
  emptyWrap: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 6,
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
