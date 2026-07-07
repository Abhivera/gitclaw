"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BRAND_ICON_MARK } from "@/lib/brand";
import type { DesktopSetupStatus } from "@/features/setup/lib/desktop-setup";
import { DesktopSetupWizard } from "@/features/setup/components/desktop-setup-wizard";

type DesktopSetupProps = {
  status: DesktopSetupStatus;
};

export function DesktopSetup({ status }: DesktopSetupProps) {
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    void window.gitclawDesktop?.getFirstRunComplete().then((complete) => {
      if (complete) {
        setShowWelcome(false);
      }
    });
  }, []);

  const dismissWelcome = () => {
    setShowWelcome(false);
    void window.gitclawDesktop?.markFirstRunComplete();
  };

  return (
    <div className="min-h-svh w-full bg-background">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-10">
        <header className="space-y-4 text-center">
          <div className="flex justify-center">
            <Image src={BRAND_ICON_MARK} alt="GitClaw" width={48} height={48} priority />
          </div>
          <div className="space-y-2">
            {showWelcome ? (
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Welcome to GitClaw
              </p>
            ) : null}
            <h1 className="text-2xl font-semibold tracking-tight">
              {showWelcome ? "Set up your reviewer" : "Finish setup"}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Add an AI provider and at least one git host. Save each step — GitClaw applies
              changes automatically. Database and local URLs are managed for you.
            </p>
          </div>
        </header>

        <DesktopSetupWizard status={status} onDismissWelcome={dismissWelcome} />
      </div>
    </div>
  );
}
