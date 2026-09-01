import { PageHeader } from "@/components/page-header";

const evidence = [
  ["CONFIRMED", "A primary or highly authoritative source directly supports the claim."],
  ["PROBABLE", "Multiple credible public sources converge strongly."],
  ["INFERRED", "A technical or logical inference is useful, but not directly proven."],
  ["SPECULATIVE", "A research hypothesis that cannot advance a funnel stage."],
] as const;

export default function MethodologyPage() {
  return (
    <>
      <PageHeader eyebrow="Inspectable methodology" title="Facts first. Inference visible." description="The platform keeps strategic relevance, acceleration, and proof quality separate so a compelling thesis cannot masquerade as a confirmed one." />
      <section className="method-grid">
        <article className="panel"><p className="eyebrow">Starting point</p><h2>Why the problem comes first</h2><p>A ticker-first workflow anchors research on companies already visible to markets. A strategic-need-first workflow follows demand formation into programs, companies, technologies, components, materials, and suppliers—preserving the causal chain.</p></article>
        <article className="panel"><p className="eyebrow">Stage logic</p><h2>Explainable funnel state</h2><p>The current stage is the highest stage with at least one non-speculative supporting event. The result returns the exact event records, excluded events, and a plain-language explanation.</p></article>
      </section>
      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">Proof quality</p><h2>Evidence levels</h2></div></div>
        <div className="card-grid four">{evidence.map(([level, text]) => <article className={`evidence-card ${level.toLowerCase()}`} key={level}><h3>{level}</h3><p>{text}</p></article>)}</div>
        <aside className="callout"><strong>AI constraint</strong><p>An AI-generated relationship is automatically capped at INFERRED, even if a caller incorrectly labels it CONFIRMED.</p></aside>
      </section>
      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">Independent outputs</p><h2>Transparent scores</h2></div></div>
        <div className="method-list">
          <article><span>01</span><div><h3>Strategic Signal Score</h3><p>Central event weights adjusted by the strongest evidence level. Returns every factor, point contribution, explanation, and evidence ID.</p></div></article>
          <article><span>02</span><div><h3>Acceleration Score</h3><p>Period-over-period award count and value growth plus agency, program, prime-relationship, and cadence signals. Absolute contract size cannot dominate.</p></div></article>
          <article><span>03</span><div><h3>Evidence Confidence</h3><p>Average proof strength adjusted by record confidence. A strong signal can therefore coexist with weak evidence coverage.</p></div></article>
          <article><span>04</span><div><h3>Execution / Investment Risk</h3><p>Interface placeholder only. Financial, dilution, concentration, capital, and delivery evidence must exist before implementation.</p></div></article>
        </div>
      </section>
    </>
  );
}
