export function StatusPill({ status }: { status: string }) {
  const tone = status === "CONFIGURATION_REQUIRED" ? "warn" : status === "SKELETON" || status === "NOT_IMPLEMENTED" ? "neutral" : "quiet";
  return <span className={`status-pill ${tone}`}>{status.replaceAll("_", " ")}</span>;
}
