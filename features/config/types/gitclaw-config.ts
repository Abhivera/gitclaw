import { z } from "zod";

export const gitclawConfigSchema = z.object({
  version: z.number().int().default(1),
  reviews: z
    .object({
      enabled: z.boolean().default(true),
      incremental: z.boolean().default(true),
      post_summary: z.boolean().default(true),
      post_inline: z.boolean().default(true),
    })
    .default({
      enabled: true,
      incremental: true,
      post_summary: true,
      post_inline: true,
    }),
  ignore: z.array(z.string()).default([]),
  instructions: z.string().optional(),
  tone: z.enum(["concise", "detailed", "mentoring"]).default("concise"),
  language_focus: z.array(z.string()).optional(),
  static_analysis: z
    .object({
      eslint: z.boolean().default(true),
      semgrep: z.boolean().default(true),
      gitleaks: z.boolean().default(true),
      npm_audit: z.boolean().default(true),
    })
    .default({
      eslint: true,
      semgrep: true,
      gitleaks: true,
      npm_audit: true,
    }),
  auto_description: z.boolean().default(true),
});

export type GitclawConfig = z.infer<typeof gitclawConfigSchema>;

export const DEFAULT_GITCLAW_CONFIG: GitclawConfig = {
  version: 1,
  reviews: {
    enabled: true,
    incremental: true,
    post_summary: true,
    post_inline: true,
  },
  ignore: [],
  tone: "concise",
  static_analysis: {
    eslint: true,
    semgrep: true,
    gitleaks: true,
    npm_audit: true,
  },
  auto_description: true,
};

export const GITCLAW_CONFIG_PATH = ".gitclaw.yaml";
