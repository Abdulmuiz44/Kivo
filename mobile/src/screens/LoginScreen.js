import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';

import { useAuth } from '../context/AuthContext';
import supabaseClient from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { setSession } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const extra = Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {};
  const clientId = extra?.googleAuth?.expoClientId ?? process.env.GOOGLE_EXPO_CLIENT_ID ?? '';

  const redirectUri = makeRedirectUri({ useProxy: true });
  console.log('[LoginScreen] Redirect URI:', redirectUri);
  console.log('[LoginScreen] Using Google client ID:', clientId);

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: clientId,
    responseType: 'id_token',
    scopes: ['profile', 'email'],
    redirectUri,
  });

  useEffect(() => {
    if (!response) return;

    console.log('[LoginScreen] Google auth response:', response);
    if (response.type === 'success') {
      const idToken = response.params?.id_token || response.authentication?.idToken || null;
      console.log('[LoginScreen] id_token received:', Boolean(idToken));

      if (!idToken) {
        Alert.alert('Sign in failed', 'Google did not return a valid ID token.');
        setIsSubmitting(false);
        return;
      }

      (async () => {
        try {
          const { data, error } = await supabaseClient.auth.signInWithIdToken({
            provider: 'google',
            token: idToken,
          });
          console.log('[LoginScreen] Supabase sign-in result:', {
            hasSession: Boolean(data?.session),
            error,
          });

          if (error) {
            Alert.alert('Sign in failed', error.message);
          } else if (data.session) {
            setSession(data.session);
          } else {
            Alert.alert('Sign in failed', 'Google login did not return a session.');
          }
        } catch (signInError) {
          console.log('[LoginScreen] Supabase sign-in exception:', signInError);
          Alert.alert('Sign in failed', signInError.message ?? 'Unexpected error.');
        } finally {
          setIsSubmitting(false);
        }
      })();
    } else if (response.type === 'error') {
      Alert.alert('Sign in failed', response.error?.message ?? 'Google sign-in error.');
      setIsSubmitting(false);
    } else if (response.type === 'dismiss' || response.type === 'cancel') {
      setIsSubmitting(false);
    }
  }, [response, setSession]);

  const handleGoogleSignIn = async () => {
    if (isSubmitting) return;
    if (!clientId) {
      Alert.alert('Configuration error', 'GOOGLE_EXPO_CLIENT_ID is not set.');
      return;
    }
    if (!request) {
      Alert.alert('Google Sign-In unavailable', 'The Google auth request is not ready yet.');
      return;
    }

    setIsSubmitting(true);
    try {
      await promptAsync({ useProxy: true, showInRecents: true });
    } catch (promptError) {
      console.log('[LoginScreen] promptAsync exception:', promptError);
      Alert.alert('Sign in failed', promptError?.message ?? 'Unable to start Google sign-in.');
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Welcome to Kivo</Text>
        <Text style={styles.subtitle}>Continue with your Google account.</Text>
        <TouchableOpacity
          style={[styles.button, (isSubmitting || !request) && styles.buttonDisabled]}
          onPress={handleGoogleSignIn}
          disabled={isSubmitting || !request}
        >
          <Text style={styles.buttonText}>{isSubmitting ? 'Starting…' : 'Continue with Google'}</Text>
        </TouchableOpacity>
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
});