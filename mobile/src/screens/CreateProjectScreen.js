import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import supabaseClient from '../lib/supabase';
import LogoIcon from '../components/LogoIcon';

const defaultPlatforms = ['Reddit', 'X'];

export default function CreateProjectScreen() {
  const navigation = useNavigation();
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [competitorUrls, setCompetitorUrls] = useState('');
  const [platforms, setPlatforms] = useState(defaultPlatforms.join(', '));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert('Title required', 'Please provide a project title.');
      return;
    }
    if (!session?.user?.id) {
      Alert.alert('Not signed in', 'Please sign in again to create a project.');
      return;
    }
    setSaving(true);
    const keywordArray = keywords
      .split(',')
      .map((word) => word.trim())
      .filter(Boolean);
    const competitorArray = competitorUrls
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean);
    const platformArray = platforms
      .split(',')
      .map((platform) => platform.trim())
      .filter(Boolean);

    const { error } = await supabaseClient.from('projects').insert({
      title: trimmedTitle,
      description: description.trim(),
      keywords: keywordArray,
      competitor_urls: competitorArray,
      platforms: platformArray,
      user_id: session.user.id,
    });

    if (error) {
      Alert.alert('Unable to save project', error.message);
    } else {
      navigation.goBack();
    }
    setSaving(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.logoRow}>
        <LogoIcon size={40} />
      </View>
      <Text style={styles.title}>New Project</Text>
      <Text style={styles.subtitle}>Set up a quick Nexa research brief.</Text>

      <Text style={styles.label}>Project title</Text>
      <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder="GTM for Nexa API" />

      <Text style={styles.label}>Description</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        style={[styles.input, styles.multiline]}
        placeholder="What do you want to learn?"
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Keywords (comma-separated)</Text>
      <TextInput value={keywords} onChangeText={setKeywords} style={styles.input} placeholder="nexa, growth, marketing" />

      <Text style={styles.label}>Competitor URLs (comma-separated)</Text>
      <TextInput value={competitorUrls} onChangeText={setCompetitorUrls} style={styles.input} placeholder="https://competitor.com" />

      <Text style={styles.label}>Platforms (comma-separated)</Text>
      <TextInput value={platforms} onChangeText={setPlatforms} style={styles.input} placeholder="Reddit, X" />

      <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSubmit} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Create Project'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#0C1A2A',
    flexGrow: 1,
  },
  logoRow: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  subtitle: {
    color: '#BBD7F3',
    marginBottom: 20,
  },
  label: {
    color: '#7AA6D9',
    marginBottom: 6,
    marginTop: 14,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#13253B',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 28,
    backgroundColor: '#4C9FFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#0C1A2A',
    fontWeight: '700',
    fontSize: 16,
  },
});
