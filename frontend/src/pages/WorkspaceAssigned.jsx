import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Inbox } from "lucide-react";
import api from "../api/axios.js";
import StatusBadge from "../components/StatusBadge.jsx";
import { PriorityBadge } from "../components/Badges.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function WorkspaceAssigned() {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/bugs/my-bugs").then((res) => setBugs(res.data.bugs)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-[18px] font-semibold text-ink-primary tracking-tight flex items-center gap-2">
          <Inbox size={20} /> Assigned to Me
        </h1>
        <p className="text-ink-tertiary text-[13px] mt-0.5">Active bugs assigned to you</p>
      </div>

      {loading ? (
        <div className="text-center text-ink-tertiary text-[13px] py-12">Loading…</div>
      ) : bugs.length === 0 ? (
        <EmptyState icon={Inbox} title="No assigned bugs" description="You don't have any active bugs assigned to you." />
      ) : (
        <div className="panel overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-surface-raised text-ink-tertiary text-[10px] uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold">Bug</th>
                <th className="text-left px-4 py-2.5 font-semibold">Project</th>
                <th className="text-left px-4 py-2.5 font-semibold">Priority</th>
                <th className="text-left px-4 py-2.5 font-semibold">Status</th>
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
                  <td className="px-4 py-3"><PriorityBadge priority={bug.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={bug.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
