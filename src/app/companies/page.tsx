import { CompanyIntelligenceSearch } from "@/components/company-intelligence-search";
import { PageHeader } from "@/components/page-header";

export default function CompaniesPage() { return <><PageHeader eyebrow="SEC + federal awards" title="Company intelligence" description="Resolve a public company through official SEC identity data, then inspect government exposure, technology evidence, reported financial facts, and unresolved supply-chain links without turning candidates into recommendations." /><CompanyIntelligenceSearch /></>; }
