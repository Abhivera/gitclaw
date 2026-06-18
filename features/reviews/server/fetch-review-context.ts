import type { ProviderConnectionRecord } from "@/features/git-providers/types";
import type { PrFile } from "@/features/reviews/types/review";
import type { GitclawConfig } from "@/features/config/types/gitclaw-config";
import { getProviderAdapter } from "@/features/git-providers/server/get-adapter";
import type { GitProvider } from "@/lib/generated/prisma/client";

const IMPORT_PATTERNS = [
  /import\s+[^'"]*['"]([^'"]+)['"]/g,
  /from\s+['"]([^'"]+)['"]/g,
  /require\(\s*['"]([^'"]+)['"]\s*\)/g,
];

const CONTEXT_DOC_FILES = ["README.md", "CONTRIBUTING.md"];

function extractLocalImports(patch: string, filePath: string): string[] {
  const imports = new Set<string>();

  for (const pattern of IMPORT_PATTERNS) {
    for (const match of patch.matchAll(pattern)) {
      const specifier = match[1];
      if (!specifier || (!specifier.startsWith(".") && !specifier.startsWith("@/"))) {
        continue;
      }

      const dir = filePath.includes("/")
        ? filePath.slice(0, filePath.lastIndexOf("/"))
        : "";
      const resolved = resolveRelativeImport(dir, specifier);
      if (resolved) {
        imports.add(resolved);
      }
    }
  }

  return [...imports];
}

function resolveRelativeImport(dir: string, specifier: string): string | null {
  if (specifier.startsWith("@/")) {
    return `src/${specifier.slice(2)}`;
  }

  const parts = [...(dir ? dir.split("/") : []), ...specifier.split("/")];
  const resolved: string[] = [];

  for (const part of parts) {
    if (part === "." || part === "") {
      continue;
    }
    if (part === "..") {
      resolved.pop();
      continue;
    }
    resolved.push(part);
  }

  const path = resolved.join("/");
  if (!path.includes(".")) {
    return `${path}.ts`;
  }
  return path;
}

type ContextInput = {
  provider: GitProvider;
  connection: ProviderConnectionRecord;
  repoFullName: string;
  baseBranch: string;
  files: PrFile[];
  config: GitclawConfig;
};

export async function fetchReviewContext(input: ContextInput): Promise<string> {
  const adapter = getProviderAdapter(input.provider);
  const sections: string[] = [];

  const importPaths = new Set<string>();
  for (const file of input.files) {
    for (const path of extractLocalImports(file.patch, file.filePath)) {
      importPaths.add(path);
    }
  }

  const pathsToFetch = [
    ...CONTEXT_DOC_FILES,
    ...[...importPaths].slice(0, 5),
  ];

  for (const filePath of pathsToFetch) {
    const content = await adapter.fetchFileContent(
      input.connection,
      input.repoFullName,
      filePath,
      input.baseBranch
    );

    if (content) {
      sections.push(
        `### ${filePath} (base branch)\n\`\`\`\n${truncateContent(content)}\n\`\`\``
      );
    }
  }

  if (input.config.instructions) {
    sections.push(
      `### Repository instructions\n${input.config.instructions.trim()}`
    );
  }

  if (sections.length === 0) {
    return "";
  }

  return `## Additional context\n\n${sections.join("\n\n")}`;
}

function truncateContent(content: string, maxLines = 120): string {
  const lines = content.split("\n");
  if (lines.length <= maxLines) {
    return content;
  }
  return `${lines.slice(0, maxLines).join("\n")}\n... (truncated)`;
}
