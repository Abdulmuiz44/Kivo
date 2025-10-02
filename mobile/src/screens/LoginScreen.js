import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { signInWithEmail, loading, lastSentEmail, error } = useAuth();
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handleSendLink = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      Alert.alert('Email required', 'Please enter your email address.');
      return;
    }

    const { success, error: signInError } = await signInWithEmail(trimmedEmail);
    if (success) {
      setStatusMessage(`Magic link sent to ${trimmedEmail}. Check your email to continue.`);
    } else if (signInError) {
      Alert.alert('Sign in failed', signInError.message ?? 'Unable to send magic link.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.select({ ios: 'padding', android: undefined })}>
      <View style={styles.inner}>
        <Text style={styles.title}>Welcome to Kivo</Text>
        <Text style={styles.subtitle}>Sign in with your email to continue.</Text>
        <TextInput
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          editable={!loading}
        />
        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSendLink} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Sending…' : 'Send Magic Link'}</Text>
        </TouchableOpacity>
        {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
        {lastSentEmail && !statusMessage ? <Text style={styles.status}>Last link sent to {lastSentEmail}.</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C1A2A',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  inner: {
    backgroundColor: '#13253B',
    borderRadius: 20,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#BBD7F3',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#1E3A5C',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#4C9FFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0C1A2A',
    fontWeight: '700',
    fontSize: 16,
  },
  status: {
    marginTop: 16,
    color: '#BBD7F3',
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    marginTop: 12,
    color: '#FF6B6B',
    fontSize: 14,
  },
});
