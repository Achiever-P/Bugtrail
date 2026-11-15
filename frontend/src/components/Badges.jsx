import React from "react";

const PRIORITY_META = {
  critical: { code: "P0", style: "bg-severity-p0/15 text-severity-p0 border-severity-p0/30" },
  high: { code: "P1", style: "bg-severity-p1/15 text-severity-p1 border-severity-p1/30" },
  medium: { code: "P2", style: "bg-severity-p2/15 text-severity-p2 border-severity-p2/30" },
  low: { code: "P3", style: "bg-severity-p3/15 text-severity-p3 border-severity-p3/30" },
};

export function PriorityBadge({ priority }) {
  const meta = PRIORITY_META[priority] || PRIORITY_META.medium;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-mono text-[10px] font-semibold tracking-wide uppercase ${meta.style}`}
    >
      {meta.code} · {priority}
    </span>
  );
}

export function SeverityTag({ severity }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-tertiary capitalize font-mono">
      {severity}
    </span>
  );
}

export function LabelTag({ children }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-raised border border-stroke text-ink-secondary font-mono text-[10px] tracking-wide">
      {children}
    </span>
  );
}
