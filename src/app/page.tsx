import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { FUNNEL_STAGES } from "@/domain/funnel";
import { SOURCE_REGISTRY } from "@/sources/registry";
import { TECHNOLOGY_THEMES } from "@/config/themes";

const scoreCards = [
  ["Strategic Signal", "Weighted, evidence-adjusted relevance across the funnel.", "Implemented"],
  ["Acceleration", "Change in adoption, customer breadth, program breadth, and cadence.", "Implemented"],
  ["Evidence Confidence", "Separates an interesting thesis from a proven thesis.", "Implemented"],
  ["Execution / Investment Risk", "Reserved for validated financial and execution inputs.", "Prepared"],
] as const;

export default function Dashboard() {
  return (
    <>
      <PageHeader
        eyebrow="Intelligence engine / foundation"
        title="Trace strategic need into industrial scale."
        description="A problem-first graph for distinguishing early research signals from validation, real procurement, production, and critical supply-chain exposure."
      />

      <section className="metric-strip" aria-label="Foundation summary">
        <div><strong>8</strong><span>funnel stages</span></div>
        <div><strong>{SOURCE_REGISTRY.length}</strong><span>primary sources mapped</span></div>
        <div><strong>{TECHNOLOGY_THEMES.length}</strong><span>technology theme</span></div>
        <div><strong>0</strong><span>providers claimed live</span></div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div><p className="eyebrow">Canonical model</p><h2>Intelligence Funnel</h2></div>
          <Link href="/funnel">Open full funnel →</Link>
        </div>
        <div className="funnel-row">
          {FUNNEL_STAGES.map((item) => (
            <div className="stage-card" key={item.stage}>
              <span>0{item.stage}</span>
              <strong>{item.shortName}</strong>
            </div>
          ))}
        </div>
      </section>

      <div className="two-column">
        <section className="panel">
          <div className="section-heading"><div><p className="eyebrow">Registry</p><h2>Source status</h2></div><Link href="/sources">All sources →</Link></div>
          <div className="source-list">
            {SOURCE_REGISTRY.map((source) => (
              <div className="source-row" key={source.id}>
                <div><strong>{source.name}</strong><span>Stages {source.funnelStages.join(" · ")}</span></div>
                <StatusPill status={source.providerStatus} />
              </div>
            ))}
          </div>
          <p className="panel-note">Phase 1 health is structural only. No external connection test has been performed.</p>
        </section>

        <section className="panel accent-panel">
          <div className="section-heading"><div><p className="eyebrow">First theme</p><h2>GNSS-Denied Autonomous Systems</h2></div><Link href="/themes">Explore →</Link></div>
          <p>From resilient positioning and autonomous navigation to the component and supplier layers that require evidence-led decomposition.</p>
          <div className="tag-cloud">
            {TECHNOLOGY_THEMES[0].nodes.slice(0, 12).map((node) => <span key={node.id}>{node.label}</span>)}
          </div>
          <p className="panel-note">Taxonomy links default to INFERRED until a public source confirms a platform-specific relationship.</p>
        </section>
      </div>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">Transparent by design</p><h2>Scores architecture</h2></div><Link href="/methodology">Read methodology →</Link></div>
        <div className="card-grid four">
          {scoreCards.map(([title, description, status], index) => (
            <article className="score-card" key={title}>
              <span className="score-index">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <small>{status}</small>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
