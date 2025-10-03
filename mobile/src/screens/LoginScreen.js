import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';

import { useAuth } from '../context/AuthContext';
import LogoIcon from '../components/LogoIcon';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { signInWithGoogle, loading, error } = useAuth();
  const extra = Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {};
  const googleAuth = extra?.googleAuth ?? {};
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: googleAuth?.expoClientId,
    iosClientId: googleAuth?.iosClientId,
    androidClientId: googleAuth?.androidClientId,
    webClientId: googleAuth?.webClientId,
    responseType: 'id_token token',
    scopes: ['profile', 'email'],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      const idToken = authentication?.idToken;
      const accessToken = authentication?.accessToken;

      if (!idToken) {
        Alert.alert('Sign in failed', 'Google did not return a valid ID token.');
        setIsSubmitting(false);
        return;
      }

      (async () => {
        try {
          const { success, error: signInError } = await signInWithGoogle({ idToken, accessToken });
          if (!success && signInError) {
            Alert.alert('Sign in failed', signInError.message ?? 'Unable to complete Google sign in.');
          }
        } catch (signInException) {
          Alert.alert('Sign in failed', signInException?.message ?? 'Unable to complete Google sign in.');
        } finally {
          setIsSubmitting(false);
        }
      })();
    } else if (response?.type === 'error') {
      Alert.alert('Sign in failed', response.error?.message ?? 'Google sign in was cancelled.');
      setIsSubmitting(false);
    } else if (response?.type === 'dismiss' || response?.type === 'cancel') {
      setIsSubmitting(false);
    }
  }, [response, signInWithGoogle]);

  const handleOAuthSignIn = async () => {
    if (loading || isSubmitting) {
      return;
    }

    if (!request) {
      Alert.alert('Configuration error', 'Google sign in is not configured properly.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await promptAsync({ useProxy: true, showInRecents: true });
      if (!result || result.type !== 'success') {
        setIsSubmitting(false);
      }
    } catch (promptError) {
      Alert.alert('Sign in failed', promptError?.message ?? 'Unable to start Google sign in.');
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.select({ ios: 'padding', android: undefined })}>
      <View style={styles.inner}>
        <View style={styles.logoContainer}>
          <LogoIcon size={80} />
        </View>
        <Text style={styles.title}>Welcome to Kivo</Text>
        <Text style={styles.subtitle}>Continue with your Google account.</Text>
        <TouchableOpacity
          style={[styles.button, (loading || isSubmitting || !request) && styles.buttonDisabled]}
          onPress={handleOAuthSignIn}
          disabled={loading || isSubmitting || !request}
        >
          <Text style={styles.buttonText}>{loading || isSubmitting ? 'Starting…' : 'Continue with Google'}</Text>
        </TouchableOpacity>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
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
  error: {
    marginTop: 12,
    color: '#FF6B6B',
    fontSize: 14,
  },
});
