import { PageHeader } from "@/components/page-header";
import { GNSS_DENIED_THEME } from "@/config/themes";
import { EvidenceThemes } from "@/components/evidence-themes";

export default function ThemesPage() {
  const byType = Object.groupBy(GNSS_DENIED_THEME.nodes, (node) => node.type);
  return (
    <>
      <PageHeader eyebrow="Technology taxonomy / theme 01" title={GNSS_DENIED_THEME.name} description={GNSS_DENIED_THEME.description} />
      <EvidenceThemes />
      <div className="section-heading"><div><p className="eyebrow">Configured taxonomy</p><h2>Reusable decomposition scaffold</h2></div><span>Not a live signal by itself</span></div>
      <section className="theme-map">
        {Object.entries(byType).map(([type, nodes]) => (
          <article className="taxonomy-column" key={type}>
            <p className="eyebrow">{type.replaceAll("_", " ")}</p>
            {(nodes ?? []).map((node) => (
              <div className="taxonomy-node" key={node.id}>
                <strong>{node.label}</strong>
                {node.aliases.length > 0 && <span>Aliases: {node.aliases.join(", ")}</span>}
                <small>Default relation: {node.relationshipEvidenceDefault}</small>
              </div>
            ))}
          </article>
        ))}
      </section>
      <aside className="callout"><strong>Evidence boundary</strong><p>This is a research vocabulary and decomposition scaffold. It does not assert that a specific system uses every listed component. Platform-specific graph edges require their own evidence.</p></aside>
    </>
  );
}
