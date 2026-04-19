import { cn } from "@/lib/utils";

// Lightweight markdown preview — handles headings, lists, code fences, paragraphs.
// Sufficient for previewing rendered prompts. No XSS vector since input comes
// from our typed mock/service layer; if wired to user input, swap to `marked` + DOMPurify.
function escape(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
}

function render(md: string): string {
  let html = "";
  let inCode = false;
  let codeBuf: string[] = [];
  const lines = md.split(/\r?\n/);
  const flushCode = () => {
    html += `<pre class="my-3 overflow-auto rounded-md border bg-surface-sunken p-3 text-mono text-foreground/85"><code>${escape(codeBuf.join("\n"))}</code></pre>`;
    codeBuf = [];
  };
  let listOpen = false;
  for (const raw of lines) {
    if (raw.startsWith("```")) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        if (listOpen) { html += "</ul>"; listOpen = false; }
        inCode = true;
      }
      continue;
    }
    if (inCode) { codeBuf.push(raw); continue; }
    const line = raw.trim();
    if (!line) {
      if (listOpen) { html += "</ul>"; listOpen = false; }
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      if (listOpen) { html += "</ul>"; listOpen = false; }
      const lvl = h[1].length;
      const cls = ["text-xl font-semibold mt-4 mb-2", "text-lg font-semibold mt-4 mb-2", "text-base font-semibold mt-3 mb-1.5", "text-sm font-semibold mt-3 mb-1", "text-sm font-medium mt-2 mb-1", "text-xs font-medium uppercase tracking-wider mt-2 mb-1 text-muted-foreground"][lvl - 1];
      html += `<h${lvl} class="${cls}">${escape(h[2])}</h${lvl}>`;
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      if (!listOpen) { html += "<ul class=\"list-disc pl-6 my-2 space-y-1 text-sm\">"; listOpen = true; }
      html += `<li>${escape(line.replace(/^[-*]\s+/, ""))}</li>`;
      continue;
    }
    if (line === "---") { html += "<hr class=\"my-3 border-border\"/>"; continue; }
    if (listOpen) { html += "</ul>"; listOpen = false; }
    html += `<p class="my-2 text-sm leading-relaxed">${escape(line)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code class=\"rounded bg-surface-sunken px-1 py-0.5 text-mono\">$1</code>")}</p>`;
  }
  if (inCode) flushCode();
  if (listOpen) html += "</ul>";
  return html;
}

export function MarkdownPreview({ source, className }: { source: string; className?: string }) {
  return (
    <div
      className={cn("rounded-md border bg-card p-4 max-w-none text-foreground", className)}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: render(source) }}
    />
  );
}
