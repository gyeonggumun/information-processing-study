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
      // Fall back to the legacy service-role key.
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
  const publishableKey = Deno.env.get('SUPABASE_ANON_KEY');
  const secretKey = getSecretKey();
  if (!accessToken) return Response.json({ error: '로그인이 필요합니다.' }, { status: 401, headers });
  if (!url || !publishableKey || !secretKey) return Response.json({ error: '관리 서비스를 사용할 수 없습니다.' }, { status: 500, headers });

  const admin = createClient(url, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: { user }, error: userError } = await admin.auth.getUser(accessToken);
  if (userError || !user) return Response.json({ error: '로그인 상태를 확인할 수 없습니다.' }, { status: 401, headers });

  const caller = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: authorization! } },
  });
  const { data: canManage, error: roleError } = await caller.rpc('can_manage_users');
  if (roleError || canManage !== true) return Response.json({ error: '관리자 권한이 필요합니다.' }, { status: 403, headers });

  let body: { action?: unknown; userId?: unknown; confirmEmail?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400, headers });
  }

  if (body.action !== 'delete' || typeof body.userId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.userId) || typeof body.confirmEmail !== 'string') {
    return Response.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400, headers });
  }
  if (body.userId === user.id) return Response.json({ error: '관리자 본인 계정은 삭제할 수 없습니다.' }, { status: 400, headers });

  const { data: target, error: targetError } = await admin.auth.admin.getUserById(body.userId);
  if (targetError || !target?.user) return Response.json({ error: '계정을 찾을 수 없습니다.' }, { status: 404, headers });
  if (target.user.email?.toLowerCase() === 'lion989072@gmail.com') {
    return Response.json({ error: '관리자 계정은 삭제할 수 없습니다.' }, { status: 403, headers });
  }
  if (!target.user.email || body.confirmEmail.trim().toLowerCase() !== target.user.email.toLowerCase()) {
    return Response.json({ error: '확인용 이메일이 일치하지 않습니다.' }, { status: 400, headers });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(target.user.id);
  if (deleteError) return Response.json({ error: '계정을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500, headers });

  console.info('Admin deleted an account', { actorUserId: user.id, targetUserId: target.user.id });
  return Response.json({ success: true }, { headers });
});
