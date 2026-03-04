"use client";

import { useState } from "react";
import { useScenarioStore } from "@/store/scenarioStore";
import { SCENARIO_FIELD_LABELS, SCENARIO_OPTIONS } from "@/lib/scenario/schema";
import type { Scenario } from "@/lib/scenario/schema";
import { EXAMPLE_SCENARIOS } from "@/lib/scenario/defaults";
import { getModule } from "@/lib/modules/registry";
import MermaidRenderer from "@/components/MermaidRenderer";
import ModuleCard from "@/components/ModuleCard";
import ThreatModelPanel from "@/components/ThreatModelPanel";

type RightTab = "modules" | "threats";

export default function ScenarioPage() {
  const {
    scenario,
    updateField,
    setScenario,
    generate,
    engineOutput,
    diagram,
    diagramLevel,
    setDiagramLevel,
    importScenario,
    exportScenario,
  } = useScenarioStore();

  const [rightTab, setRightTab] = useState<RightTab>("modules");

  const handleImport = () => {
    const input = prompt("Paste scenario JSON:");
    if (input) {
      const ok = importScenario(input);
      if (!ok) alert("Invalid scenario JSON");
    }
  };

  const selectedModuleIds = engineOutput?.modules.map((m) => m.moduleId) ?? [];

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">MVP1: Scenario Generator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="space-y-4">
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Scenario Configuration</h2>
              <div className="flex gap-2">
                {Object.entries(EXAMPLE_SCENARIOS).map(([key, { name, scenario: s }]) => (
                  <button
                    key={key}
                    onClick={() => setScenario(s)}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {(Object.keys(SCENARIO_FIELD_LABELS) as (keyof Omit<Scenario, "notes">)[]).map(
                (field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {SCENARIO_FIELD_LABELS[field]}
                    </label>
                    <select
                      value={scenario[field]}
                      onChange={(e) => updateField(field, e.target.value as never)}
                      className="w-full border rounded px-3 py-1.5 text-sm bg-white"
                    >
                      {SCENARIO_OPTIONS[field].map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={scenario.notes ?? ""}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={2}
                  className="w-full border rounded px-3 py-1.5 text-sm"
                  placeholder="Any additional context..."
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={generate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
              >
                Generate
              </button>
              <button
                onClick={handleImport}
                className="px-3 py-2 border rounded hover:bg-gray-50 text-sm"
              >
                Import JSON
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(exportScenario());
                }}
                className="px-3 py-2 border rounded hover:bg-gray-50 text-sm"
              >
                Export JSON
              </button>
            </div>
          </div>
        </div>

        {/* Right: Output */}
        <div className="space-y-4">
          {/* Tab bar */}
          {engineOutput && (
            <div className="flex gap-1 border-b pb-0">
              <button
                onClick={() => setRightTab("modules")}
                className={`px-3 py-1.5 text-sm font-medium rounded-t border border-b-0 -mb-px ${
                  rightTab === "modules"
                    ? "bg-white border-gray-300 text-gray-900"
                    : "bg-gray-50 border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Modules ({engineOutput.modules.length})
              </button>
              <button
                onClick={() => setRightTab("threats")}
                className={`px-3 py-1.5 text-sm font-medium rounded-t border border-b-0 -mb-px ${
                  rightTab === "threats"
                    ? "bg-white border-gray-300 text-gray-900"
                    : "bg-gray-50 border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Threat Model
              </button>
            </div>
          )}

          {/* Modules tab */}
          {engineOutput && rightTab === "modules" && (
            <>
              <div className="bg-white border rounded-lg p-4">
                <h2 className="font-semibold mb-3">
                  Selected Modules ({engineOutput.modules.length})
                </h2>
                <div className="space-y-2">
                  {engineOutput.modules.map((sel) => {
                    const mod = getModule(sel.moduleId);
                    if (!mod) return null;
                    return (
                      <ModuleCard
                        key={sel.moduleId}
                        module={mod}
                        selected
                        reason={sel.whySelected}
                        riskIfOmitted={sel.riskIfOmitted}
                      />
                    );
                  })}
                </div>

                {engineOutput.warnings.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    <h3 className="text-sm font-medium text-amber-700">Warnings</h3>
                    {engineOutput.warnings.map((w, i) => (
                      <p key={i} className="text-xs bg-amber-50 border border-amber-200 rounded p-2 text-amber-800">
                        {w}
                      </p>
                    ))}
                  </div>
                )}

                <details className="mt-4">
                  <summary className="text-xs text-gray-500 cursor-pointer">
                    Module Graph JSON
                  </summary>
                  <pre className="text-xs bg-gray-50 p-3 rounded mt-2 overflow-auto max-h-64">
                    {JSON.stringify(engineOutput, null, 2)}
                  </pre>
                </details>
              </div>

              {/* Diagram */}
              {diagram && (
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold">Mermaid Diagram</h2>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setDiagramLevel("high_level")}
                        className={`text-xs px-2 py-1 rounded ${
                          diagramLevel === "high_level"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        High-level
                      </button>
                      <button
                        onClick={() => setDiagramLevel("crypto_level")}
                        className={`text-xs px-2 py-1 rounded ${
                          diagramLevel === "crypto_level"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        Crypto-level
                      </button>
                    </div>
                  </div>
                  <MermaidRenderer chart={diagram.mermaid} />
                  <details className="mt-3">
                    <summary className="text-xs text-gray-500 cursor-pointer">
                      Raw Mermaid
                    </summary>
                    <pre className="text-xs bg-gray-50 p-3 rounded mt-2 overflow-auto max-h-40">
                      {diagram.mermaid}
                    </pre>
                  </details>
                </div>
              )}
            </>
          )}

          {/* Threat Model tab */}
          {engineOutput && rightTab === "threats" && (
            <div className="bg-white border rounded-lg p-4">
              <ThreatModelPanel
                scenario={scenario}
                selectedModules={selectedModuleIds}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
