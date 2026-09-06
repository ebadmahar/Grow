import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { activityApi } from '../../api/activityApi';
import { Activity } from '../../types/models';
import { MaterialIcons } from '@expo/vector-icons';

export const ActivityMapDetailsScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { id } = route.params;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
  }, [id]);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const res = await activityApi.getActivityDetails(id);
      if (res.success) setActivity(res.data);
    } catch (e) {
      console.warn('Map details fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !activity) {
    return (
      <View style={styles.container}>
        <Header title="Site Location Coordinates" showBack onBack={() => navigation.goBack()} showNotification={false} />
        <ActivityIndicator color={Colors.lime} size="large" style={{ marginTop: 60 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Site Location Map" showBack onBack={() => navigation.goBack()} showNotification={false} />

      {/* Visual Map Mock Preview Box */}
      <View style={styles.mapCanvas}>
        <View style={styles.markerPin}>
          <MaterialIcons name="place" size={36} color={Colors.lime} />
        </View>
        <Text style={styles.mapLabel}>{activity.location?.name}</Text>
      </View>

      <View style={styles.infoSheet}>
        <Card variant="lime">
          <Text style={styles.siteTitle}>{activity.location?.name}</Text>
          <Text style={styles.regionText}>{activity.location?.region || 'Islamabad, Pakistan'}</Text>
          <View style={styles.coordsBadge}>
            <MaterialIcons name="my-location" size={16} color={Colors.ink} />
            <Text style={styles.coordsText}>Lat: {activity.location?.latitude}, Lng: {activity.location?.longitude}</Text>
          </View>
        </Card>

        <Card>
          <Text style={styles.infoHeading}>Restoration Parameters</Text>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Activity Type</Text>
            <Badge label={activity.activity_type.toUpperCase()} variant="dark" />
          </View>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Verification Status</Text>
            <Badge label={activity.status} variant={activity.status === 'verified' ? 'success' : 'warning'} />
          </View>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>Logged By</Text>
            <Text style={styles.paramVal}>{activity.user?.name || 'Field Restorer'}</Text>
          </View>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  mapCanvas: {
    height: 240,
    backgroundColor: Colors.inkMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPin: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.lime,
  },
  mapLabel: {
    color: Colors.lime,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    marginTop: 8,
  },
  infoSheet: {
    padding: 16,
  },
  siteTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.heavy, color: Colors.text1 },
  regionText: { fontSize: Typography.sizes.xs, color: Colors.text2, marginTop: 2 },
  coordsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.lime, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill, marginTop: 12, alignSelf: 'flex-start', gap: 6 },
  coordsText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.ink },
  infoHeading: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.heavy, color: Colors.text1, marginBottom: 12 },
  paramRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.surface2 },
  paramLabel: { fontSize: Typography.sizes.xs, color: Colors.text2 },
  paramVal: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.text1 },
});
