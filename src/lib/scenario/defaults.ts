import type { Scenario } from "./schema";

export const DEFAULT_SCENARIO: Scenario = {
  presentationFrequency: "one_time",
  verifierTopology: "single_verifier",
  unlinkabilityGoal: "none",
  antiReplay: "nonce_only",
  deviceBinding: "none",
  verificationTarget: "offchain",
  credentialFormat: "sd_jwt",
  revocationHandling: "none",
  notes: "",
};

export const EXAMPLE_SCENARIOS: Record<string, { name: string; scenario: Scenario }> = {
  ptt_badge: {
    name: "One-time PTT Badge Verification",
    scenario: {
      presentationFrequency: "one_time",
      verifierTopology: "single_verifier",
      unlinkabilityGoal: "none",
      antiReplay: "nonce_only",
      deviceBinding: "required",
      verificationTarget: "offchain",
      credentialFormat: "sd_jwt",
      revocationHandling: "none",
      notes: "Physical badge tap at a gate – one-time, device-bound, off-chain.",
    },
  },
  repeat_alcohol: {
    name: "Repeat Presentations (Buy Alcohol)",
    scenario: {
      presentationFrequency: "repeat",
      verifierTopology: "multi_verifier_possible_collusion",
      unlinkabilityGoal: "cross_verifiers",
      antiReplay: "nullifier",
      deviceBinding: "recommended",
      verificationTarget: "offchain",
      credentialFormat: "sd_jwt",
      revocationHandling: "out_of_band",
      notes: "Age check at different stores – must be unlinkable across verifiers.",
    },
  },
};
