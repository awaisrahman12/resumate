import ReactMarkdown from "react-markdown";
import api from "../api/client.js";

/** Trigger a browser download of the given text in markdown format. */
function downloadMarkdown(filename, text) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Download resume as PDF from the server. */
async function downloadPDF(filename, content) {
  try {
    const response = await api.post(
      "/resume/download-pdf",
      { content, filename },
      { responseType: "blob" }
    );
    const url = URL.createObjectURL(response.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert("Failed to download PDF. Please try again.");
    console.error(err);
  }
}

/**
 * Renders a Markdown resume with download buttons (.md and .pdf) and an optional action
 * (e.g. "Improve this") passed in as children.
 */
export default function ResumeView({ content, title = "resume", children }) {
  const filename = title.replace(/\s+/g, "-").toLowerCase();

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Result</h3>
        <div className="flex flex-wrap items-center gap-2">
          {children}
          <button
            className="btn-ghost"
            onClick={() => downloadMarkdown(`${filename}.md`, content)}
          >
            Download .md
          </button>
          <button
            className="btn-ghost"
            onClick={() => downloadPDF(filename, content)}
          >
            Download PDF
          </button>
        </div>
      </div>
      <div className="prose-resume max-w-none rounded-xl bg-slate-50 p-6">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
