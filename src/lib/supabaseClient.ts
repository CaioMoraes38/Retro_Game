import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("ERRO CRÍTICO: Chaves do Supabase não foram carregadas no React! Verifique seu arquivo .env e se os nomes das variáveis começam com 'VITE_'.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);