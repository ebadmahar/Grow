import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, Modal, TextInput } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { communityApi } from '../../api/communityApi';
import { useAuth } from '../../context/AuthContext';
import { CommunityTask } from '../../types/models';
import { MaterialIcons } from '@expo/vector-icons';

export const TaskDetailsScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { id } = route.params;
  const { user } = useAuth();
  const [task, setTask] = useState<CommunityTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editMax, setEditMax] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const res = await communityApi.getTaskDetails(id);
      if (res.success) {
        setTask(res.data);
        setEditTitle(res.data.title);
        setEditDate(res.data.date);
        setEditTime(res.data.start_time);
        setEditMax(String(res.data.max_volunteers || 30));
        setEditDesc(res.data.description);
      }
    } catch (e) {
      console.warn('Fetch task error', e);
    } finally {
      setLoading(false);
    }
  };

  const isJoined = task?.active_participants?.some((p) => p.id === user?.id);
  const canManage = user?.role === 'admin' || (user?.role === 'coordinator' && task?.creator_id === user?.id);

  const handleJoinLeave = async () => {
    try {
      setActionLoading(true);
      if (isJoined) {
        const res = await communityApi.leaveTask(id);
        if (res.success) {
          Alert.alert('Updated', 'You have left this restoration drive.');
          fetchTask();
        }
      } else {
        const res = await communityApi.joinTask(id);
        if (res.success) {
          Alert.alert('Joined!', 'You are registered for this restoration drive!');
          fetchTask();
        }
      }
    } catch (err: any) {
      Alert.alert('Action Failed', err.message || 'Operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!editTitle.trim() || !editDate.trim() || !editDesc.trim()) {
      Alert.alert('Validation Error', 'Please fill in title, date, and description.');
      return;
    }
    try {
      setEditSaving(true);
      const res = await communityApi.updateTask(id, {
        title: editTitle,
        date: editDate,
        start_time: editTime,
        max_volunteers: parseInt(editMax, 10) || 30,
        description: editDesc,
      });
      if (res.success) {
        Alert.alert('Drive Updated', 'Community restoration drive updated successfully.');
        setShowEditModal(false);
        fetchTask();
      }
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Failed to update community drive.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteTask = () => {
    Alert.alert(
      'Delete Community Drive',
      'Are you sure you want to permanently delete this restoration drive?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const res = await communityApi.deleteTask(id);
              if (res.success) {
                Alert.alert('Deleted', 'Community drive deleted.');
                navigation.goBack();
              }
            } catch (err: any) {
              Alert.alert('Delete Failed', err.message || 'Failed to delete task');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading || !task) {
    return (
      <View style={styles.container}>
        <Header title="Drive Event Details" showBack onBack={() => navigation.goBack()} showNotification={false} />
        <ActivityIndicator color={Colors.lime} size="large" style={{ marginTop: 60 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Drive Event Details" showBack onBack={() => navigation.goBack()} showNotification={false} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card variant="lime">
          <Badge label={task.activity_type} variant="dark" />
          <Text style={styles.title}>{task.title}</Text>
          <Text style={styles.sub}>{task.location?.name}</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <MaterialIcons name="event" size={18} color={Colors.ink} />
              <Text style={styles.infoText}>{task.date}</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="schedule" size={18} color={Colors.ink} />
              <Text style={styles.infoText}>{task.start_time}</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="group" size={18} color={Colors.ink} />
              <Text style={styles.infoText}>{task.participants_count || 0}/{task.max_volunteers || 30} Joined</Text>
            </View>
          </View>
        </Card>

        {/* Lead Admin / Coordinator Controls */}
        {canManage && (
          <View style={{ marginTop: 12, flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: Colors.ink, height: 44, borderRadius: Radius.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onPress={() => setShowEditModal(true)}
            >
              <MaterialIcons name="edit" size={16} color={Colors.lime} />
              <Text style={{ color: Colors.lime, fontWeight: '700', fontSize: 13 }}>Edit Drive</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1, backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#FFCDD2', height: 44, borderRadius: Radius.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onPress={handleDeleteTask}
            >
              <MaterialIcons name="delete-forever" size={16} color="#D32F2F" />
              <Text style={{ color: '#D32F2F', fontWeight: '700', fontSize: 13 }}>Delete Drive</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Event Host / Lead</Text>
        <Card>
          <View style={styles.organizerRow}>
            <View style={styles.avatarBg}>
              <MaterialIcons name="person" size={20} color={Colors.lime} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.orgName}>{task.creator?.name || 'Drive Lead'}</Text>
              <Text style={styles.orgRole}>Field Restoration Coordinator</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>About This Drive</Text>
        <Card>
          <Text style={styles.descText}>{task.description}</Text>
        </Card>

        <Text style={styles.sectionTitle}>Registered Volunteers ({task.active_participants?.length || 0})</Text>
        <Card>
          {task.active_participants?.map((p) => (
            <View key={p.id} style={styles.participantItem}>
              <MaterialIcons name="account-circle" size={20} color={Colors.text3} />
              <Text style={styles.pName}>{p.name}</Text>
              <Badge label="Registered" variant="muted" />
            </View>
          ))}
        </Card>

        <Button
          title={isJoined ? 'Leave Restoration Drive' : 'Join Restoration Drive'}
          onPress={handleJoinLeave}
          variant={isJoined ? 'outline' : 'primary'}
          loading={actionLoading}
          size="lg"
          style={styles.joinBtn}
        />
      </ScrollView>

      {/* Edit Drive Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.text1 }}>Edit Restoration Drive</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <MaterialIcons name="close" size={22} color={Colors.text1} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.text2 }}>TITLE</Text>
              <TextInput style={{ borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 8, padding: 10, fontSize: 14, color: Colors.text1 }} value={editTitle} onChangeText={setEditTitle} />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.text2 }}>DATE (YYYY-MM-DD)</Text>
                <TextInput style={{ borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 8, padding: 10, fontSize: 14, color: Colors.text1 }} value={editDate} onChangeText={setEditDate} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.text2 }}>START TIME</Text>
                <TextInput style={{ borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 8, padding: 10, fontSize: 14, color: Colors.text1 }} value={editTime} onChangeText={setEditTime} />
              </View>
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.text2 }}>MAX VOLUNTEERS</Text>
              <TextInput style={{ borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 8, padding: 10, fontSize: 14, color: Colors.text1 }} keyboardType="number-pad" value={editMax} onChangeText={setEditMax} />
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.text2 }}>DESCRIPTION</Text>
              <TextInput style={{ borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 8, padding: 10, fontSize: 14, color: Colors.text1, height: 70 }} multiline value={editDesc} onChangeText={setEditDesc} />
            </View>

            <TouchableOpacity
              style={{ backgroundColor: Colors.ink, height: 48, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginTop: 6 }}
              onPress={handleUpdateTask}
              disabled={editSaving}
            >
              {editSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 90 },
  title: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.heavy, color: Colors.text1, marginTop: 8 },
  sub: { fontSize: Typography.sizes.xs, color: Colors.text2, marginTop: 2 },
  infoRow: { flexDirection: 'row', gap: 12, marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.limeBorder },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.ink },
  sectionTitle: { fontSize: Typography.sizes.base, fontWeight: Typography.weights.heavy, color: Colors.text1, marginTop: 16, marginBottom: 8 },
  organizerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBg: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  orgName: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.text1 },
  orgRole: { fontSize: Typography.sizes.xs, color: Colors.text2 },
  descText: { fontSize: Typography.sizes.sm, color: Colors.text2, lineHeight: 22 },
  participantItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.surface2 },
  pName: { flex: 1, fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, color: Colors.text1, marginLeft: 8 },
  joinBtn: { marginTop: 20 },
});
