import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import supabaseClient from '../lib/supabase';
import LogoIcon from '../components/LogoIcon';

const POLL_INTERVAL_MS = 2500;

export default function GenerateReportScreen({ route }) {
  const navigation = useNavigation();
  const { session } = useAuth();
  const { projectId, jobId: incomingJobId } = route.params ?? {};
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryFlag, setRetryFlag] = useState(0);
  const pollingRef = useRef(null);

  const jobStatus = job?.status ?? 'queued';

  const startPolling = (id) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    pollingRef.current = setInterval(async () => {
      const { data } = await supabaseClient.from('jobs').select('*').eq('id', id).maybeSingle();
      if (data) {
        setJob((previous) => ({ ...previous, ...data }));
      }
    }, POLL_INTERVAL_MS);
  };

  useEffect(() => {
    let isActive = true;
    const ensureJob = async () => {
      if (!session?.user?.id) {
        setError('You need to sign in again.');
        setLoading(false);
        return;
      }
      if (!projectId) {
        setError('Missing project identifier.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);

      try {
        let jobRecord = null;

        if (incomingJobId) {
          const { data, error: jobError } = await supabaseClient
            .from('jobs')
            .select('*')
            .eq('id', incomingJobId)
            .maybeSingle();
          if (jobError) throw jobError;
          jobRecord = data;
        }

        if (!jobRecord) {
          const { data, error: insertError } = await supabaseClient
            .from('jobs')
            .insert({
              user_id: session.user.id,
              project_id: projectId,
              status: 'queued',
              payload: { source: 'mobile_app' },
            })
            .select()
            .single();
          if (insertError) throw insertError;
          jobRecord = data;
        }

        if (!isActive) {
          return;
        }

        setJob(jobRecord);
        setError(null);
        startPolling(jobRecord.id);

        supabaseClient.functions.invoke('generateReport', {
          body: { jobId: jobRecord.id },
        }).catch((invokeError) => {
          console.warn('Failed to invoke generateReport function', invokeError);
        });

        const channel = supabaseClient
          .channel(`jobs-updates-${jobRecord.id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'jobs', filter: `id=eq.${jobRecord.id}` },
            (payload) => {
              if (payload.new) {
                setJob(payload.new);
              }
            },
          )
          .subscribe();

        return () => {
          channel.unsubscribe();
        };
      } catch (jobException) {
        if (isActive) {
          setError(jobException.message ?? 'Failed to queue job.');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    const unsubscribe = ensureJob();

    return () => {
      isActive = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      Promise.resolve(unsubscribe).then((cleanup) => {
        if (typeof cleanup === 'function') cleanup();
      });
    };
  }, [projectId, session?.user?.id, incomingJobId, retryFlag]);

  useEffect(() => {
    if (job?.status === 'completed' && job?.result_report_id) {
      navigation.replace('ReportViewer', { reportId: job.result_report_id, projectId: job.project_id });
    }
  }, [job, navigation]);

  const statusCopy = useMemo(() => {
    switch (jobStatus) {
      case 'queued':
        return 'Waiting for Grok-4 slot…';
      case 'processing':
        return 'Generating quick research report…';
      case 'completed':
        return 'Report ready!';
      case 'failed':
        return job?.error_message ?? 'Job failed. Try again.';
      default:
        return jobStatus;
    }
  }, [jobStatus, job?.error_message]);

  const handleRetry = () => {
    setRetryFlag((value) => value + 1);
  };

  return (
    <View style={styles.container}>
      <LogoIcon size={56} />
      {loading ? <ActivityIndicator color="#4C9FFF" /> : null}
      <Text style={styles.message}>Project: {projectId}</Text>
      <Text style={styles.status}>{statusCopy}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {job?.status === 'failed' ? (
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C1A2A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 24,
    textAlign: 'center',
  },
  status: {
    color: '#7AA6D9',
    marginTop: 16,
    textAlign: 'center',
  },
  error: {
    color: '#FF6B6B',
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4C9FFF',
  },
  retryText: {
    fontWeight: '700',
    color: '#0C1A2A',
  },
});
