"use client";

import type { PrivacyMeterResult } from "@/store/canvasStore";

interface PrivacyMeterProps {
  result: PrivacyMeterResult;
}

function scoreColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Good";
  if (score >= 50) return "Moderate";
  return "Poor";
}

export default function PrivacyMeter({ result }: PrivacyMeterProps) {
  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="font-medium text-sm mb-3">Privacy Meter</h3>

      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${scoreColor(result.score)}`}
            style={{ width: `${result.score}%` }}
          />
        </div>
        <span className="text-sm font-bold w-12 text-right">{result.score}</span>
      </div>

      <p className={`text-xs font-medium mb-2 ${result.score >= 80 ? "text-emerald-700" : result.score >= 50 ? "text-yellow-700" : "text-red-700"}`}>
        {scoreLabel(result.score)}
      </p>

      {result.deductions.length > 0 && (
        <div className="space-y-1.5">
          {result.deductions.map((d, i) => (
            <div key={i} className="text-xs bg-red-50 border border-red-200 rounded p-2">
              <span className="font-medium text-red-800">-{d.amount}</span>{" "}
              <span className="text-red-700">{d.reason}</span>
            </div>
          ))}
        </div>
      )}

      {result.deductions.length === 0 && (
        <p className="text-xs text-emerald-600">No privacy deductions. Configuration looks good.</p>
      )}
    </div>
  );
}
