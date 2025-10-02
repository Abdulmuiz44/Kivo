import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4?target=deno';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const XAI_API_KEY = Deno.env.get('XAI_API_KEY');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase edge function credentials.');
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
});

type JobRecord = {
  id: string;
  user_id: string;
  project_id: string;
  status: string;
  payload: Record<string, unknown> | null;
};

type ProjectRecord = {
  id: string;
  title: string;
  description: string | null;
  keywords: string[] | null;
  competitor_urls: string[] | null;
  platforms: string[] | null;
};

type ReportPayload = {
  top_subreddits: string[];
  top_hashtags: string[];
  competitor_snippets: Array<{ source: string; excerpt: string }>;
  post_drafts: string[];
  reply_templates: string[];
  '7_day_schedule': Array<Record<string, unknown>>;
  quick_tactics: string[];
  [key: string]: unknown;
};

const PROMPT_TEMPLATE =
  "You're Kivo, an expert growth researcher. Input: {project_title}, {description}, {keywords}, {competitor_urls}, {platforms}. Produce a JSON object with:\n- top_subreddits: array of 5 subreddit names (reason short)\n- top_hashtags: array of 5 hashtags (reason short)\n- competitor_snippets: array of 3 objects {source, excerpt}\n- post_drafts: array of 5 short post drafts (<=280 chars) tailored to platforms\n- reply_templates: array of 5 brief replies to use as comments\n- 7_day_schedule: array of posts with day/time and which draft to post\n- quick_tactics: 3 short tactical suggestions\nReturn valid JSON only.";

function compilePrompt(project: ProjectRecord): string {
  const keywords = project.keywords?.join(', ') || 'None provided';
  const competitorUrls = project.competitor_urls?.join(', ') || 'None provided';
  const platforms = project.platforms?.join(', ') || 'Reddit, X';

  return PROMPT_TEMPLATE.replace('{project_title}', project.title)
    .replace('{description}', project.description ?? 'No description provided')
    .replace('{keywords}', keywords)
    .replace('{competitor_urls}', competitorUrls)
    .replace('{platforms}', platforms);
}

async function claimJob(explicitJobId?: string): Promise<JobRecord | null> {
  if (explicitJobId) {
    const { data, error } = await supabase
      .from('jobs')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', explicitJobId)
      .eq('status', 'queued')
      .select()
      .single();

    if (error) {
      console.error('Failed to claim explicit job', error);
      return null;
    }
    return data as JobRecord;
  }

  const { data: queuedJob, error: fetchError } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'queued')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    console.error('Failed to fetch queued job', fetchError);
    return null;
  }

  if (!queuedJob) {
    return null;
  }

  const { data: claimedJob, error: claimError } = await supabase
    .from('jobs')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .eq('id', queuedJob.id)
    .eq('status', 'queued')
    .select()
    .single();

  if (claimError) {
    console.error('Failed to claim job', claimError);
    return null;
  }

  return claimedJob as JobRecord;
}

async function fetchProject(projectId: string): Promise<ProjectRecord | null> {
  const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).single();
  if (error) {
    console.error('Failed to load project', error);
    return null;
  }
  return data as ProjectRecord;
}

async function callGrok(prompt: string): Promise<ReportPayload> {
  if (!XAI_API_KEY) {
    throw new Error('XAI_API_KEY is not configured.');
  }

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Grok API error: ${response.status} ${errorBody}`);
  }

  const payload = await response.json();
  let rawContent = payload?.choices?.[0]?.message?.content ?? '';
  rawContent = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();

  try {
    const parsed = JSON.parse(rawContent) as ReportPayload;
    return parsed;
  } catch (parseError) {
    console.error('Failed to parse Grok response', rawContent);
    throw new Error('Grok returned invalid JSON.');
  }
}

type ReportRecord = {
  id: string;
  user_id: string;
  project_id: string;
  job_id: string;
  payload_json: Record<string, unknown>;
  created_at: string;
};

async function persistReport(job: JobRecord, reportPayload: ReportPayload) {
  const { data: report, error } = await supabase
    .from('reports')
    .insert({
      user_id: job.user_id,
      project_id: job.project_id,
      job_id: job.id,
      payload_json: reportPayload,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  const finishedAt = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('jobs')
    .update({ status: 'completed', finished_at: finishedAt, result_report_id: (report as ReportRecord).id })
    .eq('id', job.id);

  if (updateError) {
    console.error('Failed to mark job completed', updateError);
    throw updateError;
  }

  return report as ReportRecord;
}

async function markJobFailed(jobId: string, message: string) {
  const { error } = await supabase
    .from('jobs')
    .update({ status: 'failed', error_message: message, finished_at: new Date().toISOString() })
    .eq('id', jobId);
  if (error) {
    console.error('Failed to mark job failed', error);
  }
}

Deno.serve(async (request) => {
  let job: JobRecord | null = null;
  try {
    const requestJson = await request.json().catch(() => ({}));
    const jobId = requestJson?.jobId as string | undefined;

    job = await claimJob(jobId);
    if (!job) {
      return new Response(JSON.stringify({ message: 'No queued jobs available.' }), { status: 204 });
    }

    const project = await fetchProject(job.project_id);
    if (!project) {
      await markJobFailed(job.id, 'Project missing for job.');
      return new Response(JSON.stringify({ error: 'Project not found.' }), { status: 404 });
    }

    const prompt = compilePrompt(project);
    const reportPayload = await callGrok(prompt);
    const report = await persistReport(job, reportPayload);

    return new Response(
      JSON.stringify({ ok: true, job_id: job.id, report_id: report.id, payload: reportPayload }),
      { status: 200 },
    );
  } catch (error) {
    console.error('generateReport error', error);
    if (job) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      await markJobFailed(job.id, message);
    }

    const message = error instanceof Error ? error.message : 'Unexpected error';
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
