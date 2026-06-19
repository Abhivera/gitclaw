"use client";

import { useActionState } from "react";
import { updateSlackWebhook } from "@/features/dashboard/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";

type SlackWebhookFormProps = {
  defaultValue: string;
};

type FormState = {
  success: boolean;
  error: string | null;
};

const initialState: FormState = { success: false, error: null };

async function saveSlackWebhook(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    await updateSlackWebhook(formData);
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Failed to save. Please try again." };
  }
}

export function SlackWebhookForm({ defaultValue }: SlackWebhookFormProps) {
  const [state, formAction, pending] = useActionState(
    saveSlackWebhook,
    initialState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Slack notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slackWebhookUrl">Incoming webhook URL</Label>
            <Input
              id="slackWebhookUrl"
              name="slackWebhookUrl"
              type="url"
              placeholder="https://hooks.slack.com/services/..."
              defaultValue={defaultValue}
            />
            <p className="text-xs text-muted-foreground">
              GitClaw posts a summary when a review completes. Leave blank to
              disable.
            </p>
          </div>

          {state.success ? (
            <p
              className={cn(
                "flex items-center gap-2 text-sm text-green-700 dark:text-green-400"
              )}
              role="status"
            >
              <CheckCircleIcon className="size-4 shrink-0" />
              Notification settings saved.
            </p>
          ) : null}

          {state.error ? (
            <p
              className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              <WarningCircleIcon className="size-4 shrink-0" />
              {state.error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save notifications"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
