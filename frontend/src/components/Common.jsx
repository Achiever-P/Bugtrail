import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas text-ink-tertiary text-sm">
        Loading
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

const ACCENT_CLASSES = {
  "ink-primary": "text-ink-primary",
  "state-open": "text-state-open",
  "state-resolved": "text-state-resolved",
  "state-progress": "text-state-progress",
  accent: "text-accent",
};

export function StatCard({ eyebrow, value, sublabel, accent = "ink-primary", icon: Icon, warn }) {
  return (
    <div className="panel px-4 py-3.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold tracking-wider text-ink-tertiary uppercase">
          {eyebrow}
        </span>
        {Icon && <Icon size={13} className={warn ? "text-severity-p1" : "text-ink-tertiary"} />}
      </div>
      <div className={`text-2xl font-semibold tracking-tight ${ACCENT_CLASSES[accent] || ACCENT_CLASSES["ink-primary"]}`}>
        {value}
      </div>
      {sublabel && <div className="text-[12px] text-ink-tertiary mt-1">{sublabel}</div>}
    </div>
  );
}
