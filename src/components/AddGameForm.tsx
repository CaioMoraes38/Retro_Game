// src/components/AddGameForm.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// Esta interface representa uma linha da sua tabela 'platforms'
interface Platform {
  id: number;
  name: string;
}

// O componente recebe uma função como 'prop' para avisar o App.tsx quando um jogo for adicionado
function AddGameForm({ onGameAdded }: { onGameAdded: () => void }) {
  const [title, setTitle] = useState('');
  const [platformId, setPlatformId] = useState<number | ''>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Busca as plataformas do banco para preencher o <select>
  useEffect(() => {
    async function fetchPlatforms() {
      const { data } = await supabase.from('platforms').select('id, name');
      if (data) {
        setPlatforms(data);
      }
    }
    fetchPlatforms();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file);
      // Bônus: Tenta adivinhar o título a partir do nome do arquivo
      const guessedTitle = file.name.split('.')[0].replace(/_/g, ' ');
      setTitle(guessedTitle);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile || !title || !platformId) {
      setStatusMessage('Por favor, preencha todos os campos e selecione um arquivo.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('Enviando arquivo...');

    try {
      // Pega o usuário logado para criar uma pasta única para ele
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      // Define o caminho no Storage. Ex: public/uuid-do-usuario/jogo.smc
      const storagePath = `public/${user.id}/${selectedFile.name}`;

      // 1. Faz o UPLOAD do arquivo para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('roms') // Nome do seu bucket
        .upload(storagePath, selectedFile, {
          cacheControl: '3600',
          upsert: false, // Não sobrescreve se o arquivo já existir
        });

      if (uploadError) throw uploadError;
      
      setStatusMessage('Arquivo enviado! Salvando dados do jogo...');

      // 2. INSERE os dados do jogo no banco de dados
      const { error: insertError } = await supabase.from('games').insert({
        title: title,
        platform_id: platformId,
        storage_path: storagePath, // Salva o caminho do arquivo no storage
        user_id: user.id
      });

      if (insertError) throw insertError;

      setStatusMessage('Jogo adicionado com sucesso!');
      // Limpa o formulário
      setTitle('');
      setPlatformId('');
      setSelectedFile(null);
      // Avisa o componente pai para atualizar a lista de jogos
      onGameAdded();

    } catch (error: any) {
      console.error('Erro ao adicionar jogo:', error);
      setStatusMessage(`Erro: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
      <h2>Adicionar Novo Jogo à Biblioteca</h2>
      <form onSubmit={handleSubmit}>
        <div>
          {/* Usamos um input de arquivo padrão da web. É mais simples e seguro no Electron. */}
          <label>Arquivo da ROM:</label>
          <input type="file" onChange={handleFileChange} required />
        </div>
        <div style={{ marginTop: '8px' }}>
          <label>Título:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do Jogo"
            required
            style={{ width: '95%', padding: '8px' }}
          />
        </div>
        <div style={{ marginTop: '8px' }}>
          <label>Plataforma:</label>
          <select
            value={platformId}
            onChange={(e) => setPlatformId(Number(e.target.value))}
            required
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="" disabled>Selecione um console</option>
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={isSubmitting} style={{ marginTop: '16px', padding: '10px 15px' }}>
          {isSubmitting ? 'Salvando...' : 'Salvar Jogo'}
        </button>
      </form>
      {statusMessage && <p>{statusMessage}</p>}
    </div>
  );
}

export default AddGameForm;