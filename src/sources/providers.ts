import { getSource } from "./registry";
import { PhaseOneProvider } from "./provider";
import { USAspendingProvider } from "./usaspending/provider";
import { SAMProvider } from "./sam/provider";
import { SBIRProvider } from "./sbir/provider";
import { AFWERXProvider } from "./afwerx/provider";
import { DARPARssProvider } from "./darpa/provider";
import { GrantsProvider } from "./grants/provider";

export { SAMProvider, SBIRProvider, AFWERXProvider, DARPARssProvider as DARPAProvider, GrantsProvider };

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
  new DARPARssProvider(),
  new GrantsProvider(),
  new SAMProvider(),
  new SBIRProvider(),
  new AFWERXProvider(),
  new DIUProvider(),
  new USAspendingProvider(),
  new DoDAnnouncementsProvider(),
  new SECProvider(),
] as const;
