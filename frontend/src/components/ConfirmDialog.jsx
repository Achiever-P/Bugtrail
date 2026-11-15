import React from "react";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-stroke rounded-lg w-full max-w-sm shadow-panel">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            {danger && (
              <div className="w-9 h-9 rounded-full bg-severity-p0/15 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-severity-p0" />
              </div>
            )}
            <h3 className="text-[14px] font-semibold text-ink-primary">{title}</h3>
          </div>
          <p className="text-[13px] text-ink-secondary leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 p-4 pt-0">
          <button onClick={onCancel} className="btn-secondary flex-1">{cancelLabel}</button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-3.5 py-2 rounded-md text-[13px] font-medium transition-colors ${
              danger
                ? "bg-severity-p0 text-white hover:bg-severity-p0/80"
                : "btn-primary"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
