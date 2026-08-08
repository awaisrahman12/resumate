export default function Loader({ label = "Working…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-500">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
