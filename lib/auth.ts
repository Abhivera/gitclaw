import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import {
  ConfigError,
  formatEnvSetupMessage,
  getEnvIssues,
  isCoreEnvConfigured,
  validateCoreEnv,
} from "./env";
import { prisma } from "./db";

function createAuth() {
  const env = validateCoreEnv();

  return betterAuth({
    appName: "GitClaw",
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        mapProfileToUser: async (profile) => ({
          email: profile.email ?? `${profile.id}@users.noreply.github.com`,
          name: profile.name ?? profile.login,
        }),
      },
    },
    plugins: [nextCookies()],
  });
}

type AuthInstance = ReturnType<typeof createAuth>;

let authInstance: AuthInstance | undefined;

function getAuthInstance(): AuthInstance {
  if (authInstance) {
    return authInstance;
  }

  if (!isCoreEnvConfigured()) {
    throw new ConfigError(formatEnvSetupMessage(), getEnvIssues());
  }

  authInstance = createAuth();
  return authInstance;
}

export const auth = new Proxy({} as AuthInstance, {
  get(_target, prop, receiver) {
    const instance = getAuthInstance();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
