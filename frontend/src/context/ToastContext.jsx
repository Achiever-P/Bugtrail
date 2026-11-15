import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle2, AlertTriangle, Info } from "lucide-react";

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error", 6000),
    info: (msg) => addToast(msg, "info"),
    warning: (msg) => addToast(msg, "warning"),
  };

  const icons = {
    success: CheckCircle2,
    error: AlertTriangle,
    info: Info,
    warning: AlertTriangle,
  };

  const colors = {
    success: "border-state-resolved text-state-resolved bg-state-resolved/10",
    error: "border-severity-p0 text-severity-p0 bg-severity-p0/10",
    info: "border-accent text-accent bg-accent/10",
    warning: "border-severity-p1 text-severity-p1 bg-severity-p1/10",
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2 max-w-sm">
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div
              key={t.id}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-panel text-[13px] font-medium animate-slide-up ${colors[t.type]}`}
            >
              <Icon size={16} className="shrink-0" />
              <span className="flex-1">{t.message}</span>
              <button onClick={() => removeToast(t.id)} className="shrink-0 opacity-60 hover:opacity-100">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
