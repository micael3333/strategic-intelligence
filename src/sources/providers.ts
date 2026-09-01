import { getSource } from "./registry";
import { PhaseOneProvider } from "./provider";
import { USAspendingProvider } from "./usaspending/provider";

export class DARPAProvider extends PhaseOneProvider {
  readonly id = "provider:darpa";
  readonly name = "DARPA Provider";
  readonly source = getSource("source:darpa");
}

export class SAMProvider extends PhaseOneProvider {
  readonly id = "provider:sam";
  readonly name = "SAM.gov Provider";
  readonly source = getSource("source:sam");
  protected requiredEnvironmentVariable = "SAM_API_KEY";
}

export class SBIRApiProvider extends PhaseOneProvider {
  readonly id = "provider:sbir-api";
  readonly name = "SBIR API Provider";
  readonly source = getSource("source:sbir");
}

export class SBIRDatasetProvider extends PhaseOneProvider {
  readonly id = "provider:sbir-dataset";
  readonly name = "SBIR Dataset Provider";
  readonly source = getSource("source:sbir");
}

export class AFWERXProvider extends PhaseOneProvider {
  readonly id = "provider:afwerx";
  readonly name = "AFWERX / SpaceWERX Provider";
  readonly source = getSource("source:afwerx");
}

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
  new SBIRApiProvider(),
  new SBIRDatasetProvider(),
  new AFWERXProvider(),
  new DIUProvider(),
  new USAspendingProvider(),
  new DoDAnnouncementsProvider(),
  new SECProvider(),
] as const;
