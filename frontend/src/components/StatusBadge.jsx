import React from "react";

const STATUS_COLOR = {
  open: "bg-state-open",
  in_progress: "bg-state-progress",
  in_review: "bg-state-review",
  resolved: "bg-state-resolved",
  closed: "bg-state-closed",
  reopened: "bg-state-reopened",
};

const STATUS_LABEL = {
  open: "Open",
  in_progress: "In Progress",
  in_review: "In Review",
  resolved: "Resolved",
  closed: "Closed",
  reopened: "Reopened",
};

export default function StatusBadge({ status, showDot = true }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-secondary">
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLOR[status]}`} />}
      {STATUS_LABEL[status] || status}
    </span>
  );
}
