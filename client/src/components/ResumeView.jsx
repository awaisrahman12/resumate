import ReactMarkdown from "react-markdown";

/** Trigger a browser download of the given text. */
function download(filename, text) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Renders a Markdown resume with a download button and an optional action
 * (e.g. "Improve this") passed in as children.
 */
export default function ResumeView({ content, title = "resume", children }) {
  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Result</h3>
        <div className="flex items-center gap-2">
          {children}
          <button
            className="btn-ghost"
            onClick={() => download(`${title.replace(/\s+/g, "-").toLowerCase()}.md`, content)}
          >
            Download .md
          </button>
        </div>
      </div>
      <div className="prose-resume max-w-none rounded-xl bg-slate-50 p-6">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
