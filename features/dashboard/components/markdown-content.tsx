import { cn } from "@/lib/utils";

type MarkdownContentProps = {
  content: string;
  className?: string;
};

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("*")) {
      parts.push(<em key={match.index}>{token.slice(1, -1)}</em>);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }
    elements.push(
      <ul key={key++} className="my-2 list-disc space-y-1 pl-5">
        {listItems.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      listItems.push(trimmed.slice(2));
      continue;
    }

    flushList();

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={key++} className="mt-4 mb-2 text-sm font-semibold">
          {renderInline(trimmed.slice(4))}
        </h4>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={key++} className="mt-4 mb-2 text-base font-semibold">
          {renderInline(trimmed.slice(3))}
        </h3>
      );
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={key++} className="mt-4 mb-2 text-lg font-semibold">
          {renderInline(trimmed.slice(2))}
        </h2>
      );
    } else {
      elements.push(
        <p key={key++} className="my-2 leading-relaxed">
          {renderInline(trimmed)}
        </p>
      );
    }
  }

  flushList();

  return (
    <div className={cn("text-sm text-foreground", className)}>{elements}</div>
  );
}
