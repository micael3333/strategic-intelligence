export function StatusPill({ status }: { status: string }) {
  const tone = /AUTH|CONFIGURATION|RATE_LIMITED|BUDGET|MAINTENANCE|ERROR|FAILED|UNAVAILABLE/.test(status) ? "warn" : status === "SKELETON" || status === "NOT_IMPLEMENTED" || status === "PLANNED" ? "neutral" : "quiet";
  return <span className={`status-pill ${tone}`}>{status.replaceAll("_", " ")}</span>;
}
