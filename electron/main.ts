import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import squirrel from 'electron-squirrel-startup';

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

if (squirrel) {
  app.quit();
}

config({ path: path.resolve(process.cwd(), '.env') });


const createWindow = () => {
  const preloadScriptPath = app.isPackaged
    ? path.join(__dirname, '../preload/index.js') 
    : path.join(process.cwd(), '.vite', 'build', 'preload.js'); 

  console.log(`[main.ts] Usando o script de preload em: ${preloadScriptPath}`);

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: preloadScriptPath,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});


ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Game ROMs', extensions: ['smc', 'sfc', 'gen', 'md', 'nes', 'gba', 'z64', 'iso', 'cue'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (canceled || filePaths.length === 0) {
    return null;
  }
  return filePaths[0];
});

ipcMain.handle('game:play', async (event, storagePath: string) => {
  console.log('Recebido pedido para preparar o jogo:', storagePath);
  console.log('[main.ts] game:play - storagePath recebido:', storagePath);

  console.log('[main.ts] VERIFICANDO VARIÁVEIS DE AMBIENTE PARA SUPABASE:');
  console.log('[main.ts] URL lida do .env (process.env.VITE_SUPABASE_URL):', process.env.VITE_SUPABASE_URL);
  console.log('[main.ts] Anon Key lida do .env (process.env.VITE_SUPABASE_ANON_KEY):', process.env.VITE_SUPABASE_ANON_KEY);
  
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMessage = "Variáveis de ambiente do Supabase não encontradas no processo principal.";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const cacheDir = path.join(app.getPath('userData'), 'rom_cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  const localRomPath = path.join(cacheDir, path.basename(storagePath));

  if (!fs.existsSync(localRomPath)) {
    console.log(`ROM não está no cache. Baixando de ${storagePath}...`);
    const { data, error } = await supabase.storage.from('roms').download(storagePath);
    if (error) {
      console.error('Erro no download:', error);
      throw error;
    }
    
    const buffer = Buffer.from(await data.arrayBuffer());
    fs.writeFileSync(localRomPath, buffer);
    console.log(`Download completo! Salvo em: ${localRomPath}`);
  } else {
    console.log(`ROM encontrada no cache: ${localRomPath}`);
  }

  const vendorPath = app.isPackaged
    ? path.join(process.resourcesPath, 'vendor')
    : path.join(process.cwd(), 'vendor');

    const retroArchPath = path.join(vendorPath, 'RetroArch', 'retroarch.exe');
    const corePath = path.join(vendorPath, 'RetroArch', 'cores', 'snes9x2002_libretro.dll');

  console.log(`[main.ts] VERIFICANDO CAMINHO RETROARCH: ${retroArchPath}`);
  console.log(`[main.ts] RetroArch Existe? ${fs.existsSync(retroArchPath)}`);
  console.log(`[main.ts] VERIFICANDO CAMINHO CORE: ${corePath}`);
  console.log(`[main.ts] Core Existe? ${fs.existsSync(corePath)}`);
  console.log(`[main.ts] VERIFICANDO CAMINHO ROM NO CACHE: ${localRomPath}`);
  console.log(`[main.ts] ROM no Cache Existe? ${fs.existsSync(localRomPath)}`);

  if (!fs.existsSync(retroArchPath) || !fs.existsSync(corePath) || !fs.existsSync(localRomPath)) {
    const erroMsg = `[main.ts] ERRO: Um dos caminhos essenciais não existe. RetroArch: ${fs.existsSync(retroArchPath)}, Core: ${fs.existsSync(corePath)}, ROM: ${fs.existsSync(localRomPath)}`;
    console.error(erroMsg);
    throw new Error(erroMsg);
    
  }
  
  console.log(`[main.ts] TENTANDO EXECUTAR: ${retroArchPath} -L "${corePath}" "${localRomPath}"`);
  const retroArchProcess = spawn(retroArchPath, ['-L', corePath, localRomPath]);

  retroArchProcess.stdout.on('data', (data) => {
    console.log(`[RetroArch stdout]: ${data}`);
  });

  retroArchProcess.stderr.on('data', (data) => {
    console.error(`[RetroArch stderr]: ${data}`);
  });

  retroArchProcess.on('error', (error) => {
    console.error('[main.ts] Falha ao iniciar o processo RetroArch:', error);
  });

  retroArchProcess.on('close', (code) => {
    console.log(`[main.ts] Processo RetroArch finalizado com código ${code}`);
  });

  return true;
});