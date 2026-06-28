// ============================================================
// src/components/ui-kit/CascadeFlowBadge.tsx
// Drop this anywhere next to an AI button to show live stats
// ============================================================
import React from 'react';

export interface CascadeStats {
  run_id: string;
  cost: number;
  budget_max: number;
  budget_remaining: number;
  latency_ms: number;
  step_count: number;
  last_action: 'allow' | 'block';
}

interface Props {
  stats: CascadeStats | null;
  loading?: boolean;
}

export function CascadeFlowBadge({ stats, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400 animate-pulse">
        <span className="w-2 h-2 rounded-full bg-yellow-400" />
        CascadeFlow running...
      </div>
    );
  }

  if (!stats) return null;

  const isBlocked = stats.last_action === 'block';
  const pctUsed = Math.min(100, (stats.cost / stats.budget_max) * 100);

  return (
    <div className={`rounded-lg border p-3 text-xs font-mono space-y-1.5 ${
      isBlocked ? 'border-red-500 bg-red-950/30' : 'border-green-600 bg-green-950/30'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-white flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isBlocked ? 'bg-red-400' : 'bg-green-400'}`} />
          CascadeFlow
        </span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
          isBlocked ? 'bg-red-500 text-white' : 'bg-green-600 text-white'
        }`}>
          {stats.last_action}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-gray-300">
        <div>
          <div className="text-gray-500">cost</div>
          <div className="text-white">${stats.cost.toFixed(5)}</div>
        </div>
        <div>
          <div className="text-gray-500">latency</div>
          <div className="text-white">{stats.latency_ms}ms</div>
        </div>
        <div>
          <div className="text-gray-500">remaining</div>
          <div className={stats.budget_remaining < 0 ? 'text-red-400' : 'text-white'}>
            ${stats.budget_remaining.toFixed(5)}
          </div>
        </div>
      </div>

      {/* Budget bar */}
      <div>
        <div className="flex justify-between text-gray-500 mb-0.5">
          <span>budget used</span>
          <span>{pctUsed.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${isBlocked ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${pctUsed}%` }}
          />
        </div>
      </div>

      <div className="text-gray-600">run_id: {stats.run_id}</div>
    </div>
  );
}
