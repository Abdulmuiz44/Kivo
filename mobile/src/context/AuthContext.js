import * as Linking from 'expo-linking';
import PropTypes from 'prop-types';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

import supabaseClient from '../lib/supabase';

const AuthContext = createContext({
  session: null,
  loading: true,
  signInWithEmail: async () => {},
  signOut: async () => {},
  lastSentEmail: null,
  error: null,
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSentEmail, setLastSentEmail] = useState(null);
  const deepLinkProcessed = useRef(false);

  useEffect(() => {
    let mounted = true;

    supabaseClient.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session ?? null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession ?? null);
      if (currentSession) {
        setError(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleDeepLink = async ({ url }) => {
      if (deepLinkProcessed.current) return;
      try {
        const { data, error: linkError } = await supabaseClient.auth.getSessionFromUrl({ url, storeSession: true });
        if (linkError) {
          setError(linkError.message);
          return;
        }
        if (data.session) {
          setSession(data.session);
          setError(null);
        }
        deepLinkProcessed.current = true;
      } catch (linkException) {
        setError(linkException.message);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl) {
        handleDeepLink({ url: initialUrl });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const signInWithEmail = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const redirectUrl = Linking.createURL('/auth/callback');
      const { error: signInError } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      if (signInError) {
        setError(signInError.message);
        return { success: false, error: signInError };
      }
      setLastSentEmail(email);
      return { success: true };
    } catch (signInException) {
      setError(signInException.message);
      return { success: false, error: signInException };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabaseClient.auth.signOut();
      setSession(null);
    } catch (signOutException) {
      setError(signOutException.message);
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      session,
      loading,
      error,
      signInWithEmail,
      signOut,
      lastSentEmail,
    }),
    [session, loading, error, lastSentEmail],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
