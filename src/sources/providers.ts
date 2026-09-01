import { getSource } from "./registry";
import { PhaseOneProvider } from "./provider";
import { USAspendingProvider } from "./usaspending/provider";
import { SAMProvider } from "./sam/provider";
import { SBIRProvider } from "./sbir/provider";
import { AFWERXProvider } from "./afwerx/provider";

export class DARPAProvider extends PhaseOneProvider {
  readonly id = "provider:darpa";
  readonly name = "DARPA Provider";
  readonly source = getSource("source:darpa");
}

export { SAMProvider, SBIRProvider, AFWERXProvider };

export class DIUProvider extends PhaseOneProvider {
  readonly id = "provider:diu";
  readonly name = "DIU Provider";
  readonly source = getSource("source:diu");
}

export class DoDAnnouncementsProvider extends PhaseOneProvider {
  readonly id = "provider:dod-announcements";
  readonly name = "DoD Announcements Provider";
  readonly source = getSource("source:dod-announcements");
}

export class SECProvider extends PhaseOneProvider {
  readonly id = "provider:sec-edgar";
  readonly name = "SEC EDGAR Provider";
  readonly source = getSource("source:sec-edgar");
  protected requiredEnvironmentVariable = "SEC_USER_AGENT";
}

export const PROVIDERS = [
  new DARPAProvider(),
  new SAMProvider(),
  new SBIRProvider(),
  new AFWERXProvider(),
  new DIUProvider(),
  new USAspendingProvider(),
  new DoDAnnouncementsProvider(),
  new SECProvider(),
] as const;
