import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { speciesApi } from '../../api/speciesApi';
import { Species } from '../../types/models';
import { MaterialIcons } from '@expo/vector-icons';

export const SpeciesDetailsScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { id } = route.params;
  const [species, setSpecies] = useState<Species | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpeciesDetails();
  }, [id]);

  const fetchSpeciesDetails = async () => {
    try {
      setLoading(true);
      const res = await speciesApi.getSpeciesDetails(id);
      if (res.success) setSpecies(res.data);
    } catch (e) {
      console.warn('Fetch species error', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !species) {
    return (
      <View style={styles.container}>
        <Header title="Species Guide" showBack onBack={() => navigation.goBack()} showNotification={false} />
        <ActivityIndicator color={Colors.lime} size="large" style={{ marginTop: 60 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Species Botanical Profile" showBack onBack={() => navigation.goBack()} showNotification={false} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card variant="lime">
          <View style={styles.badgeRow}>
            <Badge label={species.is_native ? 'NATIVE INDIGENOUS SPECIES' : 'INTRODUCED'} variant={species.is_native ? 'dark' : 'warning'} />
            <Badge label={species.category.toUpperCase()} variant="muted" />
          </View>
          <Text style={styles.commonName}>{species.common_name}</Text>
          <Text style={styles.sciName}>{species.scientific_name}</Text>
          {species.local_name ? <Text style={styles.localName}>Local: {species.local_name}</Text> : null}
        </Card>

        <Text style={styles.sectionTitle}>Suitable Ecosystem Zones</Text>
        <Card>
          <View style={styles.infoRow}>
            <MaterialIcons name="place" size={20} color={Colors.info} />
            <Text style={styles.infoText}>{species.suitable_zones || 'Sub-Himalayan foothills and Margalla ridges'}</Text>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Botanical Description</Text>
        <Card>
          <Text style={styles.bodyText}>{species.basic_description || 'Native tree species adapted to local micro-climate conditions.'}</Text>
        </Card>

        <Text style={styles.sectionTitle}>Planting & Care Guidance</Text>
        <Card>
          <View style={styles.guidanceRow}>
            <MaterialIcons name="eco" size={22} color={Colors.success} />
            <Text style={[styles.bodyText, { flex: 1 }]}>{species.basic_guidance || 'Plant in well-drained rocky soil at the start of monsoon rains.'}</Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 90 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  commonName: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.heavy, color: Colors.text1 },
  sciName: { fontSize: Typography.sizes.sm, fontStyle: 'italic', color: Colors.text2, marginTop: 2 },
  localName: { fontSize: Typography.sizes.xs, color: Colors.text3, marginTop: 4 },
  sectionTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.heavy, color: Colors.text1, marginTop: 16, marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontSize: Typography.sizes.sm, color: Colors.text1, flex: 1 },
  bodyText: { fontSize: Typography.sizes.sm, color: Colors.text2, lineHeight: 22 },
  guidanceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
});
