"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";

type CopyButtonProps = {
  value: string;
  label?: string;
  className?: string;
};

export function CopyButton({ value, label = "Copy", className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("h-7 gap-1.5 px-2 text-xs", className)}
      onClick={handleCopy}
      aria-label={copied ? "Copied" : label}
    >
      {copied ? (
        <>
          <CheckIcon className="size-3.5" />
          Copied
        </>
      ) : (
        <>
          <CopyIcon className="size-3.5" />
          {label}
        </>
      )}
    </Button>
  );
}
