import { PageHeader } from "@/components/page-header";
import { FUNNEL_STAGES } from "@/domain/funnel";

const examples: Record<number, string> = {
  0: "Strategic problem, mission gap, or research priority",
  1: "RFI, Sources Sought, BAA, presolicitation, requirement",
  2: "DARPA research, SBIR/STTR, AFWERX topic",
  3: "DIU selection, prototype contract, experimental award",
  4: "Successful prototype, Success Memo, operational evaluation",
  5: "First meaningful award, initial order, follow-on contract",
  6: "Production contract, repeat procurement, manufacturing expansion",
  7: "Multi-year procurement, capacity support, prime integration",
};

const downstream = ["Components", "Materials", "Hidden Suppliers"];
const providerByStage: Record<number, string> = { 1: "SAM · CONNECTED WHEN KEYED", 2: "SBIR/STTR + AFWERX", 3: "AFWERX SIGNALS · DIU FUTURE", 4: "DIU + BLUE UAS · FUTURE", 5: "USASPENDING · LIVE", 6: "INDUSTRIAL SOURCES · FUTURE", 7: "INDUSTRIAL + SEC · FUTURE" };

export default function FunnelPage() {
  return (
    <>
      <PageHeader eyebrow="Canonical domain concept" title="The intelligence funnel" description="A stage is never returned without supporting events. Speculation can inform research, but cannot advance an entity through the funnel." />
      <section className="vertical-funnel" aria-label="Strategic intelligence funnel">
        {FUNNEL_STAGES.map((item) => (
          <article className="funnel-step" key={item.stage}>
            <div className="stage-number">{item.stage}</div>
            <div><p>Stage {item.stage}</p><h2>{item.name}</h2><span>{examples[item.stage]}</span></div>
            <div className="evidence-gate"><strong>{providerByStage[item.stage] ?? "SOURCE DISCOVERY · FUTURE"}</strong><span>Non-speculative strategic event required</span></div>
          </article>
        ))}
        <div className="decomposition-divider"><span>After structural scale · technology decomposition</span></div>
        {downstream.map((label, index) => (
          <article className="funnel-step downstream" key={label}>
            <div className="stage-number">{8 + index}</div>
            <div><p>Graph layer</p><h2>{label}</h2><span>{index === 0 ? "System → subsystem → component" : index === 1 ? "Component → material with explicit evidence" : "Supplier → company → public/private → financial analysis"}</span></div>
          </article>
        ))}
      </section>
    </>
  );
}
