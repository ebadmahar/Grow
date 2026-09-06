import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { activityApi } from '../../api/activityApi';
import { Activity } from '../../types/models';
import { MaterialIcons } from '@expo/vector-icons';

export const ActivityDetailsScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { id } = route.params;
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await activityApi.getActivityDetails(id);
      if (res.success) {
        setActivity(res.data);
      }
    } catch (e) {
      console.warn('Fetch details error', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !activity) {
    return (
      <View style={styles.container}>
        <Header title="Activity Overview" showBack onBack={() => navigation.goBack()} showNotification={false} />
        <ActivityIndicator color={Colors.lime} size="large" style={{ marginTop: 60 }} />
      </View>
    );
  }

  const isPlantation = activity.activity_type === 'plantation';
  const species = isPlantation ? activity.plantation?.species : activity.seeding?.species;
  const count = isPlantation ? activity.plantation?.quantity_planted : activity.seeding?.seeds_dispersed;

  return (
    <View style={styles.container}>
      <Header title="Activity Overview" showBack onBack={() => navigation.goBack()} showNotification={false} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header Hero Card */}
        <Card variant="lime">
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Badge label={activity.activity_type.toUpperCase()} variant="dark" />
              <Text style={styles.siteName}>{activity.location?.name || 'Restoration Site'}</Text>
              <Text style={styles.countBig}>{count?.toLocaleString()} {isPlantation ? 'Saplings' : 'Seeds'}</Text>
            </View>
            <View style={styles.pointsPill}>
              <MaterialIcons name="stars" size={20} color={Colors.lime} />
              <Text style={styles.pointsVal}>+{activity.points_awarded || 0}</Text>
            </View>
          </View>
        </Card>

        {/* Stepper Status Timeline */}
        <Text style={styles.sectionTitle}>Verification & Monitoring Stepper</Text>
        <Card style={styles.stepperCard}>
          <View style={styles.stepperRow}>
            <View style={[styles.stepDot, styles.stepCompleted]}>
              <MaterialIcons name="check" size={14} color={Colors.ink} />
            </View>
            <Text style={styles.stepText}>Reported ({activity.date})</Text>
          </View>
          <View style={styles.stepLine} />

          <View style={styles.stepperRow}>
            <View style={[styles.stepDot, (activity.monitoring_records?.length || 0) > 0 ? styles.stepCompleted : null]}>
              <MaterialIcons name="insights" size={14} color={Colors.ink} />
            </View>
            <Text style={styles.stepText}>
              {(activity.monitoring_records?.length || 0) > 0 ? 'Monitored Observation Added' : 'Pending First Observation'}
            </Text>
          </View>
          <View style={styles.stepLine} />

          <View style={styles.stepperRow}>
            <View style={[styles.stepDot, activity.status === 'verified' ? styles.stepCompleted : null]}>
              <MaterialIcons name="verified" size={14} color={Colors.ink} />
            </View>
            <Text style={styles.stepText}>
              {activity.status === 'verified' ? `Community Verified` : 'Under Review'}
            </Text>
          </View>
        </Card>

        {/* Species & Technique Card */}
        <Text style={styles.sectionTitle}>Botanical Information</Text>
        {species ? (
          <Card onPress={() => navigation.navigate('SpeciesDetails', { id: species.id })}>
            <View style={styles.speciesRow}>
              <MaterialIcons name="eco" size={24} color={Colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.speciesCommon}>{species.common_name}</Text>
                <Text style={styles.speciesSci}>{species.scientific_name}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
            </View>
          </Card>
        ) : null}

        {/* Photo Evidence Gallery */}
        {activity.photos && activity.photos.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Photo Evidence</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoGallery}>
              {activity.photos.map((photo) => (
                <Image key={photo.id} source={{ uri: photo.file_path }} style={styles.galleryImg} />
              ))}
            </ScrollView>
          </>
        ) : null}

        {/* Location GPS Card */}
        <Text style={styles.sectionTitle}>GPS Site Coordinates</Text>
        <Card onPress={() => navigation.navigate('ActivityMapDetails', { id: activity.id })}>
          <View style={styles.mapCardRow}>
            <MaterialIcons name="place" size={24} color={Colors.info} />
            <View style={{ flex: 1 }}>
              <Text style={styles.mapTitle}>{activity.location?.name}</Text>
              <Text style={styles.mapCoords}>Lat: {activity.location?.latitude}, Lng: {activity.location?.longitude}</Text>
            </View>
            <Button title="View Map" onPress={() => navigation.navigate('ActivityMapDetails', { id: activity.id })} variant="dark" size="sm" />
          </View>
        </Card>

        {/* Action Button / Rejected Notice */}
        {activity.status === 'rejected' ? (
          <Card style={{ backgroundColor: '#FEE2E2', borderColor: '#EF4444', marginTop: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <MaterialIcons name="cancel" size={24} color="#DC2626" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#991B1B' }}>Activity Submission Rejected</Text>
                <Text style={{ fontSize: 11, color: '#B91C1C', marginTop: 2 }}>
                  This activity was reviewed and rejected. No monitoring observations can be added to rejected activities.
                </Text>
              </View>
            </View>
          </Card>
        ) : (
          <Button
            title="Add Monitoring Observation"
            onPress={() => navigation.navigate('AddMonitoringRecord', { activityId: activity.id })}
            size="lg"
            style={styles.addObsBtn}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 90 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  siteName: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.heavy, color: Colors.text1, marginTop: 8 },
  countBig: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.heavy, color: Colors.ink, marginTop: 4 },
  pointsPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.ink, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill, gap: 4 },
  pointsVal: { color: Colors.lime, fontWeight: Typography.weights.bold, fontSize: Typography.sizes.sm },
  sectionTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.heavy, color: Colors.text1, marginTop: 16, marginBottom: 8 },
  stepperCard: { padding: 16 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center' },
  stepCompleted: { backgroundColor: Colors.lime },
  stepText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.text1 },
  stepLine: { width: 2, height: 16, backgroundColor: Colors.cardBorder, marginLeft: 11, marginVertical: 2 },
  speciesRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  speciesCommon: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.text1 },
  speciesSci: { fontSize: Typography.sizes.xs, fontStyle: 'italic', color: Colors.text2 },
  photoGallery: { flexDirection: 'row', marginBottom: 12 },
  galleryImg: { width: 120, height: 120, borderRadius: Radius.lg, marginRight: 10 },
  mapCardRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mapTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.text1 },
  mapCoords: { fontSize: Typography.sizes.xs, color: Colors.text2, marginTop: 2 },
  addObsBtn: { marginTop: 20 },
});
