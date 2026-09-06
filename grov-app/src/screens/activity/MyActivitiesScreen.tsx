import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { activityApi } from '../../api/activityApi';
import { Activity } from '../../types/models';
import { MaterialIcons } from '@expo/vector-icons';

export const MyActivitiesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'plantation' | 'seeding' | 'monitored'>('all');

  useEffect(() => {
    fetchActivities();
  }, [filter]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await activityApi.getMyActivities(filter === 'all' ? undefined : filter);
      if (res.success) {
        setActivities(res.data);
      }
    } catch (e) {
      console.warn('Fetch my activities error', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="My Restoration Log" showBack onBack={() => navigation.goBack()} showNotification={false} />

      <View style={styles.pillsRow}>
        {(['all', 'plantation', 'seeding', 'monitored'] as const).map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.pill, filter === item ? styles.pillActive : null]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.pillText, filter === item ? styles.pillTextActive : null]}>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.lime} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const count = item.activity_type === 'plantation'
              ? item.plantation?.quantity_planted
              : item.seeding?.seeds_dispersed;

            return (
              <Card onPress={() => navigation.navigate('ActivityDetails', { id: item.id })}>
                <View style={styles.cardRow}>
                  <View style={styles.iconBg}>
                    <MaterialIcons
                      name={item.activity_type === 'plantation' ? 'park' : 'grain'}
                      size={24}
                      color={Colors.ink}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.siteTitle}>{item.location?.name || 'Restoration Site'}</Text>
                    <Text style={styles.actMeta}>
                      {item.activity_type === 'plantation' ? `${count} Trees Planted` : `${count} Seeds Dispersed`} • {item.date}
                    </Text>
                  </View>
                  <Badge label={item.status} variant={item.status === 'verified' ? 'success' : 'warning'} />
                </View>
              </Card>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  pillsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder },
  pillActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  pillText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.text2 },
  pillTextActive: { color: Colors.lime },
  listContent: { paddingHorizontal: 16, paddingBottom: 90 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBg: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.lime, alignItems: 'center', justifyContent: 'center' },
  siteTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.text1 },
  actMeta: { fontSize: Typography.sizes.xs, color: Colors.text2, marginTop: 2 },
});
