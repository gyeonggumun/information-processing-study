import { createClient } from 'npm:@supabase/supabase-js@2.117.0';

const allowedOrigins = new Set([
  'https://information-processing-study.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

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

Deno.serve(async (request) => {
  const origin = request.headers.get('origin') ?? '';
  if (!allowedOrigins.has(origin)) return new Response('Forbidden', { status: 403 });

  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  };

  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers });

  const authorization = request.headers.get('authorization');
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const url = Deno.env.get('SUPABASE_URL');
  const secretKey = getSecretKey();
  if (!accessToken) return Response.json({ error: '인증이 필요합니다.' }, { status: 401, headers });
  if (!url || !secretKey) return Response.json({ error: '계정 삭제 서비스를 사용할 수 없습니다.' }, { status: 500, headers });

  const admin = createClient(url, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: { user }, error: userError } = await admin.auth.getUser(accessToken);
  if (userError || !user) return Response.json({ error: '로그인 상태를 확인할 수 없습니다.' }, { status: 401, headers });

  const { error: revokeError } = await admin.auth.admin.signOut(accessToken, 'global');
  if (revokeError) return Response.json({ error: '계정 세션을 종료하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500, headers });

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return Response.json({ error: '회원 탈퇴를 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500, headers });

  return Response.json({ success: true }, { headers });
});
