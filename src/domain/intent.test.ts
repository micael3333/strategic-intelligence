import { describe, expect, it } from "vitest";
import { resolveInvestigationIntent } from "./intent";

describe("investigation intent", () => {
  it("requires a local choice for broad drone intent", () => { const result = resolveInvestigationIntent("drone"); expect(result.requiresChoice).toBe(true); expect(result.options).toHaveLength(7); });
  it("resolves the selected choice without external inference", () => { const result = resolveInvestigationIntent("drone", "counter-uas"); expect(result).toMatchObject({ requiresChoice: false, cluster: "COUNTER_UAS", query: "counter-UAS" }); });
});
