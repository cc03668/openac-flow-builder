"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCanvasStore } from "@/store/canvasStore";
import { getModule, MODULE_REGISTRY } from "@/lib/modules/registry";
import MermaidRenderer from "@/components/MermaidRenderer";
import PrivacyMeter from "@/components/PrivacyMeter";
import WarningsPanel from "@/components/WarningsPanel";
import CompareView from "@/components/CompareView";
import ThreatModelPanel from "@/components/ThreatModelPanel";
import type { Scenario } from "@/lib/scenario/schema";

function SortableModuleItem({ id, onRemove }: { id: string; onRemove: () => void }) {
  const mod = getModule(id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (!mod) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 border rounded-lg p-2.5 bg-blue-50 border-blue-300"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-400 hover:text-gray-600 px-1"
        title="Drag to reorder"
      >
        ⠿
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{mod.title}</p>
        <p className="text-xs text-gray-500 truncate">{mod.description}</p>
      </div>
      <button
        onClick={onRemove}
        className="shrink-0 text-red-400 hover:text-red-600 text-sm px-1"
        title="Remove from canvas"
      >
        ✕
      </button>
    </div>
  );
}

function computeBaselinePrivacy() {
  return { score: 35, deductions: [
    { amount: 40, reason: "Baseline: no reblind/rerandomize" },
    { amount: 25, reason: "Baseline: no device binding" },
  ]};
}

function computeBaselineWarnings() {
  return [
    { severity: "warning" as const, message: "Baseline: linkability risk across sessions (no reblind)" },
  ];
}

type RightTab = "diagram" | "threats";

export default function CanvasPage() {
  const {
    canvasModuleIds,
    addModule,
    removeModule,
    reorderModules,
    diagram,
    diagramLevel,
    setDiagramLevel,
    baselineModuleIds,
    showCompare,
    setShowCompare,
    getPrivacyMeter,
    getWarnings,
    getPaletteModules,
    importCanvas,
    exportCanvas,
    unlinkabilityGoal,
    antiReplay,
    deviceBinding,
    presentationFrequency,
    verificationTarget,
    setScenarioContext,
  } = useCanvasStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<RightTab>("diagram");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const privacy = getPrivacyMeter();
  const warnings = getWarnings();
  const palette = getPaletteModules();

  // Build a Scenario object from canvas context for the threat model
  const canvasScenario: Scenario = {
    presentationFrequency: presentationFrequency as Scenario["presentationFrequency"],
    verifierTopology: "single_verifier",
    unlinkabilityGoal: unlinkabilityGoal as Scenario["unlinkabilityGoal"],
    antiReplay: antiReplay as Scenario["antiReplay"],
    deviceBinding: deviceBinding as Scenario["deviceBinding"],
    verificationTarget: verificationTarget as Scenario["verificationTarget"],
    credentialFormat: "sd_jwt",
    revocationHandling: "none",
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    if (!canvasModuleIds.includes(active.id as string) && over.id === "canvas-drop") {
      addModule(active.id as string);
      return;
    }

    if (active.id !== over.id && canvasModuleIds.includes(active.id as string)) {
      const oldIndex = canvasModuleIds.indexOf(active.id as string);
      const newIndex = canvasModuleIds.indexOf(over.id as string);
      if (newIndex >= 0) {
        reorderModules(arrayMove(canvasModuleIds, oldIndex, newIndex));
      }
    }
  };

  const handleImport = () => {
    const input = prompt("Paste canvas JSON:");
    if (input) {
      const ok = importCanvas(input);
      if (!ok) alert("Invalid canvas JSON");
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">MVP3: Canvas Editor</h1>
        <div className="flex gap-2">
          <button
            onClick={handleImport}
            className="text-xs px-3 py-1.5 border rounded hover:bg-gray-50"
          >
            Import
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(exportCanvas())}
            className="text-xs px-3 py-1.5 border rounded hover:bg-gray-50"
          >
            Export
          </button>
        </div>
      </div>

      {/* Scenario context controls */}
      <div className="bg-white border rounded-lg p-3 mb-4 flex flex-wrap gap-3 items-center text-xs">
        <span className="font-medium text-gray-600">Context:</span>
        <label className="flex items-center gap-1">
          Frequency:
          <select value={presentationFrequency} onChange={(e) => setScenarioContext({ presentationFrequency: e.target.value })} className="border rounded px-1.5 py-0.5 text-xs">
            <option value="one_time">One-time</option>
            <option value="repeat">Repeat</option>
          </select>
        </label>
        <label className="flex items-center gap-1">
          Unlinkability:
          <select value={unlinkabilityGoal} onChange={(e) => setScenarioContext({ unlinkabilityGoal: e.target.value })} className="border rounded px-1.5 py-0.5 text-xs">
            <option value="none">None</option>
            <option value="same_verifier_sessions">Same-Verifier</option>
            <option value="cross_verifiers">Cross-Verifiers</option>
          </select>
        </label>
        <label className="flex items-center gap-1">
          Anti-Replay:
          <select value={antiReplay} onChange={(e) => setScenarioContext({ antiReplay: e.target.value })} className="border rounded px-1.5 py-0.5 text-xs">
            <option value="none">None</option>
            <option value="nonce_only">Nonce</option>
            <option value="nullifier">Nullifier</option>
          </select>
        </label>
        <label className="flex items-center gap-1">
          Device:
          <select value={deviceBinding} onChange={(e) => setScenarioContext({ deviceBinding: e.target.value })} className="border rounded px-1.5 py-0.5 text-xs">
            <option value="none">None</option>
            <option value="recommended">Recommended</option>
            <option value="required">Required</option>
          </select>
        </label>
        <label className="flex items-center gap-1">
          Target:
          <select value={verificationTarget} onChange={(e) => setScenarioContext({ verificationTarget: e.target.value })} className="border rounded px-1.5 py-0.5 text-xs">
            <option value="offchain">Off-chain</option>
            <option value="onchain">On-chain</option>
            <option value="both">Both</option>
          </select>
        </label>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-12 gap-4">
          {/* Left: Module Palette */}
          <div className="col-span-3 space-y-2">
            <h2 className="font-semibold text-sm mb-2">Module Palette</h2>
            <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
              {palette.map((mod) => (
                <div
                  key={mod.id}
                  className="border rounded-lg p-2.5 bg-white hover:border-blue-300 cursor-pointer transition-colors"
                  onClick={() => addModule(mod.id)}
                >
                  <p className="text-sm font-medium">{mod.title}</p>
                  <p className="text-xs text-gray-500 truncate">{mod.description}</p>
                  <span className="text-[10px] text-blue-600 mt-0.5 block">Click to add</span>
                </div>
              ))}
              {palette.length === 0 && (
                <p className="text-xs text-gray-400 py-4 text-center">All modules on canvas</p>
              )}
            </div>
          </div>

          {/* Center: Canvas */}
          <div className="col-span-5">
            <h2 className="font-semibold text-sm mb-2">
              Canvas ({canvasModuleIds.length} modules)
            </h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 min-h-[200px] bg-gray-50">
              {canvasModuleIds.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  Click modules from the palette to add them here
                </p>
              ) : (
                <SortableContext
                  items={canvasModuleIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1.5">
                    {canvasModuleIds.map((id) => (
                      <SortableModuleItem
                        key={id}
                        id={id}
                        onRemove={() => removeModule(id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </div>
          </div>

          {/* Right: Diagram + Meters + Threats */}
          <div className="col-span-4 space-y-3">
            {/* Tab bar for right panel */}
            <div className="flex gap-1 border-b pb-0">
              <button
                onClick={() => setRightTab("diagram")}
                className={`px-3 py-1.5 text-sm font-medium rounded-t border border-b-0 -mb-px ${
                  rightTab === "diagram"
                    ? "bg-white border-gray-300 text-gray-900"
                    : "bg-gray-50 border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Diagram
              </button>
              <button
                onClick={() => setRightTab("threats")}
                className={`px-3 py-1.5 text-sm font-medium rounded-t border border-b-0 -mb-px ${
                  rightTab === "threats"
                    ? "bg-white border-gray-300 text-gray-900"
                    : "bg-gray-50 border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Threats
              </button>
            </div>

            {rightTab === "diagram" && (
              <>
                {diagram && (
                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">Diagram</h3>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setDiagramLevel("high_level")}
                          className={`text-xs px-2 py-0.5 rounded ${
                            diagramLevel === "high_level"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100"
                          }`}
                        >
                          High-level
                        </button>
                        <button
                          onClick={() => setDiagramLevel("crypto_level")}
                          className={`text-xs px-2 py-0.5 rounded ${
                            diagramLevel === "crypto_level"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100"
                          }`}
                        >
                          Crypto
                        </button>
                      </div>
                    </div>
                    <MermaidRenderer chart={diagram.mermaid} className="max-h-[40vh]" />
                  </div>
                )}

                <PrivacyMeter result={privacy} />
                <WarningsPanel warnings={warnings} />

                {/* Compare toggle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCompare(!showCompare)}
                    className={`text-xs px-3 py-1.5 rounded border ${
                      showCompare ? "bg-blue-50 border-blue-300" : "hover:bg-gray-50"
                    }`}
                  >
                    {showCompare ? "Hide Compare" : "Show Compare"}
                  </button>
                </div>

                {showCompare && (
                  <CompareView
                    baselineIds={baselineModuleIds.length > 0 ? baselineModuleIds : ["issuer_sig_verify", "attribute_commitments", "selective_disclosure", "prepare_show_split", "verifier_challenge_nonce", "offchain_verify"]}
                    currentIds={canvasModuleIds}
                    baselinePrivacy={computeBaselinePrivacy()}
                    currentPrivacy={privacy}
                    baselineWarnings={computeBaselineWarnings()}
                    currentWarnings={warnings}
                  />
                )}
              </>
            )}

            {rightTab === "threats" && (
              <div className="bg-white border rounded-lg p-4 max-h-[75vh] overflow-y-auto">
                <ThreatModelPanel
                  scenario={canvasScenario}
                  selectedModules={canvasModuleIds}
                  compact
                />
              </div>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="border rounded-lg p-2.5 bg-blue-100 border-blue-400 shadow-lg">
              <p className="text-sm font-medium">
                {getModule(activeId)?.title ?? activeId}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
