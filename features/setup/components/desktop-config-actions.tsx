"use client";

import { Button } from "@/components/ui/button";
import { FolderOpenIcon, FileTextIcon, ArrowsClockwise } from "@phosphor-icons/react";

export function DesktopConfigActions({
  compact = false,
}: {
  compact?: boolean;
}) {
  const desktop = typeof window !== "undefined" ? window.gitclawDesktop : undefined;

  if (!desktop) {
    return null;
  }

  const openEnv = () => {
    void desktop.openEnvFile();
  };

  const openFolder = () => {
    void desktop.openConfigFolder();
  };

  const restart = () => {
    void desktop.restartApp();
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={openEnv}>
          <FileTextIcon className="size-4" />
          Open configuration file
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={openFolder}>
          <FolderOpenIcon className="size-4" />
          Open folder
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" onClick={openEnv}>
        <FileTextIcon className="size-4" />
        Open configuration file
      </Button>
      <Button type="button" variant="outline" onClick={openFolder}>
        <FolderOpenIcon className="size-4" />
        Open configuration folder
      </Button>
      <Button type="button" variant="ghost" onClick={restart}>
        <ArrowsClockwise className="size-4" />
        Restart GitClaw
      </Button>
    </div>
  );
}

export function DesktopConfigPath() {
  const desktop = typeof window !== "undefined" ? window.gitclawDesktop : undefined;

  if (!desktop?.configPath) {
    return null;
  }

  return (
    <code className="block break-all rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
      {desktop.configPath}
    </code>
  );
}
