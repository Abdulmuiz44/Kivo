import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import supabaseClient from '../lib/supabase';

function ProjectCard({ project, onOpen }) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onOpen(project)}>
      <Text style={styles.cardTitle}>{project.title}</Text>
      <Text style={styles.cardDescription} numberOfLines={2}>
        {project.description || 'No description provided.'}
      </Text>
      <View style={styles.cardMetaRow}>
        <Text style={styles.cardMeta}>Keywords: {project.keywords?.join(', ') || '—'}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ProjectsScreen() {
  const navigation = useNavigation();
  const { session, signOut } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadProjects = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setProjects(data ?? []);
    }
    setLoading(false);
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [loadProjects]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  }, [loadProjects]);

  const handleOpenProject = (project) => {
    navigation.navigate('ProjectDetail', { projectId: project.id });
  };

  const handleCreateProject = () => {
    navigation.navigate('CreateProject');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Projects</Text>
          <Text style={styles.subtitle}>Manage your Nexa research briefs.</Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleCreateProject}>
        <Text style={styles.primaryButtonText}>New Project</Text>
      </TouchableOpacity>

      {loading && !projects.length ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#4C9FFF" />
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={projects.length ? styles.listContent : styles.emptyStateContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4C9FFF" />}
          renderItem={({ item }) => <ProjectCard project={item} onOpen={handleOpenProject} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No projects yet</Text>
              <Text style={styles.emptySubtitle}>Create your first Nexa research brief to get started.</Text>
            </View>
          }
        />
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C1A2A',
    paddingHorizontal: 20,
    paddingTop: 52,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#BBD7F3',
    marginTop: 4,
  },
  signOutButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#13253B',
  },
  signOutText: {
    color: '#BBD7F3',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#4C9FFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0C1A2A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 32,
  },
  emptyStateContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#13253B',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardDescription: {
    color: '#BBD7F3',
    fontSize: 14,
    marginBottom: 10,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardMeta: {
    color: '#7AA6D9',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#7AA6D9',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    textAlign: 'center',
    color: '#FF6B6B',
    marginBottom: 16,
  },
});
