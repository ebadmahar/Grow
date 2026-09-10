import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Typography } from '../../theme';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { MaterialIcons } from '@expo/vector-icons';

export const CreateActivityScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <Header title="Log Ecological Activity" showNotification={false} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 95, 110) }]}
      >
        <Text style={styles.heading}>Select Activity Type</Text>
        <Text style={styles.subHeading}>Choose the restoration action you performed in the field</Text>

        {/* Tree Plantation Selector */}
        <Card style={styles.selectorCard} onPress={() => navigation.navigate('PlantationForm')}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBg}>
              <MaterialIcons name="park" size={28} color={Colors.lime} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Tree Plantation</Text>
              <Text style={styles.cardSub}>Planting saplings, pit planting, trench planting</Text>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={18} color={Colors.textMuted} />
          </View>
          <View style={styles.rewardBadge}>
            <MaterialIcons name="stars" size={16} color={Colors.lime} />
            <Text style={styles.rewardText}>Earn +10 pts per sapling planted</Text>
          </View>
        </Card>

        {/* Seed Bombing Selector */}
        <Card style={styles.selectorCard} onPress={() => navigation.navigate('SeedingForm')}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBg}>
              <MaterialIcons name="grain" size={28} color={Colors.lime} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Seed Bombing / Dispersal</Text>
              <Text style={styles.cardSub}>Direct seeding, aerial bombing, hand broadcasting</Text>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={18} color={Colors.textMuted} />
          </View>
          <View style={styles.rewardBadge}>
            <MaterialIcons name="stars" size={16} color={Colors.lime} />
            <Text style={styles.rewardText}>Earn +1 pt per seed dispersed</Text>
          </View>
        </Card>

        {/* Environmental Issue Report Selector */}
        <Card style={styles.selectorCard} onPress={() => navigation.navigate('ReportActivity')}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBg, { backgroundColor: Colors.inkSoft }]}>
              <MaterialIcons name="report-problem" size={28} color={Colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Report Ecological Threat</Text>
              <Text style={styles.cardSub}>Pest attack, fire hazard, illegal cutting, dumping</Text>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={18} color={Colors.textMuted} />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 90,
  },
  heading: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.heavy,
    color: Colors.text1,
    marginTop: 8,
  },
  subHeading: {
    fontSize: Typography.sizes.sm,
    color: Colors.text2,
    marginTop: 4,
    marginBottom: 20,
  },
  selectorCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.heavy,
    color: Colors.text1,
  },
  cardSub: {
    fontSize: Typography.sizes.xs,
    color: Colors.text2,
    marginTop: 2,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ink,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    marginTop: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  rewardText: {
    color: Colors.lime,
    fontSize: 10,
    fontWeight: Typography.weights.bold,
  },
});
