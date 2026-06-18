import type { LanguageModel } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { env } from "@/lib/env";

/**
 * GitClaw supports three AI backends (set `AI_PROVIDER` or let it auto-detect):
 *
 * - **openrouter** — many models via one key (default)
 * - **groq** — fast inference via Groq's OpenAI-compatible API
 * - **openai-compatible** — OpenAI, Azure, Ollama, LM Studio, vLLM, etc.
 *
 * Model id: `GITCLAW_REVIEW_MODEL` (sensible default per provider when unset).
 */

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

const DEFAULT_MODELS = {
  openrouter: "openrouter/free",
  groq: "llama-3.3-70b-versatile",
  "openai-compatible": "gpt-4o-mini",
} as const;

type AIProvider = keyof typeof DEFAULT_MODELS;

function resolveProvider(): AIProvider {
  const explicit = env.AI_PROVIDER?.toLowerCase();
  if (explicit === "groq") return "groq";
  if (
    explicit === "openai" ||
    explicit === "openai-compatible" ||
    explicit === "ollama"
  ) {
    return "openai-compatible";
  }
  if (explicit === "openrouter") return "openrouter";

  // Auto-detect when AI_PROVIDER is unset.
  if (env.GROQ_API_KEY && !env.OPENROUTER_API_KEY && !env.OPENAI_BASE_URL) {
    return "groq";
  }
  if (env.OPENAI_BASE_URL) {
    return "openai-compatible";
  }
  return "openrouter";
}

function resolveModelId(provider: AIProvider): string {
  const configured = env.GITCLAW_REVIEW_MODEL?.trim();
  if (configured) {
    return configured;
  }
  return DEFAULT_MODELS[provider];
}

let cachedModel: LanguageModel | null = null;

export function getReviewModel(): LanguageModel {
  if (cachedModel) {
    return cachedModel;
  }

  const provider = resolveProvider();
  const modelId = resolveModelId(provider);

  switch (provider) {
    case "groq": {
      if (!env.GROQ_API_KEY) {
        throw new Error(
          "GROQ_API_KEY is required when AI_PROVIDER=groq (or when Groq is auto-detected)."
        );
      }
      const groq = createOpenAICompatible({
        name: "groq",
        baseURL: GROQ_BASE_URL,
        apiKey: env.GROQ_API_KEY,
      });
      cachedModel = groq(modelId);
      return cachedModel;
    }

    case "openai-compatible": {
      if (!env.OPENAI_BASE_URL) {
        throw new Error(
          "OPENAI_BASE_URL is required for the OpenAI-compatible provider (Ollama, OpenAI, Azure, ...)."
        );
      }
      const compatible = createOpenAICompatible({
        name: "gitclaw-openai-compatible",
        baseURL: env.OPENAI_BASE_URL,
        ...(env.OPENAI_API_KEY ? { apiKey: env.OPENAI_API_KEY } : {}),
      });
      cachedModel = compatible(modelId);
      return cachedModel;
    }

    case "openrouter":
    default: {
      if (!env.OPENROUTER_API_KEY) {
        throw new Error(
          "OPENROUTER_API_KEY is required when AI_PROVIDER=openrouter (the default)."
        );
      }
      const openrouter = createOpenRouter({
        apiKey: env.OPENROUTER_API_KEY,
      });
      cachedModel = openrouter(modelId);
      return cachedModel;
    }
  }
}
