"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircleIcon } from "@phosphor-icons/react";

type ProviderCard = {
  id: string;
  label: string;
  description: string;
  recommended?: boolean;
};

export function ProviderPicker({
  cards,
  selected,
  onSelect,
  configured,
}: {
  cards: ProviderCard[];
  selected: string;
  onSelect: (id: string) => void;
  configured?: Record<string, boolean>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {cards.map((card) => {
        const isSelected = selected === card.id;
        const isConfigured = configured?.[card.id];

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelect(card.id)}
            className={cn(
              "rounded-xl border p-4 text-left transition-colors",
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "border-border bg-card hover:border-primary/40",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{card.label}</span>
                  {card.recommended ? (
                    <Badge variant="secondary" className="text-[10px]">
                      Recommended
                    </Badge>
                  ) : null}
                  {isConfigured ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400">
                      <CheckCircleIcon className="size-3.5" weight="fill" />
                      Configured
                    </span>
                  ) : null}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{card.description}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
