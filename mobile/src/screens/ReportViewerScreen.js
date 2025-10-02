import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Constants from 'expo-constants';

import supabaseClient from '../lib/supabase';

export default function ReportViewerScreen({ route }) {
  const { reportId } = route.params ?? {};
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  const extra = Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {};
  const nexaApiUrl = extra?.nexaApiUrl ?? '';

  const payload = useMemo(() => report?.payload_json ?? {}, [report]);
  const postDrafts = useMemo(() => (payload.post_drafts ?? []).slice(0, 5), [payload]);
  const replyTemplates = useMemo(() => (payload.reply_templates ?? []).slice(0, 5), [payload]);

  useEffect(() => {
    const loadReport = async () => {
      if (!reportId) {
        setError('Missing report identifier');
        setLoading(false);
        return;
      }
      const { data, error: fetchError } = await supabaseClient.from('reports').select('*').eq('id', reportId).maybeSingle();
      if (fetchError) {
        setError(fetchError.message);
      } else {
        setReport(data);
      }
      setLoading(false);
    };

    loadReport();
  }, [reportId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#4C9FFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Report not available yet.</Text>
      </View>
    );
  }

  const handleExport = async () => {
    const serialized = JSON.stringify(payload, null, 2);
    try {
      await Share.share({ message: serialized });
    } catch (shareError) {
      Alert.alert('Export failed', shareError.message ?? 'Unable to export JSON.');
    }
  };

  const handleSendToNexa = async () => {
    if (!nexaApiUrl) {
      Alert.alert('Nexa URL missing', 'Configure NEXA_API_URL to enable this action.');
      return;
    }
    setSending(true);
    try {
      const response = await fetch(nexaApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: report.id,
          project_id: report.project_id,
          payload,
        }),
      });
      if (response.status === 200 || response.status === 202) {
        Alert.alert('Sent to Nexa', 'Report successfully sent to Nexa.');
      } else {
        const text = await response.text();
        Alert.alert('Send failed', `Response ${response.status}: ${text}`);
      }
    } catch (sendError) {
      Alert.alert('Send failed', sendError.message ?? 'Unexpected error');
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Quick Research Report</Text>
      <Text style={styles.sectionHeading}>Summary</Text>
      <Text style={styles.body}>{payload.summary_text || 'Summary not provided.'}</Text>

      <Text style={styles.sectionHeading}>Top Subreddits</Text>
      {(payload.top_subreddits ?? []).slice(0, 5).map((subreddit, index) => (
        <View style={styles.listRow} key={`subreddit-${index}`}>
          <Text style={styles.listText}>{subreddit}</Text>
        </View>
      ))}

      <Text style={styles.sectionHeading}>Top Hashtags</Text>
      {(payload.top_hashtags ?? []).slice(0, 5).map((hashtag, index) => (
        <View style={styles.listRow} key={`hashtag-${index}`}>
          <Text style={styles.listText}>{hashtag}</Text>
        </View>
      ))}

      <Text style={styles.sectionHeading}>Quick Tactics</Text>
      {(payload.quick_tactics ?? []).slice(0, 3).map((tactic, index) => (
        <View style={styles.listRow} key={`tactic-${index}`}>
          <Text style={styles.listText}>{tactic}</Text>
        </View>
      ))}

      <Text style={styles.sectionHeading}>Competitor Snippets</Text>
      {(payload.competitor_snippets ?? []).slice(0, 3).map((snippet, index) => (
        <View style={styles.listRow} key={`snippet-${index}`}>
          <Text style={styles.listMeta}>{snippet.source}</Text>
          <Text style={styles.listText}>{snippet.excerpt}</Text>
        </View>
      ))}

      <Text style={styles.sectionHeading}>Post Drafts</Text>
      {postDrafts.map((draft, index) => (
        <View style={styles.pill} key={`draft-${index}`}>
          <Text style={styles.pillText}>{draft}</Text>
        </View>
      ))}

      <Text style={styles.sectionHeading}>Reply Templates</Text>
      {replyTemplates.map((reply, index) => (
        <View style={styles.pill} key={`reply-${index}`}>
          <Text style={styles.pillText}>{reply}</Text>
        </View>
      ))}

      <Text style={styles.sectionHeading}>7-Day Schedule</Text>
      {(payload['7_day_schedule'] ?? []).slice(0, 7).map((entry, index) => (
        <View style={styles.listRow} key={`schedule-${index}`}>
          <Text style={styles.listMeta}>{entry.day ?? `Day ${index + 1}`}</Text>
          <Text style={styles.listText}>
            {entry.time ? `${entry.time} · ` : ''}
            {entry.draft_reference ?? entry.draft ?? 'Planned post'}
          </Text>
        </View>
      ))}

      <TouchableOpacity style={styles.secondaryButton} onPress={handleExport}>
        <Text style={styles.secondaryButtonText}>Export JSON</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.primaryButton, sending && styles.primaryButtonDisabled]}
        onPress={handleSendToNexa}
        disabled={sending}
      >
        <Text style={styles.primaryButtonText}>{sending ? 'Sending…' : 'Send to Nexa'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0C1A2A',
    padding: 20,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    backgroundColor: '#0C1A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  sectionHeading: {
    color: '#7AA6D9',
    marginTop: 18,
    marginBottom: 8,
    fontSize: 14,
  },
  body: {
    color: '#FFFFFF',
    lineHeight: 22,
  },
  listRow: {
    backgroundColor: '#13253B',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  listText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  listMeta: {
    color: '#7AA6D9',
    fontSize: 12,
    marginBottom: 4,
  },
  pill: {
    backgroundColor: '#13253B',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  pillText: {
    color: '#FFFFFF',
  },
  muted: {
    color: '#7AA6D9',
  },
  error: {
    color: '#FF6B6B',
  },
  secondaryButton: {
    marginTop: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#4C9FFF',
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#4C9FFF',
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: '#4C9FFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#0C1A2A',
    fontWeight: '700',
  },
});
