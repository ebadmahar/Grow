import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Radius, Typography } from '../../theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { adminApi } from '../../api/adminApi';
import { goalApi } from '../../api/goalApi';
import { AdminDashboardData, MonthlyGoalData } from '../../types/api';
import { Activity, ReportModel, User } from '../../types/models';
import { MaterialIcons } from '@expo/vector-icons';

export const AdminDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [dashData, setDashData] = useState<AdminDashboardData | null>(null);
  const [activitiesQueue, setActivitiesQueue] = useState<Activity[]>([]);
  const [reportsQueue, setReportsQueue] = useState<ReportModel[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [monthlyGoal, setMonthlyGoal] = useState<MonthlyGoalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'activities' | 'users' | 'reports' | 'goals' | 'broadcast'>('activities');

  // Goal Form State
  const [targetTrees, setTargetTrees] = useState('100000');
  const [targetSeeds, setTargetSeeds] = useState('50000');
  const [targetParticipants, setTargetParticipants] = useState('200');
  const [savingGoal, setSavingGoal] = useState(false);

  // Broadcast Form State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const loadAdminData = async () => {
    try {
      setRefreshing(true);
      const [dashRes, actRes, repRes, goalRes, usersRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getActivitiesQueue('reported'),
        adminApi.getReportsQueue(),
        goalApi.getMonthlyGoal(),
        adminApi.getUsers(),
      ]);

      if (dashRes.success) setDashData(dashRes.data);
      if (actRes.success) setActivitiesQueue(actRes.data);
      if (repRes.success) setReportsQueue(repRes.data);
      if (usersRes.success) setUsersList(usersRes.data);
      if (goalRes.success && goalRes.data) {
        setMonthlyGoal(goalRes.data);
        setTargetTrees(String(goalRes.data.target_trees || 100000));
        setTargetSeeds(String(goalRes.data.target_seeds || 50000));
        setTargetParticipants(String(goalRes.data.target_participants || 200));
      }
    } catch (e) {
      console.warn('Admin data fetch error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAdminData();
    }, [])
  );

  const handleVerifyActivity = async (id: number, status: 'verified' | 'rejected') => {
    try {
      const res = await adminApi.verifyActivity(id, status);
      if (res.success) {
        Alert.alert(
          'Verification Processed',
          `Activity marked as ${status}. ${status === 'verified' ? 'Points credited to user.' : ''}`
        );
        loadAdminData();
      }
    } catch (err: any) {
      Alert.alert('Action Failed', err.message || 'Verification update failed.');
    }
  };

  const handleUpdateUserRole = async (userId: number, newRole: 'volunteer' | 'coordinator' | 'admin') => {
    try {
      const res = await adminApi.updateUserRole(userId, newRole);
      if (res.success) {
        Alert.alert('Role Updated', `User role changed to ${newRole}`);
        loadAdminData();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    Alert.alert('Delete User', 'Are you sure you want to remove this user account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await adminApi.deleteUser(userId);
            if (res.success) {
              Alert.alert('User Removed', 'User account deleted successfully.');
              loadAdminData();
            }
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete user');
          }
        },
      },
    ]);
  };

  const handleResolveReport = async (id: number, status: 'investigating' | 'resolved' | 'dismissed') => {
    try {
      const res = await adminApi.resolveReport(id, { status, resolution_notes: 'Processed by Admin.' });
      if (res.success) {
        Alert.alert('Report Updated', `Report status updated to ${status}.`);
        loadAdminData();
      }
    } catch (err: any) {
      Alert.alert('Action Failed', err.message || 'Report status update failed.');
    }
  };

  const handleSaveGoal = async () => {
    try {
      setSavingGoal(true);
      const res = await adminApi.updateMonthlyGoal({
        target_trees: parseInt(targetTrees, 10) || 100000,
        target_seeds: parseInt(targetSeeds, 10) || 50000,
        target_participants: parseInt(targetParticipants, 10) || 200,
      });

      if (res.success) {
        Alert.alert('Goal Updated', 'Monthly community goal targets updated successfully!');
        loadAdminData();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update goal');
    } finally {
      setSavingGoal(false);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastTitle || !broadcastMessage) {
      Alert.alert('Validation Error', 'Please enter both broadcast title and message.');
      return;
    }

    try {
      setSendingBroadcast(true);
      const res = await adminApi.broadcastNotification({
        title: broadcastTitle,
        message: broadcastMessage,
      });

      if (res.success) {
        Alert.alert('Broadcast Sent!', 'Notification successfully dispatched to all registered community users.');
        setBroadcastTitle('');
        setBroadcastMessage('');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send broadcast');
    } finally {
      setSendingBroadcast(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header title="Admin Moderation Panel" showBack onBack={() => navigation.goBack()} showNotification={false} />
        <ActivityIndicator color={Colors.lime} size="large" style={{ marginTop: 60 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Admin Moderation Panel" showBack onBack={() => navigation.goBack()} showNotification={false} />

      {/* Top Metrics Summary */}
      {dashData ? (
        <View style={styles.metricsGrid}>
          <Card style={styles.metricItem}>
            <Text style={styles.metricVal}>{dashData.total_users}</Text>
            <Text style={styles.metricLabel}>Total Users</Text>
          </Card>
          <Card style={styles.metricItem}>
            <Text style={styles.metricVal}>{dashData.trees_planted.toLocaleString()}</Text>
            <Text style={styles.metricLabel}>Trees Planted</Text>
          </Card>
          <Card style={styles.metricItem}>
            <Text style={styles.metricVal}>{dashData.pending_review}</Text>
            <Text style={styles.metricLabel}>Pending Queue</Text>
          </Card>
        </View>
      ) : null}

      {/* Admin Tab Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'activities' && styles.tabActive]}
          onPress={() => setActiveTab('activities')}
        >
          <MaterialIcons name="fact-check" size={14} color={activeTab === 'activities' ? Colors.lime : Colors.text2} />
          <Text style={[styles.tabText, activeTab === 'activities' && styles.tabTextActive]}>
            Activity Queue ({activitiesQueue.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'users' && styles.tabActive]}
          onPress={() => setActiveTab('users')}
        >
          <MaterialIcons name="people" size={14} color={activeTab === 'users' ? Colors.lime : Colors.text2} />
          <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
            Users & Roles ({usersList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'reports' && styles.tabActive]}
          onPress={() => setActiveTab('reports')}
        >
          <MaterialIcons name="bug-report" size={14} color={activeTab === 'reports' ? Colors.lime : Colors.text2} />
          <Text style={[styles.tabText, activeTab === 'reports' && styles.tabTextActive]}>
            Reports & Bugs ({reportsQueue.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'goals' && styles.tabActive]}
          onPress={() => setActiveTab('goals')}
        >
          <MaterialIcons name="flag" size={14} color={activeTab === 'goals' ? Colors.lime : Colors.text2} />
          <Text style={[styles.tabText, activeTab === 'goals' && styles.tabTextActive]}>Monthly Goals</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'broadcast' && styles.tabActive]}
          onPress={() => setActiveTab('broadcast')}
        >
          <MaterialIcons name="campaign" size={14} color={activeTab === 'broadcast' ? Colors.lime : Colors.text2} />
          <Text style={[styles.tabText, activeTab === 'broadcast' && styles.tabTextActive]}>Broadcast</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Tab 1: Activity Verification Queue */}
      {activeTab === 'activities' && (
        <FlatList
          data={activitiesQueue}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 40, 60) }]}
          renderItem={({ item }) => {
            const count =
              item.activity_type === 'plantation'
                ? item.plantation?.quantity_planted
                : item.seeding?.seeds_dispersed;

            return (
              <Card style={{ marginBottom: 10 }}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.location?.name || 'Restoration Site'}</Text>
                    <Text style={styles.itemSub}>
                      Logged by {item.user?.name || 'Member'} • {count ?? 0} {item.activity_type === 'plantation' ? 'Saplings' : 'Seeds'} • {item.date}
                    </Text>
                  </View>
                  <Badge label={item.status} variant="warning" />
                </View>

                {item.field_notes ? (
                  <Text style={styles.descText}>Notes: {item.field_notes}</Text>
                ) : null}

                <View style={styles.actionBtnRow}>
                  <Button
                    title="Approve & Award Points"
                    onPress={() => handleVerifyActivity(item.id, 'verified')}
                    variant="primary"
                    size="sm"
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Reject"
                    onPress={() => handleVerifyActivity(item.id, 'rejected')}
                    variant="outline"
                    size="sm"
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>
            );
          }}
        />
      )}

      {/* Tab 2: Users & Role Management */}
      {activeTab === 'users' && (
        <FlatList
          data={usersList}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 40, 60) }]}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 10 }}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{item.name}</Text>
                  <Text style={styles.itemSub}>{item.email} • {item.location || 'Islamabad'}</Text>
                </View>
                <Badge
                  label={item.role.toUpperCase()}
                  variant={item.role === 'admin' ? 'dark' : (item.role === 'coordinator' ? 'lime' : 'muted')}
                />
              </View>

              <Text style={{ fontSize: 11, color: Colors.text2, marginTop: 4 }}>
                Submissions: {item.activities_count || 0} activities
              </Text>

              {/* Role Change Buttons */}
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
                <TouchableOpacity
                  style={[styles.roleChip, item.role === 'volunteer' && styles.roleChipActive]}
                  onPress={() => handleUpdateUserRole(item.id, 'volunteer')}
                >
                  <Text style={[styles.roleChipText, item.role === 'volunteer' && styles.roleChipTextActive]}>Volunteer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleChip, item.role === 'coordinator' && styles.roleChipActive]}
                  onPress={() => handleUpdateUserRole(item.id, 'coordinator')}
                >
                  <Text style={[styles.roleChipText, item.role === 'coordinator' && styles.roleChipTextActive]}>Coordinator</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleChip, item.role === 'admin' && styles.roleChipActive]}
                  onPress={() => handleUpdateUserRole(item.id, 'admin')}
                >
                  <Text style={[styles.roleChipText, item.role === 'admin' && styles.roleChipTextActive]}>Admin</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleChip, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}
                  onPress={() => handleDeleteUser(item.id)}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#DC2626' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        />
      )}

      {/* Tab 3: Reports & Bug Queue */}
      {activeTab === 'reports' && (
        <FlatList
          data={reportsQueue}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 40, 60) }]}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: 10 }}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{item.category || 'Issue Report'}</Text>
                  <Text style={styles.itemSub}>Location: {item.location_name}</Text>
                </View>
                <Badge label={item.severity} variant={item.severity === 'High' ? 'warning' : 'info'} />
              </View>

              <Text style={styles.descText}>{item.description}</Text>

              <View style={styles.actionBtnRow}>
                <Button
                  title="Mark Investigating"
                  onPress={() => handleResolveReport(item.id, 'investigating')}
                  variant="outline"
                  size="sm"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Resolve Issue"
                  onPress={() => handleResolveReport(item.id, 'resolved')}
                  variant="primary"
                  size="sm"
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          )}
        />
      )}

      {/* Tab 4: Monthly Goal Targets Form */}
      {activeTab === 'goals' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 40, 60) }]}>
          <Card style={{ gap: 12 }}>
            <Text style={styles.formSectionTitle}>Update Monthly Goal Targets</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>TARGET TREES PLANTED</Text>
              <TextInput
                style={styles.formInput}
                value={targetTrees}
                onChangeText={setTargetTrees}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>TARGET SEEDS DISPERSED</Text>
              <TextInput
                style={styles.formInput}
                value={targetSeeds}
                onChangeText={setTargetSeeds}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>TARGET VOLUNTEER PARTICIPANTS</Text>
              <TextInput
                style={styles.formInput}
                value={targetParticipants}
                onChangeText={setTargetParticipants}
                keyboardType="numeric"
              />
            </View>

            <Button
              title={savingGoal ? 'Saving Targets...' : 'Update Monthly Goal'}
              onPress={handleSaveGoal}
              disabled={savingGoal}
              variant="primary"
              size="md"
            />
          </Card>
        </ScrollView>
      )}

      {/* Tab 5: Community Broadcast Form */}
      {activeTab === 'broadcast' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 40, 60) }]}>
          <Card style={{ gap: 12 }}>
            <Text style={styles.formSectionTitle}>Broadcast Community Alert</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>NOTIFICATION TITLE</Text>
              <TextInput
                style={styles.formInput}
                value={broadcastTitle}
                onChangeText={setBroadcastTitle}
                placeholder="e.g. Margalla Drive Tomorrow!"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>BROADCAST MESSAGE</Text>
              <TextInput
                style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
                value={broadcastMessage}
                onChangeText={setBroadcastMessage}
                multiline
                placeholder="Message body delivered to all community members..."
              />
            </View>

            <Button
              title={sendingBroadcast ? 'Dispatching Alert...' : 'Send Broadcast to All Users'}
              onPress={handleSendBroadcast}
              disabled={sendingBroadcast}
              variant="primary"
              size="md"
            />
          </Card>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  metricsGrid: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  metricItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  metricVal: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.heavy, color: Colors.text1 },
  metricLabel: { fontSize: 10, color: Colors.text3, fontWeight: Typography.weights.bold, marginTop: 2 },
  tabRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tabActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  tabText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.text2 },
  tabTextActive: { color: Colors.lime },
  listContent: { paddingHorizontal: 16, paddingTop: 6 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.text1 },
  itemSub: { fontSize: Typography.sizes.xs, color: Colors.text2, marginTop: 2 },
  descText: { fontSize: Typography.sizes.xs, color: Colors.text1, marginTop: 8, fontStyle: 'italic' },
  actionBtnRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  formSectionTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.heavy, color: Colors.text1 },
  formGroup: { gap: 4 },
  formLabel: { fontSize: 10, fontWeight: Typography.weights.bold, color: Colors.text3, letterSpacing: 0.5 },
  formInput: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: Typography.sizes.sm,
    color: Colors.text1,
  },
  roleChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.surface,
  },
  roleChipActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  roleChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text2,
  },
  roleChipTextActive: {
    color: Colors.lime,
  },
});
