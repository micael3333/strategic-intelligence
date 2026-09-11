"use client";

import { useEffect, useState } from "react";
import type { ProviderHealth } from "@/sources/provider";

export function ProviderStatusDashboard() {
  const [health, setHealth] = useState<ProviderHealth[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string>();
  async function load(live = false) { setLoading(true); setError(undefined); try { const response = await fetch(`/api/providers/status${live ? "?live=1" : ""}`, { cache: "no-store" }); if (!response.ok) throw new Error(`Health route returned HTTP ${response.status}.`); setHealth(await response.json() as ProviderHealth[]); } catch (reason) { setError(reason instanceof Error ? reason.message : "Provider health failed."); } finally { setLoading(false); } }
  useEffect(() => { void load(false); }, []);
  return <section className="section-block"><div className="section-heading"><div><p className="eyebrow">Provider state</p><h2>Source health</h2></div><button className="secondary-button" disabled={loading} onClick={() => void load(true)}>{loading ? "Loading…" : "Run bounded live checks"}</button></div>{error && <p className="error-box">{error}</p>}<div className="provider-grid">{health.map((item) => <article className={`panel provider-health ${item.status.toLowerCase()}`} key={item.providerId}><p className="eyebrow">{item.status}</p><h3>{item.providerId.replace("provider:", "").replaceAll("-", " ")}</h3><strong className="provider-count">{item.recordsRetrieved ?? 0}</strong><span>{item.status === "WORKING" ? "records in last check" : "records reported"}</span><p>{item.message}</p><div className="provider-facts"><span>External check · {item.performedExternalCheck ? "YES" : "NO"}</span><span>Mode · {item.mode ?? "ADAPTER"}</span><span>Authentication · {item.authenticationRequired ? "REQUIRED" : "NONE"}</span><span>Checked · {new Date(item.checkedAt).toLocaleString()}</span><span>Last error · {item.lastError ?? "NONE"}</span></div></article>)}</div></section>;
}
