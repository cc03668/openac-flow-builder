# OpenAC Flow Builder

Scenario-to-module-graph-to-Mermaid generator for anonymous credential flows, with an interactive drag-and-drop educational UI and rule-based threat model generator.

## Quick Start

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # run Vitest tests
pnpm build      # production build
pnpm lint       # ESLint
```

## Features

### MVP1: Scenario Generator (`/scenario`)
- Configure a credential presentation scenario via a form
- Deterministic rule engine maps scenario → recommended modules with explanations
- Generates Mermaid sequence diagrams (high-level & crypto-level toggle)
- Each module includes "why selected" and "risk if omitted"
- **Threat Model tab**: view applicable threats, mitigations, and export reports
- Export/import scenario as JSON

### MVP2: Threat Model Generator
- Rule-based threat checklist across 10 security categories
- 22 threat templates covering forgery, linkability, replay, device cloning, issuer tracking, verifier collusion, revocation, side-channels, and key management
- Automatically evaluates which threats apply based on scenario + selected modules
- Checks whether mitigations are satisfied by the current module selection
- Top risks summary with severity ranking
- Export as Markdown report or JSON
- Integrated into both Scenario and Canvas pages

### MVP3: Canvas Editor (`/canvas`)
- Drag-and-drop modules from palette to canvas
- Live-updating Mermaid diagram
- Privacy meter with scored deductions
- Stable identifier warnings panel
- **Threat tab**: live threat model that updates as modules are added/removed
- Compare view: baseline vs current configuration
- Export/import canvas state as JSON

## Architecture

```
src/
├── app/
│   ├── scenario/page.tsx    # MVP1 page (with Threat Model tab)
│   └── canvas/page.tsx      # MVP3 page (with Threat tab)
├── components/
│   ├── MermaidRenderer.tsx   # Client-side Mermaid rendering
│   ├── ModuleCard.tsx        # Module display card
│   ├── PrivacyMeter.tsx      # Privacy score bar
│   ├── WarningsPanel.tsx     # Stable identifier warnings
│   ├── CompareView.tsx       # Baseline vs current diff
│   └── ThreatModelPanel.tsx  # Threat model display + export (MVP2)
├── lib/
│   ├── scenario/             # Zod schema + defaults
│   ├── modules/              # Module registry + types
│   ├── rules/                # Rule engine + ruleset
│   ├── diagram/              # Mermaid generator
│   └── threats/              # Threat model (MVP2)
│       ├── types.ts          # ThreatCategory, ThreatTemplate, Mitigation types
│       ├── templates.ts      # 22 threat templates
│       ├── generator.ts      # generateThreatModel() function
│       ├── markdown.ts       # renderThreatModelMarkdown() function
│       └── index.ts          # Public exports
└── store/
    ├── scenarioStore.ts      # MVP1 state (Zustand)
    └── canvasStore.ts        # MVP3 state (Zustand)
```

## How to Add a Module

1. Edit `src/lib/modules/registry.ts`
2. Add a new `ModuleDefinition` object to the `MODULE_REGISTRY` array:

```ts
{
  id: "my_module",
  title: "My Module",
  description: "What it does",
  provides: ["capability_name"],
  requires: ["dependency_id"],   // auto-resolved by engine
  conflicts: ["conflicting_id"],
  risksIfOmitted: ["Risk description"],
  diagramHooks: {
    actors: [],           // optional extra actors (e.g., "Chain")
    artifacts: ["x"],     // crypto artifacts
    sequenceSteps: [      // Mermaid sequence lines
      "W->>V: something",
    ],
  },
}
```

3. Update the diagram generator in `src/lib/diagram/generator.ts` to handle the new module's diagram hooks.

## How to Add a Rule

1. Edit `src/lib/rules/ruleset.ts`
2. Add a new `Rule` object to the `RULESET` array:

```ts
{
  id: "my_rule",
  description: "When to trigger",
  predicate: (scenario) => scenario.someField === "value",
  moduleAdds: ["module_id"],
  moduleRemovals: [],
  explanation: (scenario) => "Human-readable reason for this selection.",
}
```

The engine automatically:
- Resolves `requires` dependencies (adds missing required modules)
- Flags `conflicts` as warnings
- Sorts output deterministically by registry order

## How to Add a Threat Template

1. Edit `src/lib/threats/templates.ts`
2. Add a new `ThreatTemplate` object to the `THREAT_TEMPLATES` array:

```ts
{
  id: "T-XX-01",              // Prefix with category code
  title: "Short threat title",
  category: "soundness_forgery",  // One of the 10 ThreatCategory values
  description: "What can go wrong if this threat materializes.",
  appliesWhen: (scenario, selectedModules) => {
    // Return true if this threat is relevant
    return scenario.someField === "value" && !selectedModules.includes("mitigating_module");
  },
  severity: "high",           // "low" | "medium" | "high"
  mitigations: [
    {
      id: "M-XX-01a",
      title: "Mitigation title",
      description: "How to mitigate this threat.",
      dependsOnModules: ["module_id"],  // Empty array for operational measures
    },
  ],
  detectionSignals: ["Observable indicator that this threat is present"],
  references: ["Text reference (no external links required)"],
}
```

The generator automatically:
- Evaluates `appliesWhen` for each template against the current scenario and modules
- Checks `dependsOnModules` to determine if mitigations are satisfied
- Ranks top risks by severity, then by number of unsatisfied mitigations, then by ID

### Threat Categories

| Category | Code | Description |
|---|---|---|
| Soundness / Forgery | `soundness_forgery` | Credential or proof forgery attacks |
| Zero-Knowledge Leakage | `zero_knowledge_leakage` | Unintended attribute disclosure |
| Unlinkability / Linkability | `unlinkability_linkability` | Cross-session or cross-verifier tracking |
| Replay / Double-Spend | `replay_double_spend` | Proof reuse or double-presentation |
| Device Sharing / Cloning | `device_sharing_cloning` | Credential export or device theft |
| Issuer Tracking / Registry | `issuer_tracking_registry` | Issuer-side holder surveillance |
| Verifier Collusion | `verifier_collusion` | Multi-verifier correlation attacks |
| Dependency / Status / Revocation | `dependency_status_revocation` | Revocation gaps or status failures |
| Implementation / Side-Channels | `implementation_side_channels` | Timing, memory, logging leaks |
| Operational / Key Management | `operational_key_management` | Key rotation, contract audit, gas limits |

## Exporting the Threat Model

From either the Scenario or Canvas page:

- **Export MD** — Downloads a Markdown report with scenario summary, top risks, full checklist with mitigation status, assumptions, and out-of-scope items.
- **Export JSON** — Downloads the raw threat model object for programmatic use.

> **Disclaimer:** MVP2 is a checklist-based threat assessment tool, not a formal security proof. It identifies potential risks based on scenario configuration and module selection. Always review the output with your security team before deployment.

## Example Scenarios

See the `examples/` directory:
- `one-time-ptt-badge.json` — Physical badge tap, device-bound, single verifier
- `repeat-alcohol-purchase.json` — Age check at multiple stores, unlinkable, with nullifier

## Tech Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **TailwindCSS** for styling
- **Zod** for schema validation
- **Zustand** for state management
- **Mermaid** for sequence diagram rendering (client-side)
- **dnd-kit** for drag-and-drop
- **Vitest** for unit tests

## Testing

```bash
pnpm test          # run all tests
pnpm test:watch    # watch mode
```

Tests cover:
- Rule engine: scenario → expected modules, explanation content, warnings
- Diagram generator: snapshot tests for deterministic Mermaid output
- Threat model: applicability logic, mitigation satisfaction, severity ranking, markdown stability
