import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LineChart, BarChart } from 'react-native-chart-kit';
import axios from 'axios';

const API_BASE_URL = __DEV__ ? 'http://localhost:3000' : 'https://your-production-url.vercel.app';

interface ResearchStatus {
  runId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  message?: string;
}

interface ResearchPayload {
  topic: string;
  items: Array<{
    id: string;
    text: string;
    sentiment: number;
    source: string;
    author: string;
    createdAt: string;
  }>;
  clusters: Array<{
    id: string;
    topic: string;
    items: string[];
  }>;
  summary: {
    topPainPoints: string[];
    recommendedActions: string[];
    sentimentOverview: {
      positive: number;
      negative: number;
      neutral: number;
    };
  };
}

export default function ResearchResultsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<ResearchStatus | null>(null);
  const [payload, setPayload] = useState<ResearchPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchStatus = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/research/${id}/status`);
        setStatus(response.data);

        if (response.data.status === 'completed') {
          const payloadResponse = await axios.get(`${API_BASE_URL}/api/research/${id}/payload`);
          setPayload(payloadResponse.data);
          setLoading(false);
        } else if (response.data.status === 'failed') {
          setError(response.data.message || 'Research failed');
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch research data:', err);
        setError('Failed to fetch research data');
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);

    return () => clearInterval(interval);
  }, [id]);

  const handleExportPDF = () => {
    const url = `${API_BASE_URL}/api/research/${id}/export/pdf`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Failed to open PDF export');
    });
  };

  const handleExportCSV = () => {
    const url = `${API_BASE_URL}/api/research/${id}/export/csv`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Failed to open CSV export');
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>
          {status?.status === 'running'
            ? `Processing... ${status.progress}%`
            : 'Loading research data...'}
        </Text>
        {status && status.progress > 0 && (
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${status.progress}%` }]} />
          </View>
        )}
      </View>
    );
  }

  if (error || !payload) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>❌ {error || 'No data available'}</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sentimentData = payload.summary.sentimentOverview;
  const screenWidth = Dimensions.get('window').width;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>{payload.topic}</Text>
        <Text style={styles.subtitle}>{payload.items.length} items analyzed</Text>
      </View>

      {/* Sentiment Overview */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Sentiment Distribution</Text>
        <BarChart
          data={{
            labels: ['Positive', 'Neutral', 'Negative'],
            datasets: [
              {
                data: [sentimentData.positive, sentimentData.neutral, sentimentData.negative],
              },
            ],
          }}
          width={screenWidth - 80}
          height={220}
          yAxisLabel=""
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          style={styles.chart}
        />
      </View>

      {/* Top Pain Points */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💡 Top Pain Points</Text>
        {payload.summary.topPainPoints.slice(0, 5).map((point, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.listNumber}>{index + 1}</Text>
            <Text style={styles.listText}>{point}</Text>
          </View>
        ))}
      </View>

      {/* Recommended Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>✨ Recommended Actions</Text>
        {payload.summary.recommendedActions.slice(0, 5).map((action, index) => (
          <View key={index} style={styles.listItem}>
            <Text style={styles.listNumber}>{index + 1}</Text>
            <Text style={styles.listText}>{action}</Text>
          </View>
        ))}
      </View>

      {/* Topic Clusters */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏷️ Topic Clusters</Text>
        {payload.clusters.slice(0, 5).map((cluster, index) => (
          <View key={cluster.id} style={styles.clusterItem}>
            <Text style={styles.clusterTopic}>{cluster.topic}</Text>
            <Text style={styles.clusterCount}>{cluster.items.length} items</Text>
          </View>
        ))}
      </View>

      {/* Export Buttons */}
      <View style={styles.actionsCard}>
        <Text style={styles.cardTitle}>📥 Export Data</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.exportButton} onPress={handleExportPDF}>
            <Text style={styles.exportButtonText}>📄 PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportButton} onPress={handleExportCSV}>
            <Text style={styles.exportButtonText}>📊 CSV</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Start New Research</Text>
      </TouchableOpacity>
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
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  progressBarContainer: {
    width: '80%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#000',
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  listNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 8,
    minWidth: 20,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  clusterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  clusterTopic: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  clusterCount: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  exportButton: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 16,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});
