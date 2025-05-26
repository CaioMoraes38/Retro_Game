// src/App.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import AddGameForm from '../components/AddGameForm';
import Auth from '../components/Auth'; 
import { Session } from '@supabase/supabase-js';

interface Game {
  id: number;
  title: string;
  storage_path: string;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true); 
  const [playingGameId, setPlayingGameId] = useState<number | null>(null); 

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      console.log('[App.tsx] SESSÃO ATUAL ao carregar:', session);
      console.log('[App.tsx] UID DO USUÁRIO LOGADO ao carregar:', session?.user?.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      console.log('[App.tsx] MUDANÇA DE ESTADO DA SESSÃO:', session);
      console.log('[App.tsx] NOVO UID DO USUÁRIO LOGADO:', session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchGames();
    } else {
      setGames([]);
      setLoading(false);
    }
  }, [session]); 

  const fetchGames = async () => {
    console.log('[App.tsx] Iniciando fetchGames...');
    setLoading(true);
    try {
      const currentSession = await supabase.auth.getSession();
      if (!currentSession.data.session) {
        console.log('[App.tsx] fetchGames: Nenhuma sessão ativa encontrada. Saindo.');
        setGames([]);
        setLoading(false);
        return;
      }
      console.log('[App.tsx] fetchGames: Sessão ativa confirmada. UID do usuário:', currentSession.data.session.user.id);

      const { data, error, status, count } = await supabase
        .from('games')
        .select('id, title, storage_path');

      console.log('[App.tsx] fetchGames: Resposta CRUA do Supabase:', { data, error, status, count });

      if (error) {
        console.error('[App.tsx] fetchGames: Erro retornado pelo Supabase:', error);
        throw error;
      }

      if (data) {
        console.log('[App.tsx] fetchGames: Dados recebidos do Supabase:', data);
        setGames(data);
      } else {
        console.log('[App.tsx] fetchGames: Nenhum dado (data is null/undefined), mas sem erro explícito.');
        setGames([]);
      }
    } catch (error) {
      console.error('[App.tsx] fetchGames: Erro capturado no bloco CATCH:', error);
    } finally {
      console.log('[App.tsx] fetchGames: Finalizando, setLoading(false).');
      setLoading(false);
    }
  };

  
  const handlePlayClick = async (game: Game) => {
    setPlayingGameId(game.id); 
    console.log(`[App.tsx] Pedido para jogar: ${game.title} (Storage Path: ${game.storage_path})`);

    try {
      
      await window.electronAPI.playGame(game.storage_path);
      console.log(`[App.tsx] Comando playGame para ${game.title} enviado com sucesso.`);
    } catch (error) {
      console.error(`[App.tsx] Erro ao tentar executar o jogo ${game.title}:`, error);
      alert(`Não foi possível iniciar o jogo ${game.title}. Verifique o console.`);
    } finally {
      setPlayingGameId(null); // Libera os botões para outras ações
      console.log(`[App.tsx] Finalizado o processo de play para ${game.title}.`);
    }
  };
  
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Erro ao fazer logout:', error);
    } else {
        setSession(null); 
        setGames([]); 
    }
  };

  if (!session) {
    return <Auth />; 
  } 
  
  return (
    <div>
      <h1>Minha Biblioteca na Nuvem</h1>
      <p>Bem-vindo, {session.user.email}!</p>
      <button onClick={handleLogout}>Sair (Logout)</button>
      <hr />
      
      <AddGameForm onGameAdded={fetchGames} />
      
      <hr />
      <h2>Jogos Salvos</h2>
      {loading ? (
        <p>Carregando sua biblioteca de jogos...</p>
      ) : (
        <ul>
          {games.length > 0 ? (
            games.map((game) => (
              <li key={game.id}>
                <span>{game.title}</span>
                <button
                  onClick={() => handlePlayClick(game)}
                  disabled={playingGameId !== null}
                >
                  {playingGameId === game.id ? 'Preparando...' : '▶️ Jogar'}
                </button>
              </li>
            ))
          ) : (
            <p>Nenhum jogo encontrado na sua biblioteca. Adicione alguns!</p>
          )}
        </ul>
      )}
    </div>
  );
}

export default App;