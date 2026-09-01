import { PageHeader } from "@/components/page-header";
import { AwardsSearch } from "@/components/awards-search";

export default function AwardsPage() {
  return <><PageHeader eyebrow="Live audited pipeline" title="Federal award intelligence" description="Search the official USAspending API, preserve raw provenance, inspect normalized procurement events, and keep candidate theme relevance separate from confirmed award facts." /><AwardsSearch /></>;
}
