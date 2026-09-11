"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { RadarSignal } from "@/domain/radar";

export function EvidenceThemes() {
  const [signals, setSignals] = useState<RadarSignal[]>(); const [error, setError] = useState<string>();
  useEffect(() => { fetch("/api/radar", { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error(`Radar returned HTTP ${response.status}.`); const payload = await response.json() as { signals: RadarSignal[] }; setSignals(payload.signals); }).catch((reason) => setError(reason instanceof Error ? reason.message : "Stored themes could not be loaded.")); }, []);
  return <section className="section-block"><div className="section-heading"><div><p className="eyebrow">Stored evidence</p><h2>Evidence-derived themes</h2></div><span>{signals?.length ?? 0} active</span></div>{error ? <p className="error-box">{error}</p> : signals === undefined ? <div className="empty-state">Loading stored intelligence history…</div> : signals.length === 0 ? <div className="empty-state">No evidence-derived theme exists yet. Run an intelligence investigation to create a durable snapshot.</div> : <div className="card-grid three">{signals.map((signal) => <article className="panel" key={signal.id}><p className="eyebrow">{signal.lifecycleStatus} · {signal.confidence} confidence</p><h3>{signal.cluster.replaceAll("_", " ")}</h3><p>{signal.explanation}</p><small>{signal.independentProviderCount} source families · {signal.jurisdictions.join(" / ") || "jurisdiction unavailable"} · updated {new Date(signal.lastUpdated).toLocaleDateString()}</small><br /><Link href={`/intelligence?query=${encodeURIComponent(signal.cluster.replaceAll("_", " ").toLowerCase())}`}>Inspect evidence →</Link></article>)}</div>}</section>;
}
