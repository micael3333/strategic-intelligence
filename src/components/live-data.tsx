"use client";

import { useEffect, useState } from "react";

interface LiveStats {
  providerHealth: { status: string; message: string } | null;
  lastSuccessfulRequest: string | null;
  realAwardsLoaded: number;
  resolvedRecipients: number;
  candidateStrategicSignals: number;
  accelerationSignals: number;
}

export function LiveData() {
  const [stats, setStats] = useState<LiveStats | null>(null);
  useEffect(() => {
    let active = true;
    Promise.allSettled([
      fetch("/api/providers/usaspending/health", { cache: "no-store" }),
      fetch("/api/usaspending/stats", { cache: "no-store" }),
    ]).then(async () => {
      const response = await fetch("/api/usaspending/stats", { cache: "no-store" });
      if (active) setStats(await response.json() as LiveStats);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  const values = [
    ["Provider", stats?.providerHealth?.status ?? "CHECKING"],
    ["Real awards loaded", stats ? String(stats.realAwardsLoaded) : "—"],
    ["Resolved recipients", stats ? String(stats.resolvedRecipients) : "—"],
    ["Candidate signals", stats ? String(stats.candidateStrategicSignals) : "—"],
    ["Acceleration signals", stats ? String(stats.accelerationSignals) : "—"],
  ];
  return (
    <section className="section-block live-data">
      <div className="section-heading"><div><p className="eyebrow">Official public API</p><h2>Live data · USAspending</h2></div><span>GNSS-Denied Autonomous Systems</span></div>
      <div className="live-grid">{values.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      <p className="panel-note">Last successful request: {stats?.lastSuccessfulRequest ? new Date(stats.lastSuccessfulRequest).toLocaleString() : "No live search has run in this server session."}</p>
    </section>
  );
}
