import { getSource } from "./registry";
import { PhaseOneProvider } from "./provider";
import { USAspendingProvider } from "./usaspending/provider";
import { SAMProvider } from "./sam/provider";
import { SBIRProvider } from "./sbir/provider";
import { AFWERXProvider } from "./afwerx/provider";
import { DARPARssProvider } from "./darpa/provider";
import { GrantsProvider } from "./grants/provider";
import { SAMContractAwardsProvider } from "./sam-awards/provider";
import { EIAProvider } from "./eia/provider";
import { CensusTradeProvider } from "./census-trade/provider";
import { SECEdgarProvider } from "./sec/provider";
import { ExportControlsProvider } from "./export-controls/provider";
import { TEDProvider } from "./ted/provider";
import { UKFindATenderProvider } from "./uk-fts/provider";
import { DIUIntelligenceProvider } from "./diu/provider";
import { BlueUASProvider } from "./blue-uas/provider";
import { HouseDisclosureProvider } from "./house-disclosures/provider";

export { SAMProvider, SBIRProvider, AFWERXProvider, DARPARssProvider as DARPAProvider, GrantsProvider, SAMContractAwardsProvider, EIAProvider, CensusTradeProvider, SECEdgarProvider, SECEdgarProvider as SECProvider, ExportControlsProvider, TEDProvider, UKFindATenderProvider, DIUIntelligenceProvider, DIUIntelligenceProvider as DIUProvider, BlueUASProvider, HouseDisclosureProvider };

export class DoDAnnouncementsProvider extends PhaseOneProvider {
  readonly id = "provider:dod-announcements";
  readonly name = "DoD Announcements Provider";
  readonly source = getSource("source:dod-announcements");
}

export const PROVIDERS = [
  new DARPARssProvider(),
  new GrantsProvider(),
  new SAMContractAwardsProvider(),
  new EIAProvider(),
  new CensusTradeProvider(),
  new SECEdgarProvider(),
  new ExportControlsProvider(),
  new TEDProvider(),
  new UKFindATenderProvider(),
  new BlueUASProvider(),
  new HouseDisclosureProvider(),
  new SAMProvider(),
  new SBIRProvider(),
  new AFWERXProvider(),
  new DIUIntelligenceProvider(),
  new USAspendingProvider(),
  new DoDAnnouncementsProvider(),
] as const;
