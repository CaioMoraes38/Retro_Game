// src/components/Auth.tsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
    }
    setLoading(false);
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      alert(error.message);
    } else {
      alert('Cadastro realizado! Verifique seu e-mail para confirmar a conta antes de fazer login.');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '50px' }}>
      <h1>Game Launcher</h1>
      <p>Faça login ou cadastre-se para continuar</p>
      <form>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="Seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <button onClick={handleLogin} disabled={loading}>
            {loading ? <span>Carregando...</span> : <span>Login</span>}
          </button>
          <button onClick={handleSignup} disabled={loading}>
            {loading ? <span>Carregando...</span> : <span>Cadastrar</span>}
          </button>
        </div>
      </form>
    </div>
  );
}