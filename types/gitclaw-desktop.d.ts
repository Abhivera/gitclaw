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
    chooseReviewFolder: () => Promise<import("@/features/local-reviews/types").LocalReviewSelection | null>;
    reviewLocalFolder: (confirmation: { confirmed: true; snapshotId: string; destinationId: string }) => Promise<import("@/features/reviews/types/review-finding").StructuredReview>;
  }

  interface Window {
    gitclawDesktop?: GitClawDesktopBridge;
  }
}
