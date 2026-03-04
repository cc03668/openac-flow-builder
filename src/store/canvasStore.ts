import { create } from "zustand";
import { MODULE_REGISTRY } from "@/lib/modules/registry";
import type { ModuleDefinition } from "@/lib/modules/types";
import { generateDiagram } from "@/lib/diagram/generator";
import type { DiagramLevel, DiagramOutput } from "@/lib/diagram/types";

export interface PrivacyDeduction {
  amount: number;
  reason: string;
}

export interface PrivacyMeterResult {
  score: number;
  deductions: PrivacyDeduction[];
}

export interface WarningItem {
  severity: "warning" | "info";
  message: string;
}

interface CanvasState {
  // Active modules on the canvas
  canvasModuleIds: string[];
  // Diagram state
  diagram: DiagramOutput | null;
  diagramLevel: DiagramLevel;
  // Comparison baseline
  baselineModuleIds: string[];
  showCompare: boolean;
  // Scenario context for privacy meter
  unlinkabilityGoal: string;
  antiReplay: string;
  deviceBinding: string;
  presentationFrequency: string;
  verificationTarget: string;

  // Actions
  addModule: (id: string) => void;
  removeModule: (id: string) => void;
  reorderModules: (ids: string[]) => void;
  setDiagramLevel: (level: DiagramLevel) => void;
  setShowCompare: (show: boolean) => void;
  setScenarioContext: (ctx: Partial<Pick<CanvasState, "unlinkabilityGoal" | "antiReplay" | "deviceBinding" | "presentationFrequency" | "verificationTarget">>) => void;
  loadFromEngineOutput: (moduleIds: string[], scenario?: { unlinkabilityGoal: string; antiReplay: string; deviceBinding: string; presentationFrequency: string; verificationTarget: string }) => void;
  importCanvas: (json: string) => boolean;
  exportCanvas: () => string;

  // Computed
  getPrivacyMeter: () => PrivacyMeterResult;
  getWarnings: () => WarningItem[];
  getPaletteModules: () => ModuleDefinition[];
}

function regenerateDiagram(moduleIds: string[], level: DiagramLevel): DiagramOutput | null {
  if (moduleIds.length === 0) return null;
  return generateDiagram(moduleIds, level);
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  canvasModuleIds: [],
  diagram: null,
  diagramLevel: "high_level",
  baselineModuleIds: [],
  showCompare: false,
  unlinkabilityGoal: "none",
  antiReplay: "nonce_only",
  deviceBinding: "none",
  presentationFrequency: "one_time",
  verificationTarget: "offchain",

  addModule: (id) => {
    const state = get();
    if (state.canvasModuleIds.includes(id)) return;
    const newIds = [...state.canvasModuleIds, id];
    set({
      canvasModuleIds: newIds,
      diagram: regenerateDiagram(newIds, state.diagramLevel),
    });
  },

  removeModule: (id) => {
    const state = get();
    const newIds = state.canvasModuleIds.filter((m) => m !== id);
    set({
      canvasModuleIds: newIds,
      diagram: regenerateDiagram(newIds, state.diagramLevel),
    });
  },

  reorderModules: (ids) => {
    const state = get();
    set({
      canvasModuleIds: ids,
      diagram: regenerateDiagram(ids, state.diagramLevel),
    });
  },

  setDiagramLevel: (level) => {
    const state = get();
    set({
      diagramLevel: level,
      diagram: regenerateDiagram(state.canvasModuleIds, level),
    });
  },

  setShowCompare: (show) => set({ showCompare: show }),

  setScenarioContext: (ctx) => set(ctx),

  loadFromEngineOutput: (moduleIds, scenario) => {
    const state = get();
    set({
      canvasModuleIds: moduleIds,
      baselineModuleIds: moduleIds,
      diagram: regenerateDiagram(moduleIds, state.diagramLevel),
      ...(scenario ?? {}),
    });
  },

  importCanvas: (json) => {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed.canvasModuleIds)) {
        const state = get();
        set({
          canvasModuleIds: parsed.canvasModuleIds,
          diagram: regenerateDiagram(parsed.canvasModuleIds, state.diagramLevel),
          unlinkabilityGoal: parsed.unlinkabilityGoal ?? state.unlinkabilityGoal,
          antiReplay: parsed.antiReplay ?? state.antiReplay,
          deviceBinding: parsed.deviceBinding ?? state.deviceBinding,
          presentationFrequency: parsed.presentationFrequency ?? state.presentationFrequency,
          verificationTarget: parsed.verificationTarget ?? state.verificationTarget,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  exportCanvas: () => {
    const state = get();
    return JSON.stringify(
      {
        canvasModuleIds: state.canvasModuleIds,
        unlinkabilityGoal: state.unlinkabilityGoal,
        antiReplay: state.antiReplay,
        deviceBinding: state.deviceBinding,
        presentationFrequency: state.presentationFrequency,
        verificationTarget: state.verificationTarget,
      },
      null,
      2
    );
  },

  getPrivacyMeter: () => {
    const state = get();
    const ids = new Set(state.canvasModuleIds);
    const deductions: PrivacyDeduction[] = [];

    if (state.unlinkabilityGoal !== "none" && !ids.has("reblind_rerandomize")) {
      deductions.push({
        amount: 40,
        reason: `Unlinkability goal is '${state.unlinkabilityGoal}' but reblind/rerandomize is missing — presentations are linkable.`,
      });
    }

    if (state.antiReplay !== "none" && !ids.has("verifier_challenge_nonce")) {
      deductions.push({
        amount: 25,
        reason: `Anti-replay is '${state.antiReplay}' but verifier challenge nonce is missing — replay attacks possible.`,
      });
    }

    if (state.deviceBinding === "required" && !ids.has("device_binding")) {
      deductions.push({
        amount: 25,
        reason: "Device binding is required but device binding module is missing — no possession proof.",
      });
    }

    const totalDeduction = deductions.reduce((sum, d) => sum + d.amount, 0);
    return { score: Math.max(0, 100 - totalDeduction), deductions };
  },

  getWarnings: () => {
    const state = get();
    const ids = new Set(state.canvasModuleIds);
    const warnings: WarningItem[] = [];

    if (
      !ids.has("reblind_rerandomize") &&
      state.presentationFrequency === "repeat"
    ) {
      warnings.push({
        severity: "warning",
        message: "Linkability risk across sessions: reblind/rerandomize is missing with repeat presentations.",
      });
    }

    if (
      !ids.has("nullifier_antireplay") &&
      state.antiReplay === "nullifier"
    ) {
      warnings.push({
        severity: "warning",
        message: "Replay/double-use risk: nullifier module is missing but anti-replay requires nullifier.",
      });
    }

    if (
      state.verificationTarget === "onchain" ||
      state.verificationTarget === "both"
    ) {
      warnings.push({
        severity: "info",
        message: "On-chain verification: ensure your proving system and verifier contract meet gas and circuit constraints.",
      });
    }

    return warnings;
  },

  getPaletteModules: () => {
    const state = get();
    return MODULE_REGISTRY.filter((m) => !state.canvasModuleIds.includes(m.id));
  },
}));
