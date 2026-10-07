import { createClient } from 'npm:@supabase/supabase-js@2.117.0';

function getSecretKey() {
  const secretKeys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (secretKeys) {
    try {
      const parsed = JSON.parse(secretKeys);
      if (typeof parsed.default === 'string') return parsed.default;
    } catch {
      // Use the legacy service-role secret below when the new secret map is unavailable.
    }
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
}

function constantTimeEquals(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  const url = Deno.env.get('SUPABASE_URL');
  const secretKey = getSecretKey();
  if (!url || !secretKey) return Response.json({ error: 'Deletion worker is unavailable' }, { status: 500 });

  const admin = createClient(url, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: cronSecret, error: secretError } = await admin.rpc('get_account_deletion_cron_secret');
  if (secretError || typeof cronSecret !== 'string') {
    return Response.json({ error: 'Deletion worker authentication is unavailable' }, { status: 500 });
  }

  const requestSecret = request.headers.get('x-cron-secret') ?? '';
  if (!constantTimeEquals(requestSecret, cronSecret)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: claimedAccounts, error: claimError } = await admin.rpc('claim_due_account_deletions');
  if (claimError) return Response.json({ error: 'Could not claim due accounts' }, { status: 500 });

  let deletedCount = 0;
  let failedCount = 0;
  for (const account of claimedAccounts ?? []) {
    const userId = account.user_id;
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      failedCount += 1;
      await admin.from('profiles').update({ deletion_processing_at: null }).eq('user_id', userId);
    } else {
      deletedCount += 1;
    }
  }

  return Response.json({ deletedCount, failedCount }, { status: failedCount ? 500 : 200 });
});
