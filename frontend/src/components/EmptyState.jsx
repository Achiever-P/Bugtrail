import React from "react";

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-surface-raised border border-stroke flex items-center justify-center mb-4">
          <Icon size={22} className="text-ink-tertiary" />
        </div>
      )}
      <h3 className="text-[14px] font-semibold text-ink-primary mb-1">{title}</h3>
      {description && <p className="text-[13px] text-ink-tertiary max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
