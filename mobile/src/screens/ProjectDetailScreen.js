import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useRoute } from '@react-navigation/native';

import supabaseClient from '../lib/supabase';

export default function ProjectDetailScreen({ navigation }) {
  const route = useRoute();
  const { projectId } = route.params ?? {};
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latestReportId, setLatestReportId] = useState(null);

  const loadProject = useCallback(async () => {
    if (!projectId) {
      setError('Missing project identifier');
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: fetchError } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setProject(data);
      const { data: reportData } = await supabaseClient
        .from('reports')
        .select('id')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setLatestReportId(reportData?.id ?? null);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    navigation.setOptions({ title: 'Project' });
    loadProject();
  }, [navigation, loadProject]);

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

  if (!project) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Project not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{project.title}</Text>
      <Text style={styles.sectionHeading}>Description</Text>
      <Text style={styles.body}>{project.description || 'No description provided.'}</Text>

      <Text style={styles.sectionHeading}>Keywords</Text>
      <Text style={styles.body}>{project.keywords?.join(', ') || '—'}</Text>

      <Text style={styles.sectionHeading}>Competitors</Text>
      <Text style={styles.body}>{project.competitor_urls?.join('\n') || '—'}</Text>

      <Text style={styles.sectionHeading}>Platforms</Text>
      <Text style={styles.body}>{project.platforms?.join(', ') || '—'}</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('GenerateReport', { projectId })}>
        <Text style={styles.primaryButtonText}>Generate Quick Report</Text>
      </TouchableOpacity>
      {latestReportId ? (
        <TouchableOpacity
          style={[styles.secondaryButton, { marginTop: 12 }]}
          onPress={() => navigation.navigate('ReportViewer', { reportId: latestReportId, projectId })}
        >
          <Text style={styles.secondaryButtonText}>View Latest Report</Text>
        </TouchableOpacity>
      ) : null}
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
    fontSize: 14,
    marginTop: 18,
    marginBottom: 6,
  },
  body: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
  },
  muted: {
    color: '#7AA6D9',
    fontSize: 16,
  },
  error: {
    color: '#FF6B6B',
    fontSize: 16,
  },
  primaryButton: {
    marginTop: 32,
    backgroundColor: '#4C9FFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0C1A2A',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#4C9FFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#4C9FFF',
    fontWeight: '600',
  },
});
