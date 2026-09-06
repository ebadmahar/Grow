import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { goalApi } from '../../api/goalApi';
import { MonthlyGoalData } from '../../types/api';
import { MaterialIcons } from '@expo/vector-icons';

export const MonthlyGoalScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [goal, setGoal] = useState<MonthlyGoalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoal();
  }, []);

  const fetchGoal = async () => {
    try {
      setLoading(true);
      const res = await goalApi.getMonthlyGoal();
      if (res.success) setGoal(res.data);
    } catch (e) {
      console.warn('Fetch goal error', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !goal) {
    return (
      <View style={styles.container}>
        <Header title="Monthly Restoration Goal" showBack onBack={() => navigation.goBack()} showNotification={false} />
        <ActivityIndicator color={Colors.lime} size="large" style={{ marginTop: 60 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Monthly Goal Breakdown" showBack onBack={() => navigation.goBack()} showNotification={false} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Large Progress Hero Box */}
        <Card variant="dark" style={styles.heroCard}>
          <Text style={styles.periodText}>{goal.period}</Text>
          <Text style={styles.titleText}>{goal.title}</Text>

          <View style={styles.gaugeContainer}>
            <Text style={styles.gaugeVal}>{goal.completion_percentage}%</Text>
            <Text style={styles.gaugeSub}>Goal Target Reached</Text>
          </View>

          <Text style={styles.countBig}>{goal.trees_planted.toLocaleString()} / {goal.target_trees.toLocaleString()} Trees</Text>
        </Card>

        <Text style={styles.sectionTitle}>Sub-Goal Breakdown Metrics</Text>
        {goal.sub_goals.map((sub, idx) => (
          <Card key={idx}>
            <View style={styles.subHeader}>
              <Text style={styles.subName}>{sub.name}</Text>
              <Text style={styles.subPct}>{sub.percentage}%</Text>
            </View>
            <Text style={styles.subCount}>{sub.current.toLocaleString()} / {sub.target.toLocaleString()}</Text>
            <View style={styles.track}>
              <View style={[styles.bar, { width: `${Math.min(sub.percentage, 100)}%` }]} />
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 90 },
  heroCard: { alignItems: 'center', paddingVertical: 24 },
  periodText: { fontSize: 10, fontWeight: Typography.weights.bold, color: Colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  titleText: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.heavy, color: Colors.lime, marginTop: 4 },
  gaugeContainer: { width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(200, 255, 85, 0.12)', borderWidth: 3, borderColor: Colors.lime, alignItems: 'center', justifyContent: 'center', marginVertical: 20 },
  gaugeVal: { fontSize: Typography.sizes.xxl, fontWeight: Typography.weights.heavy, color: Colors.lime },
  gaugeSub: { fontSize: 8, fontWeight: Typography.weights.bold, color: Colors.card, marginTop: 2 },
  countBig: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.card },
  sectionTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.heavy, color: Colors.text1, marginTop: 16, marginBottom: 10 },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  subName: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.text1 },
  subPct: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.heavy, color: Colors.text3 },
  subCount: { fontSize: Typography.sizes.xs, color: Colors.text2, marginBottom: 8 },
  track: { height: 8, backgroundColor: Colors.surface2, borderRadius: Radius.pill, overflow: 'hidden' },
  bar: { height: '100%', backgroundColor: Colors.lime },
});
