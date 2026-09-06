import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { notificationApi } from '../../api/notificationApi';
import { NotificationModel } from '../../types/models';
import { MaterialIcons } from '@expo/vector-icons';

export const NotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [timeline, setTimeline] = useState<{ today: NotificationModel[]; yesterday: NotificationModel[]; this_week: NotificationModel[] }>({ today: [], yesterday: [], this_week: [] });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getNotifications();
      if (res.success) {
        setTimeline(res.data.timeline);
        setUnreadCount(res.data.unread_count);
      }
    } catch (e) {
      console.warn('Notifications fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      fetchNotifications();
    } catch (e) {
      console.warn('Mark all read error', e);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Notifications Timeline" showBack onBack={() => navigation.goBack()} showNotification={false} />

      <View style={styles.topBar}>
        <Text style={styles.unreadText}>{unreadCount} unread notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.lime} size="large" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {timeline.today.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Today</Text>
              {timeline.today.map((notif) => (
                <Card key={notif.id} style={!notif.is_read ? styles.unreadCard : null}>
                  <View style={styles.notifRow}>
                    <MaterialIcons name="notifications-active" size={20} color={Colors.lime} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifTitle}>{notif.title}</Text>
                      <Text style={styles.notifMsg}>{notif.message}</Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ) : null}

          {timeline.yesterday.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Yesterday</Text>
              {timeline.yesterday.map((notif) => (
                <Card key={notif.id}>
                  <View style={styles.notifRow}>
                    <MaterialIcons name="notifications" size={20} color={Colors.text3} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifTitle}>{notif.title}</Text>
                      <Text style={styles.notifMsg}>{notif.message}</Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ) : null}

          {timeline.this_week.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>This Week</Text>
              {timeline.this_week.map((notif) => (
                <Card key={notif.id}>
                  <View style={styles.notifRow}>
                    <MaterialIcons name="notifications-none" size={20} color={Colors.textMuted} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifTitle}>{notif.title}</Text>
                      <Text style={styles.notifMsg}>{notif.message}</Text>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  unreadText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.text2 },
  markAllText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold, color: Colors.text3 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 90 },
  section: { marginBottom: 16 },
  sectionHeader: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.heavy, color: Colors.text1, marginBottom: 8 },
  unreadCard: { borderWidth: 1, borderColor: Colors.limeBorder, backgroundColor: Colors.limeSubtle },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  notifTitle: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, color: Colors.text1 },
  notifMsg: { fontSize: Typography.sizes.xs, color: Colors.text2, marginTop: 2, lineHeight: 18 },
});
