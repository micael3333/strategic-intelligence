"use client";

import { useState } from "react";
import { defaultDefenseSearch } from "@/sources/usaspending/query";
import type { RecipientIntelligence } from "@/sources/usaspending/store";
import type { USAspendingSearchQuery, USAspendingSearchResult } from "@/sources/usaspending/types";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function AwardsSearch() {
  const initial = defaultDefenseSearch();
  const [query, setQuery] = useState<USAspendingSearchQuery>(initial);
  const [keywords, setKeywords] = useState(initial.keywords?.join(", ") ?? "");
  const [result, setResult] = useState<USAspendingSearchResult | null>(null);
  const [recipient, setRecipient] = useState<RecipientIntelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true); setError(null); setRecipient(null);
    try {
      const response = await fetch("/api/usaspending/search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...query, keywords: keywords.split(",").map((term) => term.trim()).filter(Boolean) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Search failed");
      setResult(body as USAspendingSearchResult);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Search failed"); }
    finally { setLoading(false); }
  }

  async function inspectRecipient(id: string) {
    const response = await fetch(`/api/usaspending/recipient/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (response.ok) setRecipient(await response.json() as RecipientIntelligence);
  }

  return (
    <div className="awards-workspace">
      <form className="search-panel" onSubmit={search}>
        <div className="form-grid">
          <label>Start date<input type="date" value={query.startDate} onChange={(e) => setQuery({ ...query, startDate: e.target.value })} required /></label>
          <label>End date<input type="date" value={query.endDate} onChange={(e) => setQuery({ ...query, endDate: e.target.value })} required /></label>
          <label className="wide">Agency<input value={query.agency ?? ""} onChange={(e) => setQuery({ ...query, agency: e.target.value })} placeholder="Department of Defense" /></label>
          <label className="full">Keywords<textarea rows={2} value={keywords} onChange={(e) => setKeywords(e.target.value)} aria-describedby="keyword-help" /></label>
          <small className="full" id="keyword-help">Comma-separated. Matches are candidate signals, not confirmed strategic relevance.</small>
          <label className="wide">Recipient<input value={query.recipientSearchText ?? ""} onChange={(e) => setQuery({ ...query, recipientSearchText: e.target.value || undefined })} /></label>
          <label>Minimum award<input type="number" min="0" value={query.minimumAwardAmount ?? ""} onChange={(e) => setQuery({ ...query, minimumAwardAmount: e.target.value ? Number(e.target.value) : undefined })} /></label>
        </div>
        <details className="advanced-filters"><summary>Advanced filters</summary><div className="form-grid">
          <label>NAICS codes<input placeholder="336411, 541715" onChange={(e) => setQuery({ ...query, naicsCodes: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })} /></label>
          <label>PSC codes<input placeholder="AC13, 1550" onChange={(e) => setQuery({ ...query, pscCodes: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })} /></label>
          <label>Result limit<select value={query.limit} onChange={(e) => setQuery({ ...query, limit: Number(e.target.value) })}><option>10</option><option>25</option><option>50</option></select></label>
        </div></details>
        <button className="search-button" disabled={loading}>{loading ? "Querying official API…" : "Search USAspending"}</button>
        {error && <p className="error-box">{error}</p>}
      </form>

      {result && <section className="results-section">
        <div className="result-summary">
          <div><strong>{result.summary.rawAwardCount}</strong><span>official records</span></div>
          <div><strong>{result.summary.newAwardCount}</strong><span>new records</span></div>
          <div><strong>{result.summary.duplicateCount}</strong><span>duplicates blocked</span></div>
          <div><strong>{result.summary.candidateSignalCount}</strong><span>theme candidates</span></div>
          <div><strong>{result.provenance.httpStatus}</strong><span>HTTP status</span></div>
        </div>
        <p className="provenance-line">Official endpoint · {result.provenance.endpoint} · SHA-256 {result.provenance.responseHash}</p>
        <div className="award-list">{result.awards.map((award) => <article className="award-result" key={award.normalized.id}>
          <div className="award-main">
            <div><p className="eyebrow">{award.normalized.awardingAgency ?? "Agency not returned"}</p><h2>{award.normalized.recipientName ?? "Recipient not returned"}</h2></div>
            <strong className="award-amount">{award.normalized.awardAmount === undefined ? "Amount not returned" : money.format(award.normalized.awardAmount)}</strong>
          </div>
          <div className="award-meta"><span>{award.normalized.awardId ?? award.normalized.generatedInternalId ?? award.normalized.id}</span><span>{award.normalized.startDate ?? award.normalized.baseObligationDate ?? "Date not returned"}</span><span>{award.normalized.awardType ?? "Type not returned"}</span><span>Evidence · CONFIRMED</span></div>
          <p>{award.normalized.description ?? "No description returned by the selected endpoint fields."}</p>
          <div className="interpretation-grid">
            <div><small>Theme match</small><strong>{award.themeMatch?.themeName ?? "No candidate match"}</strong><span>{award.themeMatch ? `${award.themeMatch.evidenceLevel} · ${award.themeMatch.matchedTerms.join(", ")}` : "No relevance inferred"}</span></div>
            <div><small>Funnel interpretation</small><strong>{award.funnel.stage === null ? "PROCUREMENT EVENT · NO PROMOTION" : `STAGE ${award.funnel.stage}`}</strong><span>{award.funnel.explanation}</span></div>
            <div><small>Entity resolution</small><strong>{award.recipient.status.replaceAll("_", " ")}</strong><span>{award.recipient.explanation}</span></div>
          </div>
          <div className="award-actions"><button onClick={() => inspectRecipient(award.recipient.id)} type="button">Inspect recipient intelligence</button><details><summary>Raw source data</summary><pre>{JSON.stringify(award.raw, null, 2)}</pre></details><details><summary>Normalized event</summary><pre>{JSON.stringify({ normalized: award.normalized, procurementEvent: award.procurementEvent, strategicEvents: award.strategicEvents }, null, 2)}</pre></details></div>
        </article>)}</div>
      </section>}

      {recipient && <aside className="recipient-panel">
        <div className="section-heading"><div><p className="eyebrow">Recipient intelligence</p><h2>{recipient.recipient.canonicalName}</h2></div><button type="button" onClick={() => setRecipient(null)}>Close</button></div>
        <p>{recipient.recipient.status.replaceAll("_", " ")} · {Object.entries(recipient.recipient.identifiers).filter(([, value]) => value).map(([key, value]) => `${key.toUpperCase()}: ${value}`).join(" · ") || "No authoritative identifier returned"}</p>
        <div className="recipient-metrics"><div><strong>{recipient.awardCount}</strong><span>Awards</span></div><div><strong>{money.format(recipient.totalAwardValue)}</strong><span>Total value</span></div><div><strong>{recipient.agencies.length}</strong><span>Agencies</span></div></div>
        <div className="score-panels"><Score title="Strategic Signal" score={recipient.strategicSignal.score} explanation={recipient.strategicSignal.explanation} factors={recipient.strategicSignal.factors} /><Score title="Acceleration" score={recipient.acceleration.score.score} explanation={`${recipient.acceleration.label}. ${recipient.acceleration.explanation}`} factors={recipient.acceleration.score.factors} /><Score title="Evidence Confidence" score={recipient.evidenceConfidence.score} explanation={recipient.evidenceConfidence.explanation} factors={recipient.evidenceConfidence.factors} /></div>
      </aside>}
    </div>
  );
}

function Score({ title, score, explanation, factors }: { title: string; score: number; explanation: string; factors: Array<{ key: string; label: string; points: number }> }) {
  return <article><p className="eyebrow">{title}</p><strong className="big-score">{score}</strong><p>{explanation}</p><details><summary>Explain factors</summary><ul>{factors.map((factor) => <li key={factor.key}>{factor.label}: +{factor.points}</li>)}</ul></details></article>;
}
