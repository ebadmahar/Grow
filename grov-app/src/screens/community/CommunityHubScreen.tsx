import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Radius, Typography } from '../../theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { communityApi } from '../../api/communityApi';
import { goalApi } from '../../api/goalApi';
import { CommunityTask } from '../../types/models';
import { MonthlyGoalData } from '../../types/api';
import { MaterialIcons } from '@expo/vector-icons';

export const CommunityHubScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<CommunityTask[]>([]);
  const [goal, setGoal] = useState<MonthlyGoalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCommunityData = async () => {
    try {
      setRefreshing(true);
      const [tasksRes, goalRes] = await Promise.all([
        communityApi.getTasks(),
        goalApi.getMonthlyGoal(),
      ]);

      if (tasksRes.success) setTasks(tasksRes.data);
      if (goalRes.success) setGoal(goalRes.data);
    } catch (e) {
      console.warn('Community data fetch error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCommunityData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCommunityData();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Header title="Community Hub" showNotification={false} />

      {/* Monthly Goal Header Banner */}
      {goal ? (
        <Card variant="dark" style={styles.goalBanner} onPress={() => navigation.navigate('MonthlyGoal')}>
          <View style={styles.goalRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.goalSub}>{goal.period} Goal</Text>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <Text style={styles.goalCount}>{goal.trees_planted.toLocaleString()} / {goal.target_trees.toLocaleString()} Trees</Text>
            </View>
            <View style={styles.percentBadge}>
              <Text style={styles.percentText}>{goal.completion_percentage}%</Text>
            </View>
          </View>
        </Card>
      ) : null}

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Active Community Tasks</Text>
        <TouchableOpacity style={styles.createFabBtn} onPress={() => navigation.navigate('CreateTask')}>
          <MaterialIcons name="add" size={16} color={Colors.ink} />
          <Text style={styles.createFabText}>New Drive</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator color={Colors.lime} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 95, 110) }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadCommunityData} tintColor={Colors.lime} />}
          renderItem={({ item }) => (
            <Card onPress={() => navigation.navigate('TaskDetails', { id: item.id })}>
              <View style={styles.taskCardHeader}>
                <View style={styles.typeBadge}>
                  <MaterialIcons name="groups" size={16} color={Colors.lime} />
                  <Text style={styles.typeText}>{item.activity_type}</Text>
                </View>
                <Badge label={item.status.toUpperCase()} variant="success" />
              </View>

              <Text style={styles.taskTitle}>{item.title}</Text>
              <Text style={styles.taskSub} numberOfLines={2}>{item.description}</Text>

              <View style={styles.taskMetaRow}>
                <View style={styles.metaItem}>
                  <MaterialIcons name="place" size={14} color={Colors.text3} />
                  <Text style={styles.metaText}>{item.location?.name || 'Site'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <MaterialIcons name="event" size={14} color={Colors.text3} />
                  <Text style={styles.metaText}>{item.date}</Text>
                </View>
                <View style={styles.metaItem}>
                  <MaterialIcons name="person" size={14} color={Colors.text3} />
                  <Text style={styles.metaText}>{item.participants_count || 0}/{item.max_volunteers || 30}</Text>
                </View>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  goalBanner: { margin: 16, marginBottom: 8 },
  goalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalSub: { fontSize: 10, fontWeight: Typography.weights.bold, color: Colors.textMuted, textTransform: 'uppercase' },
  goalTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.heavy, color: Colors.lime, marginTop: 2 },
  goalCount: { fontSize: Typography.sizes.xs, color: Colors.card, marginTop: 2 },
  percentBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.lime, alignItems: 'center', justifyContent: 'center' },
  percentText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.heavy, color: Colors.ink },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginVertical: 8 },
  sectionTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.heavy, color: Colors.text1 },
  createFabBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.lime, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill, gap: 4 },
  createFabText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.heavy, color: Colors.ink },
  listContent: { paddingHorizontal: 16, paddingBottom: 90 },
  taskCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.ink, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm, gap: 4 },
  typeText: { fontSize: 10, fontWeight: Typography.weights.bold, color: Colors.lime },
  taskTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.heavy, color: Colors.text1 },
  taskSub: { fontSize: Typography.sizes.xs, color: Colors.text2, marginTop: 4, lineHeight: 18 },
  taskMetaRow: { flexDirection: 'row', gap: 12, marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.surface2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: Typography.sizes.xs, color: Colors.text3 },
});
