import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius } from '../../theme';
import { Header } from '../../components/common/Header';
import { reportApi } from '../../api/reportApi';
import { MaterialIcons } from '@expo/vector-icons';

export const ReportBugSuggestionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [reportType, setReportType] = useState<'bug' | 'suggestion'>('bug');
  const [locationName, setLocationName] = useState('Margalla Hills Zone');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please describe the bug or feature suggestion.');
      return;
    }

    try {
      setSubmitting(true);
      const category = reportType === 'bug' ? 'Platform Bug Report' : 'Feature Suggestion';
      const severity = reportType === 'bug' ? 'Medium' : 'Low';

      await reportApi.submitReport({
        site_name: locationName,
        category,
        severity,
        description,
      });

      Alert.alert(
        'Feedback Sent',
        'Thank you! Your bug report / feature suggestion has been sent directly to the Admin Dashboard.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert('Submission Error', e?.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Report Bug / Suggestion" showNotification={false} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 40, 60) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Submit Feedback to Platform Admin</Text>
          <Text style={styles.cardSub}>
            Help us improve Grōv! Report technical issues or suggest new features for future updates.
          </Text>

          {/* Toggle Type */}
          <Text style={styles.inputLabel}>TYPE OF FEEDBACK</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, reportType === 'bug' && styles.toggleBtnActive]}
              onPress={() => setReportType('bug')}
            >
              <MaterialIcons
                name="bug-report"
                size={16}
                color={reportType === 'bug' ? Colors.lime : Colors.text2}
              />
              <Text style={[styles.toggleBtnText, reportType === 'bug' && styles.toggleBtnTextActive]}>
                Report a Bug
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, reportType === 'suggestion' && styles.toggleBtnActive]}
              onPress={() => setReportType('suggestion')}
            >
              <MaterialIcons
                name="lightbulb"
                size={16}
                color={reportType === 'suggestion' ? Colors.lime : Colors.text2}
              />
              <Text style={[styles.toggleBtnText, reportType === 'suggestion' && styles.toggleBtnTextActive]}>
                Feature Suggestion
              </Text>
            </TouchableOpacity>
          </View>

          {/* Location / Module */}
          <Text style={styles.inputLabel}>APP SECTION / MODULE</Text>
          <TextInput
            style={styles.input}
            value={locationName}
            onChangeText={setLocationName}
            placeholder="e.g. Map View / Community Hub"
          />

          {/* Description */}
          <Text style={styles.inputLabel}>DESCRIPTION & DETAILS</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what happened, error steps, or your proposed idea..."
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.lime} size="small" />
            ) : (
              <>
                <MaterialIcons name="send" size={16} color={Colors.lime} />
                <Text style={styles.submitBtnText}>Submit to Admin Dashboard</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: 18,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text1,
  },
  cardSub: {
    fontSize: 12,
    color: Colors.text2,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.text2,
    letterSpacing: 0.8,
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.surface,
  },
  toggleBtnActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text2,
  },
  toggleBtnTextActive: {
    color: Colors.lime,
  },
  input: {
    height: 44,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.cardBorder,
    paddingHorizontal: 12,
    fontSize: 13,
    color: Colors.text1,
    backgroundColor: Colors.surface,
  },
  textArea: {
    height: 110,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  submitBtn: {
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: Colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
