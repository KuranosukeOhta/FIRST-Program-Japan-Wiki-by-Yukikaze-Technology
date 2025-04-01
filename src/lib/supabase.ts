import { createClient } from '@supabase/supabase-js';

// クライアント側で使用するSupabaseクライアント
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase環境変数が設定されていません');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey
      }
    }
  });
};

// サーバー側で使用するSupabaseクライアント（管理者権限）
export const createSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase管理者環境変数が設定されていません');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      }
    }
  });
};

// シングルトンパターンでクライアント側のSupabaseインスタンスを提供
let supabase: ReturnType<typeof createSupabaseClient> | null = null;

export const getSupabase = () => {
  if (!supabase) {
    supabase = createSupabaseClient();
  }
  return supabase;
}; 