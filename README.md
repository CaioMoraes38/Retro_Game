# Retro Game Launcher com Electron, React, Vite e Supabase

Bem-vindo ao Retro Game Launcher! Este é um aplicativo desktop construído para gerenciar e jogar seus jogos retrô favoritos, com uma biblioteca sincronizada na nuvem e integração com o emulador RetroArch.

![Gameplay Screenshot Placeholder](https://via.placeholder.com/800x450.png?text=Seu+Game+Launcher+em+Ação)

## 🚀 Funcionalidades Principais

* **Autenticação de Usuários:** Sistema completo de Cadastro, Login e Logout usando Supabase Auth.
* **Biblioteca de Jogos na Nuvem:** Os metadados dos jogos são armazenados no banco de dados Supabase.
* **Upload de ROMs:** Os arquivos de ROM são enviados para o Supabase Storage, associados à conta do usuário.
* **Download Sob Demanda:** As ROMs são baixadas para um cache local apenas quando o usuário decide jogar.
* **Integração com RetroArch:** Utiliza uma versão embutida do RetroArch para emulação de jogos. Os caminhos para o RetroArch e seus cores são configurados no aplicativo.
* **Gerenciamento de Jogos:** Formulário para adicionar novos jogos à biblioteca (faz upload da ROM e salva metadados).
    * *(Nota: Conforme sua última solicitação, o acesso para adicionar novos jogos pode ser restrito, transformando a lista de jogos em um catálogo curado).*
* **Sistema de Favoritos:** Usuários podem marcar jogos como favoritos.
* **Catálogo de Emuladores:** Exibe uma lista de emuladores (com links para download) que os usuários podem baixar para seus sistemas (gerenciados pelo sistema operacional do usuário).

## 🛠️ Tecnologias Utilizadas

* **Electron:** Para criar o aplicativo desktop multiplataforma.
* **React:** Para construir a interface do usuário.
* **TypeScript:** Para tipagem estática e um desenvolvimento mais robusto.
* **Vite:** Para o build do frontend e servidor de desenvolvimento rápido.
* **Supabase:** Como Backend-as-a-Service (BaaS):
    * **Database (PostgreSQL):** Para armazenar informações sobre jogos, usuários, favoritos, plataformas e emuladores.
    * **Authentication:** Para gerenciar contas de usuários.
    * **Storage:** Para armazenar os arquivos de ROM dos jogos.
* **RetroArch:** Emulador principal (versão portátil embutida no projeto).
* **Electron Forge:** Para empacotar e distribuir o aplicativo.
* **Dotenv:** Para gerenciar variáveis de ambiente.

## 📋 Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:
* [Node.js](https://nodejs.org/) (que inclui o npm)
* Um editor de código (como [VS Code](https://code.visualstudio.com/))
* Uma conta gratuita no [Supabase](https://supabase.com/)

## ⚙️ Configuração do Projeto

Siga os passos abaixo para configurar o ambiente de desenvolvimento:

1.  **Clone o Repositório:**
    ```bash
    git clone SEU_LINK_PARA_O_REPOSITORIO_AQUI
    cd nome-da-pasta-do-projeto
    ```

2.  **Instale as Dependências:**
    ```bash
    npm install
    ```

3.  **Configure o Supabase:**
    * Crie um novo projeto no [Supabase](https://supabase.com/).
    * No seu projeto Supabase, vá em **Project Settings** > **API**.
    * Copie a **Project URL** e a **anon public key**.
    * Crie um arquivo chamado `.env` na raiz do seu projeto e adicione suas chaves:
        ```env
        VITE_SUPABASE_URL=SUA_URL_DO_SUPABASE_AQUI
        VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA_AQUI
        ```

4.  **Configure o Banco de Dados Supabase:**
    * No seu painel do Supabase, vá para o **SQL Editor**.
    * Execute os scripts SQL necessários para criar as tabelas:
        * `platforms`
        * `games`
        * `user_favorites`
        * `emulators`
    * Configure as **Row Level Security (RLS) Policies** para cada tabela, conforme discutimos, para garantir a segurança e privacidade dos dados dos usuários.

5.  **Configure o Supabase Storage:**
    * No seu painel do Supabase, vá para **Storage**.
    * Crie um novo bucket chamado `roms`.
    * Configure as **Políticas de Acesso (Policies)** para o bucket `roms` para permitir que usuários autenticados façam upload (INSERT) e download (SELECT) de seus próprios arquivos (usando o `user_id` no caminho do arquivo, ex: `public/[user_id]/nome_do_arquivo.rom`).

6.  **Configure o RetroArch Embutido:**
    * Baixe a versão **portátil (.zip)** do RetroArch para Windows.
    * Crie uma pasta `vendor` na raiz do seu projeto.
    * Dentro da pasta `vendor`, crie uma subpasta `RetroArch`.
    * Descompacte **todo o conteúdo** do RetroArch portátil dentro de `vendor/RetroArch/`.
    * A estrutura deve ser `vendor/RetroArch/retroarch.exe`, `vendor/RetroArch/cores/`, etc.
    * Adicione os arquivos `.dll` dos cores de emulador que você deseja suportar dentro da pasta `vendor/RetroArch/cores/`.

## 🚀 Como Rodar

1.  **Modo de Desenvolvimento:**
    ```bash
    npm run dev
    ```
    Isso iniciará o aplicativo com o servidor de desenvolvimento do Vite e o Electron.

2.  **Build para Produção:**
    ```bash
    npm run make
    ```
    Isso empacotará seu aplicativo em um executável distribuível na pasta `out`.

## 📂 Estrutura de Pastas (Simplificada)
/
|-- electron/         # Código do processo principal do Electron (main.ts, preload.ts)

|-- vendor/           # Arquivos de terceiros (RetroArch)

|   |-- RetroArch/    # Conteúdo do RetroArch portátil

|-- src/              # Código fonte do frontend React

|   |-- components/   # Componentes React reutilizáveis

|   |-- lib/          # Módulos auxiliares (ex: supabaseClient.ts)

|   |-- App.tsx       # Componente principal do React

|   |-- main.tsx      # Ponto de entrada do React

|-- .env              # Variáveis de ambiente (NÃO ENVIE PARA O GITHUB)

|-- forge.config.ts   # Configuração do Electron Forge

|-- package.json

|-- ...outros arquivos de configuração

