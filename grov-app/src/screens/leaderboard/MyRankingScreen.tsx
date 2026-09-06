import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { leaderboardApi } from '../../api/leaderboardApi';
import { MyRankingData } from '../../types/api';
import { MaterialIcons } from '@expo/vector-icons';

export const MyRankingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [data, setData] = useState<MyRankingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyRanking();
  }, []);

  const fetchMyRanking = async () => {
    try {
      setLoading(true);
      const res = await leaderboardApi.getMyRanking();
      if (res.success) setData(res.data);
    } catch (e) {
      console.warn('My ranking fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <View style={styles.container}>
        <Header title="My Ranking Breakdown" showBack onBack={() => navigation.goBack()} showNotification={false} />
        <ActivityIndicator color={Colors.lime} size="large" style={{ marginTop: 60 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="My Ranking Breakdown" showBack onBack={() => navigation.goBack()} showNotification={false} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Rank Hero Card */}
        <Card variant="dark" style={styles.rankHeroCard}>
          <Text style={styles.rankBadgeText}>{data.rank} Rank Position</Text>
          <Text style={styles.userName}>{data.user.name}</Text>
          <Text style={styles.userRole}>{data.user.role}</Text>

          <View style={styles.pointsPill}>
            <MaterialIcons name="stars" size={24} color={Colors.lime} />
            <Text style={styles.pointsVal}>{data.monthly_points.toLocaleString()} Points</Text>
          </View>
        </Card>

        <Text style={styles.statusMsg}>{data.status_message}</Text>

        <Text style={styles.sectionTitle}>Detailed Impact Metrics</Text>

        <View style={styles.grid}>
          <Card style={styles.metricCard}>
            <MaterialIcons name="park" size={24} color={Colors.success} />
            <Text style={styles.valText}>{data.metrics.trees_planted.toLocaleString()}</Text>
            <Text style={styles.labelText}>Trees Planted</Text>
          </Card>

          <Card style={styles.metricCard}>
            <MaterialIcons name="grain" size={24} color={Colors.info} />
            <Text style={styles.valText}>{data.metrics.seeds_dispersed.toLocaleString()}</Text>
            <Text style={styles.labelText}>Seeds Dispersed</Text>
          </Card>

          <Card style={styles.metricCard}>
            <MaterialIcons name="insights" size={24} color={Colors.warning} />
            <Text style={styles.valText}>{data.metrics.monitoring_records.toLocaleString()}</Text>
            <Text style={styles.labelText}>Observations</Text>
          </Card>

          <Card style={styles.metricCard}>
            <MaterialIcons name="verified" size={24} color={Colors.lime} />
            <Text style={styles.valText}>{data.metrics.verified_activities}</Text>
            <Text style={styles.labelText}>Verified Ratio</Text>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 90 },
  rankHeroCard: { alignItems: 'center', paddingVertical: 24 },
  rankBadgeText: { fontSize: Typography.sizes.display, fontWeight: Typography.weights.heavy, color: Colors.lime },
  userName: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.card, marginTop: 4 },
  userRole: { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginTop: 2 },
  pointsPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(200, 255, 85, 0.12)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.pill, marginTop: 16, gap: 8 },
  pointsVal: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.heavy, color: Colors.lime },
  statusMsg: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.text2, textAlign: 'center', marginVertical: 14 },
  sectionTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.heavy, color: Colors.text1, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricCard: { width: '48%', alignItems: 'center', paddingVertical: 16 },
  valText: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.heavy, color: Colors.text1, marginTop: 6 },
  labelText: { fontSize: Typography.sizes.xs, color: Colors.text3, marginTop: 2 },
});
