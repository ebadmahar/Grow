import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Radius, Typography } from '../../theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { leaderboardApi } from '../../api/leaderboardApi';
import { LeaderboardRanking } from '../../types/api';
import { MaterialIcons } from '@expo/vector-icons';

export const LeaderboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [rankings, setRankings] = useState<LeaderboardRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'plantation' | 'seeding' | 'community'>('plantation');
  const [period, setPeriod] = useState<'all_time' | 'weekly' | 'last_week' | 'monthly'>('all_time');

  const fetchLeaderboard = async () => {
    try {
      setRefreshing(true);
      const res = await leaderboardApi.getLeaderboard(activeTab, period);
      if (res.success) setRankings(res.data.rankings);
    } catch (e) {
      console.warn('Leaderboard fetch error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab, period]);

  useFocusEffect(
    useCallback(() => {
      fetchLeaderboard();
    }, [activeTab, period])
  );

  return (
    <View style={styles.container}>
      <Header title="Regional Leaderboard" showNotification={false} />

      {/* Hero CTA Card to My Ranking */}
      <View style={styles.myRankRow}>
        <Card variant="lime" onPress={() => navigation.navigate('MyRanking')} style={styles.myRankCard}>
          <View style={styles.myRankContent}>
            <View style={styles.rankBadgeBg}>
              <Text style={styles.rankNum}>#1</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.myRankTitle}>My Leaderboard Ranking</Text>
              <Text style={styles.myRankSub}>Tap to view your detailed points & metrics</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={Colors.ink} />
          </View>
        </Card>
      </View>

      {/* Timeframe Selector Pills (All Time / This Week / Last Week / Monthly) */}
      <View style={styles.periodRow}>
        {[
          { key: 'all_time', label: 'All Time' },
          { key: 'weekly', label: 'This Week' },
          { key: 'last_week', label: 'Last Week' },
          { key: 'monthly', label: 'Monthly' },
        ].map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.periodChip, period === p.key && styles.periodChipActive]}
            onPress={() => setPeriod(p.key as any)}
          >
            <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Activity Type Tabs Row */}
      <View style={styles.tabsRow}>
        {(['plantation', 'seeding', 'community'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab ? styles.tabActive : null]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab ? styles.tabTextActive : null]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.lime} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rankings}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchLeaderboard} tintColor={Colors.lime} />}
          ListEmptyComponent={
            <Card style={{ alignItems: 'center', paddingVertical: 24 }}>
              <MaterialIcons name="emoji-events" size={32} color={Colors.textMuted} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.text2, marginTop: 8 }}>
                No restorer activity recorded for this timeframe yet.
              </Text>
            </Card>
          }
          renderItem={({ item }) => (
            <Card style={item.rank === 1 ? styles.topRankCard : null}>
              <View style={styles.itemRow}>
                <View style={[styles.rankCircle, item.rank === 1 ? styles.rankGold : null]}>
                  <Text style={[styles.rankText, item.rank === 1 ? styles.rankTextGold : null]}>#{item.rank}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userRole}>{item.role}</Text>
                </View>
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreVal}>{(item.score || 0).toLocaleString()}</Text>
                  <Text style={styles.scoreLabel}>{activeTab === 'plantation' ? 'Trees' : (activeTab === 'seeding' ? 'Seeds' : 'Points')}</Text>
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
  myRankRow: { paddingHorizontal: 16, paddingTop: 12 },
  myRankCard: { padding: 12 },
  myRankContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankBadgeBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNum: { color: Colors.lime, fontSize: 16, fontWeight: '800' },
  myRankTitle: { fontSize: 14, fontWeight: '800', color: Colors.ink },
  myRankSub: { fontSize: 11, color: Colors.inkSoft, marginTop: 2 },
  periodRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 10, gap: 6 },
  periodChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
  },
  periodChipActive: { backgroundColor: Colors.ink },
  periodText: { fontSize: 11, fontWeight: '700', color: Colors.text2 },
  periodTextActive: { color: Colors.lime },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.limeSubtle, borderColor: Colors.limeBorder },
  tabText: { fontSize: 12, fontWeight: '700', color: Colors.text2 },
  tabTextActive: { color: Colors.ink },
  listContent: { padding: 16, gap: 10, paddingBottom: 90 },
  topRankCard: { borderColor: Colors.limeBorder, borderWidth: 1.5 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankGold: { backgroundColor: Colors.lime },
  rankText: { fontSize: 13, fontWeight: '800', color: Colors.text2 },
  rankTextGold: { color: Colors.ink },
  userName: { fontSize: 14, fontWeight: '700', color: Colors.text1 },
  userRole: { fontSize: 11, color: Colors.text2, marginTop: 1 },
  scoreContainer: { alignItems: 'flex-end' },
  scoreVal: { fontSize: 16, fontWeight: '800', color: Colors.text1 },
  scoreLabel: { fontSize: 10, fontWeight: '700', color: Colors.text3, marginTop: 1 },
});
