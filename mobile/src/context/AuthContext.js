import PropTypes from 'prop-types';
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

import supabaseClient from '../lib/supabase';

const AuthContext = createContext({
  session: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  error: null,
  setSession: () => {},
});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const signInWithGoogle = useCallback(async ({ idToken, accessToken }) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: signInError } = await supabaseClient.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
        access_token: accessToken,
      });

      if (signInError) {
        setError(signInError.message);
        return { success: false, error: signInError };
      }

      if (data.session) {
        setSession(data.session);
        setError(null);
        return { success: true };
      }

      const missingSessionError = new Error('Google sign in did not return a session.');
      setError(missingSessionError.message);
      return { success: false, error: missingSessionError };
    } catch (signInException) {
      setError(signInException.message);
      return { success: false, error: signInException };
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await supabaseClient.auth.signOut();
      setSession(null);
    } catch (signOutException) {
      setError(signOutException.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      session,
      loading,
      error,
      signInWithGoogle,
      signOut,
      setSession,
    }),
    [session, loading, error, signInWithGoogle, signOut, setSession],
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
