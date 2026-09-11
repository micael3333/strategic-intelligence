import { IntelligenceSearch } from "@/components/intelligence-search";
import { PageHeader } from "@/components/page-header";
import { ProviderStatusDashboard } from "@/components/provider-status-dashboard";
import { RadarDashboard } from "@/components/radar-dashboard";

export default function Dashboard() { return <>
  <PageHeader eyebrow="Strategic signal graph + physical economy" title="AllMarkets Intelligence" description="See where government demand, public capital, technology maturation, physical supply, energy data, and issuer-reported evidence converge—starting from the strategic problem, not the ticker." />
  <RadarDashboard />
  <ProviderStatusDashboard />
  <section className="section-block"><div className="section-heading"><div><p className="eyebrow">Problem-first investigation</p><h2>Intelligence search</h2></div><span>Providers fail independently</span></div><IntelligenceSearch /></section>
</>; }
