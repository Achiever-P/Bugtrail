import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import api from "../api/axios.js";
import EmptyState from "../components/EmptyState.jsx";

export default function WorkspaceRecentlyClosed() {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/bugs/recently-closed").then((res) => setBugs(res.data.bugs)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-[18px] font-semibold text-ink-primary tracking-tight flex items-center gap-2">
          <History size={20} /> Recently Closed
        </h1>
        <p className="text-ink-tertiary text-[13px] mt-0.5">Bugs closed in the last 30 days</p>
      </div>

      {loading ? (
        <div className="text-center text-ink-tertiary text-[13px] py-12">Loading…</div>
      ) : bugs.length === 0 ? (
        <EmptyState icon={History} title="No recently closed bugs" description="Bugs closed in the last 30 days will appear here." />
      ) : (
        <div className="panel overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-surface-raised text-ink-tertiary text-[10px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold">Bug</th>
                <th className="text-left px-4 py-2.5 font-semibold">Project</th>
                <th className="text-left px-4 py-2.5 font-semibold">Closed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke-soft">
              {bugs.map((bug) => (
                <tr key={bug._id} className="hover:bg-surface-raised transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/bugs/${bug._id}`} className="block">
                      <div className="mono-tag text-ink-tertiary">{bug.bugId}</div>
                      <div className="font-medium text-ink-primary">{bug.title}</div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-tertiary font-mono text-[12px]">{bug.project?.key}</td>
                  <td className="px-4 py-3 text-ink-tertiary text-[12px]">
                    {bug.closedAt ? formatDistanceToNow(new Date(bug.closedAt), { addSuffix: true }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
