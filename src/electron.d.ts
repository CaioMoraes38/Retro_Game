// src/electron.d.ts
export interface IElectronAPI {
  playGame: (storagePath: string) => Promise<boolean>;
  selectRom: () => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}