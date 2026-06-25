export {};

declare global {
  interface GitClawDesktopBridge {
    platform: NodeJS.Platform;
    configPath: string;
    getFirstRunComplete: () => Promise<boolean>;
    openConfigFolder: () => Promise<void>;
    openEnvFile: () => Promise<void>;
    restartApp: () => Promise<void>;
    markFirstRunComplete: () => Promise<void>;
  }

  interface Window {
    gitclawDesktop?: GitClawDesktopBridge;
  }
}
