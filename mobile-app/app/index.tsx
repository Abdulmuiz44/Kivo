import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';

// Configure API base URL - change this to your backend URL
const API_BASE_URL = __DEV__ ? 'http://localhost:3000' : 'https://your-production-url.vercel.app';

export default function HomeScreen() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [queryTerms, setQueryTerms] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>(['reddit']);

  const sources = [
    { id: 'reddit', label: 'Reddit' },
    { id: 'twitter', label: 'Twitter/X' },
  ];

  const toggleSource = (sourceId: string) => {
    if (selectedSources.includes(sourceId)) {
      setSelectedSources(selectedSources.filter((s) => s !== sourceId));
    } else {
      setSelectedSources([...selectedSources, sourceId]);
    }
  };

  const handleStartResearch = async () => {
    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter a research topic');
      return;
    }

    if (selectedSources.length === 0) {
      Alert.alert('Error', 'Please select at least one data source');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/research/run`, {
        topic: topic.trim(),
        sources: selectedSources,
        queryTerms: queryTerms
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t),
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString(),
        },
      });

      const { runId } = response.data;
      router.push(`/research/${runId}`);
    } catch (error) {
      console.error('Research error:', error);
      Alert.alert('Error', 'Failed to start research. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Kivo Research</Text>
        <Text style={styles.subtitle}>AI-powered social media research assistant</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Research Topic *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Freelancer invoicing pain points"
          value={topic}
          onChangeText={setTopic}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Query Terms (comma-separated)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., invoice, payment, freelance"
          value={queryTerms}
          onChangeText={setQueryTerms}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Data Sources *</Text>
        <View style={styles.sourcesContainer}>
          {sources.map((source) => (
            <TouchableOpacity
              key={source.id}
              style={[
                styles.sourceButton,
                selectedSources.includes(source.id) && styles.sourceButtonActive,
              ]}
              onPress={() => toggleSource(source.id)}
            >
              <Text
                style={[
                  styles.sourceButtonText,
                  selectedSources.includes(source.id) && styles.sourceButtonTextActive,
                ]}
              >
                {source.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleStartResearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Start Research</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.features}>
        <Text style={styles.featuresTitle}>Features:</Text>
        <View style={styles.featuresList}>
          <Text style={styles.featureItem}>✨ AI-powered sentiment analysis</Text>
          <Text style={styles.featureItem}>📊 Topic clustering & visualization</Text>
          <Text style={styles.featureItem}>💡 Pain point identification</Text>
          <Text style={styles.featureItem}>📄 Export to PDF/CSV</Text>
          <Text style={styles.featureItem}>🔔 Webhook notifications</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  sourcesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  sourceButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  sourceButtonActive: {
    borderColor: '#000',
    backgroundColor: '#000',
  },
  sourceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  sourceButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  features: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});
