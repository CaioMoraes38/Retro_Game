// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
 
  playGame: (storagePath: string) => ipcRenderer.invoke('game:play', storagePath),

 
  selectRom: () => ipcRenderer.invoke('dialog:openFile'),
});