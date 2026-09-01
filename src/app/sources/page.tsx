import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { ALL_SOURCES, SOURCE_REGISTRY } from "@/sources/registry";
import { ProviderStatusDashboard } from "@/components/provider-status-dashboard";

export default function SourcesPage() {
  const future = ALL_SOURCES.filter((source) => source.future);
  return (
    <>
      <PageHeader eyebrow="Modular ingestion boundary" title="Source Registry" description="Every source declares its role, funnel coverage, access assumptions, credential needs, reliability, and limits. Provider failure is isolated by adapter." />
      <div className="table-wrap">
        <table>
          <thead><tr><th>Source / role</th><th>Stages</th><th>Access</th><th>Status</th><th>Credentials</th><th>Limitations</th></tr></thead>
          <tbody>
            {SOURCE_REGISTRY.map((source) => (
              <tr key={source.id}>
                <td><strong>{source.name}</strong><span>{source.role}</span></td>
                <td><div className="stage-dots">{source.funnelStages.map((stage) => <b key={stage}>{stage}</b>)}</div></td>
                <td>{source.accessMethod.replaceAll("_", " ")}</td>
                <td><StatusPill status={source.providerStatus} /></td>
                <td>{source.credentialRequirement ?? "None declared"}</td>
                <td><ul>{source.limitations.map((limit) => <li key={limit}>{limit}</li>)}</ul></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ProviderStatusDashboard />
      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">Placeholders only</p><h2>Future sources</h2></div><span>{future.length} planned</span></div>
        <div className="card-grid three">
          {future.map((source) => <article className="future-card" key={source.id}><h3>{source.name}</h3><p>{source.role}</p><StatusPill status="PLANNED" /></article>)}
        </div>
      </section>
    </>
  );
}
