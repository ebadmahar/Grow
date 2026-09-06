import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Typography } from '../../theme';
import { Button } from '../../components/common/Button';
import { MaterialIcons } from '@expo/vector-icons';

export const SeedingConfirmScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { activity } = route.params || {};

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="check-circle" size={64} color={Colors.lime} />
        </View>

        <Text style={styles.title}>Seed Bombing Logged!</Text>
        <Text style={styles.subtitle}>
          Your seed dispersal activity at {activity?.location?.name || 'the site'} has been registered successfully.
        </Text>

        <View style={styles.pointsBadge}>
          <MaterialIcons name="stars" size={24} color={Colors.lime} />
          <Text style={styles.pointsText}>+{activity?.points_awarded || 500} Points Earned</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="View Activity Details"
          onPress={() => navigation.replace('ActivityDetails', { id: activity?.id })}
          size="lg"
          style={styles.btn}
        />
        <Button
          title="Back to Dashboard"
          onPress={() => navigation.replace('MainApp')}
          variant="outline"
          size="lg"
          style={styles.btn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface, padding: 24, justifyContent: 'space-between' },
  content: { alignItems: 'center', marginTop: 100 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: Typography.sizes.display, fontWeight: Typography.weights.heavy, color: Colors.text1, letterSpacing: -1 },
  subtitle: { fontSize: Typography.sizes.base, color: Colors.text2, textAlign: 'center', lineHeight: 22, marginTop: 10 },
  pointsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.ink, paddingHorizontal: 20, paddingVertical: 12, borderRadius: Radius.pill, marginTop: 24, gap: 8 },
  pointsText: { color: Colors.lime, fontSize: Typography.sizes.lg, fontWeight: Typography.weights.heavy },
  footer: { marginBottom: 20, gap: 12 },
  btn: { width: '100%' },
});
